import { PUZZLES_DATA } from '../data/puzzlesData';
import { Chess } from 'chess.js';

console.log('====================================================================');
console.log('       PUZZLE LESSONS MODEL & PEDAGOGY VERIFICATION');
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

// 1. Verify all 13 puzzles contain complete rich lesson fields
console.log('\n--- 1. RICH PUZZLE LESSON ATTRIBUTES AUDIT ---');

PUZZLES_DATA.forEach((puzzle) => {
  const pId = puzzle.id;

  // Title
  assert(
    Boolean(puzzle.title && puzzle.title.trim().length > 3),
    `[${pId}] Has descriptive lesson title`,
    `Title was: "${puzzle.title}"`
  );

  // Learning Objective
  assert(
    Boolean(puzzle.learningObjective && puzzle.learningObjective.length > 15),
    `[${pId}] Has clear learning objective`,
    `Objective was: "${puzzle.learningObjective}"`
  );

  // Position Context
  assert(
    Boolean(puzzle.positionContext && puzzle.positionContext.length > 10),
    `[${pId}] Has position context`
  );

  // Observation Prompt
  assert(
    Boolean(puzzle.observationPrompt && puzzle.observationPrompt.length > 10),
    `[${pId}] Has observation prompt ("What to notice")`
  );

  // Thinking Prompt
  assert(
    Boolean(puzzle.thinkingPrompt && puzzle.thinkingPrompt.length > 10),
    `[${pId}] Has thinking process prompt`
  );

  // Candidate Move Prompt
  assert(
    Boolean(puzzle.candidateMovePrompt && puzzle.candidateMovePrompt.length > 10),
    `[${pId}] Has candidate move prompt`
  );

  // Solution
  assert(
    Boolean(puzzle.solution && puzzle.targetMoves.includes(puzzle.solution)),
    `[${pId}] Solution matches targetMoves`,
    `solution: ${puzzle.solution}`
  );

  // Hints structure
  assert(
    Boolean(
      puzzle.hints?.conceptHint &&
      puzzle.hints?.areaHint &&
      puzzle.hints?.pieceHint &&
      puzzle.hints?.moveHint
    ),
    `[${pId}] Has structured 4-tier hints`
  );

  // Tactical Explanation
  assert(
    Boolean(puzzle.tacticalExplanation && puzzle.tacticalExplanation.length > 15),
    `[${pId}] Has tactical mechanism explanation`
  );

  // Calculation Explanation
  assert(
    Boolean(puzzle.calculationExplanation && puzzle.calculationExplanation.length > 15),
    `[${pId}] Has step-by-step calculation explanation`
  );

  // Why it works
  assert(
    Boolean(puzzle.whyItWorks),
    `[${pId}] Has why-it-works justification`
  );

  // Why alternatives fail
  assert(
    Boolean(Array.isArray(puzzle.whyAlternativesFail) && puzzle.whyAlternativesFail.length > 0),
    `[${pId}] Has refutation of plausible alternatives`
  );

  // Recognition Cues
  assert(
    Boolean(Array.isArray(puzzle.recognitionCues) && puzzle.recognitionCues.length >= 2),
    `[${pId}] Has >= 2 visual recognition cues`
  );

  // Transferable Principle
  assert(
    Boolean(puzzle.transferablePrinciple && puzzle.transferablePrinciple.length > 15),
    `[${pId}] Has transferable principle`
  );

  // Real-game application
  assert(
    Boolean(puzzle.realGameApplication && puzzle.realGameApplication.length > 10),
    `[${pId}] Has real game application heritage`
  );

  // Review Question
  assert(
    Boolean(
      puzzle.reviewQuestion &&
      puzzle.reviewQuestion.question.length > 10 &&
      puzzle.reviewQuestion.options.length >= 2 &&
      puzzle.reviewQuestion.correctIndex >= 0 &&
      puzzle.reviewQuestion.correctIndex < puzzle.reviewQuestion.options.length &&
      puzzle.reviewQuestion.explanation.length > 10
    ),
    `[${pId}] Has valid interactive review question`
  );
});

// 2. Educational Objective Structure Audit
console.log('\n--- 2. EDUCATIONAL OBJECTIVE CHECK ---');
const sampleFork = PUZZLES_DATA.find((p) => p.id === 'puz-fork-1')!;
assert(
  Boolean(sampleFork.learningObjective?.includes('knight can jump') || sampleFork.learningObjective?.includes('fork')),
  'Learning objective clearly articulates the tactical skill'
);
assert(
  Boolean(sampleFork.recognitionCues?.some((cue) => cue.toLowerCase().includes('c7') || cue.toLowerCase().includes('king'))),
  'Recognition cues identify concrete geometry'
);
assert(
  Boolean(sampleFork.transferablePrinciple?.includes('simultaneous threats') || sampleFork.transferablePrinciple?.includes('forcing moves')),
  'Transferable principle gives generalizable advice'
);

// 3. FEN & Solution Verification
console.log('\n--- 3. SOLUTION LEGALITY CHECK ---');
PUZZLES_DATA.forEach((p) => {
  const chess = new Chess(p.fen);
  const moveRes = chess.move(p.solution!);
  assert(
    Boolean(moveRes),
    `[${p.id}] Primary solution ${p.solution} is strictly legal in FEN position`
  );
});

console.log('\n====================================================================');
console.log(`PUZZLE LESSONS SUMMARY: ${passedTests} PASSED, ${failedTests} FAILED`);
console.log('====================================================================');

if (failedTests > 0) {
  process.exit(1);
} else {
  console.log('ALL PUZZLE LESSONS VERIFIED! ✓\n');
}
