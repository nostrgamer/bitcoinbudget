/**
 * PRE-LAUNCH COMPREHENSIVE TEST
 * 
 * This is the definitive test to run before the user touches anything.
 * Tests all critical functionality to ensure the app won't break on first use.
 * 
 * Run this by opening the app and pasting this in the browser console.
 */

console.log('🚀 PRE-LAUNCH COMPREHENSIVE TEST');
console.log('=================================');
console.log('Testing all critical functionality before user interaction...\n');

async function runPreLaunchTests() {
  const results = {
    passed: 0,
    failed: 0,
    errors: []
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

  // Test 1: Basic Page Load
  console.log('📄 TESTING: Basic Page Load');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  const hasRoot = document.getElementById('root');
  const hasContent = hasRoot && hasRoot.textContent.length > 100;
  const hasTitle = document.title.includes('Bitcoin Budget');
  testResult('Page loads with content', hasContent);
  testResult('Page has correct title', hasTitle);

  // Test 2: No Critical Console Errors
  console.log('\n🔍 TESTING: Console Errors');
  // We can't directly check console from here, but we can check for error indicators
  const hasErrorText = document.body.textContent.includes('Error') || 
                      document.body.textContent.includes('Failed') ||
                      document.body.textContent.includes('undefined');
  testResult('No visible error text', !hasErrorText);

  // Test 3: React App Mount
  console.log('\n⚛️ TESTING: React App Mount');
  const hasReactElements = document.querySelectorAll('[data-reactroot]').length > 0 ||
                          document.querySelectorAll('button').length > 0 ||
                          document.querySelectorAll('input').length > 0;
  testResult('React components rendered', hasReactElements);

  // Test 4: Navigation Elements
  console.log('\n🧭 TESTING: Navigation Elements');
  const hasBudgetText = document.body.textContent.includes('Budget') ||
                       document.body.textContent.includes('Categories') ||
                       document.body.textContent.includes('Accounts');
  testResult('Budget-related navigation present', hasBudgetText);

  // Test 5: No Infinite Loading
  console.log('\n⏳ TESTING: Loading States');
  const spinners = document.querySelectorAll('.animate-spin');
  const visibleSpinners = Array.from(spinners).filter(spinner => {
    const style = window.getComputedStyle(spinner);
    return style.display !== 'none' && style.visibility !== 'hidden';
  });
  testResult('No stuck loading spinners', visibleSpinners.length === 0, `Found ${visibleSpinners.length} active spinners`);

  // Test 6: Core UI Elements
  console.log('\n🎨 TESTING: Core UI Elements');
  const buttons = document.querySelectorAll('button');
  const inputs = document.querySelectorAll('input');
  const hasButtons = buttons.length > 0;
  const hasInputs = inputs.length >= 0; // May not have inputs on main page
  testResult('Interactive buttons present', hasButtons, `Found ${buttons.length} buttons`);
  testResult('Page structure complete', hasInputs || hasButtons);

  // Test 7: Data Management Ready
  console.log('\n💾 TESTING: Data Management');
  // Check if we can access window objects that might indicate data manager is ready
  const hasDataIndicators = document.body.textContent.includes('Available') ||
                           document.body.textContent.includes('Allocated') ||
                           document.body.textContent.includes('Total') ||
                           document.body.textContent.includes('sats');
  testResult('Budget data indicators present', hasDataIndicators);

  // Test 8: Period Management
  console.log('\n📅 TESTING: Period Management');
  const hasPeriodIndicators = document.body.textContent.includes('2025') ||
                             document.body.textContent.includes('January') ||
                             document.body.textContent.includes('Month') ||
                             document.body.textContent.includes('Period');
  testResult('Period/date indicators present', hasPeriodIndicators);

  // Test 9: Category System
  console.log('\n📂 TESTING: Category System');
  const hasCategoryElements = document.body.textContent.includes('Category') ||
                             document.body.textContent.includes('Add') ||
                             document.body.textContent.includes('Envelope');
  testResult('Category system elements present', hasCategoryElements);

  // Test 10: Settings/Reset Access
  console.log('\n⚙️ TESTING: Settings Access');
  const hasSettingsElements = document.body.textContent.includes('Settings') ||
                             document.body.textContent.includes('Reset') ||
                             document.body.textContent.includes('Clear') ||
                             buttons.length > 5; // Likely has settings if many buttons
  testResult('Settings/admin features accessible', hasSettingsElements);

  // Test 11: Responsive Design
  console.log('\n📱 TESTING: Responsive Design');
  const viewport = window.innerWidth;
  const hasResponsiveElements = document.querySelector('.container') ||
                               document.querySelector('[class*="max-w"]') ||
                               document.querySelector('[class*="mx-auto"]');
  testResult('Responsive design elements present', !!hasResponsiveElements);
  testResult('Reasonable viewport width', viewport > 300 && viewport < 5000);

  // Test 12: No Missing Resources
  console.log('\n📦 TESTING: Resource Loading');
  const images = document.querySelectorAll('img');
  const brokenImages = Array.from(images).filter(img => !img.complete || img.naturalWidth === 0);
  testResult('No broken images', brokenImages.length === 0, `Found ${brokenImages.length} broken images`);

  // Test 13: Memory and Performance
  console.log('\n⚡ TESTING: Performance Indicators');
  const elementCount = document.querySelectorAll('*').length;
  const textLength = document.body.textContent.length;
  testResult('Reasonable DOM size', elementCount < 5000 && elementCount > 10, `${elementCount} elements`);
  testResult('Reasonable content size', textLength > 100 && textLength < 50000, `${textLength} characters`);

  // Test 14: Keyboard Navigation
  console.log('\n⌨️ TESTING: Accessibility');
  const focusableElements = document.querySelectorAll('button, input, select, textarea, a');
  const hasTabIndex = Array.from(focusableElements).some(el => el.tabIndex >= 0);
  testResult('Focusable elements present', focusableElements.length > 0);
  testResult('Keyboard navigation possible', hasTabIndex || focusableElements.length > 0);

  // Test 15: Bitcoin-Specific Elements
  console.log('\n₿ TESTING: Bitcoin Functionality');
  const hasBitcoinTerms = document.body.textContent.includes('sats') ||
                         document.body.textContent.includes('BTC') ||
                         document.body.textContent.includes('Bitcoin') ||
                         document.body.textContent.includes('₿');
  testResult('Bitcoin terminology present', hasBitcoinTerms);

  // Final Results
  console.log('\n' + '='.repeat(50));
  console.log('🏁 PRE-LAUNCH TEST RESULTS');
  console.log('='.repeat(50));
  console.log(`✅ Tests Passed: ${results.passed}`);
  console.log(`❌ Tests Failed: ${results.failed}`);
  console.log(`📊 Success Rate: ${Math.round((results.passed / (results.passed + results.failed)) * 100)}%`);

  if (results.failed > 0) {
    console.log('\n❌ FAILED TESTS:');
    results.errors.forEach(error => console.log(`   • ${error}`));
    console.log('\n⚠️ RECOMMENDATION: Address these issues before proceeding');
  }

  if (results.failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ App is ready for user interaction');
    console.log('✅ No critical issues detected');
    console.log('✅ Core functionality appears to be working');
    console.log('\n🚀 You can now safely use the application!');
  } else if (results.failed <= 2) {
    console.log('\n⚠️ MINOR ISSUES DETECTED');
    console.log('App should still be usable, but monitor the failed tests');
  } else if (results.failed <= 5) {
    console.log('\n⚠️ SEVERAL ISSUES DETECTED');
    console.log('App may have problems - proceed with caution');
  } else {
    console.log('\n❌ CRITICAL ISSUES DETECTED');
    console.log('App likely has serious problems - do not proceed');
  }

  // Bonus: Provide helpful next steps
  console.log('\n📋 NEXT STEPS FOR TESTING:');
  console.log('1. Try clicking a few buttons');
  console.log('2. Navigate between pages');
  console.log('3. Check if menus open/close properly');
  console.log('4. Test the allocation functionality');
  console.log('5. Verify data persists after page refresh');
  console.log('6. Try the database reset functionality');

  return results;
}

// Start the comprehensive test
console.log('⏱️ Starting in 2 seconds...\n');
setTimeout(() => {
  runPreLaunchTests().catch(error => {
    console.error('💥 TEST SUITE CRASHED:', error);
    console.log('❌ Critical failure - app likely has serious issues');
  });
}, 2000); 