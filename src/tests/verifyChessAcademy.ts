import { ChessEngine } from '../lib/chess/chessEngine';
import { AdaptiveLearningEngine, INITIAL_CONCEPT_MASTERY } from '../services/adaptiveLearningEngine';
import { CURRICULUM_DATA } from '../data/curriculumData';
import { PUZZLES_DATA } from '../data/puzzlesData';

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, details?: string) {
  if (condition) {
    console.log(`✓ [PASS] ${testName}`);
    passed++;
  } else {
    console.error(`✗ [FAIL] ${testName}${details ? ': ' + details : ''}`);
    failed++;
  }
}

console.log('=== RUNNING CHESSCADET AUTOMATED TESTS ===\n');

// 1. CHESS MOVE VALIDATION & RULES
console.log('--- 1. Chess Move Validation & Rules ---');
const engine = new ChessEngine();

// Initial board
assert(engine.turn === 'w', 'Initial turn is white');
assert(!engine.isCheck, 'Initial position is not check');
assert(!engine.isGameOver, 'Game is not over at start');

// Make standard opening move 1. e4
const move1 = engine.makeSanMove('e4');
assert(move1 !== null && move1.san === 'e4', '1. e4 is valid legal move');
assert(engine.turn === 'b', 'Turn switches to black');

// Test illegal move: White pawn cannot move to e6 on move 1
const illegalMove = engine.makeSanMove('e6'); // black pawn from e7 can, but let's test invalid e1e6
const engine2 = new ChessEngine();
const illegalMoveResult = engine2.makeMove('e1' as any, 'e6' as any);
assert(illegalMoveResult === null, 'King cannot move 5 squares ahead (illegal move rejected)');

// Test Back Rank Mate Checkmate detection
const mateEngine = new ChessEngine('6k1/5ppp/8/8/8/8/8/3R2K1 w - - 0 1');
const mateMove = mateEngine.makeSanMove('Rd8#');
assert(mateMove !== null, 'Rd8# executes cleanly');
assert(mateEngine.isCheck, 'Rd8# puts King in check');
assert(mateEngine.isCheckmate, 'Rd8# is confirmed checkmate');
assert(mateEngine.isGameOver, 'Game over on back rank mate');

// 2. CURRICULUM FEN VALIDATION
console.log('\n--- 2. Curriculum & Puzzle FEN Validation ---');
let allFensValid = true;
let totalExercisesTested = 0;

for (const path of CURRICULUM_DATA) {
  for (const mod of path.modules) {
    for (const lesson of mod.lessons) {
      for (const sec of lesson.sections) {
        // Validate demonstration FEN
        const demoEngine = new ChessEngine(sec.demonstrationFen);
        if (!demoEngine.fen) allFensValid = false;

        for (const ex of sec.exercises) {
          totalExercisesTested++;
          const exEngine = new ChessEngine(ex.fen);
          if (!exEngine.fen) {
            allFensValid = false;
            console.error(`Invalid FEN in exercise ${ex.id}: ${ex.fen}`);
          }
        }
      }
    }
  }
}

for (const puz of PUZZLES_DATA) {
  totalExercisesTested++;
  const puzEngine = new ChessEngine(puz.fen);
  if (!puzEngine.fen) {
    allFensValid = false;
    console.error(`Invalid FEN in puzzle ${puz.id}: ${puz.fen}`);
  }
}

assert(allFensValid, `All ${totalExercisesTested} curriculum & puzzle FEN positions are valid legal setups`);

// 3. ADAPTIVE LEARNING ENGINE TESTS
console.log('\n--- 3. Adaptive Learning Engine Tests ---');

// Weakness identification
const biggestWeakness = AdaptiveLearningEngine.getBiggestOpportunity(INITIAL_CONCEPT_MASTERY);
assert(
  biggestWeakness !== null && biggestWeakness.concept === 'BACK_RANK_MATE',
  'Adaptive engine identifies Back Rank Mate as #1 biggest opportunity (mastery 37%)'
);

// Mastery update on perfect solve (0 hints)
const testConcept = INITIAL_CONCEPT_MASTERY.find((c) => c.concept === 'BACK_RANK_MATE')!;
const updatedOnSuccess = AdaptiveLearningEngine.updateMastery(testConcept, true, 0, 8.5);
assert(
  updatedOnSuccess.masteryPercentage === 44, // 37 + 7 = 44
  'Mastery increases by +7% on first attempt without hints'
);
assert(
  updatedOnSuccess.recentErrors === 4, // 5 - 1 = 4
  'Recent errors decremented on clean solve'
);

// Mastery update on repeated failure
const updatedOnFail = AdaptiveLearningEngine.updateMastery(testConcept, false, 0, 15);
assert(
  updatedOnFail.masteryPercentage === 31, // 37 - 6 = 31
  'Mastery penalizes by -6% on failed attempt'
);
assert(
  updatedOnFail.recentErrors === 6,
  'Recent error count incremented on failure'
);

// Educational Learning Rating calculation
const ratingResultSuccess = AdaptiveLearningEngine.updateLearningRating(1240, 2, true, 0);
assert(
  ratingResultSuccess.newRating > 1240 && ratingResultSuccess.change > 0,
  `Rating increases on solve (+${ratingResultSuccess.change}) to ${ratingResultSuccess.newRating}`
);

const ratingResultFail = AdaptiveLearningEngine.updateLearningRating(1240, 2, false, 0);
assert(
  ratingResultFail.newRating < 1240 && ratingResultFail.change < 0,
  `Rating decreases on failure (${ratingResultFail.change}) to ${ratingResultFail.newRating}`
);

// Dynamic Daily Practice Generation
const generatedDaily = AdaptiveLearningEngine.generateDailyPractice(INITIAL_CONCEPT_MASTERY, PUZZLES_DATA);
assert(
  generatedDaily.tasks.length === 5,
  'Dynamic Daily Practice generates exactly 5 calibrated exercises'
);
assert(
  generatedDaily.tasks.some((t) => t.type === 'weakness' && t.concept === 'BACK_RANK_MATE'),
  'Daily practice includes targeted drills for the identified weakness (Back Rank Mate)'
);
assert(
  generatedDaily.tasks.some((t) => t.type === 'warmup'),
  'Daily practice includes warmup exercise'
);
assert(
  generatedDaily.tasks.some((t) => t.type === 'challenge'),
  'Daily practice includes tactical challenge'
);
assert(
  generatedDaily.tasks.some((t) => t.type === 'review'),
  'Daily practice includes spaced repetition review of mastered concept'
);

console.log('\n=== TEST RESULTS SUMMARY ===');
console.log(`Passed: ${passed}`);
console.log(`Failed: ${failed}`);

if (failed > 0) {
  process.exit(1);
} else {
  console.log('ALL TESTS PASSED SUCCESSFULLY! ✓\n');
}
