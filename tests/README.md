# Bitcoin Budget App - Test Suite

This directory contains the comprehensive test suite for the Bitcoin Budget application. Tests are designed to verify functionality without relying on external services or wallets.

## Test Organization

### 📁 Directory Structure
```
tests/
├── system/              # Basic health and stability tests
│   ├── system-health-test.js           # Quick 30-second health check
│   ├── pre-launch-comprehensive-test.js # Pre-user-interaction verification
│   ├── comprehensive-system-test.js    # Factory pattern architecture test
│   ├── system-fragility-analysis.js    # Stability and fragility analysis
│   ├── final-system-verification.js    # Production readiness assessment
│   └── allocation-debug.js              # Debug allocation system issues
├── integration/         # Full workflow and feature tests  
│   ├── comprehensive-workflow-test.js   # Complete user workflows (navigation fixed)
│   ├── month-transition-test.js         # Monthly budgeting and rollover
│   ├── allocation-verification-test.js  # Focused allocation system testing
│   └── comprehensive-ui-test.js         # Complete UI functionality verification
├── unit/               # Individual component tests (future)
└── run-tests.js        # Test runner and documentation
```

## Available Tests

### 🔍 System Health Tests (Basic Stability)

#### System Health Test
**File**: `system/system-health-test.js`  
**Duration**: ~30 seconds  
**Purpose**: Quick stability check

**What it tests:**
- ✅ React app loading properly
- ✅ UI elements and navigation present
- ✅ Data loading and balance displays
- ✅ Interactive elements (buttons, forms)
- ✅ Basic navigation functionality
- ✅ Error detection and loading states

**When to run**: First test to run when checking system health

#### Pre-Launch Comprehensive Test
**File**: `system/pre-launch-comprehensive-test.js`  
**Duration**: ~1 minute  
**Purpose**: Final check before user interaction

**What it tests:**
- ✅ Complete app initialization
- ✅ All critical UI components
- ✅ Data management readiness
- ✅ Bitcoin terminology and functionality
- ✅ Responsive design elements
- ✅ Accessibility features
- ✅ Performance indicators

#### Comprehensive System Test
**File**: `system/comprehensive-system-test.js`  
**Duration**: ~1-2 minutes  
**Purpose**: Detailed system architecture verification

**What it tests:**
- ✅ Factory pattern implementation
- ✅ Data manager architecture
- ✅ Account management systems
- ✅ Budget period functionality
- ✅ Category allocation workflow
- ✅ Reset functionality stability
- ✅ UI responsiveness

#### System Fragility Analysis
**File**: `system/system-fragility-analysis.js`  
**Duration**: ~2-3 minutes  
**Purpose**: Identify potential breaking points

**What it tests:**
- ✅ Data manager singleton stability
- ✅ React Query cache consistency
- ✅ Initialization race conditions
- ✅ UI state management
- ✅ Data persistence reliability
- ✅ Error recovery mechanisms
- ✅ Memory management
- ✅ Concurrent operation safety

#### Final System Verification
**File**: `system/final-system-verification.js`  
**Duration**: ~2-3 minutes  
**Purpose**: Production readiness assessment

**What it tests:**
- 🚨 **Critical Systems** (Production Blocking)
- ⚠️ **Important Systems** (Highly Recommended)  
- 💡 **Optional Systems** (Enhancement Opportunities)
- 📊 **Production Readiness Score**
- 🎯 **Deployment Recommendations**

### 🔄 Integration Tests (Full Workflows)

#### Comprehensive Workflow Test (Fixed)
**File**: `integration/comprehensive-workflow-test.js`  
**Duration**: ~2-3 minutes  
**Purpose**: Full user workflow testing

**What it tests:**
- ✅ **Fixed Navigation**: No longer breaks on account creation
- ✅ Transaction creation with existing accounts
- ✅ Category creation and management
- ✅ Sats allocation workflow
- ✅ Balance calculations and math accuracy
- ✅ Data persistence across page reloads
- ✅ React Query cache invalidation

**Navigation Fix**: This test no longer tries to create accounts (which redirected to welcome page). Instead, it works within the existing budget context using available accounts from dropdowns.

#### Month Transition Test
**File**: `integration/month-transition-test.js`  
**Duration**: ~1-2 minutes  
**Purpose**: Monthly budgeting system testing

**What it tests:**
- ✅ Current month state capture
- ✅ Month navigation (next/previous)
- ✅ Rollover logic verification
- ✅ Allocation functionality across months
- ✅ Data integrity during transitions
- ✅ Bidirectional navigation stability

#### Allocation Verification Test
**File**: `integration/allocation-verification-test.js`  
**Duration**: ~2-3 minutes  
**Purpose**: Focused allocation system testing

**What it tests:**
- ✅ Initial state verification
- ✅ Category card detection
- ✅ Allocation button functionality
- ✅ Modal opening and form interaction
- ✅ Balance update verification
- ✅ React Query cache testing
- ✅ Data persistence with page reload

#### Comprehensive UI Test
**File**: `integration/comprehensive-ui-test.js`  
**Duration**: ~1-2 minutes  
**Purpose**: Complete UI functionality verification

**What it tests:**
- ✅ Initial data loading
- ✅ Budget period navigation
- ✅ Account balance display
- ✅ Allocation workflow (critical)
- ✅ Category management
- ✅ Real-time updates
- ✅ Error handling

### 🐛 Debug Tests (Troubleshooting)

#### Allocation Debug Test
**File**: `system/allocation-debug.js`  
**Duration**: ~1-2 minutes  
**Purpose**: Detailed allocation system debugging

**What it tests:**
- 🐛 Step-by-step allocation process
- 🐛 Detailed component inspection
- 🐛 Form interaction debugging
- 🐛 Modal state analysis
- 🐛 Balance calculation verification
- 🐛 React Query cache behavior
- 🐛 Comprehensive error logging

## How to Run Tests

### Method 1: Test Runner (Recommended)
Load the test runner for an organized menu:
```javascript
fetch("/tests/run-tests.js").then(r=>r.text()).then(eval)
```

Then use helper functions:
```javascript
loadTest("health")             // Quick health check
loadTest("prelaunch")          // Pre-interaction verification
loadTest("workflow")           // Full workflow test
loadTest("monthly")            // Month transition test
loadTest("allocation")         // Allocation verification
loadTest("fragility")          // Fragility analysis
loadTest("final_verification") // Production readiness
loadTest("allocation_debug")   // Debug allocation issues
```

### Method 2: Test Sequences
Run multiple tests in sequence:
```javascript
runTestSequence("quick")       // health → prelaunch
runTestSequence("basic")       // health → workflow → monthly  
runTestSequence("full")        // health → workflow → fragility → final_verification
runTestSequence("debug")       // allocation_debug → allocation → fragility
```

### Method 3: Direct Test Loading
Copy and paste into browser console:

**System Health Test:**
```javascript
fetch("/tests/system/system-health-test.js").then(r=>r.text()).then(eval)
```

**Comprehensive Workflow Test:**
```javascript
fetch("/tests/integration/comprehensive-workflow-test.js").then(r=>r.text()).then(eval)
```

**Month Transition Test:**
```javascript
fetch("/tests/integration/month-transition-test.js").then(r=>r.text()).then(eval)
```

**Final System Verification:**
```javascript
fetch("/tests/system/final-system-verification.js").then(r=>r.text()).then(eval)
```

## Test Complexity Levels

- **🟢 Simple**: Quick checks, minimal interaction (30 seconds - 1 minute)
- **🟡 Moderate**: Some user simulation, basic workflows (1-2 minutes)  
- **🟠 Complex**: Full workflows, data manipulation, persistence testing (2-3 minutes)
- **🔴 Advanced**: Deep analysis, stability assessment, production readiness (2-3 minutes)
- **🔧 Debug**: Detailed logging, troubleshooting, step-by-step analysis (1-2 minutes)

## Interpreting Results

### Success Indicators
- ✅ **Green checkmarks** = Test passed
- **📊 Success rate** displayed at end of each test
- **💚 90%+** = Excellent system health
- **💛 70-89%** = Good, minor issues
- **❤️ <70%** = Needs attention

### Warning & Error Indicators
- ⚠️ **Yellow triangles** = Warnings detected
- ❌ **Red X marks** = Test failed
- **Error details** provided for each failure
- **Troubleshooting suggestions** included in test output

## Production Readiness Criteria

### Target Success Rates
- **System Health Test**: 90%+ pass rate
- **Pre-Launch Test**: 90%+ pass rate
- **Comprehensive Workflow Test**: 85%+ pass rate  
- **Month Transition Test**: 80%+ pass rate
- **Final Verification Critical Systems**: 95%+ pass rate
- **No Critical Crashes**: Tests should complete without system failures

### What Each Success Rate Means
- **95%+**: System is production-ready and highly stable
- **90%+**: System is production-ready with excellent stability
- **80-89%**: System is mostly stable, minor issues acceptable
- **70-79%**: System has issues that should be addressed
- **<70%**: System needs significant attention before release

## Recommended Testing Workflows

### 🚀 Quick Health Check (2-3 minutes)
```javascript
runTestSequence("quick")  // health → prelaunch
```
Perfect for: Daily development checks, CI/CD pipeline

### 🧪 Basic Development Testing (5-7 minutes)  
```javascript
runTestSequence("basic")  // health → workflow → monthly
```
Perfect for: Feature development, pull request verification

### 📊 Comprehensive Analysis (8-12 minutes)
```javascript
runTestSequence("full")   // health → workflow → fragility → final_verification
```
Perfect for: Release preparation, major feature releases

### 🐛 Issue Troubleshooting (5-8 minutes)
```javascript
runTestSequence("debug")  // allocation_debug → allocation → fragility
```
Perfect for: Debugging allocation issues, investigating problems

### 🎯 Production Deployment Check
```javascript
testCriticalSystems()     // Comprehensive production readiness check
```
Perfect for: Pre-deployment verification, production health monitoring

## Important Notes

### Test Behavior
- ⚠️ **Creates Real Data**: Tests create actual transactions, categories, and allocations
- 🔄 **Includes Page Reloads**: Tests refresh the page to verify data persistence
- 🧪 **Non-Destructive Design**: Tests are designed to be safe but create test records
- 📊 **Data Modification**: Some tests may modify existing data for verification purposes

### Prerequisites
- ✅ Development server running on port 5173
- ✅ Browser with JavaScript console access
- ✅ App initialized (welcome screen completed)
- ✅ At least one account existing for workflow tests

## Troubleshooting

### Common Issues
- **Tests fail to load**: Check dev server is running and accessible on port 5173
- **Navigation failures**: Tests adapt automatically and continue execution
- **Allocation failures**: Run `loadTest("allocation_debug")` for detailed analysis
- **Data persistence issues**: Check IndexedDB and encryption functionality
- **Cache invalidation problems**: Verify React Query hooks are properly configured
- **Infinite loading**: Verify React Query hooks are using correct properties

### Debug Information
Each test provides detailed output including:
- Current system state and data snapshots
- Expected vs actual values with variance analysis
- Error messages and stack traces for failures
- Data flow summaries and balance calculations
- Performance timings and operation durations
- Step-by-step execution logs for debugging

## Historical Context

### Navigation Issue Resolution (January 2025)
**Problem**: Original comprehensive test broke when creating accounts redirected to welcome page.

**Solution**: Redesigned test to work within existing budget context:
- No account creation during tests
- Uses existing accounts from dropdowns
- Stays within budget page context
- Added `ensureBudgetPage()` helper for reliable navigation

**Result**: Tests now run reliably without navigation issues.

### Test Organization Improvement (January 2025)
**Before**: Test files scattered in root directory, hard to find and manage  
**After**: Organized by purpose and complexity:
- `system/` for basic health checks and stability analysis
- `integration/` for full workflow testing and user interactions  
- `unit/` for individual component testing (future)
- `run-tests.js` for easy access and comprehensive documentation

**Benefits**: 
- ✅ Easy to find appropriate tests for different scenarios
- ✅ Clear progression from simple to complex testing
- ✅ Organized by test purpose and complexity level
- ✅ Comprehensive documentation and helper functions

## Future Improvements

### Planned Additions
- **Unit Tests**: Individual component testing with React Testing Library
- **End-to-End Tests**: Complete user journey automation with Playwright
- **Performance Tests**: Load testing and optimization verification
- **Accessibility Tests**: WCAG compliance verification with axe-core
- **Security Tests**: Encryption and data safety verification

### Contributing
When adding new tests:
1. Place them in the appropriate directory (`system/`, `integration/`, or `unit/`)
2. Follow the existing naming pattern: `kebab-case.js`
3. Update `run-tests.js` to include new tests in the appropriate category
4. Update this README with test descriptions and usage
5. Ensure tests are non-destructive and include proper cleanup
6. Add appropriate complexity level and duration estimates

---

## Quick Start

1. **Load the test runner**:
   ```javascript
   fetch("/tests/run-tests.js").then(r=>r.text()).then(eval)
   ```

2. **Run recommended test sequence**:
   ```javascript
   loadTest("health")          // Quick health check
   loadTest("workflow")        // Test core features  
   loadTest("final_verification") // Production readiness
   ```

3. **Review results** and address any failures with <70% success rates

4. **Repeat tests** after making changes to verify stability

The organized test suite provides confidence in system stability and production readiness! 🚀 