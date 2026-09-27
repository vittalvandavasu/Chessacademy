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
  | 'CANDIDATE_MOVES';

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

export interface Exercise {
  id: string;
  type: ExerciseType;
  concept: TacticalConcept;
  difficulty: 1 | 2 | 3 | 4 | 5; // 1 = beginner, 5 = advanced
  fen: string;
  initialOrientation?: 'white' | 'black';
  targetMoves: string[]; // Acceptable SAN or UCI moves for step 1
  solutionSequence?: ExerciseStep[]; // Multi-move lines
  conceptHint: string; // Hint 1: Conceptual hint
  areaHint: string; // Hint 2: Board area / squares (e.g. "f7-g8 area")
  pieceHint: string; // Hint 3: Piece to move (e.g. "Look at your White Queen on d1")
  moveHint: string; // Hint 4: Exact move guidance (e.g. "Qh5+ forces king to e7")
  explanation: string; // Pedagogical explanation shown upon solving
  commonMistakes?: Record<string, string>; // SAN -> custom feedback on why this move is tempting but wrong
  xp: number;
  highlightSquares?: string[]; // Squares to highlight initially (e.g. pinned piece)
  arrowGuide?: { from: string; to: string; color?: string }[];
  // Instructional 2.0 Extensions
  observationPrompt?: string; // "What should you notice?"
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
