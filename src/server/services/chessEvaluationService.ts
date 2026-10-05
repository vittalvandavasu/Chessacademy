import { Chess } from 'chess.js';
import { prisma } from '../db/prisma';

export type MoveVerdict =
  | 'DECISIVE_FORK'
  | 'DECISIVE_PIN'
  | 'DECISIVE_SKEWER'
  | 'CHECKMATE'
  | 'TACTICAL_WIN'
  | 'BLUNDER'
  | 'HANGING_PIECE'
  | 'PREMATURE_CHECK'
  | 'MISCALCULATION'
  | 'INACCURACY'
  | 'ILLEGAL';

export interface MoveEvaluationResult {
  isLegal: boolean;
  isSuccess: boolean;
  verdict?: MoveVerdict;
  playedSan?: string;
  resultingFen?: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  explanation: string;
  opponentReplySan?: string;
  opponentReplyFen?: string;
  nextStepIndex?: number;
  isSequenceComplete: boolean;
}

export class ChessEvaluationService {
  /**
   * Server-authoritative mathematical and tactical evaluation of an exercise move attempt
   */
  public static async evaluateAttempt(
    exerciseId: string,
    submission: {
      from: string;
      to: string;
      promotion?: 'q' | 'r' | 'b' | 'n';
      stepIndex?: number;
    }
  ): Promise<MoveEvaluationResult> {
    const exercise = await prisma.exercise.findUnique({
      where: { id: exerciseId },
    });

    if (!exercise) {
      throw new Error(`Exercise ${exerciseId} not found in database.`);
    }

    const stepIndex = submission.stepIndex || 0;
    const targetMoves: string[] = JSON.parse(exercise.targetMoves || '[]');
    let solutionSequence: { userMove: string; opponentReply?: string }[] = [];
    if (exercise.solutionSequence) {
      try {
        solutionSequence = JSON.parse(exercise.solutionSequence);
      } catch {
        solutionSequence = [];
      }
    }

    // Determine the current starting FEN for this step
    const chess = new Chess(exercise.fen);

    // If multi-step, advance position up to current step
    for (let i = 0; i < stepIndex; i++) {
      if (solutionSequence[i]) {
        chess.move(solutionSequence[i].userMove);
        if (solutionSequence[i].opponentReply) {
          chess.move(solutionSequence[i].opponentReply!);
        }
      }
    }

    // Attempt the user's submitted move on the authoritative board
    let playedMove = null;
    try {
      playedMove = chess.move({
        from: submission.from as any,
        to: submission.to as any,
        promotion: submission.promotion || 'q',
      });
    } catch {
      return {
        isLegal: false,
        isSuccess: false,
        verdict: 'ILLEGAL',
        explanation: 'Illegal chess move submitted according to FIDE rules.',
        isSequenceComplete: false,
      };
    }

    if (!playedMove) {
      return {
        isLegal: false,
        isSuccess: false,
        verdict: 'ILLEGAL',
        explanation: 'Illegal move rejected by server engine.',
        isSequenceComplete: false,
      };
    }

    const playedSan = playedMove.san;
    const cleanPlayed = playedSan.replace(/[+#?!]/g, '').trim();
    const uci = `${submission.from}${submission.to}`;
    const givesCheck = chess.inCheck();
    const givesCheckmate = chess.isCheckmate();

    // Check if the user's move hangs the piece (opponent can simply capture it for free)
    const opponentLegalMoves = chess.moves({ verbose: true });
    const freeCaptures = opponentLegalMoves.filter((m) => m.to === playedMove.to);
    let isHangingBlunder = false;
    let refutationCaptureSan = '';

    if (freeCaptures.length > 0 && !givesCheckmate) {
      for (const cap of freeCaptures) {
        // Sim capture to see if user has recaptures
        const simAfterCap = new Chess(chess.fen());
        simAfterCap.move(cap.san);
        const userRecaptures = simAfterCap.moves({ verbose: true }).filter((m) => m.to === playedMove.to);
        if (userRecaptures.length === 0) {
          isHangingBlunder = true;
          refutationCaptureSan = cap.san;
          break;
        }
      }
    }

    // Validate if move matches the verified solution sequence or target moves
    let isCorrect = false;
    let opponentReplySan: string | undefined = undefined;
    let opponentReplyFen: string | undefined = undefined;

    if (solutionSequence.length > stepIndex) {
      const expectedStep = solutionSequence[stepIndex];
      const cleanExpected = expectedStep.userMove.replace(/[+#?!]/g, '').trim();
      isCorrect =
        cleanPlayed === cleanExpected ||
        uci === expectedStep.userMove ||
        targetMoves.some((m) => m.replace(/[+#?!]/g, '').trim() === cleanPlayed || m === uci);

      if (isCorrect && expectedStep.opponentReply) {
        opponentReplySan = expectedStep.opponentReply;
        const compMove = chess.move(expectedStep.opponentReply);
        if (compMove) {
          opponentReplyFen = chess.fen();
        }
      }
    } else {
      isCorrect = targetMoves.some(
        (m) => m.replace(/[+#?!]/g, '').trim() === cleanPlayed || m.trim() === uci
      );
    }

    // TRUTH GATE: A hanging blunder can NEVER be considered correct!
    if (isHangingBlunder && !isCorrect) {
      return {
        isLegal: true,
        isSuccess: false,
        verdict: 'HANGING_PIECE',
        playedSan,
        resultingFen: chess.fen(),
        isCheck: givesCheck,
        isCheckmate: false,
        explanation: `Blunder! You played ${playedSan}, but Black can simply respond with ${refutationCaptureSan} capturing your ${playedMove.piece === 'n' ? 'knight' : playedMove.piece === 'r' ? 'rook' : playedMove.piece === 'b' ? 'bishop' : playedMove.piece === 'q' ? 'queen' : 'piece'} for free!`,
        isSequenceComplete: false,
      };
    }

    // Determine accurate, truthful verdict
    let verdict: MoveVerdict = 'INACCURACY';
    if (isCorrect) {
      if (givesCheckmate) verdict = 'CHECKMATE';
      else if (exercise.conceptKey === 'FORK') verdict = 'DECISIVE_FORK';
      else if (exercise.conceptKey === 'PIN') verdict = 'DECISIVE_PIN';
      else if (exercise.conceptKey === 'SKEWER') verdict = 'DECISIVE_SKEWER';
      else verdict = 'TACTICAL_WIN';
    } else if (givesCheck) {
      verdict = 'PREMATURE_CHECK';
    } else if (isHangingBlunder) {
      verdict = 'HANGING_PIECE';
    } else {
      verdict = 'MISCALCULATION';
    }

    const isSequenceComplete = isCorrect && (stepIndex >= solutionSequence.length - 1 || !opponentReplySan);

    // Truthful pedagogical explanation
    let explanation = isCorrect
      ? exercise.explanation
      : givesCheck
      ? `You gave check with ${playedSan}, but check alone does not win material here. Look for a forcing tactical combination.`
      : 'Not quite the best move. Check king safety and calculate opponent forcing replies.';

    if (!isCorrect && exercise.commonMistakes) {
      try {
        const mistakes = JSON.parse(exercise.commonMistakes);
        if (mistakes[cleanPlayed] || mistakes[uci]) {
          explanation = mistakes[cleanPlayed] || mistakes[uci];
        }
      } catch {
        // Fallback to default
      }
    }

    return {
      isLegal: true,
      isSuccess: isCorrect,
      verdict,
      playedSan,
      resultingFen: chess.fen(),
      isCheck: givesCheck,
      isCheckmate: givesCheckmate,
      explanation,
      opponentReplySan,
      opponentReplyFen,
      nextStepIndex: isCorrect && !isSequenceComplete ? stepIndex + 1 : undefined,
      isSequenceComplete,
    };
  }
}
