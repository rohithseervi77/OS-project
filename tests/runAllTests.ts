console.log('========================================================');
console.log('  RUNNING FULL SMART CPU SCHEDULER MASTER TEST SUITE   ');
console.log('========================================================\n');

try {
  require('./phase1.test');
  console.log('\n--------------------------------------------------------\n');
  require('./phase2.test');
  console.log('\n--------------------------------------------------------\n');
  require('./phase3.test');
  console.log('\n--------------------------------------------------------\n');
  require('./phase4.test');
  console.log('\n--------------------------------------------------------\n');
  require('./phase5_6_7.test');
  console.log('\n--------------------------------------------------------\n');
  require('./auditInvariants.test');

  console.log('\n========================================================');
  console.log('  ALL TEST PHASES & AUDIT INVARIANTS PASSED! (30/30)    ');
  console.log('========================================================');
} catch (err) {
  console.error('\n❌ TEST SUITE FAILURE:', err);
  process.exit(1);
}
