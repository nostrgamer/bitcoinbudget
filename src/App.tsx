import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Component, ReactNode } from 'react'
import Navigation from './components/navigation'
import WelcomePage from './pages/welcome-page.tsx'
import BudgetPage from './pages/budget-page.tsx'
import CategoriesPage from './pages/categories-page.tsx'
import TransactionsPage from './pages/transactions-page.tsx'
import AccountsPage from './pages/accounts-page.tsx'
import './App.css'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

class ErrorBoundary extends Component<{children: ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: ReactNode}) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: any) {
    console.error('🔥 React Error Boundary caught error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6 text-center">
            <div className="text-red-600 text-xl mb-4">⚠️ Something went wrong</div>
            <div className="text-gray-600 mb-4 text-sm">
              {this.state.error?.message || 'An unexpected error occurred during allocation'}
            </div>
            <div className="space-y-2">
              <button
                onClick={() => this.setState({ hasError: false, error: undefined })}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Try again
              </button>
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
              >
                Refresh page
              </button>
            </div>
            <details className="mt-4 text-left">
              <summary className="text-sm text-gray-500 cursor-pointer">Error details</summary>
              <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                {this.state.error?.stack}
              </pre>
            </details>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-background font-sans antialiased">
        <Navigation />
        
        <Routes>
          <Route path="/" element={<WelcomePage />} />
          <Route path="/budget" element={<BudgetPage />} />
          <Route path="/budget/:budgetId" element={<BudgetPage />} />
          <Route path="/accounts" element={<AccountsPage />} />
          <Route path="/categories" element={<CategoriesPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
        </Routes>
        
        {/* Toast notifications */}
        <Toaster
          position="top-right"
          toastOptions={{
            duration: 4000,
            style: {
              background: 'hsl(var(--card))',
              color: 'hsl(var(--card-foreground))',
              border: '1px solid hsl(var(--border))'
            }
          }}
        />
      </div>
    </ErrorBoundary>
  )
}

export default App 