export type ChessPieceColor = 'w' | 'b';

export type TacticalConcept =
  | 'CHESS_BOARD'
  | 'PIECE_MOVEMENT'
  | 'CAPTURING'
  | 'CHECK'
  | 'CHECKMATE'
  | 'STALEMATE'
  | 'CASTLING'
  | 'EN_PASSANT'
  | 'PAWN_PROMOTION'
  | 'PIECE_VALUES'
  | 'FORK'
  | 'PIN'
  | 'SKEWER'
  | 'DISCOVERED_ATTACK'
  | 'DOUBLE_ATTACK'
  | 'REMOVING_DEFENDER'
  | 'ZWISCHENZUG'
  | 'BACK_RANK_MATE'
  | 'SMOTHERED_MATE'
  | 'DEFLECTION'
  | 'DECOY'
  | 'OVERLOADING'
  | 'CLEARANCE'
  | 'INTERFERENCE'
  | 'ATTRACTION'
  | 'DEVELOPMENT'
  | 'CENTER_CONTROL'
  | 'KING_SAFETY'
  | 'WEAK_SQUARES'
  | 'OUTPOSTS'
  | 'OPEN_FILES'
  | 'PAWN_STRUCTURE'
  | 'OPPOSITION'
  | 'PASSED_PAWNS'
  | 'ROOK_ENDGAMES'
  | 'QUEEN_ENDGAMES'
  | 'CANDIDATE_MOVES'
  | 'OPENING_PRINCIPLES'
  | 'ITALIAN_GAME'
  | 'RUY_LOPEZ'
  | 'SICILIAN_DEFENSE'
  | 'FRENCH_DEFENSE'
  | 'CARO_KANN'
  | 'QUEENS_GAMBIT'
  | 'SLAV_DEFENSE'
  | 'LONDON_SYSTEM'
  | 'KINGS_INDIAN'
  | 'NIMZO_INDIAN'
  | 'GRUNFELD'
  | 'ENGLISH_OPENING'
  | 'ALEKHINE_DEFENSE'
  | 'PIRC_DEFENSE'
  | 'CATALAN_OPENING';

export type OpeningFamily =
  | 'OPEN_GAMES'
  | 'SEMI_OPEN'
  | 'QUEENS_PAWN'
  | 'HYPERMODERN';

export interface OpeningMoveStep {
  moveNumber: number;
  white: { san: string; explanation: string };
  black?: { san: string; explanation: string };
  fenAfter: string;
}

export interface ChessOpeningLesson {
  id: string;
  name: string;
  eco: string;
  family: OpeningFamily;
  movesSan: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  tagline: string;
  philosophy: string;
  whitePlans: string[];
  blackPlans: string[];
  keyPawnStructure: string;
  famousTrap?: {
    name: string;
    description: string;
    moves: string;
  };
  famousChampions: string[];
  startingFen: string;
  finalFen: string;
  movesSequence: OpeningMoveStep[];
  interactivePracticeFen: string;
  targetMove: string;
  practiceExplanation: string;
  curriculumLessonId?: string;
  quizQuestions?: {
    question: string;
    options: string[];
    correctIndex: number;
    explanation: string;
  }[];
  keyVariations?: {
    name: string;
    moves: string;
    description: string;
  }[];
}

export type ExerciseType =
  | 'FIND_THE_MOVE'
  | 'FIND_THE_TACTIC'
  | 'FIND_THE_CHECKMATE'
  | 'CHOOSE_THE_BEST_MOVE'
  | 'COMPLETE_THE_SEQUENCE'
  | 'DEFEND_THE_POSITION'
  | 'FIND_THE_BLUNDER';

export interface ExerciseStep {
  userMove: string; // SAN e.g. "Rd8+" or UCI e.g. "d1d8"
  opponentReply?: string; // Computer reply SAN e.g. "Rxd8"
  explanation?: string;
  annotation?: '!' | '!!' | '!?' | '?' | '??';
  fenAfter?: string;
}

export interface WhyThisMove {
  tacticalIdea: string;
  target: string;
  keyFeature: string;
  whyItWorks: string;
}

export interface AlternativeMove {
  san: string;
  uci?: string;
  category?: 'Missed Check' | 'Missed Capture' | 'Defensive Oversight' | 'Miscalculation' | 'Tactical Oversell' | 'Quiet Move Blunder';
  whyItFails: string;
  refutationMoves?: string[]; // e.g. ["Qxf7+", "Kh8", "Qxg7#"]
}

export interface ConceptCardData {
  concept: TacticalConcept;
  title: string;
  tagline: string;
  definition: string;
  recognitionCues: string[];
  commonMistakes: string[];
  transferablePrinciple: string;
}

export interface LessonReviewQuestion {
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface LessonHints {
  conceptHint: string;
  areaHint: string;
  pieceHint: string;
  moveHint: string;
}

export interface PuzzleLesson {
  id: string;
  title: string;
  concept: TacticalConcept;
  difficulty: 1 | 2 | 3 | 4 | 5;

  learningObjective: string;
  positionContext: string;
  observationPrompt: string;
  thinkingPrompt: string;
  candidateMovePrompt: string;

  solution: string;
  solutionSequence?: ExerciseStep[];
  opponentResponses?: string[];

  hints: LessonHints;

  tacticalExplanation: string;
  calculationExplanation: string;
  whyItWorks: string;
  whyAlternativesFail?: string[];
  commonMistakes?: Record<string, string>;

  recognitionCues: string[];
  transferablePrinciple: string;
  realGameApplication?: string;
  reviewQuestion?: LessonReviewQuestion;
  relatedConcepts?: TacticalConcept[];
  prerequisites?: string[];
  followUpExercise?: string;
}

export interface Exercise {
  id: string;
  title?: string;
  type: ExerciseType;
  concept: TacticalConcept;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = advanced
  fen: string;
  initialOrientation?: 'white' | 'black';
  targetMoves: string[]; // Acceptable SAN or UCI moves for step 1
  solution?: string; // Principal SAN solution e.g. "Nc7+"
  solutionSequence?: ExerciseStep[]; // Multi-move lines
  opponentResponses?: string[]; // Expected opponent responses

  // Masterclass Educational Fields (ChessCadet 3.0)
  learningObjective?: string;
  positionContext?: string;
  observationPrompt?: string;
  thinkingPrompt?: string;
  candidateMovePrompt?: string;

  // Progressive Hints
  conceptHint: string; // Hint 1: Conceptual hint
  areaHint: string; // Hint 2: Board area / squares (e.g. "f7-g8 area")
  pieceHint: string; // Hint 3: Piece to move (e.g. "Look at your White Queen on d1")
  moveHint: string; // Hint 4: Exact move guidance (e.g. "Qh5+ forces king to e7")
  hints?: LessonHints; // Structured hints container

  // Deep Coach Explanations & Masterclass Pedagogy
  explanation: string; // Pedagogical explanation shown upon solving
  tacticalExplanation?: string; // Geometric & dynamic explanation
  calculationExplanation?: string; // Step-by-step calculation & lines
  whyItWorks?: string | WhyThisMove; // Why the tactic succeeds
  whyAlternativesFail?: string[] | AlternativeMove[]; // Detailed refutations of plausible alternatives
  commonMistakes?: Record<string, string>; // SAN -> custom feedback on why this move is tempting but wrong
  recognitionCues?: string[]; // Concrete visual cues to spot the motif
  transferablePrinciple?: string; // Generalizable chess wisdom
  realGameApplication?: string; // Master game context or real-world application
  reviewQuestion?: LessonReviewQuestion; // Retention quiz with options & explanation
  relatedConcepts?: TacticalConcept[];
  prerequisites?: string[];
  followUpExercise?: string;

  xp: number;
  highlightSquares?: string[]; // Squares to highlight initially (e.g. pinned piece)
  arrowGuide?: { from: string; to: string; color?: string }[];
  // Instructional 2.0 Extensions
  objective?: string; // e.g. "Deliver a forcing skewer to win the Queen"
  consequence?: string; // What happens next (Level 3 feedback)
  principleToRemember?: string; // Transferable rule (Level 4 feedback)
  whyThisMove?: WhyThisMove;
  alternatives?: AlternativeMove[];
  learningPathTitle?: string;
  lessonTitle?: string;
  errorDiagnostics?: Record<string, { category: string; explanation: string; mistake: string }>;
}

export interface LessonSection {
  id: string;
  title: string;
  conceptIntro: string;
  bulletPoints?: string[];
  demonstrationFen: string;
  demonstrationMove?: string;
  demonstrationArrows?: { from: string; to: string; color?: string }[];
  demonstrationHighlights?: string[];
  exercises: Exercise[];
  keyTakeaway: string;
}

export interface Lesson {
  id: string;
  moduleId: string;
  pathId: string;
  title: string;
  description: string;
  concept: TacticalConcept;
  estimatedMinutes: number;
  sections: LessonSection[];
  xpReward: number;
  order: number;
}

export interface Module {
  id: string;
  pathId: string;
  title: string;
  description: string;
  lessons: Lesson[];
  order: number;
}

export interface LearningPath {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  level: 'Beginner' | 'Intermediate' | 'Advanced';
  modules: Module[];
  order: number;
  badgeId: string;
}

export interface ConceptMastery {
  concept: TacticalConcept;
  name: string;
  category: 'Foundations' | 'Tactics' | 'Strategy' | 'Endgames';
  masteryPercentage: number; // 0 - 100
  totalAttempts: number;
  successfulAttempts: number;
  lastPracticed: string; // ISO date
  recentErrors: number;
  averageResponseTimeSeconds: number;
}

export interface UserStats {
  learningRating: number; // e.g. 1240
  totalXp: number;
  level: number;
  currentStreakDays: number;
  longestStreakDays: number;
  lastActiveDate: string; // YYYY-MM-DD
  lessonsCompleted: number;
  puzzlesSolved: number;
  accuracyRate: number; // e.g. 78.5%
  totalPracticeMinutes: number;
}

export interface DailyPracticeTask {
  id: string;
  title: string;
  concept: TacticalConcept;
  exercise: Exercise;
  completed: boolean;
  type: 'warmup' | 'weakness' | 'challenge' | 'review';
}

export interface DailyPracticeSession {
  date: string; // YYYY-MM-DD
  tasks: DailyPracticeTask[];
  totalXp: number;
  estimatedMinutes: number;
  isCompleted: boolean;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  xpReward: number;
  category: 'streak' | 'mastery' | 'puzzle' | 'milestone';
  unlockedAt?: string;
  progress: number; // 0 - 100
  isUnlocked: boolean;
}

export interface ClassroomStudent {
  id: string;
  name: string;
  avatar: string;
  lessonsCompleted: number;
  accuracy: number;
  weakestConcept: string;
  learningRating: number;
  lastActive: string;
}

export interface ClassroomAssignment {
  id: string;
  title: string;
  dueDate: string;
  pathOrLessonTitle: string;
  targetExercisesCount: number;
  completedCount: number;
  totalStudents: number;
}

export interface DiscussionComment {
  id: string;
  lessonId: string;
  authorName: string;
  authorAvatar: string;
  authorRating: number;
  timestamp: string;
  content: string;
  upvotes: number;
  userHasUpvoted?: boolean;
}
