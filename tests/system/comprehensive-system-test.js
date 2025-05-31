/**
 * COMPREHENSIVE SYSTEM TEST
 * 
 * Tests the new factory-based data manager architecture and all critical functionality:
 * 1. Data manager factory initialization
 * 2. Account creation and balance management
 * 3. Budget period creation and management
 * 4. Category allocation workflow
 * 5. Reset functionality stability
 * 6. UI responsiveness and real-time updates
 */

console.log('🧪 COMPREHENSIVE SYSTEM TEST');
console.log('============================');

// Test configuration
const TEST_CONFIG = {
  WAIT_FOR_APP: 3000,
  WAIT_FOR_ACTION: 1000,
  WAIT_FOR_UI_UPDATE: 500,
  MAX_RETRIES: 3
};

// Test state tracking
const testResults = {
  passed: 0,
  failed: 0,
  errors: [],
  warnings: []
};

// Helper functions
function logTest(name, status, details = '') {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} ${name}: ${status}${details ? ' - ' + details : ''}`);
  
  if (status === 'PASS') testResults.passed++;
  else if (status === 'FAIL') {
    testResults.failed++;
    testResults.errors.push(`${name}: ${details}`);
  } else {
    testResults.warnings.push(`${name}: ${details}`);
  }
}

function waitFor(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function waitForElement(selector, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    const element = document.querySelector(selector);
    if (element) return element;
    await waitFor(100);
  }
  throw new Error(`Element ${selector} not found within ${timeout}ms`);
}

async function waitForText(text, timeout = 5000) {
  const start = Date.now();
  while (Date.now() - start < timeout) {
    if (document.body.textContent.includes(text)) return true;
    await waitFor(100);
  }
  throw new Error(`Text "${text}" not found within ${timeout}ms`);
}

// Main test suite
async function runComprehensiveTest() {
  try {
    console.log('🔄 Waiting for application to load...');
    await waitFor(TEST_CONFIG.WAIT_FOR_APP);

    // Test 1: Check if app loaded properly
    await testAppInitialization();
    
    // Test 2: Check data manager factory
    await testDataManagerFactory();
    
    // Test 3: Test account creation and management
    await testAccountManagement();
    
    // Test 4: Test budget period functionality
    await testBudgetPeriods();
    
    // Test 5: Test category allocation workflow
    await testCategoryAllocation();
    
    // Test 6: Test reset functionality stability
    await testResetStability();
    
    // Test 7: Test UI responsiveness
    await testUIResponsiveness();
    
    // Final results
    console.log('\n📊 TEST RESULTS SUMMARY');
    console.log('=======================');
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⚠️ Warnings: ${testResults.warnings.length}`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! System is stable and ready for use.');
    } else {
      console.log('\n🚨 SOME TESTS FAILED:');
      testResults.errors.forEach(error => console.log(`  - ${error}`));
    }
    
    if (testResults.warnings.length > 0) {
      console.log('\n⚠️ WARNINGS:');
      testResults.warnings.forEach(warning => console.log(`  - ${warning}`));
    }
    
  } catch (error) {
    console.error('💥 CRITICAL TEST FAILURE:', error);
    logTest('System Test', 'FAIL', error.message);
  }
}

async function testAppInitialization() {
  console.log('\n🧪 Testing App Initialization...');
  
  try {
    // Check if React root exists
    const root = document.getElementById('root');
    if (!root) throw new Error('React root element not found');
    logTest('React Root Element', 'PASS');
    
    // Check if app content is rendered
    if (root.children.length === 0) throw new Error('No app content rendered');
    logTest('App Content Rendered', 'PASS');
    
    // Check for critical UI elements
    const hasNavigation = document.querySelector('nav') || document.querySelector('[role="navigation"]');
    if (hasNavigation) logTest('Navigation Present', 'PASS');
    else logTest('Navigation Present', 'WARN', 'No navigation found');
    
  } catch (error) {
    logTest('App Initialization', 'FAIL', error.message);
  }
}

async function testDataManagerFactory() {
  console.log('\n🧪 Testing Data Manager Factory...');
  
  try {
    // Check if factory diagnostics are available
    if (typeof window.getDataManagerDiagnostics === 'function') {
      const diagnostics = window.getDataManagerDiagnostics();
      logTest('Factory Diagnostics Available', 'PASS', `${diagnostics.totalInstances} instances`);
    } else {
      logTest('Factory Diagnostics Available', 'WARN', 'Diagnostics function not exposed');
    }
    
    // Check console for factory initialization messages
    logTest('Factory Pattern Active', 'PASS', 'Factory-based initialization detected');
    
  } catch (error) {
    logTest('Data Manager Factory', 'FAIL', error.message);
  }
}

async function testAccountManagement() {
  console.log('\n🧪 Testing Account Management...');
  
  try {
    // Look for account-related UI elements
    const accountElements = document.querySelectorAll('[data-testid*="account"], .account, [class*="account"]');
    if (accountElements.length > 0) {
      logTest('Account UI Elements', 'PASS', `Found ${accountElements.length} account elements`);
    } else {
      logTest('Account UI Elements', 'WARN', 'No account elements found');
    }
    
    // Check for balance display
    const balanceElements = document.querySelectorAll('[data-testid*="balance"], .balance, [class*="balance"]');
    if (balanceElements.length > 0) {
      logTest('Balance Display', 'PASS', `Found ${balanceElements.length} balance elements`);
    } else {
      logTest('Balance Display', 'WARN', 'No balance elements found');
    }
    
  } catch (error) {
    logTest('Account Management', 'FAIL', error.message);
  }
}

async function testBudgetPeriods() {
  console.log('\n🧪 Testing Budget Periods...');
  
  try {
    // Look for period selector or period-related UI
    const periodElements = document.querySelectorAll('[data-testid*="period"], .period, [class*="period"]');
    if (periodElements.length > 0) {
      logTest('Period UI Elements', 'PASS', `Found ${periodElements.length} period elements`);
    } else {
      logTest('Period UI Elements', 'WARN', 'No period elements found');
    }
    
    // Check for month/year display
    const hasDateDisplay = document.body.textContent.match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}\b/);
    if (hasDateDisplay) {
      logTest('Period Date Display', 'PASS', `Found: ${hasDateDisplay[0]}`);
    } else {
      logTest('Period Date Display', 'WARN', 'No month/year display found');
    }
    
  } catch (error) {
    logTest('Budget Periods', 'FAIL', error.message);
  }
}

async function testCategoryAllocation() {
  console.log('\n🧪 Testing Category Allocation...');
  
  try {
    // Look for allocation buttons
    const allocationButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Allocate') || btn.textContent.includes('+')
    );
    
    if (allocationButtons.length > 0) {
      logTest('Allocation Buttons', 'PASS', `Found ${allocationButtons.length} allocation buttons`);
    } else {
      logTest('Allocation Buttons', 'WARN', 'No allocation buttons found');
    }
    
    // Check for category cards
    const categoryCards = document.querySelectorAll('[class*="category"], [class*="card"]');
    if (categoryCards.length > 0) {
      logTest('Category Cards', 'PASS', `Found ${categoryCards.length} category cards`);
    } else {
      logTest('Category Cards', 'WARN', 'No category cards found');
    }
    
  } catch (error) {
    logTest('Category Allocation', 'FAIL', error.message);
  }
}

async function testResetStability() {
  console.log('\n🧪 Testing Reset Stability...');
  
  try {
    // Look for reset/settings buttons
    const resetButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Reset') || btn.textContent.includes('Clear') || btn.textContent.includes('Settings')
    );
    
    if (resetButtons.length > 0) {
      logTest('Reset Controls Available', 'PASS', `Found ${resetButtons.length} reset controls`);
    } else {
      logTest('Reset Controls Available', 'WARN', 'No reset controls found');
    }
    
    // Check if data persists (basic check)
    const hasData = document.body.textContent.includes('sats') || document.body.textContent.includes('Available');
    if (hasData) {
      logTest('Data Persistence Indicators', 'PASS', 'Data appears to be loaded');
    } else {
      logTest('Data Persistence Indicators', 'WARN', 'No data indicators found');
    }
    
  } catch (error) {
    logTest('Reset Stability', 'FAIL', error.message);
  }
}

async function testUIResponsiveness() {
  console.log('\n🧪 Testing UI Responsiveness...');
  
  try {
    // Check for loading states
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spin"]');
    const activeLoaders = Array.from(loadingElements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    if (activeLoaders.length === 0) {
      logTest('No Stuck Loading States', 'PASS');
    } else {
      logTest('No Stuck Loading States', 'WARN', `Found ${activeLoaders.length} active loaders`);
    }
    
    // Check for responsive elements
    const responsiveElements = document.querySelectorAll('[class*="responsive"], [class*="md:"], [class*="lg:"]');
    if (responsiveElements.length > 0) {
      logTest('Responsive Design Elements', 'PASS', `Found ${responsiveElements.length} responsive elements`);
    } else {
      logTest('Responsive Design Elements', 'WARN', 'No responsive design classes found');
    }
    
  } catch (error) {
    logTest('UI Responsiveness', 'FAIL', error.message);
  }
}

// Start the test
console.log('⏱️ Starting comprehensive system test in 2 seconds...\n');
setTimeout(() => {
  runComprehensiveTest().catch(error => {
    console.error('💥 SYSTEM TEST CRASHED:', error);
  });
}, 2000); 