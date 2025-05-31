import React, { useState, useRef, useEffect } from 'react'

interface DropdownMenuProps {
  children: React.ReactNode
}

interface DropdownMenuContentProps {
  children: React.ReactNode
  className?: string
}

interface DropdownMenuItemProps {
  children: React.ReactNode
  onClick?: () => void
  className?: string
}

interface DropdownMenuTriggerProps {
  children: React.ReactNode
  asChild?: boolean
}

const DropdownMenuContext = React.createContext<{
  isOpen: boolean
  setIsOpen: (open: boolean) => void
}>({
  isOpen: false,
  setIsOpen: () => {}
})

export const DropdownMenu = ({ children }: DropdownMenuProps) => {
  const [isOpen, setIsOpen] = useState(false)
  
  return (
    <DropdownMenuContext.Provider value={{ isOpen, setIsOpen }}>
      <div className="relative inline-block text-left">
        {children}
      </div>
    </DropdownMenuContext.Provider>
  )
}

export const DropdownMenuTrigger = ({ children, asChild }: DropdownMenuTriggerProps) => {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = () => {
    setIsOpen(!isOpen)
  }
  
  if (asChild && React.isValidElement(children)) {
    return React.cloneElement(children as React.ReactElement<any>, {
      onClick: handleClick,
      'aria-expanded': isOpen,
      'aria-haspopup': true
    })
  }
  
  return (
    <button
      onClick={handleClick}
      aria-expanded={isOpen}
      aria-haspopup={true}
      className="inline-flex items-center justify-center"
    >
      {children}
    </button>
  )
}

export const DropdownMenuContent = ({ children, className = '' }: DropdownMenuContentProps) => {
  const { isOpen, setIsOpen } = React.useContext(DropdownMenuContext)
  const contentRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (contentRef.current && !contentRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, setIsOpen])
  
  if (!isOpen) return null
  
  const classes = `absolute right-0 mt-2 w-56 rounded-md border bg-popover p-1 text-popover-foreground shadow-md z-50 ${className}`
  
  return (
    <div
      ref={contentRef}
      className={classes}
    >
      {children}
    </div>
  )
}

export const DropdownMenuItem = ({ children, onClick, className = '' }: DropdownMenuItemProps) => {
  const { setIsOpen } = React.useContext(DropdownMenuContext)
  
  const handleClick = () => {
    onClick?.()
    setIsOpen(false)
  }
  
  const classes = `relative flex cursor-default select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`
  
  return (
    <div
      className={classes}
      onClick={handleClick}
    >
      {children}
    </div>
  )
} 