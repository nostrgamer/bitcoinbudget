import React, { useEffect } from 'react'

interface DialogProps {
  open?: boolean
  onOpenChange?: (open: boolean) => void
  children: React.ReactNode
}

interface DialogContentProps {
  children: React.ReactNode
  className?: string
}

interface DialogHeaderProps {
  children: React.ReactNode
  className?: string
}

interface DialogTitleProps {
  children: React.ReactNode
  className?: string
}

export const Dialog = ({ open = false, onOpenChange, children }: DialogProps) => {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [open])
  
  if (!open) return null
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      <div className="relative z-50">
        {children}
      </div>
    </div>
  )
}

export const DialogContent = ({ children, className = '' }: DialogContentProps) => {
  const classes = `fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 sm:rounded-lg ${className}`
  
  return (
    <div className={classes}>
      {children}
    </div>
  )
}

export const DialogHeader = ({ children, className = '' }: DialogHeaderProps) => {
  const classes = `flex flex-col space-y-1.5 text-center sm:text-left ${className}`
  
  return (
    <div className={classes}>
      {children}
    </div>
  )
}

export const DialogTitle = ({ children, className = '' }: DialogTitleProps) => {
  const classes = `text-lg font-semibold leading-none tracking-tight ${className}`
  
  return (
    <h2 className={classes}>
      {children}
    </h2>
  )
} 