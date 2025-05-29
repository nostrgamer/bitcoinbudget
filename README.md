# Bitcoin Budget

A privacy-focused budgeting application designed specifically for Bitcoin users. Built with envelope budgeting methodology featuring monthly budget periods and account management, operating entirely in Bitcoin/sats with manual transaction entry.

## 🎯 Core Principles

- **Privacy First**: All data stays on your device, encrypted with your password
- **Bitcoin Native**: All calculations in satoshis, no floating point arithmetic
- **Manual Entry**: No wallet connectivity for maximum security
- **Offline First**: Works without internet connection
- **Envelope Budgeting**: Monthly budgeting with rollover logic and account management
- **Open Source**: Full transparency and community-driven development

## ✨ Features

### Current (Phase 1 Complete)
- 🔐 Client-side encryption using Web Crypto API
- 💾 Local storage with IndexedDB
- 📱 Progressive Web App (PWA) support
- 🎨 Modern, responsive UI with Tailwind CSS
- ⚡ Fast performance with React 18 and Vite
- 🔧 TypeScript for type safety
- 📊 Basic envelope budgeting with categories
- 💸 Transaction management with transfers
- 🎯 Budget allocation and tracking

### In Development (Phase 2 & 3)
- 🏦 **Account Management**: Multiple Bitcoin accounts/wallets
- 📅 **Monthly Budgeting**: Monthly budget periods with envelope methodology
- 🔄 **Rollover Logic**: Unspent funds roll to next month
- 💰 **Account Balances**: Track actual Bitcoin in each account
- 🔀 **Account Transfers**: Move Bitcoin between accounts
- 📋 **Reconciliation**: Match transactions with account statements

### Planned (Future)
- 📊 Advanced reporting and analytics
- 📈 Bitcoin price integration (optional)
- 🔄 Enhanced data import/export functionality
- 📱 Mobile app versions
- 🌐 Multi-language support
- 📈 Historical budget analysis
- 🎯 Budget templates and goals

## 🏗️ Architecture

This application follows a privacy-first, envelope budgeting architecture:

```
Browser Environment
├── React App (TypeScript)
├── Monthly Budget Engine
├── Account Management System
├── Data Layer (Encrypted)
├── IndexedDB Storage
└── Web Crypto API
```

### Data Model
```
Budget
├── Accounts (Bitcoin wallets/holdings)
├── Budget Periods (Monthly cycles)
├── Categories (Spending envelopes)
├── Transactions (Bitcoin movements)
└── Transfers (Between accounts/categories)
```

All user data is encrypted before storage using AES-256-GCM encryption with PBKDF2 key derivation. No data ever leaves your device.

## 🚀 Implementation Roadmap

### Phase 1: Foundation ✅ COMPLETE
- Basic envelope budgeting
- Category management
- Transaction tracking
- Transfer system
- Client-side encryption

### Phase 2: Account Management 🚧 IN PROGRESS
- Account CRUD operations
- Account balance tracking
- Account-based transactions
- Account transfer functionality
- Account reconciliation

### Phase 3: Monthly Budgeting 📋 PLANNED
- Budget period management
- Monthly category allocations
- Rollover logic implementation
- Monthly reporting
- Historical budget tracking

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/bitcoin-budget.git
cd bitcoin-budget
```

2. Install dependencies:
```bash
npm install
```

3. Start the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

The built files will be in the `dist` directory, ready for static hosting.

## 🛠️ Development

### Tech Stack

- **Frontend**: React 18 with TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Radix UI + shadcn/ui
- **Build Tool**: Vite
- **State Management**: TanStack Query + React State
- **Storage**: IndexedDB with encryption
- **Testing**: Vitest + React Testing Library

### Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   ├── forms/          # Form components
│   └── layout/         # Layout components
├── features/           # Feature modules
│   ├── budget/         # Budget management
│   ├── accounts/       # Account management
│   ├── transactions/   # Transaction management
│   └── categories/     # Category management
├── services/           # Business logic
│   ├── encryption/     # Encryption service
│   ├── storage/        # Storage service
│   └── bitcoin/        # Bitcoin utilities
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── types/              # TypeScript definitions
└── constants/          # App constants
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run test` - Run tests
- `npm run lint` - Lint code
- `npm run format` - Format code with Prettier
- `npm run type-check` - Check TypeScript types

### Code Style

This project follows strict coding standards:

- **TypeScript**: Strict mode enabled, no `any` types
- **ESLint**: Enforced code quality rules
- **Prettier**: Consistent code formatting
- **Conventional Commits**: Structured commit messages

## 🔒 Security

### Encryption

- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Unique per user
- **IV**: Unique per encryption operation

### Privacy

- No telemetry or analytics
- No external API calls for core functionality
- No user tracking
- All data processing happens locally

### Security Considerations

- Regular dependency updates
- Security-focused code reviews
- No sensitive data in logs
- Content Security Policy (CSP) implementation

## 🧪 Testing

Run the test suite:

```bash
npm run test
```

Run tests with coverage:

```bash
npm run test:coverage
```

Run tests in UI mode:

```bash
npm run test:ui
```

## 📖 Usage

### Getting Started

1. **Create Your First Budget**: Set up your budget with a secure password
2. **Add Accounts**: Create accounts for your Bitcoin holdings (wallets, exchanges, cold storage)
3. **Set Up Categories**: Organize your spending into categories (groceries, rent, savings, etc.)
4. **Enter Transactions**: Manually add your Bitcoin transactions linked to specific accounts
5. **Allocate Monthly Budget**: Assign sats to categories for the current month
6. **Track and Adjust**: Monitor spending and adjust allocations as needed

### Key Concepts

- **Sats**: All amounts are in satoshis (1 BTC = 100,000,000 sats)
- **Accounts**: Your Bitcoin wallets/holdings (hardware wallet, exchange, mobile wallet, etc.)
- **Categories**: Spending envelopes for organizing your budget (groceries, rent, savings, etc.)
- **Budget Periods**: Monthly cycles for budget allocation and tracking
- **Transactions**: Manual entries of Bitcoin movements tied to specific accounts
- **Transfers**: Moving Bitcoin between accounts or allocating to categories
- **Rollover**: Unspent category funds automatically roll to the next month
- **Available to Assign**: Unallocated Bitcoin available for budget assignment

### Account Types

- **Checking**: Day-to-day spending accounts (mobile wallets, exchange accounts)
- **Savings**: Long-term storage (hardware wallets, cold storage)
- **Investment**: Bitcoin held for investment purposes
- **Cash**: Physical Bitcoin representations (gift cards, etc.)

### Monthly Budgeting Workflow

1. **Start of Month**: Review previous month's performance
2. **Assign Available Funds**: Allocate unassigned Bitcoin to categories
3. **Track Spending**: Enter transactions as they occur
4. **Monitor Progress**: Check category balances throughout the month
5. **Month End**: Review results, plan for next month

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

### Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Inspired by envelope budgeting methodology
- Built with [React](https://reactjs.org/) and [TypeScript](https://www.typescriptlang.org/)
- UI components from [Radix UI](https://www.radix-ui.com/) and [shadcn/ui](https://ui.shadcn.com/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)

## 🔗 Links

- [Documentation](docs/)
- [Architecture Overview](ARCHITECTURE.md)
- [Security Model](docs/security.md)
- [API Reference](docs/api.md)

## 📞 Support

- [GitHub Issues](https://github.com/yourusername/bitcoin-budget/issues)
- [Discussions](https://github.com/yourusername/bitcoin-budget/discussions)

---

**⚠️ Important**: This software is in early development. Always backup your data and use at your own risk. Never store large amounts of Bitcoin information without proper security measures. 