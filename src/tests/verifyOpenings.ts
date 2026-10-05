import { OPENINGS_DATA } from '../data/openingsData';
import { Chess } from 'chess.js';

console.log('====================================================================');
console.log('           CHESS OPENINGS DATA & MOVE TRUTH AUDIT');
console.log('====================================================================');

let passedTests = 0;
let failedTests = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passedTests++;
  } else {
    console.error(`✗ [FAIL] ${testName}${detail ? ` -> ${detail}` : ''}`);
    failedTests++;
  }
}

OPENINGS_DATA.forEach((opening) => {
  console.log(`\n--- Auditing Opening: ${opening.name} (${opening.eco}) ---`);

  // 1. Structure
  assert(Boolean(opening.id && opening.name && opening.eco), `[${opening.id}] Basic identification populated`);
  assert(Boolean(opening.philosophy && opening.philosophy.length > 20), `[${opening.id}] Deep philosophy text present`);
  assert(opening.whitePlans.length >= 2, `[${opening.id}] Has >= 2 White plans`);
  assert(opening.blackPlans.length >= 2, `[${opening.id}] Has >= 2 Black plans`);
  assert(opening.famousChampions.length >= 2, `[${opening.id}] Has >= 2 Famous champions`);

  // 2. Starting FEN
  const startEngine = new Chess(opening.startingFen);
  assert(Boolean(startEngine), `[${opening.id}] Starting FEN is valid`);

  // 3. Move Sequence Simulation
  const sim = new Chess(opening.startingFen);
  let movesClean = true;

  for (const step of opening.movesSequence) {
    // White move
    const wRes = sim.move(step.white.san);
    if (!wRes) {
      movesClean = false;
      console.error(`  Illegal White move ${step.white.san} on move ${step.moveNumber}`);
      break;
    }

    if (step.black) {
      // Black move
      const bRes = sim.move(step.black.san);
      if (!bRes) {
        movesClean = false;
        console.error(`  Illegal Black move ${step.black.san} on move ${step.moveNumber}`);
        break;
      }
    }

    // Verify fenAfter validity
    const stepFenEngine = new Chess(step.fenAfter);
    if (!stepFenEngine) {
      movesClean = false;
      console.error(`  Invalid fenAfter on move ${step.moveNumber}: ${step.fenAfter}`);
    }
  }

  assert(movesClean, `[${opening.id}] All moves in sequence executed legally`);
  assert(sim.fen() === opening.finalFen, `[${opening.id}] Final FEN matches move simulation exactly`);

  // 4. Interactive practice position
  const practiceEngine = new Chess(opening.interactivePracticeFen);
  assert(Boolean(practiceEngine), `[${opening.id}] Interactive practice FEN is valid`);
  const targetMoveObj = practiceEngine.move(opening.targetMove);
  assert(Boolean(targetMoveObj), `[${opening.id}] Target practice move "${opening.targetMove}" is strictly legal`);
});

console.log('\n====================================================================');
console.log(`OPENINGS AUDIT SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL CHESS OPENINGS VERIFIED ERROR-FREE! ✓\n');
}
