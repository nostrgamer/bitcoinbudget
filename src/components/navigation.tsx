import { Link, useLocation } from 'react-router-dom'
import { Home, CreditCard, FolderOpen, TrendingUp, Settings } from 'lucide-react'

export default function Navigation() {
  const location = useLocation()

  const navItems = [
    { path: '/budget', label: 'Budget', icon: Home },
    { path: '/transactions', label: 'Transactions', icon: CreditCard },
    { path: '/accounts', label: 'Accounts', icon: TrendingUp },
    { path: '/categories', label: 'Categories', icon: FolderOpen },
  ]

  // Don't show navigation on welcome page
  if (location.pathname === '/') {
    return null
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-4 py-3">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        {/* Logo/Title */}
        <div className="flex items-center space-x-3">
          <div className="text-orange-500 font-bold text-xl">₿</div>
          <h1 className="text-xl font-bold text-gray-900">Bitcoin Budget</h1>
        </div>

        {/* Navigation Links */}
        <div className="flex items-center space-x-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path
            const Icon = item.icon
            
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  isActive
                    ? 'bg-orange-100 text-orange-700'
                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </div>

        {/* Settings (future) */}
        <div className="flex items-center">
          <button className="p-2 text-gray-400 hover:text-gray-600 rounded-lg hover:bg-gray-100">
            <Settings className="h-4 w-4" />
          </button>
        </div>
      </div>
    </nav>
  )
} 