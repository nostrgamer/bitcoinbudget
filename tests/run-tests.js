/**
 * TEST RUNNER
 * 
 * Provides easy access to all available tests for the Bitcoin Budget app.
 * Tests are organized by type and complexity.
 */

console.log('🧪 BITCOIN BUDGET APP - TEST RUNNER');
console.log('===================================');
console.log('Available tests organized by complexity and type\n');

// Test definitions
const tests = {
  // System Health Tests
  health: {
    name: 'System Health Test',
    description: 'Quick health check - run this first',
    path: 'tests/system/system-health-test.js',
    complexity: 'Simple',
    duration: '30 seconds',
    purpose: 'Verify basic app functionality and stability'
  },
  prelaunch: {
    name: 'Pre-Launch Comprehensive Test',
    description: 'Final check before user interaction',
    path: 'tests/system/pre-launch-comprehensive-test.js',
    complexity: 'Simple',
    duration: '1 minute',
    purpose: 'Ensure app is ready for user interaction'
  },
  comprehensive_system: {
    name: 'Comprehensive System Test',
    description: 'Detailed system architecture verification',
    path: 'tests/system/comprehensive-system-test.js',
    complexity: 'Moderate',
    duration: '1-2 minutes',
    purpose: 'Test factory pattern and core architecture'
  },
  fragility: {
    name: 'System Fragility Analysis',
    description: 'Identify potential breaking points',
    path: 'tests/system/system-fragility-analysis.js',
    complexity: 'Advanced',
    duration: '2-3 minutes',
    purpose: 'Analyze system stability and fragility points'
  },
  final_verification: {
    name: 'Final System Verification',
    description: 'Production readiness assessment',
    path: 'tests/system/final-system-verification.js',
    complexity: 'Advanced',
    duration: '2-3 minutes',
    purpose: 'Comprehensive production readiness check'
  },

  // Integration Tests
  workflow: {
    name: 'Comprehensive Workflow Test (Fixed)',
    description: 'Full user workflow without navigation issues',
    path: 'tests/integration/comprehensive-workflow-test.js',
    complexity: 'Complex',
    duration: '2-3 minutes',
    purpose: 'Test complete user workflows: transactions, categories, allocations'
  },
  monthly: {
    name: 'Month Transition Test',
    description: 'Monthly rollover and data integrity',
    path: 'tests/integration/month-transition-test.js',
    complexity: 'Complex',
    duration: '1-2 minutes',
    purpose: 'Test monthly budgeting periods and rollover logic'
  },
  allocation: {
    name: 'Allocation Verification Test',
    description: 'Focused allocation system testing',
    path: 'tests/integration/allocation-verification-test.js',
    complexity: 'Complex',
    duration: '2-3 minutes',
    purpose: 'Test allocation workflow and cache invalidation'
  },
  ui_comprehensive: {
    name: 'Comprehensive UI Test',
    description: 'Complete UI functionality verification',
    path: 'tests/integration/comprehensive-ui-test.js',
    complexity: 'Complex',
    duration: '1-2 minutes',
    purpose: 'Test all UI components and interactions'
  },

  // Debug and Utility Tests
  allocation_debug: {
    name: 'Allocation Debug Test',
    description: 'Detailed allocation system debugging',
    path: 'tests/system/allocation-debug.js',
    complexity: 'Debug',
    duration: '1-2 minutes',
    purpose: 'Debug allocation issues with detailed logging'
  }
};

// Display test menu organized by category
console.log('📋 Available Tests by Category:');
console.log('===============================');

// System Health Tests
console.log('\n🔍 SYSTEM HEALTH TESTS (Basic Stability):');
console.log('-'.repeat(40));
const healthTests = ['health', 'prelaunch', 'comprehensive_system', 'fragility', 'final_verification'];
healthTests.forEach(key => {
  const test = tests[key];
  console.log(`🧪 ${test.name}`);
  console.log(`   📝 ${test.description}`);
  console.log(`   ⏱️ ${test.duration} | 📊 ${test.complexity}`);
  console.log(`   🎯 ${test.purpose}`);
  console.log(`   📁 ${test.path}\n`);
});

// Integration Tests
console.log('🔄 INTEGRATION TESTS (Full Workflows):');
console.log('-'.repeat(40));
const integrationTests = ['workflow', 'monthly', 'allocation', 'ui_comprehensive'];
integrationTests.forEach(key => {
  const test = tests[key];
  console.log(`🧪 ${test.name}`);
  console.log(`   📝 ${test.description}`);
  console.log(`   ⏱️ ${test.duration} | 📊 ${test.complexity}`);
  console.log(`   🎯 ${test.purpose}`);
  console.log(`   📁 ${test.path}\n`);
});

// Debug Tests
console.log('🐛 DEBUG TESTS (Troubleshooting):');
console.log('-'.repeat(40));
const debugTests = ['allocation_debug'];
debugTests.forEach(key => {
  const test = tests[key];
  console.log(`🧪 ${test.name}`);
  console.log(`   📝 ${test.description}`);
  console.log(`   ⏱️ ${test.duration} | 📊 ${test.complexity}`);
  console.log(`   🎯 ${test.purpose}`);
  console.log(`   📁 ${test.path}\n`);
});

console.log('='.repeat(50));
console.log('🚀 HOW TO RUN TESTS');
console.log('='.repeat(50));

console.log('\n1️⃣ RECOMMENDED TEST SEQUENCES:');
console.log('   🔍 Quick Health Check: health → prelaunch');
console.log('   🧪 Basic Verification: health → workflow → monthly');
console.log('   📊 Full Analysis: health → workflow → fragility → final_verification');
console.log('   🐛 Troubleshooting: allocation_debug → allocation → fragility');

console.log('\n2️⃣ DIRECT LOADING (Copy & Paste):');
console.log('   For System Health Test:');
console.log('   fetch("/tests/system/system-health-test.js").then(r=>r.text()).then(eval)');

console.log('\n   For Comprehensive Workflow Test:');
console.log('   fetch("/tests/integration/comprehensive-workflow-test.js").then(r=>r.text()).then(eval)');

console.log('\n   For Month Transition Test:');
console.log('   fetch("/tests/integration/month-transition-test.js").then(r=>r.text()).then(eval)');

console.log('\n   For Final Verification:');
console.log('   fetch("/tests/system/final-system-verification.js").then(r=>r.text()).then(eval)');

console.log('\n3️⃣ HELPER FUNCTIONS:');
console.log('   loadTest("health")        # Quick health check');
console.log('   loadTest("workflow")      # Full workflow test');
console.log('   loadTest("monthly")       # Month transition test');
console.log('   loadTest("allocation")    # Allocation verification');
console.log('   loadTest("fragility")     # Fragility analysis');
console.log('   loadTest("final_verification") # Production readiness');

console.log('\n4️⃣ INTERPRETING RESULTS:');
console.log('   ✅ Green checkmarks = Test passed');
console.log('   ❌ Red X marks = Test failed');
console.log('   ⚠️ Warning triangles = Issues detected');
console.log('   📊 Success rate shown at end');
console.log('   💚 90%+ = Excellent');
console.log('   💛 70-89% = Good');
console.log('   ❤️ <70% = Needs attention');

console.log('\n5️⃣ WHAT EACH TEST CATEGORY CHECKS:');
console.log('   🔍 System Health: Basic UI, data loading, navigation, stability');
console.log('   🔄 Integration: Complete workflows, user interactions, data persistence');
console.log('   🐛 Debug: Detailed logging, step-by-step analysis, troubleshooting');

console.log('\n📝 TROUBLESHOOTING GUIDE:');
console.log('   • Tests fail to load: Check dev server running on port 5173');
console.log('   • Navigation issues: Tests adapt automatically');
console.log('   • Allocation failures: Run allocation_debug for detailed analysis');
console.log('   • Cache issues: Check React Query cache invalidation');
console.log('   • Data persistence: Verify IndexedDB and encryption working');

console.log('\n🎯 PRODUCTION READINESS CRITERIA:');
console.log('   ✅ System Health Test: 90%+ pass rate');
console.log('   ✅ Workflow Test: 85%+ pass rate');
console.log('   ✅ Monthly Test: 80%+ pass rate');
console.log('   ✅ Final Verification: 95%+ critical systems');
console.log('   ✅ No critical crashes during testing');

console.log('\n⚠️ IMPORTANT NOTES:');
console.log('   • Tests create real data (transactions, categories)');
console.log('   • Tests include page reloads to verify persistence');
console.log('   • Run tests on development environment');
console.log('   • Tests are designed to be non-destructive');
console.log('   • Some tests may modify existing data for verification');

console.log('\n🔧 TEST ORGANIZATION:');
console.log('   📁 tests/system/ - Basic health and stability tests');
console.log('   📁 tests/integration/ - Full workflow and feature tests');
console.log('   📁 tests/unit/ - Individual component tests (future)');

console.log('\n📊 TEST COMPLEXITY LEVELS:');
console.log('   🟢 Simple: Quick checks, minimal interaction');
console.log('   🟡 Moderate: Some user simulation, basic workflows');
console.log('   🟠 Complex: Full workflows, data manipulation, persistence testing');
console.log('   🔴 Advanced: Deep analysis, stability assessment, production readiness');
console.log('   🔧 Debug: Detailed logging, troubleshooting, step-by-step analysis');

// Helper function for easy test loading
window.loadTest = function(testName) {
  const test = tests[testName];
  if (!test) {
    console.error(`❌ Test "${testName}" not found. Available tests:`);
    Object.keys(tests).forEach(key => {
      console.log(`   • ${key} - ${tests[key].name}`);
    });
    return;
  }
  
  console.log(`🧪 Loading ${test.name}...`);
  fetch(`/${test.path}`)
    .then(response => response.text())
    .then(code => {
      console.log(`✅ Executing ${test.name}`);
      eval(code);
    })
    .catch(error => {
      console.error(`❌ Failed to load ${test.name}:`, error);
    });
};

// Helper function to run a sequence of tests
window.runTestSequence = function(sequence) {
  const sequences = {
    quick: ['health', 'prelaunch'],
    basic: ['health', 'workflow', 'monthly'],
    full: ['health', 'workflow', 'fragility', 'final_verification'],
    debug: ['allocation_debug', 'allocation', 'fragility']
  };
  
  const testSequence = sequences[sequence];
  if (!testSequence) {
    console.error(`❌ Unknown sequence "${sequence}". Available:`);
    Object.keys(sequences).forEach(key => {
      console.log(`   • ${key}: ${sequences[key].join(' → ')}`);
    });
    return;
  }
  
  console.log(`🔄 Running ${sequence} test sequence: ${testSequence.join(' → ')}`);
  
  let currentIndex = 0;
  function runNext() {
    if (currentIndex >= testSequence.length) {
      console.log(`✅ Test sequence "${sequence}" completed!`);
      return;
    }
    
    const testName = testSequence[currentIndex];
    console.log(`\n🧪 Running test ${currentIndex + 1}/${testSequence.length}: ${testName}`);
    
    loadTest(testName);
    currentIndex++;
    
    // Wait between tests (adjust timing as needed)
    setTimeout(runNext, 30000); // 30 second delay between tests
  }
  
  runNext();
};

console.log('\n🚀 Ready to test! Use loadTest("testname") or runTestSequence("quick")');
console.log('💡 TIP: Start with loadTest("health") for a quick system check');

// Advanced helper: Test all critical systems
window.testCriticalSystems = function() {
  console.log('🎯 Testing all critical systems for production readiness...');
  runTestSequence('full');
}; 