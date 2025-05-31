/**
 * SYSTEM HEALTH TEST
 * 
 * Quick system health check to verify core functionality:
 * 1. React Query hooks working
 * 2. Data loading properly
 * 3. UI components rendered
 * 4. Basic navigation working
 * 5. No critical errors
 * 
 * Run this first to verify system stability.
 */

console.log('🔍 SYSTEM HEALTH TEST');
console.log('=====================');
console.log('Checking system health and basic functionality...\n');

async function runSystemHealthTest() {
  const results = {
    passed: 0,
    failed: 0,
    errors: [],
    data: {}
  };

  function testResult(name, condition, details = '') {
    if (condition) {
      console.log(`✅ ${name}`);
      results.passed++;
    } else {
      console.log(`❌ ${name}${details ? ': ' + details : ''}`);
      results.failed++;
      results.errors.push(name);
    }
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  try {
    console.log('⏱️ Waiting for app to initialize...');
    await wait(5000);

    // ============================================================================
    // PHASE 1: BASIC UI HEALTH
    // ============================================================================
    console.log('\n🎨 PHASE 1: Basic UI Health');
    
    const bodyText = document.body.textContent;
    
    // Check for React app loaded
    const reactLoaded = !bodyText.includes('Loading...') && bodyText.length > 100;
    testResult('React app loaded', reactLoaded);
    
    // Check for navigation elements
    const navLinks = document.querySelectorAll('a, button');
    testResult('Navigation elements present', navLinks.length > 0, `Found ${navLinks.length} links/buttons`);
    
    // Check for major sections
    const hasBudget = bodyText.includes('Budget') || bodyText.includes('Available') || bodyText.includes('Allocated');
    testResult('Budget content visible', hasBudget);
    
    const hasAccounts = bodyText.includes('Account') || document.querySelectorAll('a').length > 0;
    testResult('Account system visible', hasAccounts);

    // ============================================================================
    // PHASE 2: DATA LOADING
    // ============================================================================
    console.log('\n📊 PHASE 2: Data Loading Health');
    
    // Check for balance displays
    const availableMatch = bodyText.match(/Available[:\s]*(\d+(?:,\d{3})*)\s*sats/i);
    const allocatedMatch = bodyText.match(/Allocated[:\s]*(\d+(?:,\d{3})*)\s*sats/i);
    const totalMatch = bodyText.match(/Total[:\s]*(\d+(?:,\d{3})*)\s*sats/i);
    
    results.data.available = availableMatch ? parseInt(availableMatch[1].replace(/,/g, '')) : null;
    results.data.allocated = allocatedMatch ? parseInt(allocatedMatch[1].replace(/,/g, '')) : null;
    results.data.total = totalMatch ? parseInt(totalMatch[1].replace(/,/g, '')) : null;
    
    testResult('Available balance displayed', results.data.available !== null, `${results.data.available} sats`);
    testResult('Allocated balance displayed', results.data.allocated !== null, `${results.data.allocated} sats`);
    testResult('Total balance displayed', results.data.total !== null, `${results.data.total} sats`);
    
    // Check balance math consistency
    if (results.data.available !== null && results.data.allocated !== null && results.data.total !== null) {
      const mathCorrect = Math.abs((results.data.available + results.data.allocated) - results.data.total) <= 1000;
      testResult('Balance math is consistent', mathCorrect, 
        `Available(${results.data.available}) + Allocated(${results.data.allocated}) ≈ Total(${results.data.total})`);
    }

    // ============================================================================
    // PHASE 3: INTERACTIVE ELEMENTS
    // ============================================================================
    console.log('\n🖱️ PHASE 3: Interactive Elements');
    
    // Check for buttons
    const buttons = document.querySelectorAll('button');
    const enabledButtons = Array.from(buttons).filter(btn => !btn.disabled);
    
    testResult('Buttons present', buttons.length > 0, `Found ${buttons.length} buttons`);
    testResult('Some buttons enabled', enabledButtons.length > 0, `${enabledButtons.length} enabled`);
    
    // Check for category cards
    const categoryCards = document.querySelectorAll('[class*="category"], [class*="card"]');
    results.data.categoryCount = categoryCards.length;
    testResult('Category interface present', categoryCards.length > 0, `Found ${categoryCards.length} category cards`);
    
    // Check for allocation buttons
    const allocationButtons = Array.from(buttons).filter(btn => 
      btn.textContent.includes('Allocate') || 
      btn.textContent.includes('+') ||
      btn.getAttribute('title')?.includes('allocate')
    );
    results.data.allocationButtons = allocationButtons.length;
    testResult('Allocation buttons present', allocationButtons.length > 0, `Found ${allocationButtons.length} allocation buttons`);

    // ============================================================================
    // PHASE 4: NAVIGATION TEST
    // ============================================================================
    console.log('\n🧭 PHASE 4: Navigation Health');
    
    // Find main navigation links
    const budgetLink = Array.from(document.querySelectorAll('a, button')).find(el => 
      el.textContent.includes('Budget') && !el.textContent.includes('Add')
    );
    const transactionsLink = Array.from(document.querySelectorAll('a, button')).find(el => 
      el.textContent.includes('Transactions')
    );
    const accountsLink = Array.from(document.querySelectorAll('a, button')).find(el => 
      el.textContent.includes('Accounts')
    );
    
    testResult('Budget navigation available', !!budgetLink);
    testResult('Transactions navigation available', !!transactionsLink);
    testResult('Accounts navigation available', !!accountsLink);
    
    // Test quick navigation to transactions and back
    if (transactionsLink) {
      console.log('🧭 Testing navigation to Transactions...');
      transactionsLink.click();
      await wait(2000);
      
      const transactionPageText = document.body.textContent;
      const onTransactionPage = transactionPageText.includes('Transaction') || transactionPageText.includes('Add Transaction');
      testResult('Navigation to transactions works', onTransactionPage);
      
      // Navigate back to budget
      if (budgetLink) {
        console.log('🧭 Navigating back to Budget...');
        budgetLink.click();
        await wait(2000);
        
        const backText = document.body.textContent;
        const backOnBudget = backText.includes('Available') || backText.includes('Allocated');
        testResult('Navigation back to budget works', backOnBudget);
      }
    }

    // ============================================================================
    // PHASE 5: ERROR DETECTION
    // ============================================================================
    console.log('\n⚠️ PHASE 5: Error Detection');
    
    // Check for JavaScript errors
    const consoleErrors = window.console.error.toString().includes('error') || 
                         document.body.textContent.includes('Error') ||
                         document.body.textContent.includes('Failed to');
    
    testResult('No obvious errors visible', !consoleErrors);
    
    // Check for spinning/loading states that are stuck
    const spinners = document.querySelectorAll('[class*="spin"], [class*="loading"], [class*="loader"]');
    const stuckLoading = spinners.length > 0 && bodyText.length < 500;
    
    testResult('No stuck loading states', !stuckLoading, spinners.length > 0 ? `Found ${spinners.length} spinners` : '');
    
    // Check for React Query status
    const reactQueryWorking = !bodyText.includes('Query failed') && !bodyText.includes('No data');
    testResult('React Query functioning', reactQueryWorking);

    // ============================================================================
    // FINAL RESULTS
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('🔍 SYSTEM HEALTH TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${results.passed}`);
    console.log(`❌ Tests Failed: ${results.failed}`);
    console.log(`📊 Health Score: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    if (results.failed === 0) {
      console.log('\n💚 SYSTEM HEALTHY!');
      console.log('✅ All core systems functioning');
      console.log('✅ UI loading properly');
      console.log('✅ Data displaying correctly');
      console.log('✅ Navigation working');
      console.log('✅ No critical errors detected');
      console.log('\n🚀 Ready for comprehensive workflow testing!');
    } else if (results.failed <= 2) {
      console.log('\n💛 SYSTEM MOSTLY HEALTHY');
      console.log('Minor issues detected, but core functionality appears stable');
    } else {
      console.log('\n❤️ SYSTEM HEALTH ISSUES');
      console.log('Several problems detected that may affect functionality:');
      results.errors.forEach(error => console.log(`   • ${error}`));
      console.log('\n⚠️ Address health issues before running comprehensive tests');
    }

    // System summary
    console.log('\n📊 SYSTEM DATA SUMMARY:');
    console.log(`💰 Available: ${results.data.available || 'Not detected'} sats`);
    console.log(`📊 Allocated: ${results.data.allocated || 'Not detected'} sats`);
    console.log(`📈 Total: ${results.data.total || 'Not detected'} sats`);
    console.log(`📂 Categories: ${results.data.categoryCount || 0} cards`);
    console.log(`🎯 Allocation Buttons: ${results.data.allocationButtons || 0}`);

    return results;

  } catch (error) {
    console.error('💥 SYSTEM HEALTH TEST CRASHED:', error);
    console.log('❌ Critical system failure detected');
    results.failed++;
    results.errors.push('Health test execution crashed');
    return results;
  }
}

// Start the system health test
console.log('⏱️ Starting system health test in 3 seconds...\n');
setTimeout(() => {
  runSystemHealthTest().catch(error => {
    console.error('💥 SYSTEM HEALTH TEST FAILED:', error);
  });
}, 3000); 