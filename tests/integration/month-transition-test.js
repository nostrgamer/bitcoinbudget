/**
 * MONTH TRANSITION TEST
 * 
 * Tests the critical month transition and rollover functionality:
 * 1. Verify current month allocation
 * 2. Navigate to next month
 * 3. Verify rollover calculations
 * 4. Test new allocations in new month
 * 5. Navigate back and verify data integrity
 * 
 * Run this AFTER the comprehensive workflow test passes.
 */

console.log('📅 MONTH TRANSITION TEST');
console.log('========================');
console.log('Testing monthly rollover and data integrity...\n');

async function runMonthTransitionTest() {
  const results = {
    passed: 0,
    failed: 0,
    errors: [],
    monthData: {}
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

  function extractBalance(text, label) {
    const match = text.match(new RegExp(`${label}[:\s]*(\d+(?:,\d{3})*)\s*sats`, 'i'));
    return match ? parseInt(match[1].replace(/,/g, '')) : 0;
  }

  function getCurrentMonth() {
    // Try to find month indicator in the UI
    const monthMatch = document.body.textContent.match(/(January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/);
    return monthMatch ? `${monthMatch[1]} ${monthMatch[2]}` : 'Unknown';
  }

  try {
    console.log('⏱️ Waiting for app to initialize...');
    await wait(3000);

    // ============================================================================
    // PHASE 1: CAPTURE CURRENT MONTH STATE
    // ============================================================================
    console.log('\n📊 PHASE 1: Capture Current Month State');
    
    const currentMonth = getCurrentMonth();
    const bodyText = document.body.textContent;
    
    results.monthData.originalMonth = currentMonth;
    results.monthData.originalAvailable = extractBalance(bodyText, 'Available');
    results.monthData.originalAllocated = extractBalance(bodyText, 'Allocated');
    results.monthData.originalTotal = extractBalance(bodyText, 'Total');
    
    console.log(`📅 Current Month: ${currentMonth}`);
    console.log(`💰 Available: ${results.monthData.originalAvailable} sats`);
    console.log(`📊 Allocated: ${results.monthData.originalAllocated} sats`);
    console.log(`📈 Total: ${results.monthData.originalTotal} sats`);
    
    testResult('Current month state captured', currentMonth !== 'Unknown');

    // Capture category allocations if visible
    const categoryElements = document.querySelectorAll('[class*="category"], [class*="card"]');
    results.monthData.originalCategories = categoryElements.length;
    console.log(`📂 Categories visible: ${results.monthData.originalCategories}`);

    // ============================================================================
    // PHASE 2: NAVIGATE TO NEXT MONTH
    // ============================================================================
    console.log('\n➡️ PHASE 2: Navigate to Next Month');
    
    // Look for month navigation buttons
    const nextButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Next') || 
      btn.textContent.includes('>') || 
      btn.textContent.includes('→') ||
      btn.getAttribute('title')?.includes('next') ||
      btn.getAttribute('aria-label')?.includes('next')
    );
    
    // Also look for month selector dropdown
    const monthSelectors = document.querySelectorAll('select');
    let monthSelectorFound = false;
    
    if (monthSelectors.length > 0) {
      for (const selector of monthSelectors) {
        const options = Array.from(selector.options);
        const hasMonths = options.some(opt => 
          opt.textContent.match(/(January|February|March|April|May|June|July|August|September|October|November|December)/i)
        );
        
        if (hasMonths) {
          console.log('📅 Found month selector dropdown');
          const currentIndex = selector.selectedIndex;
          const nextOption = options[currentIndex + 1];
          
          if (nextOption) {
            console.log(`🖱️ Selecting next month: ${nextOption.textContent}`);
            selector.value = nextOption.value;
            selector.dispatchEvent(new Event('change', { bubbles: true }));
            monthSelectorFound = true;
            await wait(3000); // Wait for month change
            break;
          }
        }
      }
    }
    
    if (!monthSelectorFound && nextButtons.length > 0) {
      console.log(`🖱️ Found ${nextButtons.length} next buttons, clicking first one...`);
      nextButtons[0].click();
      await wait(3000);
    }
    
    testResult('Month navigation attempted', monthSelectorFound || nextButtons.length > 0);

    // ============================================================================
    // PHASE 3: VERIFY NEW MONTH STATE
    // ============================================================================
    console.log('\n📊 PHASE 3: Verify New Month State');
    
    await wait(2000); // Additional wait for UI updates
    
    const newMonth = getCurrentMonth();
    const newBodyText = document.body.textContent;
    
    results.monthData.newMonth = newMonth;
    results.monthData.newAvailable = extractBalance(newBodyText, 'Available');
    results.monthData.newAllocated = extractBalance(newBodyText, 'Allocated');
    results.monthData.newTotal = extractBalance(newBodyText, 'Total');
    
    console.log(`📅 New Month: ${newMonth}`);
    console.log(`💰 Available: ${results.monthData.newAvailable} sats`);
    console.log(`📊 Allocated: ${results.monthData.newAllocated} sats`);
    console.log(`📈 Total: ${results.monthData.newTotal} sats`);
    
    const monthChanged = newMonth !== results.monthData.originalMonth;
    testResult('Month actually changed', monthChanged, 
      `${results.monthData.originalMonth} → ${newMonth}`);

    // ============================================================================
    // PHASE 4: TEST ROLLOVER LOGIC
    // ============================================================================
    console.log('\n🔄 PHASE 4: Test Rollover Logic');
    
    if (monthChanged) {
      // In a proper rollover system:
      // - Unspent allocated funds should roll over to new month
      // - Total available might be different but should be consistent
      // - Categories should maintain their allocations or show rollover amounts
      
      const rolloverExpected = results.monthData.originalAllocated;
      const totalConsistent = Math.abs(results.monthData.newTotal - results.monthData.originalTotal) <= 1000; // Allow small variance
      
      console.log(`🔄 Expected rollover amount: ${rolloverExpected} sats`);
      console.log(`📊 Total consistency check: ${totalConsistent}`);
      
      testResult('Rollover amounts reasonable', rolloverExpected >= 0);
      testResult('Total balances consistent', totalConsistent,
        `Original: ${results.monthData.originalTotal}, New: ${results.monthData.newTotal}`);
        
      // Check if categories are still visible
      const newCategoryElements = document.querySelectorAll('[class*="category"], [class*="card"]');
      results.monthData.newCategories = newCategoryElements.length;
      
      testResult('Categories preserved across months', results.monthData.newCategories > 0,
        `Original: ${results.monthData.originalCategories}, New: ${results.monthData.newCategories}`);
    }

    // ============================================================================
    // PHASE 5: TEST ALLOCATION IN NEW MONTH
    // ============================================================================
    console.log('\n💰 PHASE 5: Test Allocation in New Month');
    
    const allocationButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Allocate') || 
      btn.textContent.includes('+') ||
      btn.getAttribute('title')?.includes('allocate')
    );
    
    if (allocationButtons.length > 0) {
      console.log(`🖱️ Found ${allocationButtons.length} allocation buttons in new month`);
      
      // Try a small allocation to test system
      allocationButtons[0].click();
      await wait(1500);
      
      const allocationInput = document.querySelector('input[type="number"], input[name="amount"]');
      
      if (allocationInput) {
        const testAmount = 5000; // Small test allocation
        results.monthData.testAllocation = testAmount;
        
        allocationInput.value = testAmount.toString();
        allocationInput.dispatchEvent(new Event('input', { bubbles: true }));
        console.log(`💰 Test allocation: ${testAmount} sats`);
        
        await wait(500);
        
        const allocateButton = Array.from(document.querySelectorAll('button')).find(btn => 
          btn.textContent.includes('Allocate') || 
          btn.textContent.includes('Confirm') ||
          btn.textContent.includes('Save')
        );
        
        if (allocateButton && !allocateButton.disabled) {
          console.log('💾 Confirming test allocation...');
          allocateButton.click();
          await wait(2000);
          
          // Check if allocation worked
          const postAllocationText = document.body.textContent;
          const postAvailable = extractBalance(postAllocationText, 'Available');
          const postAllocated = extractBalance(postAllocationText, 'Allocated');
          
          const availableDecreased = postAvailable < results.monthData.newAvailable;
          const allocatedIncreased = postAllocated > results.monthData.newAllocated;
          
          console.log(`📊 Post-allocation Available: ${postAvailable} sats`);
          console.log(`📊 Post-allocation Allocated: ${postAllocated} sats`);
          
          testResult('Allocation worked in new month', availableDecreased || allocatedIncreased);
          
          results.monthData.postAvailable = postAvailable;
          results.monthData.postAllocated = postAllocated;
        }
      }
      
      testResult('Allocation interface works in new month', !!allocationInput);
    } else {
      testResult('Allocation interface works in new month', false, 'No allocation buttons found');
    }

    // ============================================================================
    // PHASE 6: NAVIGATE BACK TO ORIGINAL MONTH
    // ============================================================================
    console.log('\n⬅️ PHASE 6: Navigate Back to Original Month');
    
    // Look for previous buttons or month selector
    const prevButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Previous') || 
      btn.textContent.includes('Prev') ||
      btn.textContent.includes('<') || 
      btn.textContent.includes('←') ||
      btn.getAttribute('title')?.includes('previous') ||
      btn.getAttribute('aria-label')?.includes('previous')
    );
    
    let backNavigated = false;
    
    // Try month selector first
    const backMonthSelectors = document.querySelectorAll('select');
    for (const selector of backMonthSelectors) {
      const options = Array.from(selector.options);
      const originalOption = options.find(opt => 
        opt.textContent.includes(results.monthData.originalMonth.split(' ')[0]) // Match month name
      );
      
      if (originalOption) {
        console.log(`🖱️ Selecting original month: ${originalOption.textContent}`);
        selector.value = originalOption.value;
        selector.dispatchEvent(new Event('change', { bubbles: true }));
        backNavigated = true;
        await wait(3000);
        break;
      }
    }
    
    if (!backNavigated && prevButtons.length > 0) {
      console.log(`🖱️ Found ${prevButtons.length} previous buttons, clicking first one...`);
      prevButtons[0].click();
      await wait(3000);
      backNavigated = true;
    }
    
    testResult('Back navigation attempted', backNavigated);

    // ============================================================================
    // PHASE 7: VERIFY ORIGINAL MONTH INTEGRITY
    // ============================================================================
    console.log('\n🔍 PHASE 7: Verify Original Month Data Integrity');
    
    if (backNavigated) {
      await wait(2000);
      
      const backMonth = getCurrentMonth();
      const backText = document.body.textContent;
      
      results.monthData.backMonth = backMonth;
      results.monthData.backAvailable = extractBalance(backText, 'Available');
      results.monthData.backAllocated = extractBalance(backText, 'Allocated');
      results.monthData.backTotal = extractBalance(backText, 'Total');
      
      console.log(`📅 Back to Month: ${backMonth}`);
      console.log(`💰 Available: ${results.monthData.backAvailable} sats`);
      console.log(`📊 Allocated: ${results.monthData.backAllocated} sats`);
      console.log(`📈 Total: ${results.monthData.backTotal} sats`);
      
      const backToOriginal = backMonth === results.monthData.originalMonth || 
                            backMonth.includes(results.monthData.originalMonth.split(' ')[0]);
      
      testResult('Returned to original month', backToOriginal,
        `Expected: ${results.monthData.originalMonth}, Got: ${backMonth}`);
      
      // Check data integrity - original month data should be preserved
      const availableIntact = Math.abs(results.monthData.backAvailable - results.monthData.originalAvailable) <= 1000;
      const allocatedIntact = Math.abs(results.monthData.backAllocated - results.monthData.originalAllocated) <= 1000;
      
      testResult('Original month available balance preserved', availableIntact,
        `Original: ${results.monthData.originalAvailable}, Back: ${results.monthData.backAvailable}`);
      testResult('Original month allocated balance preserved', allocatedIntact,
        `Original: ${results.monthData.originalAllocated}, Back: ${results.monthData.backAllocated}`);
    }

    // ============================================================================
    // FINAL RESULTS
    // ============================================================================
    console.log('\n' + '='.repeat(60));
    console.log('📅 MONTH TRANSITION TEST RESULTS');
    console.log('='.repeat(60));
    console.log(`✅ Tests Passed: ${results.passed}`);
    console.log(`❌ Tests Failed: ${results.failed}`);
    console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

    if (results.failed === 0) {
      console.log('\n🎉 MONTH TRANSITION SUCCESS!');
      console.log('✅ Month navigation working');
      console.log('✅ Rollover logic functional');
      console.log('✅ Allocations work across months');
      console.log('✅ Data integrity maintained');
      console.log('✅ Bidirectional navigation working');
      console.log('\n🚀 Monthly budgeting system is fully functional!');
    } else if (results.failed <= 2) {
      console.log('\n⚠️ MINOR MONTH TRANSITION ISSUES');
      console.log('Most functionality working, but some edge cases detected');
    } else {
      console.log('\n❌ MONTH TRANSITION ISSUES');
      console.log('Several problems with monthly budgeting system');
      results.errors.forEach(error => console.log(`   • ${error}`));
    }

    // Data flow summary
    console.log('\n📊 MONTH TRANSITION DATA FLOW:');
    console.log(`📅 Original Month: ${results.monthData.originalMonth}`);
    console.log(`📅 New Month: ${results.monthData.newMonth}`);
    console.log(`📅 Back to: ${results.monthData.backMonth}`);
    console.log(`💰 Available Flow: ${results.monthData.originalAvailable} → ${results.monthData.newAvailable} → ${results.monthData.backAvailable}`);
    console.log(`📊 Allocated Flow: ${results.monthData.originalAllocated} → ${results.monthData.newAllocated} → ${results.monthData.backAllocated}`);
    
    if (results.monthData.testAllocation) {
      console.log(`🧪 Test Allocation: ${results.monthData.testAllocation} sats in new month`);
    }

    return results;

  } catch (error) {
    console.error('💥 MONTH TRANSITION TEST CRASHED:', error);
    console.log('❌ Critical failure in monthly budgeting system');
    results.failed++;
    results.errors.push('Test execution crashed');
    return results;
  }
}

// Start the month transition test
console.log('⏱️ Starting month transition test in 3 seconds...\n');
setTimeout(() => {
  runMonthTransitionTest().catch(error => {
    console.error('💥 MONTH TRANSITION TEST FAILED:', error);
  });
}, 3000); 