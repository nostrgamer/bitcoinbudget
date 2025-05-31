/**
 * SYSTEM FRAGILITY ANALYSIS
 * 
 * Comprehensive analysis of system stability and potential fragility points.
 * This test identifies areas where the system might break easily.
 */

console.log('🔍 SYSTEM FRAGILITY ANALYSIS');
console.log('============================');
console.log('Analyzing system stability and fragility points...\n');

async function runSystemFragilityAnalysis() {
  const results = {
    passed: 0,
    failed: 0,
    warnings: 0,
    critical: 0,
    errors: [],
    fragilities: [],
    strengths: []
  };

  function testResult(name, level, condition, details = '') {
    const icons = {
      PASS: '✅',
      WARN: '⚠️',
      FAIL: '❌',
      CRITICAL: '🚨'
    };
    
    const icon = icons[level] || '❓';
    console.log(`${icon} ${name}${details ? ': ' + details : ''}`);
    
    if (level === 'PASS') {
      results.passed++;
      results.strengths.push(name);
    } else if (level === 'WARN') {
      results.warnings++;
      results.fragilities.push(`${name}: ${details}`);
    } else if (level === 'FAIL') {
      results.failed++;
      results.errors.push(`${name}: ${details}`);
    } else if (level === 'CRITICAL') {
      results.critical++;
      results.errors.push(`CRITICAL - ${name}: ${details}`);
    }
  }

  function wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  try {
    console.log('⏱️ Waiting for system initialization...');
    await wait(5000);

    // ============================================================================
    // FRAGILITY POINT 1: DATA MANAGER SINGLETON STABILITY
    // ============================================================================
    console.log('\n🧪 FRAGILITY ANALYSIS 1: Data Manager Architecture');
    console.log('==================================================');
    
    // Check if we can access diagnostic information
    if (typeof window.getDataManagerDiagnostics === 'function') {
      try {
        const diagnostics = window.getDataManagerDiagnostics();
        
        testResult('Data manager diagnostics available', 'PASS', true, 
          `Total instances: ${diagnostics.totalInstances}`);
          
        if (diagnostics.totalInstances === 1) {
          testResult('Single data manager instance', 'PASS', true, 'Good - no instance multiplication');
        } else if (diagnostics.totalInstances > 1) {
          testResult('Multiple data manager instances', 'WARN', false, 
            `${diagnostics.totalInstances} instances detected - potential memory leak`);
        }
        
        if (diagnostics.isFactoryBased) {
          testResult('Factory-based architecture', 'PASS', true, 'Modern factory pattern in use');
        } else {
          testResult('Singleton architecture stability', 'CRITICAL', false, 
            'Legacy singleton detected - high fragility risk');
        }
        
      } catch (error) {
        testResult('Data manager diagnostic access', 'WARN', false, 
          'Cannot access diagnostics - ' + error.message);
      }
    } else {
      testResult('Data manager diagnostic access', 'WARN', false, 
        'Diagnostics function not exposed');
    }

    // ============================================================================
    // FRAGILITY POINT 2: REACT QUERY CACHE CONSISTENCY
    // ============================================================================
    console.log('\n🔄 FRAGILITY ANALYSIS 2: React Query Cache');
    console.log('===========================================');
    
    // Check for signs of cache inconsistency
    const bodyText = document.body.textContent;
    const hasStaleData = bodyText.includes('Loading...') || bodyText.includes('Fetching...');
    
    if (hasStaleData) {
      testResult('No stuck loading states', 'WARN', false, 
        'Detected loading states - possible cache invalidation issues');
    } else {
      testResult('Clean cache state', 'PASS', true, 'No stuck loading indicators');
    }
    
    // Check for duplicate queries or data inconsistencies
    const availableMatches = bodyText.match(/Available[:\s]*(\d+(?:,\d{3})*)\s*sats/gi) || [];
    const allocatedMatches = bodyText.match(/Allocated[:\s]*(\d+(?:,\d{3})*)\s*sats/gi) || [];
    
    if (availableMatches.length > 1) {
      const values = availableMatches.map(match => 
        parseInt(match.match(/(\d+(?:,\d{3})*)/)[1].replace(/,/g, ''))
      );
      const allSame = values.every(val => val === values[0]);
      
      if (allSame) {
        testResult('Consistent Available balances', 'PASS', true, 
          `${availableMatches.length} displays all show same value`);
      } else {
        testResult('Available balance consistency', 'CRITICAL', false, 
          `Different values: ${values.join(', ')} - cache inconsistency detected`);
      }
    }

    // ============================================================================
    // FRAGILITY POINT 3: INITIALIZATION RACE CONDITIONS
    // ============================================================================
    console.log('\n🏁 FRAGILITY ANALYSIS 3: Initialization Race Conditions');
    console.log('========================================================');
    
    // Check for indicators of initialization problems
    const hasErrorText = bodyText.includes('No budget loaded') || 
                        bodyText.includes('ensureBasicBudgetInfrastructure') ||
                        bodyText.includes('Failed to initialize');
                        
    if (hasErrorText) {
      testResult('Clean initialization', 'CRITICAL', false, 
        'Initialization error messages detected');
    } else {
      testResult('Clean initialization', 'PASS', true, 'No initialization errors visible');
    }
    
    // Check if budget period is properly loaded
    const hasPeriodInfo = bodyText.includes('2025') || 
                         bodyText.includes('January') || 
                         bodyText.includes('February') ||
                         bodyText.match(/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/);
                         
    if (hasPeriodInfo) {
      testResult('Budget period initialized', 'PASS', true, 'Period information visible');
    } else {
      testResult('Budget period initialization', 'WARN', false, 
        'No clear period information - possible initialization issue');
    }

    // ============================================================================
    // FRAGILITY POINT 4: UI STATE MANAGEMENT
    // ============================================================================
    console.log('\n🎨 FRAGILITY ANALYSIS 4: UI State Management');
    console.log('============================================');
    
    // Check for disabled buttons that should be enabled
    const buttons = document.querySelectorAll('button');
    const disabledButtons = Array.from(buttons).filter(btn => btn.disabled);
    const disabledRatio = disabledButtons.length / buttons.length;
    
    if (disabledRatio > 0.8) {
      testResult('Button state management', 'CRITICAL', false, 
        `${Math.round(disabledRatio * 100)}% of buttons disabled - possible state management failure`);
    } else if (disabledRatio > 0.5) {
      testResult('Button state management', 'WARN', false, 
        `${Math.round(disabledRatio * 100)}% of buttons disabled - check state logic`);
    } else {
      testResult('Button state management', 'PASS', true, 
        `${Math.round(disabledRatio * 100)}% disabled - reasonable ratio`);
    }
    
    // Check for allocation buttons specifically
    const allocationButtons = Array.from(buttons).filter(btn => 
      btn.textContent.includes('Allocate') || btn.textContent.includes('+')
    );
    const enabledAllocationButtons = allocationButtons.filter(btn => !btn.disabled);
    
    if (allocationButtons.length === 0) {
      testResult('Allocation button availability', 'WARN', false, 
        'No allocation buttons found');
    } else if (enabledAllocationButtons.length === 0) {
      testResult('Allocation button functionality', 'CRITICAL', false, 
        'All allocation buttons disabled - allocation system broken');
    } else {
      testResult('Allocation button functionality', 'PASS', true, 
        `${enabledAllocationButtons.length}/${allocationButtons.length} allocation buttons enabled`);
    }

    // ============================================================================
    // FRAGILITY POINT 5: DATA PERSISTENCE RELIABILITY
    // ============================================================================
    console.log('\n💾 FRAGILITY ANALYSIS 5: Data Persistence');
    console.log('=========================================');
    
    // Check if IndexedDB appears to be working
    if ('indexedDB' in window) {
      testResult('IndexedDB support', 'PASS', true, 'Browser supports IndexedDB');
      
      // Try to detect if we have actual data
      const hasBalanceData = bodyText.match(/\d+(?:,\d{3})*\s*sats/);
      
      if (hasBalanceData) {
        testResult('Data persistence indicators', 'PASS', true, 'Balance data appears to be loaded');
      } else {
        testResult('Data persistence indicators', 'WARN', false, 
          'No balance data visible - possible persistence failure');
      }
    } else {
      testResult('IndexedDB support', 'CRITICAL', false, 
        'Browser does not support IndexedDB - app will not work');
    }

    // ============================================================================
    // FRAGILITY POINT 6: ERROR RECOVERY MECHANISMS
    // ============================================================================
    console.log('\n🛡️ FRAGILITY ANALYSIS 6: Error Recovery');
    console.log('========================================');
    
    // Check for error boundaries and recovery mechanisms
    const hasErrorBoundary = document.querySelector('[data-error-boundary]') || 
                            bodyText.includes('Something went wrong') ||
                            bodyText.includes('Error boundary');
                            
    // Look for reset/recovery options
    const hasResetOptions = Array.from(buttons).some(btn => 
      btn.textContent.includes('Reset') || 
      btn.textContent.includes('Clear') ||
      btn.textContent.includes('Settings')
    );
    
    if (hasResetOptions) {
      testResult('Recovery mechanisms available', 'PASS', true, 'Reset/recovery options found');
    } else {
      testResult('Recovery mechanisms available', 'WARN', false, 
        'No obvious reset/recovery options - users may be stuck if issues occur');
    }

    // ============================================================================
    // FRAGILITY POINT 7: MEMORY MANAGEMENT
    // ============================================================================
    console.log('\n🧠 FRAGILITY ANALYSIS 7: Memory Management');
    console.log('==========================================');
    
    // Check DOM size and complexity
    const elementCount = document.querySelectorAll('*').length;
    const textLength = document.body.textContent.length;
    
    if (elementCount > 10000) {
      testResult('DOM complexity', 'WARN', false, 
        `${elementCount} elements - high complexity may cause performance issues`);
    } else if (elementCount > 5000) {
      testResult('DOM complexity', 'WARN', false, 
        `${elementCount} elements - moderate complexity`);
    } else {
      testResult('DOM complexity', 'PASS', true, 
        `${elementCount} elements - reasonable complexity`);
    }
    
    if (textLength > 100000) {
      testResult('Content size', 'WARN', false, 
        `${textLength} characters - very large content size`);
    } else {
      testResult('Content size', 'PASS', true, 
        `${textLength} characters - reasonable content size`);
    }

    // ============================================================================
    // FRAGILITY POINT 8: CONCURRENT OPERATION SAFETY
    // ============================================================================
    console.log('\n⚡ FRAGILITY ANALYSIS 8: Concurrent Operations');
    console.log('=============================================');
    
    // Check for indicators of race conditions
    const spinners = document.querySelectorAll('[class*="spin"], [class*="loading"]');
    const visibleSpinners = Array.from(spinners).filter(spinner => {
      const style = window.getComputedStyle(spinner);
      return style.display !== 'none' && style.visibility !== 'hidden';
    });
    
    if (visibleSpinners.length > 3) {
      testResult('Concurrent operation management', 'WARN', false, 
        `${visibleSpinners.length} active spinners - possible race conditions`);
    } else if (visibleSpinners.length > 0) {
      testResult('Concurrent operation management', 'PASS', true, 
        `${visibleSpinners.length} active operations - normal`);
    } else {
      testResult('Concurrent operation management', 'PASS', true, 
        'No active operations detected');
    }

    // ============================================================================
    // RESULTS SUMMARY
    // ============================================================================
    console.log('\n' + '='.repeat(70));
    console.log('🔍 SYSTEM FRAGILITY ANALYSIS RESULTS');
    console.log('='.repeat(70));
    console.log(`✅ Strengths: ${results.passed}`);
    console.log(`⚠️ Fragilities: ${results.warnings}`);
    console.log(`❌ Failures: ${results.failed}`);
    console.log(`🚨 Critical Issues: ${results.critical}`);
    
    const total = results.passed + results.warnings + results.failed + results.critical;
    const stabilityScore = Math.round(((results.passed + (results.warnings * 0.5)) / total) * 100);
    
    console.log(`📊 Stability Score: ${stabilityScore}%`);
    
    if (results.critical > 0) {
      console.log('\n🚨 CRITICAL FRAGILITIES DETECTED:');
      console.log('IMMEDIATE ACTION REQUIRED');
      results.errors.filter(e => e.includes('CRITICAL')).forEach(error => {
        console.log(`   🚨 ${error}`);
      });
    }
    
    if (results.failed > 0) {
      console.log('\n❌ SIGNIFICANT FRAGILITIES:');
      results.errors.filter(e => !e.includes('CRITICAL')).forEach(error => {
        console.log(`   ❌ ${error}`);
      });
    }
    
    if (results.warnings > 0) {
      console.log('\n⚠️ POTENTIAL FRAGILITY POINTS:');
      results.fragilities.forEach(fragility => {
        console.log(`   ⚠️ ${fragility}`);
      });
    }
    
    if (results.passed > 0) {
      console.log('\n✅ SYSTEM STRENGTHS:');
      results.strengths.forEach(strength => {
        console.log(`   ✅ ${strength}`);
      });
    }
    
    // Recommendations
    console.log('\n📋 STABILITY RECOMMENDATIONS:');
    
    if (stabilityScore >= 90) {
      console.log('🎉 EXCELLENT: System is very stable with minimal fragility points');
      console.log('   • Continue current architecture patterns');
      console.log('   • Monitor identified fragility points');
      console.log('   • Ready for production use');
    } else if (stabilityScore >= 70) {
      console.log('💛 GOOD: System is mostly stable with some fragility points');
      console.log('   • Address critical issues immediately');
      console.log('   • Plan fixes for major fragilities');
      console.log('   • Monitor system during use');
    } else if (stabilityScore >= 50) {
      console.log('⚠️ MODERATE: System has significant fragility concerns');
      console.log('   • Fix critical and major issues before release');
      console.log('   • Implement additional error handling');
      console.log('   • Add more recovery mechanisms');
    } else {
      console.log('❌ POOR: System is highly fragile and unreliable');
      console.log('   • Major architectural changes needed');
      console.log('   • Do not use in production');
      console.log('   • Complete stability overhaul required');
    }

    return results;

  } catch (error) {
    console.error('💥 FRAGILITY ANALYSIS CRASHED:', error);
    testResult('Fragility Analysis Execution', 'CRITICAL', false, 
      'Analysis itself crashed - system extremely unstable');
    return results;
  }
}

// Start the fragility analysis
console.log('⏱️ Starting system fragility analysis in 3 seconds...\n');
setTimeout(() => {
  runSystemFragilityAnalysis().catch(error => {
    console.error('💥 FRAGILITY ANALYSIS FAILED:', error);
  });
}, 3000); 