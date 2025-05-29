# Bitcoin Budget App - Architecture Documentation

## Overview

Bitcoin Budget is a privacy-focused budgeting application designed specifically for Bitcoin users. It follows envelope budgeting methodology with monthly budget periods and comprehensive account management, operating entirely in Bitcoin/sats with manual transaction entry. The application prioritizes user privacy by storing all data locally with client-side encryption.

## Implementation Phases

### Phase 1: Foundation ✅ COMPLETE
- Basic envelope budgeting system
- Category management with allocation tracking
- Transaction recording and management
- Transfer system between categories
- Client-side encryption and storage

### Phase 2: Account Management 🚧 IN PROGRESS
- Multiple Bitcoin account/wallet support
- Account-based transaction tracking
- Account balance calculation and reconciliation
- Inter-account transfer functionality
- Account type classification (checking, savings, etc.)

### Phase 3: Monthly Budgeting 📋 PLANNED
- Monthly budget period management
- Rollover logic for unspent category funds
- Monthly allocation workflow
- Historical budget tracking and analysis
- Advanced reporting across budget periods

## Core Principles

### 1. Privacy First
- **Zero Server Storage**: All user data remains on the client device
- **Client-Side Encryption**: Data encrypted before storage using Web Crypto API
- **No Telemetry**: No analytics or tracking of user behavior
- **Open Source**: Full transparency through open-source codebase

### 2. Bitcoin Native
- **Sat-Based Accounting**: All calculations in satoshis (integers only)
- **Manual Entry**: No wallet connectivity for maximum security
- **Bitcoin-Centric UX**: Interface designed around Bitcoin concepts
- **Account-Based**: All transactions tied to specific Bitcoin accounts

### 3. Envelope Budgeting
- **Monthly Cycles**: Budget periods with rollover logic
- **Category Allocation**: Assign available funds to spending categories
- **Zero-Based Budgeting**: Every sat has a purpose
- **Rollover Logic**: Unspent funds automatically roll to next month

### 4. Offline First
- **PWA Architecture**: Works without internet connection
- **Local Storage**: IndexedDB for persistent data storage
- **Service Worker**: Caching for offline functionality

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Browser Environment                       │
├─────────────────────────────────────────────────────────────┤
│  React App (TypeScript)                                     │
│  ├── UI Components (shadcn/ui + Tailwind)                   │
│  ├── State Management (TanStack Query + React State)        │
│  ├── Routing (React Router)                                 │
│  └── Business Logic                                         │
├─────────────────────────────────────────────────────────────┤
│  Budget Engine                                              │
│  ├── Monthly Budget Engine (Phase 3)                        │
│  ├── Account Management System (Phase 2)                    │
│  ├── Envelope Budgeting Logic                               │
│  └── Transfer & Allocation Engine                           │
├─────────────────────────────────────────────────────────────┤
│  Data Layer                                                 │
│  ├── Encryption Service (Web Crypto API)                    │
│  ├── Storage Service (IndexedDB)                            │
│  ├── Data Models & Validation                               │
│  └── Migration Service                                      │
├─────────────────────────────────────────────────────────────┤
│  Browser APIs                                               │
│  ├── IndexedDB (Persistent Storage)                         │
│  ├── Web Crypto API (Encryption)                            │
│  ├── Service Worker (Offline Support)                       │
│  └── Local Storage (Settings Only)                          │
└─────────────────────────────────────────────────────────────┘
```

## Data Models

### Core Entities

#### Budget
```typescript
interface Budget {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  currency: 'BTC' | 'sats';
  currentPeriodId: string; // Current active budget period
  settings: BudgetSettings;
}
```

#### Account (Phase 2)
```typescript
interface Account {
  id: string;
  budgetId: string;
  name: string;
  type: 'checking' | 'savings' | 'investment' | 'cash';
  description?: string;
  balance: number; // current balance in sats (calculated from transactions)
  isOnBudget: boolean; // whether transactions affect budget categories
  isClosed: boolean;
  sortOrder: number;
  createdAt: Date;
  updatedAt: Date;
}
```

#### BudgetPeriod (Phase 3)
```typescript
interface BudgetPeriod {
  id: string;
  budgetId: string;
  month: number; // 1-12
  year: number;
  startDate: Date;
  endDate: Date;
  isActive: boolean;
  totalIncome: number; // sats
  totalBudgeted: number; // sats allocated to categories
  totalActivity: number; // sats spent
  createdAt: Date;
  updatedAt: Date;
}
```

#### Category
```typescript
interface Category {
  id: string;
  budgetId: string;
  name: string;
  description?: string;
  color: string;
  targetAmount: number; // monthly target allocation in sats
  currentAmount: number; // current available balance in sats
  type: 'expense' | 'income' | 'savings';
  parentId?: string; // for subcategories
  sortOrder: number;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}
```

#### Transaction (Enhanced for Phase 2)
```typescript
interface Transaction {
  id: string;
  budgetId: string;
  accountId: string; // Required - all transactions tied to accounts
  categoryId?: string; // Optional - can be unassigned
  amount: number; // sats (negative for outflows, positive for inflows)
  description: string;
  date: Date;
  type: TransactionType; // 'income' | 'expense' | 'transfer'
  tags?: string[];
  cleared: boolean; // for reconciliation
  approved: boolean;
  transferAccountId?: string; // for account-to-account transfers
  transferTransactionId?: string; // linked transfer transaction
  createdAt: Date;
  updatedAt: Date;
}
```

#### Transfer
```typescript
interface Transfer {
  id: string;
  budgetId: string;
  fromCategoryId: string; // Can be UNASSIGNED_CATEGORY_ID
  toCategoryId: string;   // Can be UNASSIGNED_CATEGORY_ID
  amount: number; // sats
  description?: string;
  date: Date;
  createdAt: Date;
}
```

#### CategoryAllocation (Phase 3)
```typescript
interface CategoryAllocation {
  id: string;
  budgetId: string;
  budgetPeriodId: string;
  categoryId: string;
  budgeted: number; // sats allocated for this period
  activity: number; // sats spent in this period
  available: number; // remaining balance (calculated)
  carryover: number; // amount carried from previous period
  createdAt: Date;
  updatedAt: Date;
}
```

## Security Architecture

### Encryption Strategy

#### Master Key Derivation
```typescript
// User password → Master Key
const masterKey = await crypto.subtle.deriveKey(
  {
    name: 'PBKDF2',
    salt: userSalt, // unique per user
    iterations: 100000,
    hash: 'SHA-256'
  },
  passwordKey,
  { name: 'AES-GCM', length: 256 },
  false,
  ['encrypt', 'decrypt']
);
```

#### Data Encryption
- **Algorithm**: AES-256-GCM
- **Key Derivation**: PBKDF2 with 100,000 iterations
- **Salt**: Unique per user, stored unencrypted
- **IV**: Unique per encryption operation
- **Authentication**: Built into GCM mode

#### Storage Structure
```typescript
interface EncryptedData {
  version: number;
  salt: Uint8Array;
  iv: Uint8Array;
  data: Uint8Array; // encrypted JSON
  authTag: Uint8Array; // GCM authentication tag
}
```

### Key Management
- **Password-Based**: User password is the only key
- **No Key Recovery**: Lost password = lost data (by design)
- **Session Keys**: Derived keys cached in memory during session
- **Auto-Lock**: Clear keys after inactivity timeout

## Data Storage

### IndexedDB Schema

#### Object Stores
1. **budgets**: Encrypted budget metadata
2. **accounts**: Encrypted account data (Phase 2)
3. **budget_periods**: Encrypted budget period data (Phase 3)
4. **categories**: Encrypted category data
5. **category_allocations**: Encrypted monthly category allocations (Phase 3)
6. **transactions**: Encrypted transaction data (account-linked)
7. **transfers**: Encrypted transfer data (category-to-category)
8. **settings**: Encrypted user settings
9. **metadata**: Unencrypted app metadata (version, etc.)

#### Indexes
- `transactions_by_account`: accountId, date
- `transactions_by_category`: categoryId, date
- `transactions_by_date`: date
- `transactions_by_period`: budgetPeriodId, date (Phase 3)
- `categories_by_budget`: budgetId, sortOrder
- `accounts_by_budget`: budgetId, sortOrder
- `transfers_by_date`: date
- `allocations_by_period`: budgetPeriodId, categoryId (Phase 3)
- `budget_periods_by_budget`: budgetId, year, month (Phase 3)

### Data Migration
```typescript
interface Migration {
  version: number;
  description: string;
  migrate: (db: IDBDatabase) => Promise<void>;
}
```

## Component Architecture

### Feature-Based Organization
```
src/
├── components/           # Reusable UI components
│   ├── ui/              # shadcn/ui components
│   ├── forms/           # Form components
│   └── layout/          # Layout components
├── features/            # Feature modules
│   ├── budget/          # Budget management & periods (Phase 3)
│   ├── accounts/        # Account management (Phase 2)
│   ├── transactions/    # Transaction management
│   ├── categories/      # Category management
│   ├── transfers/       # Transfer management
│   ├── allocation/      # Monthly allocation workflow (Phase 3)
│   └── settings/        # App settings
├── services/            # Business logic
│   ├── encryption/      # Encryption service
│   ├── storage/         # Storage service
│   ├── bitcoin/         # Bitcoin utilities
│   ├── budgeting/       # Budget calculation engine
│   └── validation/      # Data validation
├── hooks/               # Custom React hooks
├── utils/               # Utility functions
├── types/               # TypeScript definitions
└── constants/           # App constants
```

### State Management Strategy

#### Local State (React useState)
- Component-specific UI state
- Form state
- Modal visibility
- Loading states

#### Global State (TanStack Query)
- Budget data
- Account data
- Transaction data
- Category data

#### Persistent State (IndexedDB)
- All user data (encrypted)
- App settings
- User preferences

## Bitcoin Integration

### Sat Handling
```typescript
// Constants
const SATS_PER_BTC = 100_000_000;

// Utility functions
function btcToSats(btc: number): number {
  return Math.round(btc * SATS_PER_BTC);
}

function satsToBtc(sats: number): number {
  return sats / SATS_PER_BTC;
}

function formatSats(sats: number, unit: 'sats' | 'BTC' = 'sats'): string {
  if (unit === 'BTC') {
    return `₿${satsToBtc(sats).toFixed(8)}`;
  }
  return `${sats.toLocaleString()} sats`;
}
```

### Price Integration (Optional)
- Real-time BTC/USD rates for reference
- Historical price data for reporting
- No dependency on price for core functionality

## Performance Considerations

### Bundle Optimization
- Code splitting by route
- Lazy loading of heavy components
- Tree shaking of unused code
- Dynamic imports for optional features

### Runtime Performance
- React.memo for expensive components
- useMemo for expensive calculations
- useCallback for stable function references
- Virtual scrolling for large transaction lists

### Storage Performance
- Batch IndexedDB operations
- Efficient indexing strategy
- Pagination for large datasets
- Background data processing

## Security Considerations

### Threat Model
1. **Local Device Compromise**: Encryption protects data at rest
2. **Network Attacks**: No network communication for core features
3. **Browser Vulnerabilities**: CSP and secure coding practices
4. **Side-Channel Attacks**: Constant-time operations where possible

### Mitigation Strategies
- Content Security Policy (CSP)
- Subresource Integrity (SRI)
- Regular security audits
- Dependency vulnerability scanning
- Secure random number generation

## Deployment Architecture

### Static Hosting
- No server required
- CDN distribution
- HTTPS enforcement
- Immutable deployments

### Progressive Web App
- Service Worker for offline support
- App manifest for installation
- Background sync (when online)
- Push notifications (optional)

## Testing Strategy

### Unit Tests
- Utility functions
- Encryption/decryption
- Data validation
- Bitcoin calculations

### Integration Tests
- Storage operations
- Component interactions
- User workflows
- Error scenarios

### End-to-End Tests
- Critical user paths
- Cross-browser compatibility
- Performance benchmarks
- Security validation

## Monitoring & Analytics

### Privacy-Preserving Metrics
- No user tracking
- No personal data collection
- Optional anonymous usage statistics
- Local error logging only

### Performance Monitoring
- Core Web Vitals
- Bundle size tracking
- Load time metrics
- Error rate monitoring

## Future Considerations

### Phase 4: Advanced Features
- Advanced reporting and analytics
- Budget templates and goals
- Historical trend analysis
- Custom budget categories and rules
- Data export/import enhancements

### Phase 5: Bitcoin Integration
- Lightning Network transaction support
- Hardware wallet integration (read-only)
- Bitcoin price integration (optional)
- Multi-signature budget sharing
- Advanced Bitcoin address validation

### Phase 6: Platform Expansion
- Mobile app versions (React Native)
- Desktop app (Electron)
- Browser extension
- Multi-language support
- Advanced accessibility features

### Scalability Considerations
- Large transaction volumes (10k+ transactions)
- Multiple budget support
- Advanced categorization and tagging
- Performance optimization for large datasets
- Enhanced search and filtering capabilities

This architecture provides a solid foundation for a privacy-focused, Bitcoin-native budgeting application that implements comprehensive envelope budgeting with account management and monthly budget periods, while maintaining security and performance throughout all implementation phases. 