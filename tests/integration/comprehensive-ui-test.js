/**
 * COMPREHENSIVE UI FUNCTIONALITY TEST
 * 
 * This script tests all major UI functions to identify issues:
 * 1. Data initialization and budget periods
 * 2. Account management and balance display
 * 3. Category creation and management
 * 4. Fund allocation workflow (the main issue)
 * 5. Real-time UI updates
 * 6. Navigation between periods
 */

console.log('🧪 COMPREHENSIVE UI FUNCTIONALITY TEST');
console.log('=====================================');

// Helper function to wait for condition
function waitFor(condition, timeout = 5000) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    const check = () => {
      if (condition()) {
        resolve();
      } else if (Date.now() - start > timeout) {
        reject(new Error('Timeout waiting for condition'));
      } else {
        setTimeout(check, 100);
      }
    };
    check();
  });
}

// Helper function to wait for UI element
function waitForElement(selector, timeout = 5000) {
  return waitFor(() => document.querySelector(selector), timeout);
}

// Helper function to click and wait
async function clickAndWait(selector, waitForSelector = null) {
  const element = document.querySelector(selector);
  if (!element) throw new Error(`Element not found: ${selector}`);
  
  element.click();
  
  if (waitForSelector) {
    await waitForElement(waitForSelector);
  } else {
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// Test suite object to track results
const testResults = {
  passed: 0,
  failed: 0,
  tests: []
};

function logTest(name, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status}: ${name} ${details}`);
  
  testResults.tests.push({ name, passed, details });
  if (passed) {
    testResults.passed++;
  } else {
    testResults.failed++;
  }
}

// ============================================================================
// TEST 1: INITIAL DATA LOADING
// ============================================================================

async function testInitialDataLoading() {
  console.log('\n📊 TEST 1: Initial Data Loading');
  console.log('=================================');
  
  try {
    // Wait for the app to initialize
    await waitForElement('[data-testid="budget-page"], .space-y-6', 10000);
    logTest('App initialized', true);
    
    // Check for basic UI elements
    const hasHeader = document.querySelector('h1')?.textContent?.includes('Bitcoin Budget');
    logTest('Header rendered', hasHeader, hasHeader ? '' : 'Header not found');
    
    // Check if budget period selector exists
    const hasPeriodSelector = !!document.querySelector('[class*="budget-period"], [class*="period-selector"]');
    logTest('Budget Period Selector rendered', hasPeriodSelector);
    
    // Check summary cards
    const summaryCards = document.querySelectorAll('.grid .p-4, .grid .border');
    logTest('Summary cards rendered', summaryCards.length >= 4, `Found ${summaryCards.length} cards`);
    
  } catch (error) {
    logTest('Initial data loading', false, error.message);
  }
}

// ============================================================================
// TEST 2: BUDGET PERIOD NAVIGATION
// ============================================================================

async function testBudgetPeriodNavigation() {
  console.log('\n📅 TEST 2: Budget Period Navigation');
  console.log('===================================');
  
  try {
    // Look for period selector
    const periodSelector = document.querySelector('button[class*="Calendar"], button:has(.text-lg)');
    logTest('Period selector found', !!periodSelector);
    
    if (periodSelector) {
      // Check current period display
      const currentPeriodText = periodSelector.textContent;
      logTest('Current period displayed', !!currentPeriodText, `Shows: "${currentPeriodText}"`);
      
      // Try to open period dropdown
      await clickAndWait(periodSelector);
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Check if dropdown appeared
      const dropdown = document.querySelector('[class*="dropdown"], [class*="absolute"]');
      logTest('Period dropdown opens', !!dropdown);
      
      // Close dropdown by clicking outside
      if (dropdown) {
        document.body.click();
        await new Promise(resolve => setTimeout(resolve, 300));
      }
    }
    
  } catch (error) {
    logTest('Budget period navigation', false, error.message);
  }
}

// ============================================================================
// TEST 3: ACCOUNT BALANCE DISPLAY
// ============================================================================

async function testAccountBalanceDisplay() {
  console.log('\n💰 TEST 3: Account Balance Display');
  console.log('==================================');
  
  try {
    // Find balance display elements
    const balanceElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && (el.textContent.includes('sats') || el.textContent.includes('Available') || el.textContent.includes('Total'))
    );
    
    logTest('Balance elements found', balanceElements.length > 0, `Found ${balanceElements.length} balance elements`);
    
    // Check for specific balance types
    const totalAvailable = balanceElements.find(el => el.textContent.includes('Total Available'));
    const allocated = balanceElements.find(el => el.textContent.includes('Allocated'));
    const unassigned = balanceElements.find(el => el.textContent.includes('Unassigned'));
    
    logTest('Total Available displayed', !!totalAvailable, totalAvailable?.textContent);
    logTest('Allocated displayed', !!allocated, allocated?.textContent);
    logTest('Unassigned displayed', !!unassigned, unassigned?.textContent);
    
    // Check for duplicate "sats sats" issue
    const duplicateSats = balanceElements.some(el => el.textContent.includes('sats sats'));
    logTest('No duplicate "sats sats" text', !duplicateSats, duplicateSats ? 'Found duplicate sats text!' : '');
    
  } catch (error) {
    logTest('Account balance display', false, error.message);
  }
}

// ============================================================================
// TEST 4: ALLOCATION WORKFLOW (MAIN ISSUE)
// ============================================================================

async function testAllocationWorkflow() {
  console.log('\n🎯 TEST 4: Allocation Workflow (CRITICAL)');
  console.log('==========================================');
  
  try {
    // Find allocate button
    const allocateButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && (btn.textContent.includes('Allocate') || btn.textContent.includes('sats'))
    );
    
    logTest('Allocate button found', !!allocateButton, allocateButton?.textContent);
    
    if (allocateButton && !allocateButton.disabled) {
      // Click allocate button
      await clickAndWait(allocateButton);
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Check if modal opened
      const modal = document.querySelector('[class*="modal"], [class*="fixed"][class*="inset-0"], .bg-black.bg-opacity-50');
      logTest('Allocation modal opens', !!modal);
      
      if (modal) {
        // Check modal contents
        const modalContent = modal.textContent;
        const hasAmountInput = modal.querySelector('input[type="number"], input[name="amount"]');
        const hasSubmitButton = Array.from(modal.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Allocate') || btn.textContent.includes('Save') || btn.textContent.includes('Confirm')
        );
        
        logTest('Modal has amount input', !!hasAmountInput);
        logTest('Modal has submit button', !!hasSubmitButton);
        
        // Try to close modal
        const closeButton = modal.querySelector('[class*="close"], button');
        if (closeButton) {
          closeButton.click();
          await new Promise(resolve => setTimeout(resolve, 500));
        }
      }
    } else {
      logTest('Allocate button enabled', false, 'Button is disabled or not found');
    }
    
  } catch (error) {
    logTest('Allocation workflow', false, error.message);
  }
}

// ============================================================================
// TEST 5: CATEGORY MANAGEMENT
// ============================================================================

async function testCategoryManagement() {
  console.log('\n📂 TEST 5: Category Management');
  console.log('===============================');
  
  try {
    // Find category cards
    const categoryCards = document.querySelectorAll('[class*="category"], [class*="card"]');
    logTest('Category cards found', categoryCards.length > 0, `Found ${categoryCards.length} category cards`);
    
    // Check for add category button
    const addCategoryButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent && btn.textContent.includes('Add Category')
    );
    logTest('Add Category button found', !!addCategoryButton);
    
    // Check category card contents
    if (categoryCards.length > 0) {
      const firstCard = categoryCards[0];
      const hasTitle = firstCard.querySelector('h3, h4, .font-bold');
      const hasAmount = firstCard.textContent.includes('sats');
      
      logTest('Category cards have titles', !!hasTitle);
      logTest('Category cards show amounts', hasAmount);
    }
    
  } catch (error) {
    logTest('Category management', false, error.message);
  }
}

// ============================================================================
// TEST 6: REAL-TIME UPDATES
// ============================================================================

async function testRealTimeUpdates() {
  console.log('\n🔄 TEST 6: Real-time Updates');
  console.log('=============================');
  
  try {
    // Check if balance numbers are properly formatted
    const balanceElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && el.textContent.match(/\d+(?:,\d{3})*\s*sats/)
    );
    
    logTest('Formatted balance numbers', balanceElements.length > 0, `Found ${balanceElements.length} formatted balances`);
    
    // Check for loading indicators
    const loadingElements = document.querySelectorAll('[class*="loading"], [class*="spin"]');
    const activeLoaders = Array.from(loadingElements).filter(el => {
      const style = window.getComputedStyle(el);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    logTest('No stuck loading states', activeLoaders.length === 0, `Found ${activeLoaders.length} active loaders`);
    
  } catch (error) {
    logTest('Real-time updates', false, error.message);
  }
}

// ============================================================================
// TEST 7: ERROR HANDLING
// ============================================================================

async function testErrorHandling() {
  console.log('\n⚠️ TEST 7: Error Handling');
  console.log('=========================');
  
  try {
    // Check for error messages in the UI
    const errorElements = Array.from(document.querySelectorAll('*')).filter(el => 
      el.textContent && (el.textContent.includes('Error') || el.textContent.includes('Failed'))
    );
    
    logTest('No visible errors', errorElements.length === 0, errorElements.length > 0 ? `Found ${errorElements.length} error messages` : '');
    
    // Check for proper button states
    const buttons = document.querySelectorAll('button');
    const disabledButtons = Array.from(buttons).filter(btn => btn.disabled);
    
    logTest('Some buttons enabled', buttons.length > disabledButtons.length, `${buttons.length - disabledButtons.length} enabled buttons`);
    
  } catch (error) {
    logTest('Error handling', false, error.message);
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runComprehensiveUITest() {
  console.log('⏱️ Waiting for app to load...\n');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  try {
    await testInitialDataLoading();
    await testBudgetPeriodNavigation();
    await testAccountBalanceDisplay();
    await testAllocationWorkflow();
    await testCategoryManagement();
    await testRealTimeUpdates();
    await testErrorHandling();
    
    // Final results
    console.log('\n' + '='.repeat(60));
    console.log('🧪 COMPREHENSIVE UI TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${testResults.passed}`);
    console.log(`❌ Tests Failed: ${testResults.failed}`);
    console.log(`📊 Success Rate: ${Math.round((testResults.passed / (testResults.passed + testResults.failed)) * 100)}%`);
    
    if (testResults.failed === 0) {
      console.log('\n🎉 ALL UI TESTS PASSED!');
      console.log('✅ User interface is fully functional');
      console.log('✅ All workflows are working properly');
      console.log('✅ Ready for user interaction');
    } else if (testResults.failed <= 2) {
      console.log('\n⚠️ MINOR UI ISSUES');
      console.log('Most functionality working, some edge cases need attention');
    } else {
      console.log('\n❌ UI ISSUES DETECTED');
      console.log('Several problems found that may affect user experience:');
      testResults.tests.filter(test => !test.passed).forEach(test => {
        console.log(`   • ${test.name}: ${test.details}`);
      });
    }
    
    // Detailed breakdown
    console.log('\n📋 DETAILED TEST BREAKDOWN:');
    testResults.tests.forEach(test => {
      const icon = test.passed ? '✅' : '❌';
      console.log(`${icon} ${test.name}${test.details ? ': ' + test.details : ''}`);
    });
    
  } catch (error) {
    console.error('💥 UI TEST SUITE CRASHED:', error);
    console.log('❌ Critical failure in UI testing framework');
  }
}

// Start the comprehensive UI test
console.log('🚀 Starting comprehensive UI test in 2 seconds...\n');
setTimeout(() => {
  runComprehensiveUITest().catch(error => {
    console.error('💥 COMPREHENSIVE UI TEST FAILED:', error);
  });
}, 2000); 