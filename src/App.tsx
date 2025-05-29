import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import WelcomePage from './pages/welcome-page.tsx'
import BudgetPage from './pages/budget-page.tsx'
import CategoriesPage from './pages/categories-page.tsx'
import TransactionsPage from './pages/transactions-page.tsx'
import TransfersPage from './pages/transfers-page.tsx'
import { AccountsPage } from './pages/accounts-page.tsx'
import { useBudgetStorageInit } from './hooks/use-budget-storage'
import './App.css'

function App() {
  // Initialize storage system
  useBudgetStorageInit()

  return (
    <div className="min-h-screen bg-background font-sans antialiased">
      <Routes>
        <Route path="/" element={<WelcomePage />} />
        <Route path="/budget" element={<BudgetPage />} />
        <Route path="/budget/:budgetId" element={<BudgetPage />} />
        <Route path="/accounts" element={<AccountsPage />} />
        <Route path="/categories" element={<CategoriesPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/transfers" element={<TransfersPage />} />
      </Routes>
      
      {/* Toast notifications */}
      <Toaster
        position="top-right"
        toastOptions={{
          duration: 4000,
          style: {
            background: 'hsl(var(--card))',
            color: 'hsl(var(--card-foreground))',
            border: '1px solid hsl(var(--border))',
          },
        }}
      />
    </div>
  )
}

export default App 