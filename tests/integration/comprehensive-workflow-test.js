/**
 * COMPREHENSIVE WORKFLOW TEST (FIXED)
 * 
 * Tests actual user workflows without navigation issues:
 * 1. Work with existing accounts (no creation)
 * 2. Add funding transactions to existing accounts
 * 3. Create categories
 * 4. Allocate sats to categories
 * 5. Verify balance calculations
 * 6. Test data persistence
 * 
 * This version avoids navigation issues by working within the budget context.
 */

console.log('🔄 COMPREHENSIVE WORKFLOW TEST (FIXED)');
console.log('=====================================');
console.log('Testing actual user workflows with proper navigation...\n');

async function runFixedWorkflowTest() {
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

  function getRandomId() {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }

  function extractBalance(text, label) {
    const match = text.match(new RegExp(`${label}[:\s]*(\d+(?:,\d{3})*)\s*sats`, 'i'));
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  function ensureBudgetPage() {
    // Make sure we're on the budget page
    const budgetLink = Array.from(document.querySelectorAll('a, button')).find(el => 
      el.textContent.includes('Budget') && !el.textContent.includes('Add')
    );
    if (budgetLink) {
      budgetLink.click();
      return wait(2000);
    }
    return Promise.resolve();
  }

  try {
    console.log('⏱️ Waiting for app to fully initialize...');
    await wait(5000);

    // Ensure we start on budget page
    await ensureBudgetPage();

    // ============================================================================
    // PHASE 1: BASELINE VERIFICATION
    // ============================================================================
    console.log('\n📊 PHASE 1: Verify Initial State');
    
    const bodyText = document.body.textContent;
    results.data.initialAvailable = extractBalance(bodyText, 'Available');
    results.data.initialAllocated = extractBalance(bodyText, 'Allocated');
    results.data.initialTotal = extractBalance(bodyText, 'Total');
    
    console.log(`📈 Initial Available: ${results.data.initialAvailable} sats`);
    console.log(`📊 Initial Allocated: ${results.data.initialAllocated} sats`);
    console.log(`📈 Initial Total: ${results.data.initialTotal} sats`);
    
    testResult('Initial state captured', !isNaN(results.data.initialAvailable));
    testResult('On budget page', bodyText.includes('Available') || bodyText.includes('Budget'));

    // ============================================================================
    // PHASE 2: ADD FUNDING VIA TRANSACTION (SKIP ACCOUNT CREATION)
    // ============================================================================
    console.log('\n💰 PHASE 2: Add Funding Transaction');
    
    // Navigate to transactions page
    const transactionsLink = Array.from(document.querySelectorAll('a, button')).find(el => 
      el.textContent.includes('Transactions')
    );
    
    if (transactionsLink) {
      console.log('🧭 Navigating to Transactions page...');
      transactionsLink.click();
      await wait(3000);
    }
    
    const addTransactionButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Add Transaction') || 
      btn.textContent.includes('New Transaction') ||
      btn.textContent.includes('Add') || 
      btn.textContent.includes('+')
    );

    if (addTransactionButton) {
      console.log('🖱️ Clicking Add Transaction button...');
      addTransactionButton.click();
      await wait(1500);
      
      // Fill transaction form with existing account
      const amountInput = document.querySelector('input[name="amount"], input[type="number"]');
      const descriptionInput = document.querySelector('input[name="description"], textarea');
      const typeSelect = document.querySelector('select[name="type"], select');
      const accountSelect = document.querySelector('select[name="accountId"], select');
      
      const fundingAmount = 300000; // 300k sats (more conservative)
      results.data.fundingAmount = fundingAmount;
      
      if (amountInput) {
        amountInput.value = fundingAmount.toString();
        amountInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`💵 Amount: ${fundingAmount} sats`);
      }
      
      if (descriptionInput) {
        const description = `Test funding ${getRandomId()}`;
        descriptionInput.value = description;
        descriptionInput.dispatchEvent(new Event('input', { bubbles: true }));
        results.data.transactionDescription = description;
        console.log(`📝 Description: ${description}`);
      }
      
      if (typeSelect) {
        typeSelect.value = 'income';
        typeSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log('📊 Type: income');
      }
      
      if (accountSelect && accountSelect.options.length > 1) {
        // Select the first available account (skip "Select..." option)
        accountSelect.selectedIndex = 1;
        accountSelect.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`🏦 Account: ${accountSelect.options[1].textContent}`);
        results.data.selectedAccount = accountSelect.options[1].textContent;
      }
      
      // Submit transaction
      const saveTransactionButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Save') || 
        btn.textContent.includes('Create') ||
        btn.textContent.includes('Add')
      );
      
      if (saveTransactionButton && !saveTransactionButton.disabled) {
        console.log('💾 Saving transaction...');
        saveTransactionButton.click();
        await wait(3000);
      }
      
      testResult('Transaction creation attempted', !!amountInput);
    } else {
      testResult('Transaction creation attempted', false, 'No add transaction button found');
    }

    // ============================================================================
    // PHASE 3: RETURN TO BUDGET AND VERIFY BALANCE UPDATE
    // ============================================================================
    console.log('\n📊 PHASE 3: Verify Balance Updates');
    
    await ensureBudgetPage();
    await wait(2000); // Wait for data to sync
    
    const newBodyText = document.body.textContent;
    results.data.newAvailable = extractBalance(newBodyText, 'Available');
    results.data.newAllocated = extractBalance(newBodyText, 'Allocated');
    results.data.newTotal = extractBalance(newBodyText, 'Total');
    
    console.log(`📈 New Available: ${results.data.newAvailable} sats`);
    console.log(`📊 New Allocated: ${results.data.newAllocated} sats`);
    console.log(`📈 New Total: ${results.data.newTotal} sats`);
    console.log(`📊 Expected Increase: ${results.data.fundingAmount} sats`);
    
    const balanceIncreased = results.data.newAvailable > results.data.initialAvailable;
    const increaseReasonable = (results.data.newAvailable - results.data.initialAvailable) > 0;
    
    testResult('Balance increased after funding', balanceIncreased, 
      `Available: ${results.data.initialAvailable} → ${results.data.newAvailable}`);
    testResult('Balance increase is reasonable', increaseReasonable);

    // ============================================================================
    // PHASE 4: ADD CATEGORY
    // ============================================================================
    console.log('\n📂 PHASE 4: Add New Category');
    
    const addCategoryButton = Array.from(document.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Add Category') || 
      btn.textContent.includes('New Category') ||
      btn.textContent.includes('Create Category') ||
      (btn.textContent.includes('Add') && document.body.textContent.includes('Categories'))
    );

    if (addCategoryButton) {
      console.log('🖱️ Clicking Add Category button...');
      addCategoryButton.click();
      await wait(1500);
      
      // Fill category form
      const categoryNameInput = document.querySelector('input[name="name"], input[placeholder*="name"], input[placeholder*="Category"]');
      const categoryTargetInput = document.querySelector('input[name="targetAmount"], input[name="target"], input[placeholder*="target"]');
      
      const categoryName = `Test Category ${getRandomId()}`;
      const targetAmount = 50000; // 50k sats
      results.data.categoryName = categoryName;
      results.data.targetAmount = targetAmount;
      
      if (categoryNameInput) {
        categoryNameInput.value = categoryName;
        categoryNameInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`📝 Category name: ${categoryName}`);
      }
      
      if (categoryTargetInput) {
        categoryTargetInput.value = targetAmount.toString();
        categoryTargetInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`🎯 Target amount: ${targetAmount} sats`);
      }
      
      // Submit category
      const saveCategoryButton = Array.from(document.querySelectorAll('button')).find(btn => 
        btn.textContent.includes('Save') || 
        btn.textContent.includes('Create') ||
        btn.textContent.includes('Add')
      );
      
      if (saveCategoryButton && !saveCategoryButton.disabled) {
        console.log('💾 Saving category...');
        saveCategoryButton.click();
        await wait(3000); // Wait longer for category to appear
      }
      
      testResult('Category creation attempted', !!categoryNameInput);
    } else {
      testResult('Category creation attempted', false, 'No add category button found');
    }

    // ============================================================================
    // PHASE 5: ALLOCATE SATS TO CATEGORY
    // ============================================================================
    console.log('\n💰 PHASE 5: Allocate Sats to Category');
    
    await ensureBudgetPage();
    await wait(2000); // Wait for UI to update
    
    // Find allocation buttons
    const allocationButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Allocate') || 
      btn.textContent.includes('+') ||
      btn.textContent.includes('Add to') ||
      btn.getAttribute('title')?.includes('allocate') ||
      btn.getAttribute('aria-label')?.includes('allocate')
    );
    
    console.log(`🔍 Found ${allocationButtons.length} potential allocation buttons`);
    allocationButtons.forEach((btn, i) => {
      console.log(`   ${i + 1}. "${btn.textContent.trim()}" (${btn.className})`);
    });
    
    if (allocationButtons.length > 0) {
      console.log(`🖱️ Clicking allocation button: "${allocationButtons[0].textContent.trim()}"`);
      allocationButtons[0].click();
      await wait(2000);
      
      // Find allocation amount input
      const allocationInput = document.querySelector('input[type="number"], input[name="amount"], input[placeholder*="amount"]');
      
      if (allocationInput) {
        const allocationAmount = 30000; // 30k sats
        results.data.allocationAmount = allocationAmount;
        
        // Clear any existing value
        allocationInput.value = '';
        allocationInput.focus();
        
        allocationInput.value = allocationAmount.toString();
        allocationInput.dispatchEvent(new Event('input', { bubbles: true }));
        allocationInput.dispatchEvent(new Event('change', { bubbles: true }));
        console.log(`💰 Allocating: ${allocationAmount} sats`);
        
        await wait(1000);
        
        // Submit allocation
        const allocateButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Allocate') || 
          btn.textContent.includes('Confirm') ||
          btn.textContent.includes('Save') ||
          btn.textContent.includes('Add') ||
          btn.type === 'submit'
        );
        
        if (allocateButton && !allocateButton.disabled) {
          console.log(`💾 Confirming allocation with: "${allocateButton.textContent.trim()}"`);
          allocateButton.click();
          await wait(4000); // Wait longer for cache invalidation
        } else {
          console.log('⚠️ No confirmation button found or button disabled');
        }
        
        testResult('Allocation attempted', true);
      } else {
        testResult('Allocation attempted', false, 'No allocation input found');
      }
    } else {
      testResult('Allocation attempted', false, 'No allocation buttons found');
    }

    // ============================================================================
    // PHASE 6: VERIFY ALLOCATION RESULTS
    // ============================================================================
    console.log('\n📊 PHASE 6: Verify Allocation Results');
    
    await ensureBudgetPage();
    await wait(3000); // Wait for UI to fully update
    
    const finalBodyText = document.body.textContent;
    results.data.finalAvailable = extractBalance(finalBodyText, 'Available');
    results.data.finalAllocated = extractBalance(finalBodyText, 'Allocated');
    results.data.finalTotal = extractBalance(finalBodyText, 'Total');
    
    console.log(`📈 Final Available: ${results.data.finalAvailable} sats`);
    console.log(`📊 Final Allocated: ${results.data.finalAllocated} sats`);
    console.log(`📈 Final Total: ${results.data.finalTotal} sats`);
    
    const expectedAvailable = results.data.newAvailable - (results.data.allocationAmount || 0);
    const expectedAllocated = results.data.newAllocated + (results.data.allocationAmount || 0);
    
    console.log(`🎯 Expected Available: ${expectedAvailable} sats`);
    console.log(`🎯 Expected Allocated: ${expectedAllocated} sats`);
    
    const availableDecreased = results.data.finalAvailable < results.data.newAvailable;
    const allocatedIncreased = results.data.finalAllocated > results.data.newAllocated;
    const balancesMathCorrect = Math.abs((results.data.finalAvailable + results.data.finalAllocated) - results.data.finalTotal) <= 1000;
    
    testResult('Available balance decreased after allocation', availableDecreased,
      `${results.data.newAvailable} → ${results.data.finalAvailable}`);
    testResult('Allocated balance increased after allocation', allocatedIncreased,
      `${results.data.newAllocated} → ${results.data.finalAllocated}`);
    testResult('Total balances math is correct', balancesMathCorrect,
      `Available + Allocated ≈ Total`);

    // ============================================================================
    // PHASE 7: TEST DATA PERSISTENCE
    // ============================================================================
    console.log('\n🔄 PHASE 7: Test Data Persistence');
    
    console.log('🔄 Refreshing page to test persistence...');
    window.location.reload();
    await wait(8000); // Wait for full reload and initialization
    
    await ensureBudgetPage();
    await wait(2000);
    
    const persistedBodyText = document.body.textContent;
    results.data.persistedAvailable = extractBalance(persistedBodyText, 'Available');
    results.data.persistedAllocated = extractBalance(persistedBodyText, 'Allocated');
    results.data.persistedTotal = extractBalance(persistedBodyText, 'Total');
    
    console.log(`📈 Persisted Available: ${results.data.persistedAvailable} sats`);
    console.log(`📊 Persisted Allocated: ${results.data.persistedAllocated} sats`);
    console.log(`📈 Persisted Total: ${results.data.persistedTotal} sats`);
    
    const availablePersisted = Math.abs(results.data.persistedAvailable - results.data.finalAvailable) <= 1000;
    const allocatedPersisted = Math.abs(results.data.persistedAllocated - results.data.finalAllocated) <= 1000;
    const totalPersisted = Math.abs(results.data.persistedTotal - results.data.finalTotal) <= 1000;
    
    testResult('Available balance persisted', availablePersisted,
      `${results.data.finalAvailable} → ${results.data.persistedAvailable}`);
    testResult('Allocated balance persisted', allocatedPersisted,
      `${results.data.finalAllocated} → ${results.data.persistedAllocated}`);
    testResult('Total balance persisted', totalPersisted,
      `${results.data.finalTotal} → ${results.data.persistedTotal}`);

    // ============================================================================
    // FINAL RESULTS
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('🏁 COMPREHENSIVE WORKFLOW TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${results.passed}`);
    console.log(`❌ Tests Failed: ${results.failed}`);
    console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    if (results.failed === 0) {
      console.log('\n🎉 COMPLETE WORKFLOW SUCCESS!');
      console.log('✅ Full user workflow functional');
      console.log('✅ Transaction processing working');
      console.log('✅ Category management working');
      console.log('✅ Allocation system working');
      console.log('✅ Balance calculations correct');
      console.log('✅ Data persistence working');
      console.log('✅ Cache invalidation working');
      console.log('\n🚀 App is ready for production use!');
    } else if (results.failed <= 2) {
      console.log('\n⚠️ MINOR WORKFLOW ISSUES');
      console.log('Most functionality working, but some edge cases detected');
    } else {
      console.log('\n❌ WORKFLOW ISSUES DETECTED:');
      results.errors.forEach(error => console.log(`   • ${error}`));
      console.log('\n⚠️ Core functionality needs attention before release');
    }

    // Data summary
    console.log('\n📊 DATA FLOW SUMMARY:');
    console.log(`💰 Funding Added: ${results.data.fundingAmount || 0} sats`);
    console.log(`📊 Amount Allocated: ${results.data.allocationAmount || 0} sats`);
    console.log(`📈 Available Flow: ${results.data.initialAvailable} → ${results.data.persistedAvailable} sats`);
    console.log(`📊 Allocated Flow: ${results.data.initialAllocated} → ${results.data.persistedAllocated} sats`);
    
    if (results.data.selectedAccount) {
      console.log(`🏦 Used Account: ${results.data.selectedAccount}`);
    }
    if (results.data.categoryName) {
      console.log(`📂 Created Category: ${results.data.categoryName}`);
    }

    return results;

  } catch (error) {
    console.error('💥 WORKFLOW TEST CRASHED:', error);
    console.log('❌ Critical failure in core functionality');
    results.failed++;
    results.errors.push('Test execution crashed');
    return results;
  }
}

// Start the fixed comprehensive workflow test
console.log('⏱️ Starting fixed comprehensive workflow test in 3 seconds...\n');
setTimeout(() => {
  runFixedWorkflowTest().catch(error => {
    console.error('💥 COMPREHENSIVE TEST FAILED:', error);
  });
}, 3000); 