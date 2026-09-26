import { Chess } from 'chess.js';

export type ExerciseStatus = 'DRAFT' | 'REVIEW' | 'VERIFIED' | 'PUBLISHED' | 'REJECTED';

export interface VerificationResult {
  isValid: boolean;
  status: ExerciseStatus;
  errors: string[];
  warnings: string[];
  details: {
    fen: string;
    turn: 'w' | 'b';
    legalMovesCount: number;
    solutionMovesValid: string[];
    isCheck: boolean;
    isCheckmate: boolean;
  };
}

export class PuzzleVerificationService {
  /**
   * Rigorous verification pipeline for chess exercises
   */
  public static verifyExercise(exercise: {
    fen: string;
    targetMoves: string[];
    conceptKey?: string;
    exerciseType?: string;
    solutionSequence?: { userMove: string; opponentReply?: string }[];
    difficulty?: number;
  }): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let chess: Chess;

    // 1. FEN Parsing & King Presence
    try {
      chess = new Chess(exercise.fen);
    } catch (err: any) {
      return {
        isValid: false,
        status: 'REJECTED',
        errors: [`Invalid FEN structure: ${err.message}`],
        warnings: [],
        details: {
          fen: exercise.fen,
          turn: 'w',
          legalMovesCount: 0,
          solutionMovesValid: [],
          isCheck: false,
          isCheckmate: false,
        },
      };
    }

    const turn = chess.turn();
    const legalMoves = chess.moves({ verbose: true });
    const isCheck = chess.inCheck();

    // 2. Legal position validation
    if (legalMoves.length === 0) {
      errors.push('Game is already over (checkmate or stalemate) in the starting FEN.');
    }

    // 3. Solution legality
    const validMoves: string[] = [];
    for (const moveStr of exercise.targetMoves) {
      const sim = new Chess(exercise.fen);
      const res = sim.move(moveStr);
      if (!res) {
        errors.push(`Target move "${moveStr}" is illegal in position ${exercise.fen}`);
      } else {
        validMoves.push(res.san);
      }
    }

    // 4. Multi-step sequence validation
    if (exercise.solutionSequence && exercise.solutionSequence.length > 0) {
      const simSeq = new Chess(exercise.fen);
      exercise.solutionSequence.forEach((step, idx) => {
        const uMove = simSeq.move(step.userMove);
        if (!uMove) {
          errors.push(`Sequence step ${idx + 1} user move "${step.userMove}" is illegal.`);
        } else if (step.opponentReply) {
          const oMove = simSeq.move(step.opponentReply);
          if (!oMove) {
            errors.push(`Sequence step ${idx + 1} opponent reply "${step.opponentReply}" is illegal.`);
          }
        }
      });
    }

    // 5. Concept & Motif Validation
    if (exercise.conceptKey === 'BACK_RANK_MATE' && exercise.exerciseType === 'FIND_THE_CHECKMATE') {
      const firstMove = exercise.targetMoves[0];
      if (firstMove) {
        const testMate = new Chess(exercise.fen);
        testMate.move(firstMove);
        if (!testMate.isCheckmate()) {
          warnings.push(`Exercise tagged as FIND_THE_CHECKMATE does not produce immediate checkmate after ${firstMove}`);
        }
      }
    }

    // 6. Blunder detection (is the target move blundering into a piece capture?)
    if (exercise.targetMoves[0]) {
      const simBlunder = new Chess(exercise.fen);
      const m = simBlunder.move(exercise.targetMoves[0]);
      if (m) {
        // Check if opponent can immediately capture this piece with no compensation in 1-move puzzles
        const replies = simBlunder.moves({ verbose: true });
        const directCapture = replies.find((r) => r.to === m.to && m.piece !== 'p');
        if (directCapture && !simBlunder.inCheck() && !exercise.solutionSequence?.length) {
          warnings.push(
            `Target move ${m.san} is immediately capturable by opponent's ${directCapture.piece} on ${directCapture.from}`
          );
        }
      }
    }

    const isValid = errors.length === 0;
    const status: ExerciseStatus = isValid ? 'VERIFIED' : 'REJECTED';

    return {
      isValid,
      status,
      errors,
      warnings,
      details: {
        fen: exercise.fen,
        turn,
        legalMovesCount: legalMoves.length,
        solutionMovesValid: validMoves,
        isCheck,
        isCheckmate: chess.isCheckmate(),
      },
    };
  }
}
