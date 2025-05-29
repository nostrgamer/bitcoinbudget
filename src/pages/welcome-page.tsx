import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Bitcoin, Shield, Wallet, Zap } from 'lucide-react'

const WelcomePage = () => {
  const navigate = useNavigate()
  const [isLoading, setIsLoading] = useState(false)

  const handleGetStarted = async () => {
    setIsLoading(true)
    // Simulate loading for better UX
    await new Promise(resolve => setTimeout(resolve, 500))
    navigate('/budget')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      <div className="container mx-auto px-4 py-16">
        {/* Header */}
        <div className="text-center mb-16">
          <div className="flex justify-center mb-6">
            <div className="relative">
              <Bitcoin className="h-16 w-16 text-primary bitcoin-pulse" />
              <div className="absolute -top-1 -right-1 h-6 w-6 bg-green-500 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-white">₿</span>
              </div>
            </div>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-5 bg-gradient-to-r from-primary to-green-600 bg-clip-text text-transparent leading-tight py-2">
            Bitcoin Budget
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Take control of your Bitcoin with envelope budgeting. 
            Private, secure, and designed for Bitcoiners.
          </p>
        </div>

        {/* Features */}
        <div className="grid md:grid-cols-3 gap-8 mb-16">
          <div className="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <Shield className="h-12 w-12 text-primary mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Privacy First</h3>
            <p className="text-muted-foreground">
              All data stays on your device. Encrypted locally with no servers or tracking.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <Wallet className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Envelope Budgeting</h3>
            <p className="text-muted-foreground">
              Allocate your sats into categories and track spending with proven methodology.
            </p>
          </div>
          
          <div className="text-center p-6 rounded-lg border bg-card hover:shadow-lg transition-shadow">
            <Zap className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
            <h3 className="text-xl font-semibold mb-2">Lightning Fast</h3>
            <p className="text-muted-foreground">
              Built for speed with offline support. Works anywhere, anytime.
            </p>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center">
          <button
            onClick={handleGetStarted}
            disabled={isLoading}
            className="inline-flex items-center px-8 py-4 text-lg font-semibold text-primary-foreground bg-primary hover:bg-primary/90 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <>
                <div className="loading-spinner mr-2" />
                Loading...
              </>
            ) : (
              <>
                Get Started
                <Bitcoin className="ml-2 h-5 w-5" />
              </>
            )}
          </button>
          <p className="text-sm text-muted-foreground mt-4">
            No signup required • No personal data collected
          </p>
        </div>

        {/* Footer */}
        <div className="text-center mt-16 pt-8 border-t">
          <p className="text-sm text-muted-foreground">
            Built with ❤️ for the Bitcoin community
          </p>
        </div>
      </div>
    </div>
  )
}

export default WelcomePage 