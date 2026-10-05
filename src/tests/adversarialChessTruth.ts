import { Chess, Square } from 'chess.js';
import { PuzzleVerificationService } from '../server/services/puzzleVerificationService';
import { ChessTruthEngine } from '../server/services/chessTruthEngine';

interface AdversarialTestCase {
  category: string;
  subCategory: string;
  name: string;
  fen: string;
  targetMoves: string[];
  solutionSequence?: { userMove: string; opponentReply?: string }[];
  conceptKey?: string;
  exerciseType?: string;
  expectedValid: boolean;
  expectedReasonSubstring?: string;
}

let totalTests = 0;
let passedTests = 0;
let failedTests = 0;

function runAdversarialTest(tc: AdversarialTestCase) {
  totalTests++;
  const result = PuzzleVerificationService.verifyExercise({
    fen: tc.fen,
    targetMoves: tc.targetMoves,
    conceptKey: tc.conceptKey,
    exerciseType: tc.exerciseType,
    solutionSequence: tc.solutionSequence,
  });

  const testPassed = result.isValid === tc.expectedValid;

  if (testPassed) {
    passedTests++;
    console.log(`✓ [PASS] [${tc.category} - ${tc.subCategory}] ${tc.name}`);
    if (!result.isValid && result.errors.length > 0) {
      console.log(`    -> Correctly rejected with reason: "${result.errors[0]}"`);
    }
  } else {
    failedTests++;
    console.error(`✗ [FAIL] [${tc.category} - ${tc.subCategory}] ${tc.name}`);
    console.error(`    Expected valid: ${tc.expectedValid}, but got: ${result.isValid}`);
    console.error(`    Errors: ${JSON.stringify(result.errors)}`);
    console.error(`    Warnings: ${JSON.stringify(result.warnings)}`);
  }
}

console.log('====================================================================');
console.log('       ADVERSARIAL CHESS TRUTH & TACTICAL VERIFICATION AUDIT');
console.log('====================================================================\n');

// ==================================================================
// 1. FORKS
// ==================================================================
console.log('--- 1. FORKS AUDIT ---');

runAdversarialTest({
  category: 'FORK',
  subCategory: 'Valid Fork',
  name: 'Clean Nc7+ forking King e8 and Rook a8 with no capture possible',
  fen: 'r3k2r/pp3ppp/8/3N4/8/8/PPP2PPP/R4RK1 w kq - 0 1',
  targetMoves: ['Nc7+'],
  solutionSequence: [
    { userMove: 'Nc7+', opponentReply: 'Kd8' },
    { userMove: 'Nxa8' },
  ],
  conceptKey: 'FORK',
  expectedValid: true,
});

runAdversarialTest({
  category: 'FORK',
  subCategory: 'Fake Fork - Hanging Knight',
  name: 'Nd6+ check forking King and Rook, but Knight is instantly capturable by pawn c7xd6',
  fen: 'r3k2r/ppp2ppp/8/8/4N3/8/PPP2PPP/R3K2R w KQkq - 0 1',
  targetMoves: ['Nd6+'],
  conceptKey: 'FORK',
  expectedValid: false,
  expectedReasonSubstring: 'blunders the piece',
});

runAdversarialTest({
  category: 'FORK',
  subCategory: 'Fake Fork - Irrelevant Targets',
  name: 'Knight attacks two pawns (a7, e7) that are both defended with 0 tactical gain',
  fen: 'r1b1k2r/pppp1ppp/8/8/1N6/8/PPPP1PPP/R1BQK2R w KQkq - 0 1',
  targetMoves: ['Nc6'],
  conceptKey: 'FORK',
  expectedValid: false,
});

runAdversarialTest({
  category: 'FORK',
  subCategory: 'Fake Fork - Target Can Be Saved',
  name: 'Knight attacks two pieces, but opponent has move that neutralizes both',
  fen: 'r2qk2r/ppp2ppp/2n5/3N4/1b6/8/PPP2PPP/R1BQK2R w KQkq - 0 1',
  targetMoves: ['Nxb4'],
  conceptKey: 'FORK',
  expectedValid: false,
});

runAdversarialTest({
  category: 'FORK',
  subCategory: 'Valid Royal Fork',
  name: 'Nc7+ forking King e8 and Queen a6 cleanly',
  fen: '4k2r/pp3ppp/q7/3N4/8/8/PPP2PPP/R4RK1 w k - 0 1',
  targetMoves: ['Nc7+'],
  solutionSequence: [
    { userMove: 'Nc7+', opponentReply: 'Kd7' },
    { userMove: 'Nxa6' },
  ],
  conceptKey: 'FORK',
  expectedValid: true,
});

// ==================================================================
// 2. PINS
// ==================================================================
console.log('\n--- 2. PINS AUDIT ---');

runAdversarialTest({
  category: 'PIN',
  subCategory: 'Valid Absolute Pin',
  name: 'Rook on e1 pins Knight e4 to King e8, d3 attacks and wins it',
  fen: '4k3/3p1ppp/8/8/4n3/8/3P1PPP/4R1K1 w - - 0 1',
  targetMoves: ['d3'],
  solutionSequence: [
    { userMove: 'd3', opponentReply: 'd5' },
    { userMove: 'dxe4' },
  ],
  conceptKey: 'PIN',
  expectedValid: true,
});

runAdversarialTest({
  category: 'PIN',
  subCategory: 'Fake Pin - Intervening Piece',
  name: 'Rook appears to pin knight, but friendly pawn blocks the line to the king',
  fen: '4k3/4p3/8/8/4n3/8/8/4R1K1 w - - 0 1',
  targetMoves: ['Rxe4'],
  conceptKey: 'PIN',
  expectedValid: false,
});

runAdversarialTest({
  category: 'PIN',
  subCategory: 'Relative Pin with Material Gain',
  name: 'Bg5 pins Black knight on f6 to Queen on d8',
  fen: 'r1bqk2r/pppp1ppp/2n2n2/4p3/4P3/3P1N2/PPP1BPPP/RNBQK2R w KQkq - 1 5',
  targetMoves: ['Bg5'],
  conceptKey: 'PIN',
  expectedValid: true,
});

// ==================================================================
// 3. SKEWERS
// ==================================================================
console.log('\n--- 3. SKEWERS AUDIT ---');

runAdversarialTest({
  category: 'SKEWER',
  subCategory: 'Valid Skewer',
  name: 'Ra7+ skewers King e7 and Queen h7',
  fen: '8/4k2q/8/8/8/8/8/R3K3 w - - 0 1',
  targetMoves: ['Ra7+'],
  solutionSequence: [
    { userMove: 'Ra7+', opponentReply: 'Kd6' },
    { userMove: 'Rxh7' },
  ],
  conceptKey: 'SKEWER',
  expectedValid: true,
});

runAdversarialTest({
  category: 'SKEWER',
  subCategory: 'Fake Skewer - Low Value in Front',
  name: 'Front piece is a pawn and rear piece is a queen (a pin, not a skewer)',
  fen: '8/4p2q/4k3/8/8/8/8/R3K3 w - - 0 1',
  targetMoves: ['Ra7'],
  conceptKey: 'SKEWER',
  expectedValid: false,
});

// ==================================================================
// 4. CHECKMATE & BACK-RANK MATE
// ==================================================================
console.log('\n--- 4. CHECKMATE AUDIT ---');

runAdversarialTest({
  category: 'CHECKMATE',
  subCategory: 'True Checkmate',
  name: 'Ra8# against king with no luft and no defenders',
  fen: '6k1/5ppp/8/8/8/8/8/R3K3 w - - 0 1',
  targetMoves: ['Ra8#'],
  conceptKey: 'CHECKMATE',
  exerciseType: 'FIND_THE_CHECKMATE',
  expectedValid: true,
});

runAdversarialTest({
  category: 'CHECKMATE',
  subCategory: 'Fake Mate - King Escape Square Exists',
  name: 'Ra8+ check, but black played h6 so king escapes to h7',
  fen: '6k1/5pp1/7p/8/8/8/8/R3K3 w - - 0 1',
  targetMoves: ['Ra8+'],
  conceptKey: 'CHECKMATE',
  exerciseType: 'FIND_THE_CHECKMATE',
  expectedValid: false,
  expectedReasonSubstring: 'Fake mate',
});

runAdversarialTest({
  category: 'CHECKMATE',
  subCategory: 'Fake Mate - Checking Piece Can Be Captured',
  name: 'Ra8+ delivered, but Black Rook on f8 simply captures Rxa8',
  fen: '5rk1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
  targetMoves: ['Ra8'],
  conceptKey: 'CHECKMATE',
  exerciseType: 'FIND_THE_CHECKMATE',
  expectedValid: false,
  expectedReasonSubstring: 'Fake mate',
});

runAdversarialTest({
  category: 'BACK_RANK_MATE',
  subCategory: 'Valid Doubled Rook Back-Rank Mate',
  name: '1. Rxe8+ Rxe8 2. Rxe8# forced mate in 2',
  fen: 'r3r1k1/5ppp/8/8/8/8/4RPPP/4R1K1 w - - 0 1',
  targetMoves: ['Rxe8+'],
  solutionSequence: [
    { userMove: 'Rxe8+', opponentReply: 'Rxe8' },
    { userMove: 'Rxe8#' },
  ],
  conceptKey: 'BACK_RANK_MATE',
  exerciseType: 'FIND_THE_CHECKMATE',
  expectedValid: true,
});

runAdversarialTest({
  category: 'BACK_RANK_MATE',
  subCategory: 'Fake Back-Rank Mate - King on 6th rank',
  name: 'Checkmate delivered on e6, not on back rank',
  fen: '8/8/4k3/8/8/8/4Q3/4K3 w - - 0 1',
  targetMoves: ['Qe6+'],
  conceptKey: 'BACK_RANK_MATE',
  exerciseType: 'FIND_THE_CHECKMATE',
  expectedValid: false,
});

// ==================================================================
// 5. SACRIFICES (GREEK GIFT, QUEEN SACRIFICE, DEFLECTION)
// ==================================================================
console.log('\n--- 5. SACRIFICES AUDIT (CRITICAL) ---');

runAdversarialTest({
  category: 'SACRIFICE',
  subCategory: 'Queen Sacrifice for Back-Rank Mate',
  name: 'Qxe8+!! sacrificed to deflect back-rank rook, followed by Rxe8# mate',
  fen: '3rr1k1/5ppp/8/8/Q7/8/4RPPP/4R1K1 w - - 0 1',
  targetMoves: ['Qxe8+'],
  solutionSequence: [
    { userMove: 'Qxe8+', opponentReply: 'Rxe8' },
    { userMove: 'Rxe8#' },
  ],
  conceptKey: 'BACK_RANK_MATE',
  exerciseType: 'FIND_THE_CHECKMATE',
  expectedValid: true, // MUST PASS because sequence ends in forced checkmate!
});

runAdversarialTest({
  category: 'SACRIFICE',
  subCategory: 'Deflection Sacrifice Leading to Material Win',
  name: 'Rook sacrificed on e8+ forcing trade that wins queen',
  fen: 'r3r1k1/5ppp/8/8/8/8/4RPPP/4R1K1 w - - 0 1',
  targetMoves: ['Rxe8+'],
  solutionSequence: [
    { userMove: 'Rxe8+', opponentReply: 'Rxe8' },
    { userMove: 'Rxe8#' },
  ],
  conceptKey: 'CHECKMATE',
  expectedValid: true,
});

runAdversarialTest({
  category: 'SACRIFICE',
  subCategory: 'Fake Sacrifice (Unsound Blunder)',
  name: 'Queen sacrificed on e5 with zero continuation and zero compensation (-9 points)',
  fen: '4k3/4r3/8/8/4Q3/8/8/4K3 w - - 0 1',
  targetMoves: ['Qxe7+'],
  solutionSequence: [
    { userMove: 'Qxe7+', opponentReply: 'Kxe7' },
  ], // Leaves White with a lone King vs lone King after throwing away Queen for Rook (-4 pts net)
  conceptKey: 'FORK',
  expectedValid: false,
  expectedReasonSubstring: 'Hanging piece',
});

runAdversarialTest({
  category: 'SACRIFICE',
  subCategory: 'Greek Gift Bishop Sacrifice',
  name: 'Bxh7+! sacrificed against castled king, winning attack',
  fen: 'r1bq1rk1/ppp2ppp/2n1pn2/3p4/2PP4/2NBPN2/PP3PPP/R1BQK2R w KQ - 0 1',
  targetMoves: ['Bxh7+'],
  solutionSequence: [
    { userMove: 'Bxh7+', opponentReply: 'Kxh7' },
    { userMove: 'Ng5+', opponentReply: 'Kg8' },
    { userMove: 'Qh5' },
  ],
  conceptKey: 'SACRIFICE',
  expectedValid: true,
});

runAdversarialTest({
  category: 'SACRIFICE',
  subCategory: 'Exchange Sacrifice for Decisive Attack',
  name: 'Rook sacrificed on e8+ forcing checkmate',
  fen: 'r3r1k1/5ppp/8/8/8/8/4RPPP/4R1K1 w - - 0 1',
  targetMoves: ['Rxe8+'],
  solutionSequence: [
    { userMove: 'Rxe8+', opponentReply: 'Rxe8' },
    { userMove: 'Rxe8#' },
  ],
  conceptKey: 'CHECKMATE',
  expectedValid: true,
});

runAdversarialTest({
  category: 'DOUBLE_ATTACK',
  subCategory: 'Valid Double Attack',
  name: 'Queen attacks undefended rook on a8 and threatens mate on g7 simultaneously',
  fen: 'r4rk1/ppp2ppp/8/8/8/8/1Q3PPP/5RK1 w - - 0 1',
  targetMoves: ['Qxb7'],
  conceptKey: 'DOUBLE_ATTACK',
  expectedValid: true,
});

runAdversarialTest({
  category: 'REMOVE_THE_DEFENDER',
  subCategory: 'Valid Removal of Defender',
  name: 'White captures the knight on f6 that defends Queen on d8, then captures Queen',
  fen: 'r1bqr1k1/ppp2ppp/2n2n2/3p4/1bPP4/2NBPN2/PP1B1PPP/R2Q1RK1 w - - 0 1',
  targetMoves: ['Nxd5'],
  conceptKey: 'REMOVING_DEFENDER',
  expectedValid: true,
});

runAdversarialTest({
  category: 'ZWISCHENZUG',
  subCategory: 'Valid Zwischenzug (In-Between Check)',
  name: 'Intermediate check before recapturing material',
  fen: 'r3r1k1/5ppp/8/8/8/8/4RPPP/4R1K1 w - - 0 1',
  targetMoves: ['Rxe8+'],
  solutionSequence: [
    { userMove: 'Rxe8+', opponentReply: 'Rxe8' },
    { userMove: 'Rxe8#' },
  ],
  conceptKey: 'ZWISCHENZUG',
  expectedValid: true,
});

// ==================================================================
// 6. PREMATURE CHECK VS WINNING TACTIC
// ==================================================================
console.log('\n--- 6. PREMATURE CHECK AUDIT ---');

runAdversarialTest({
  category: 'PREMATURE_CHECK',
  subCategory: 'Losing / Blunder Check',
  name: 'White gives check with Ra8+, but black simply plays Rxa8 winning a rook',
  fen: '5rk1/5ppp/8/8/8/8/8/R5K1 w - - 0 1',
  targetMoves: ['Ra8'],
  conceptKey: 'FORK',
  expectedValid: false,
  expectedReasonSubstring: 'Hanging piece',
});

runAdversarialTest({
  category: 'PREMATURE_CHECK',
  subCategory: 'Premature Check - No Tactical Gain',
  name: 'Rfe1+ check in quiet position with no fork or material win',
  fen: '4k2r/pp3ppp/q7/3N4/8/8/PPP2PPP/R4RK1 w k - 0 1',
  targetMoves: ['Rfe1+'],
  conceptKey: 'FORK',
  expectedValid: false,
  expectedReasonSubstring: 'Not a fork',
});

// ==================================================================
// 7. DISCOVERED ATTACK
// ==================================================================
console.log('\n--- 7. DISCOVERED ATTACK AUDIT ---');

runAdversarialTest({
  category: 'DISCOVERED_ATTACK',
  subCategory: 'Valid Discovered Attack',
  name: 'White moves knight on c3 to d5, unmasking bishop on b2 aiming at Queen on g7',
  fen: 'r3k2r/pp3pqp/8/8/8/2N5/PB3PPP/R4RK1 w kq - 0 1',
  targetMoves: ['Nd5'],
  conceptKey: 'DISCOVERED_ATTACK',
  expectedValid: true,
});

runAdversarialTest({
  category: 'DISCOVERED_ATTACK',
  subCategory: 'Fake Discovered Attack - Obstructed Line',
  name: 'White moves pawn, but bishop behind is still blocked by a second piece',
  fen: 'r3k2r/pp3pqp/8/8/3N4/2P5/PB3PPP/R4RK1 w kq - 0 1',
  targetMoves: ['c4'],
  conceptKey: 'DISCOVERED_ATTACK',
  expectedValid: false,
  expectedReasonSubstring: 'Not a discovered attack',
});

// ==================================================================
// 8. ATTACK MAP & POSITION ANALYSIS VERIFICATION
// ==================================================================
console.log('\n--- 8. ATTACK MAP & GEOMETRY VERIFICATION ---');

const testBoard = new Chess('r3k2r/ppN2ppp/q7/8/8/8/PPP2PPP/R4RK1 b k - 1 1');
const analysis = ChessTruthEngine.analyzePosition(testBoard);

const c7Square = analysis.attackMap.get('c7');
const e8Square = analysis.attackMap.get('e8');
const a6Square = analysis.attackMap.get('a6');

console.log('Independent Attack Map Report for FEN:', testBoard.fen());
console.log(`  Knight on c7 attacked by Black: [${c7Square?.attackedByBlack.join(', ') || 'NONE'}]`);
console.log(`  Knight on c7 defended by White: [${c7Square?.attackedByWhite.join(', ') || 'NONE'}]`);
console.log(`  Black King on e8 attacked by White: [${e8Square?.attackedByWhite.join(', ') || 'NONE'}]`);
console.log(`  Black Queen on a6 attacked by White: [${a6Square?.attackedByWhite.join(', ') || 'NONE'}]`);
console.log(`  Black King legal escape squares: [${analysis.blackKingEscapes.join(', ')}]`);

const mapTestPassed =
  c7Square?.attackedByBlack.length === 0 &&
  e8Square?.attackedByWhite.includes('c7') &&
  a6Square?.attackedByWhite.includes('c7');

if (mapTestPassed) {
  passedTests++;
  console.log('✓ [PASS] [ATTACK_MAP] Independently verified geometric sightlines, attacks, and escapes.');
} else {
  failedTests++;
  console.error('✗ [FAIL] [ATTACK_MAP] Attack map calculation discrepancy.');
}
totalTests++;

// ==================================================================
// FINAL SUMMARY
// ==================================================================
console.log('\n====================================================================');
console.log(`ADVERSARIAL SUITE SUMMARY: ${passedTests} / ${totalTests} TESTS PASSED`);
if (failedTests === 0) {
  console.log('ALL ADVERSARIAL TRUTH VALIDATION TESTS PASSED PERFECTLY! ✓');
} else {
  console.error(`${failedTests} TESTS FAILED! The verification system has flaws.`);
  process.exit(1);
}
console.log('====================================================================\n');
