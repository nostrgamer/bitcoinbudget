/**
 * ALLOCATION DEBUG TEST
 * 
 * Debug utility for troubleshooting allocation system issues.
 * Provides detailed logging and step-by-step allocation testing.
 */

console.log('🐛 ALLOCATION DEBUG TEST');
console.log('========================');
console.log('Debugging allocation system with detailed logging...\n');

async function runAllocationDebugTest() {
  const debug = {
    steps: [],
    errors: [],
    warnings: [],
    data: {}
  };

  function debugLog(step, status, details = '', data = null) {
    const timestamp = new Date().toLocaleTimeString();
    const icon = status === 'SUCCESS' ? '✅' : status === 'ERROR' ? '❌' : status === 'WARN' ? '⚠️' : 'ℹ️';
    
    console.log(`${icon} [${timestamp}] ${step}${details ? ': ' + details : ''}`);
    
    debug.steps.push({ timestamp, step, status, details, data });
    
    if (status === 'ERROR') debug.errors.push(`${step}: ${details}`);
    if (status === 'WARN') debug.warnings.push(`${step}: ${details}`);
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  function extractBalance(text, label) {
    const match = text.match(new RegExp(`${label}[:\s]*(\d+(?:,\d{3})*)\s*sats`, 'i'));
    return match ? parseInt(match[1].replace(/,/g, '')) : null;
  }

  try {
    debugLog('INITIALIZATION', 'INFO', 'Starting allocation debug session');
    await wait(5000);

    // ============================================================================
    // DEBUG STEP 1: EXAMINE INITIAL STATE
    // ============================================================================
    debugLog('STATE_CAPTURE', 'INFO', 'Capturing initial application state');
    
    const bodyText = document.body.textContent;
    const initialState = {
      available: extractBalance(bodyText, 'Available'),
      allocated: extractBalance(bodyText, 'Allocated'),
      total: extractBalance(bodyText, 'Total'),
      pageContent: bodyText.length,
      timestamp: Date.now()
    };
    
    debug.data.initialState = initialState;
    
    debugLog('BALANCE_DETECTION', initialState.available !== null ? 'SUCCESS' : 'ERROR', 
      `Available: ${initialState.available} sats`, initialState);

    if (initialState.available === null) {
      debugLog('BALANCE_MISSING', 'ERROR', 'Cannot find Available balance in page content');
      return debug;
    }

    // ============================================================================
    // DEBUG STEP 2: LOCATE ALLOCATION COMPONENTS
    // ============================================================================
    debugLog('COMPONENT_SEARCH', 'INFO', 'Searching for allocation UI components');
    
    // Find category cards
    const categoryCards = document.querySelectorAll('[class*="category"], [class*="card"]');
    debugLog('CATEGORY_CARDS', categoryCards.length > 0 ? 'SUCCESS' : 'WARN', 
      `Found ${categoryCards.length} category cards`);
    
    // Detailed card inspection
    categoryCards.forEach((card, index) => {
      const cardText = card.textContent;
      const hasAmount = cardText.includes('sats');
      const hasButton = card.querySelector('button');
      
      debugLog(`CARD_${index}`, hasButton ? 'SUCCESS' : 'WARN', 
        `Card ${index}: Amount=${hasAmount}, Button=${!!hasButton}`, {
          text: cardText.substring(0, 100),
          hasAmount,
          hasButton: !!hasButton
        });
    });
    
    // Find allocation buttons
    const allocationButtons = Array.from(document.querySelectorAll('button')).filter(btn => 
      btn.textContent.includes('Allocate') || 
      btn.textContent.includes('+') ||
      btn.getAttribute('title')?.includes('allocate')
    );
    
    debugLog('ALLOCATION_BUTTONS', allocationButtons.length > 0 ? 'SUCCESS' : 'ERROR', 
      `Found ${allocationButtons.length} allocation buttons`);
    
    // Detailed button inspection
    allocationButtons.forEach((btn, index) => {
      debugLog(`BUTTON_${index}`, !btn.disabled ? 'SUCCESS' : 'WARN', 
        `"${btn.textContent.trim()}" - ${btn.disabled ? 'DISABLED' : 'ENABLED'}`, {
          text: btn.textContent.trim(),
          disabled: btn.disabled,
          className: btn.className
        });
    });

    if (allocationButtons.length === 0) {
      debugLog('NO_BUTTONS', 'ERROR', 'No allocation buttons found - cannot proceed with allocation test');
      return debug;
    }

    // ============================================================================
    // DEBUG STEP 3: TEST MODAL OPENING
    // ============================================================================
    debugLog('MODAL_TEST', 'INFO', 'Testing allocation modal opening');
    
    const firstButton = allocationButtons[0];
    
    if (firstButton.disabled) {
      debugLog('BUTTON_DISABLED', 'ERROR', 'First allocation button is disabled');
      return debug;
    }
    
    debugLog('BUTTON_CLICK', 'INFO', `Clicking: "${firstButton.textContent.trim()}"`);
    firstButton.click();
    
    await wait(2000);
    
    // Check for modal
    const modal = document.querySelector('[class*="fixed"][class*="inset-0"], .bg-black, .bg-opacity-50');
    debugLog('MODAL_OPEN', modal ? 'SUCCESS' : 'ERROR', 
      modal ? 'Modal opened successfully' : 'Modal failed to open');
    
    if (!modal) {
      debugLog('MODAL_MISSING', 'ERROR', 'Cannot proceed without modal');
      return debug;
    }

    // ============================================================================
    // DEBUG STEP 4: INSPECT MODAL CONTENTS
    // ============================================================================
    debugLog('MODAL_INSPECTION', 'INFO', 'Inspecting modal contents and form elements');
    
    const modalContent = modal.textContent;
    const amountInput = modal.querySelector('input[type="number"], input[name="amount"]');
    const categorySelect = modal.querySelector('select');
    const allocateButton = Array.from(modal.querySelectorAll('button')).find(btn => 
      btn.textContent.includes('Allocate') || 
      btn.textContent.includes('Confirm') ||
      btn.textContent.includes('Save')
    );
    
    debugLog('INPUT_AMOUNT', amountInput ? 'SUCCESS' : 'ERROR', 
      amountInput ? 'Amount input found' : 'Amount input missing', {
        type: amountInput?.type,
        name: amountInput?.name,
        placeholder: amountInput?.placeholder
      });
      
    debugLog('SELECT_CATEGORY', categorySelect ? 'SUCCESS' : 'WARN', 
      categorySelect ? `Category select found with ${categorySelect.options.length} options` : 'Category select missing');
      
    debugLog('BUTTON_ALLOCATE', allocateButton ? 'SUCCESS' : 'ERROR', 
      allocateButton ? `Allocate button: "${allocateButton.textContent.trim()}"` : 'Allocate button missing');

    if (!amountInput || !allocateButton) {
      debugLog('MODAL_INCOMPLETE', 'ERROR', 'Modal missing required elements');
      return debug;
    }

    // ============================================================================
    // DEBUG STEP 5: TEST FORM INTERACTION
    // ============================================================================
    debugLog('FORM_INTERACTION', 'INFO', 'Testing form input and validation');
    
    const testAmount = Math.min(5000, Math.floor(initialState.available / 20)); // Very conservative
    debug.data.testAmount = testAmount;
    
    debugLog('AMOUNT_INPUT', 'INFO', `Testing with amount: ${testAmount} sats`);
    
    // Clear and set input value
    amountInput.value = '';
    amountInput.focus();
    
    debugLog('INPUT_CLEAR', 'SUCCESS', 'Input cleared and focused');
    
    amountInput.value = testAmount.toString();
    amountInput.dispatchEvent(new Event('input', { bubbles: true }));
    amountInput.dispatchEvent(new Event('change', { bubbles: true }));
    
    debugLog('INPUT_SET', 'SUCCESS', `Value set to: ${amountInput.value}`);
    
    await wait(1000);
    
    // Check button state after input
    const buttonEnabledAfterInput = !allocateButton.disabled;
    debugLog('BUTTON_STATE', buttonEnabledAfterInput ? 'SUCCESS' : 'WARN', 
      `Button ${buttonEnabledAfterInput ? 'enabled' : 'still disabled'} after input`);

    // ============================================================================
    // DEBUG STEP 6: SUBMIT ALLOCATION
    // ============================================================================
    debugLog('ALLOCATION_SUBMIT', 'INFO', 'Attempting to submit allocation');
    
    if (allocateButton.disabled) {
      debugLog('SUBMIT_BLOCKED', 'WARN', 'Cannot submit - button is disabled');
    } else {
      debugLog('SUBMIT_CLICK', 'INFO', 'Clicking allocate button');
      allocateButton.click();
      
      await wait(4000); // Wait for processing
      
      debugLog('SUBMIT_COMPLETE', 'SUCCESS', 'Allocation submission completed');
    }

    // ============================================================================
    // DEBUG STEP 7: VERIFY RESULTS
    // ============================================================================
    debugLog('RESULT_VERIFICATION', 'INFO', 'Verifying allocation results');
    
    await wait(2000);
    
    const newBodyText = document.body.textContent;
    const newState = {
      available: extractBalance(newBodyText, 'Available'),
      allocated: extractBalance(newBodyText, 'Allocated'),
      total: extractBalance(newBodyText, 'Total'),
      timestamp: Date.now()
    };
    
    debug.data.newState = newState;
    
    debugLog('BALANCE_UPDATE', newState.available !== null ? 'SUCCESS' : 'ERROR', 
      `New Available: ${newState.available} sats`, newState);
    
    if (debug.data.testAmount && newState.available !== null) {
      const expectedAvailable = initialState.available - debug.data.testAmount;
      const actualChange = initialState.available - newState.available;
      
      debugLog('BALANCE_CALCULATION', 'INFO', 
        `Expected change: ${debug.data.testAmount}, Actual change: ${actualChange}`, {
          expected: expectedAvailable,
          actual: newState.available,
          difference: Math.abs(expectedAvailable - newState.available)
        });
      
      if (Math.abs(actualChange - debug.data.testAmount) <= 100) {
        debugLog('ALLOCATION_SUCCESS', 'SUCCESS', 'Allocation amount matches expected change');
      } else {
        debugLog('ALLOCATION_MISMATCH', 'WARN', 
          `Allocation mismatch - expected ${debug.data.testAmount}, got ${actualChange}`);
      }
    }

    // ============================================================================
    // DEBUG STEP 8: REACT QUERY CACHE CHECK
    // ============================================================================
    debugLog('CACHE_CHECK', 'INFO', 'Testing React Query cache invalidation');
    
    const timeDiff = newState.timestamp - initialState.timestamp;
    debugLog('UPDATE_TIMING', 'INFO', `Update took ${timeDiff}ms`);
    
    // Force page reload to test persistence
    debugLog('PERSISTENCE_TEST', 'INFO', 'Testing data persistence with page reload');
    window.location.reload();
    
    return debug;

  } catch (error) {
    debugLog('CRITICAL_ERROR', 'ERROR', error.message, { stack: error.stack });
    debug.errors.push(`Critical error: ${error.message}`);
    return debug;
  }
}

// Enhanced debug output function
function printDebugSummary(debug) {
  console.log('\n' + '='.repeat(60));
  console.log('🐛 ALLOCATION DEBUG SUMMARY');
  console.log('='.repeat(60));
  
  console.log(`📊 Total Steps: ${debug.steps.length}`);
  console.log(`❌ Errors: ${debug.errors.length}`);
  console.log(`⚠️ Warnings: ${debug.warnings.length}`);
  
  if (debug.errors.length > 0) {
    console.log('\n❌ ERRORS DETECTED:');
    debug.errors.forEach(error => console.log(`   • ${error}`));
  }
  
  if (debug.warnings.length > 0) {
    console.log('\n⚠️ WARNINGS:');
    debug.warnings.forEach(warning => console.log(`   • ${warning}`));
  }
  
  if (debug.data.initialState && debug.data.newState) {
    console.log('\n📊 BALANCE CHANGES:');
    console.log(`   Available: ${debug.data.initialState.available} → ${debug.data.newState.available} sats`);
    console.log(`   Allocated: ${debug.data.initialState.allocated} → ${debug.data.newState.allocated} sats`);
    if (debug.data.testAmount) {
      console.log(`   Test Amount: ${debug.data.testAmount} sats`);
    }
  }
  
  console.log('\n📋 DETAILED STEP LOG:');
  debug.steps.forEach(step => {
    const icon = step.status === 'SUCCESS' ? '✅' : step.status === 'ERROR' ? '❌' : step.status === 'WARN' ? '⚠️' : 'ℹ️';
    console.log(`${icon} [${step.timestamp}] ${step.step}${step.details ? ': ' + step.details : ''}`);
  });
}

// Start the allocation debug test
console.log('⏱️ Starting allocation debug test in 3 seconds...\n');
setTimeout(() => {
  runAllocationDebugTest().then(debug => {
    printDebugSummary(debug);
  }).catch(error => {
    console.error('💥 ALLOCATION DEBUG CRASHED:', error);
  });
}, 3000); 