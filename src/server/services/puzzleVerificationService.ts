import { Chess, Square, PieceSymbol } from 'chess.js';
import { ChessTruthEngine, PIECE_VALUES } from './chessTruthEngine';

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
    motifVerified?: boolean;
    motifFeedback?: string;
  };
}

export class PuzzleVerificationService {
  /**
   * Rigorous, first-principles verification pipeline for chess exercises and puzzles.
   * Independently computes attacks, motifs, piece safety, and continuation validity.
   */
  public static verifyExercise(exercise: {
    fen: string;
    targetMoves: string[];
    conceptKey?: string;
    exerciseType?: string;
    solutionSequence?: { userMove: string; opponentReply?: string; explanation?: string }[];
    difficulty?: number;
  }): VerificationResult {
    const errors: string[] = [];
    const warnings: string[] = [];
    let chess: Chess;

    // 1. FEN Syntax & Board Legality
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
    const isInitialCheck = chess.inCheck();

    // 2. Position Status (game must not already be over)
    if (legalMoves.length === 0) {
      errors.push('Game is already over (checkmate or stalemate) in the starting position.');
    }

    // 3. Solution legality
    const validMoves: string[] = [];
    for (const moveStr of exercise.targetMoves) {
      const sim = new Chess(exercise.fen);
      let res = null;
      try {
        res = sim.move(moveStr);
      } catch {
        res = null;
      }
      if (!res || res.captured === 'k') {
        errors.push(`Target move "${moveStr}" is illegal in position ${exercise.fen}`);
      } else {
        validMoves.push(res.san);
      }
    }

    // 4. Multi-step sequence legality & continuation calculation
    let finalSim = new Chess(exercise.fen);
    const initialMaterial = ChessTruthEngine.calculateMaterialBalance(finalSim, turn);

    if (exercise.solutionSequence && exercise.solutionSequence.length > 0) {
      for (let i = 0; i < exercise.solutionSequence.length; i++) {
        const step = exercise.solutionSequence[i];
        let uMove = null;
        try {
          uMove = finalSim.move(step.userMove);
        } catch {
          uMove = null;
        }

        if (!uMove || uMove.captured === 'k') {
          errors.push(`Sequence step ${i + 1} user move "${step.userMove}" is illegal.`);
          break;
        }

        if (step.opponentReply) {
          let oMove = null;
          try {
            oMove = finalSim.move(step.opponentReply);
          } catch {
            oMove = null;
          }
          if (!oMove || oMove.captured === 'k') {
            errors.push(`Sequence step ${i + 1} opponent reply "${step.opponentReply}" is illegal.`);
            break;
          }
        }
      }
    } else if (validMoves[0]) {
      finalSim.move(validMoves[0]);
    }

    const finalMaterial = ChessTruthEngine.calculateMaterialBalance(finalSim, turn);
    const materialDelta = finalMaterial - initialMaterial;
    const leadsToCheckmate = finalSim.isCheckmate();

    // 5. Tactical Motif & Truth Verification
    const firstMoveStr = exercise.targetMoves[0];
    let motifVerified = true;
    let motifFeedback = '';

    if (firstMoveStr && validMoves.includes(firstMoveStr)) {
      const afterFirstMove = new Chess(exercise.fen);
      const mObj = afterFirstMove.move(firstMoveStr)!;

      // Check if move hangs a piece WITHOUT compensation
      const oppReplies = afterFirstMove.moves({ verbose: true });
      const freeCaptures = oppReplies.filter((r) => r.to === mObj.to);

      let isHangingUncompensated = false;
      if (freeCaptures.length > 0 && !afterFirstMove.isCheckmate()) {
        for (const cap of freeCaptures) {
          const simCap = new Chess(afterFirstMove.fen());
          simCap.move(cap.san);
          const recaptures = simCap.moves({ verbose: true }).filter((rec) => rec.to === mObj.to);

          if (recaptures.length === 0) {
            const materialAfterOppCap = ChessTruthEngine.calculateMaterialBalance(simCap, turn);
            const hasMatingThreat = ChessTruthEngine.hasMatingThreat(finalSim, turn);
            const isSoundSacrifice =
              exercise.conceptKey === 'SACRIFICE' &&
              (leadsToCheckmate || hasMatingThreat || materialDelta > 0);

            if (!leadsToCheckmate && materialDelta <= 0 && !isSoundSacrifice) {
              isHangingUncompensated = true;
              errors.push(
                `Hanging piece: Target move ${firstMoveStr} blunders the piece. Opponent can play ${cap.san} capturing it for free with no verified compensation.`
              );
              break;
            }
          }
        }
      }

      // Check specific tactical concepts
      const concept = exercise.conceptKey;

      if (concept === 'FORK') {
        const forkCheck = this.verifyForkConcept(exercise.fen, mObj, afterFirstMove, turn, materialDelta, leadsToCheckmate);
        if (!forkCheck.isValid) {
          errors.push(forkCheck.reason);
          motifVerified = false;
        } else {
          motifFeedback = forkCheck.reason;
        }
      } else if (concept === 'PIN') {
        const pinCheck = this.verifyPinConcept(exercise.fen, mObj, afterFirstMove, turn, materialDelta, leadsToCheckmate);
        if (!pinCheck.isValid) {
          errors.push(pinCheck.reason);
          motifVerified = false;
        } else {
          motifFeedback = pinCheck.reason;
        }
      } else if (concept === 'SKEWER') {
        const skewerCheck = this.verifySkewerConcept(exercise.fen, mObj, afterFirstMove, turn, materialDelta, leadsToCheckmate);
        if (!skewerCheck.isValid) {
          errors.push(skewerCheck.reason);
          motifVerified = false;
        } else {
          motifFeedback = skewerCheck.reason;
        }
      } else if (concept === 'CHECKMATE' || (concept === 'BACK_RANK_MATE' && exercise.exerciseType === 'FIND_THE_CHECKMATE')) {
        const mateCheck = this.verifyCheckmateConcept(exercise.fen, mObj, afterFirstMove, leadsToCheckmate, concept === 'BACK_RANK_MATE');
        if (!mateCheck.isValid) {
          errors.push(mateCheck.reason);
          motifVerified = false;
        } else {
          motifFeedback = mateCheck.reason;
        }
      } else if (concept === 'DISCOVERED_ATTACK') {
        const discCheck = this.verifyDiscoveredAttack(exercise.fen, mObj, afterFirstMove, turn);
        if (!discCheck.isValid) {
          errors.push(discCheck.reason);
          motifVerified = false;
        } else {
          motifFeedback = discCheck.reason;
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
        isCheck: isInitialCheck,
        isCheckmate: chess.isCheckmate(),
        motifVerified,
        motifFeedback,
      },
    };
  }

  // --- SPECIFIC TACTICAL VERIFIERS ---

  private static verifyForkConcept(
    initialFen: string,
    moveObj: any,
    afterMove: Chess,
    playerColor: 'w' | 'b',
    materialDelta: number,
    leadsToMate: boolean
  ): { isValid: boolean; reason: string } {
    // Moved piece attacks:
    const attackedSquares = ChessTruthEngine.getAttackedSquares(
      afterMove,
      moveObj.to,
      moveObj.piece,
      playerColor
    );

    const enemyTargets: { square: Square; type: string; val: number }[] = [];
    for (const sq of attackedSquares) {
      const p = afterMove.get(sq);
      if (p && p.color !== playerColor) {
        enemyTargets.push({ square: sq, type: p.type, val: PIECE_VALUES[p.type] || 0 });
      }
    }

    if (enemyTargets.length < 2) {
      return {
        isValid: false,
        reason: `Not a fork: Move ${moveObj.san} attacks only ${enemyTargets.length} enemy piece(s) (${enemyTargets.map((t) => t.type + '@' + t.square).join(', ') || 'none'}). A fork requires attacking >= 2 targets.`,
      };
    }

    // Check if targets are meaningful (e.g. not just 2 pawns where both are defended and 0 material is won)
    const hasKingTarget = enemyTargets.some((t) => t.type === 'k');
    const hasHighValueTarget = enemyTargets.some((t) => t.val >= 3);
    const netGain = leadsToMate || materialDelta > 0;

    if (!hasKingTarget && !hasHighValueTarget && !netGain) {
      return {
        isValid: false,
        reason: `Fake fork: The attacked targets are low value (pawns) and the move produces no tactical material gain.`,
      };
    }

    // Check if opponent can simply move one piece to defend the other and save both
    const oppMoves = afterMove.moves({ verbose: true });
    // If king in check, opponent must respond to check
    if (!hasKingTarget) {
      let canDefendBoth = false;
      for (const op of oppMoves) {
        const testSim = new Chess(afterMove.fen());
        testSim.move(op.san);
        const playerReplies = testSim.moves({ verbose: true });
        const canStillCaptureTarget = playerReplies.some(
          (pr) => pr.from === moveObj.to && enemyTargets.some((t) => t.square === pr.to)
        );
        if (!canStillCaptureTarget) {
          canDefendBoth = true;
          break;
        }
      }

      if (canDefendBoth && !netGain) {
        return {
          isValid: false,
          reason: `Fake fork: Opponent can respond with a single defensive move that saves both attacked pieces without loss.`,
        };
      }
    }

    return { isValid: true, reason: `Valid fork attacking ${enemyTargets.length} targets: ${enemyTargets.map((t) => t.type + '@' + t.square).join(', ')}` };
  }

  private static verifyPinConcept(
    initialFen: string,
    moveObj: any,
    afterMove: Chess,
    playerColor: 'w' | 'b',
    materialDelta: number,
    leadsToMate: boolean
  ): { isValid: boolean; reason: string } {
    const analysis = ChessTruthEngine.analyzePosition(afterMove);
    const initialAnalysis = ChessTruthEngine.analyzePosition(new Chess(initialFen));
    const enemyColor = playerColor === 'w' ? 'b' : 'w';

    // 1. Check if the moved piece itself DELIVERS an absolute or relative pin
    const pieceOnTo = afterMove.get(moveObj.to);
    const isRayPiece = pieceOnTo && (pieceOnTo.type === 'b' || pieceOnTo.type === 'r' || pieceOnTo.type === 'q');

    let createdPin = false;
    let createdPinDescription = '';

    if (isRayPiece) {
      // Check absolute pin delivered by this piece
      const absPinDelivered = analysis.pinnedPieces.find((p) => {
        if (p.pinningPiece !== moveObj.to) return false;
        const pinnedPiece = afterMove.get(p.square);
        if (!pinnedPiece || pinnedPiece.color !== enemyColor) return false;
        // A vertical pin on a pawn does not immobilize the pawn along the file
        if (pinnedPiece.type === 'p' && p.square[0] === moveObj.to[0]) {
          return false;
        }
        return true;
      });
      if (absPinDelivered) {
        createdPin = true;
        createdPinDescription = `Delivered absolute pin on ${absPinDelivered.square} to King.`;
      } else {
        // Check relative pin delivered by this piece
        const relPinDelivered = this.findRelativePinFromPiece(afterMove, moveObj.to, playerColor);
        if (relPinDelivered) {
          createdPin = true;
          createdPinDescription = relPinDelivered;
        }
      }
    }

    if (createdPin) {
      return { isValid: true, reason: `Verified pin: ${createdPinDescription}` };
    }

    // 2. Check if the move EXPLOITS an existing pin present in initialFen
    const enemyPinsBefore = initialAnalysis.pinnedPieces.filter((p) => {
      const piece = new Chess(initialFen).get(p.square);
      return piece && piece.color === enemyColor;
    });

    const exploitedPin = enemyPinsBefore.find((p) => p.square === moveObj.to);
    if (exploitedPin) {
      return { isValid: true, reason: `Verified exploitation of pinned piece on ${exploitedPin.square}.` };
    }

    // Also check if moved piece attacks an already pinned piece (piling pressure)
    const attackedSquares = ChessTruthEngine.getAttackedSquares(afterMove, moveObj.to, moveObj.piece, playerColor);
    const attackingPinnedPiece = enemyPinsBefore.find((p) => attackedSquares.includes(p.square));
    if (attackingPinnedPiece) {
      return { isValid: true, reason: `Verified piling pressure on pinned piece on ${attackingPinnedPiece.square}.` };
    }

    // 3. Check unpinning move
    const friendlyPinsBefore = initialAnalysis.pinnedPieces.filter((p) => {
      const piece = new Chess(initialFen).get(p.square);
      return piece && piece.color === playerColor;
    });
    const friendlyPinsAfter = analysis.pinnedPieces.filter((p) => {
      const piece = afterMove.get(p.square);
      return piece && piece.color === playerColor;
    });

    if (friendlyPinsBefore.length > friendlyPinsAfter.length) {
      return { isValid: true, reason: `Verified unpinning defensive move.` };
    }

    return {
      isValid: false,
      reason: `Fake pin: Move ${moveObj.san} does not create a pin, nor exploit a pinned piece, nor unpin a friendly piece.`,
    };
  }

  private static findRelativePinFromPiece(chess: Chess, fromSq: Square, playerColor: 'w' | 'b'): string | null {
    const enemyColor = playerColor === 'w' ? 'b' : 'w';
    const piece = chess.get(fromSq);
    if (!piece || piece.color !== playerColor) return null;

    const dirs: [number, number][] = [];
    if (piece.type === 'b' || piece.type === 'q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    if (piece.type === 'r' || piece.type === 'q') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);

    const startFile = fromSq.charCodeAt(0) - 97;
    const startRank = parseInt(fromSq[1], 10) - 1;

    for (const [df, dr] of dirs) {
      let curF = startFile + df;
      let curR = startRank + dr;
      const piecesOnRay: { sq: Square; type: string; color: string; val: number }[] = [];

      while (curF >= 0 && curF < 8 && curR >= 0 && curR < 8) {
        const raySq = `${String.fromCharCode(97 + curF)}${curR + 1}` as Square;
        const p = chess.get(raySq);
        if (p) {
          piecesOnRay.push({ sq: raySq, type: p.type, color: p.color, val: PIECE_VALUES[p.type] || 0 });
        }
        curF += df;
        curR += dr;
      }

      if (
        piecesOnRay.length >= 2 &&
        piecesOnRay[0].color === enemyColor &&
        piecesOnRay[1].color === enemyColor &&
        piecesOnRay[1].type !== 'k' &&
        (piecesOnRay[1].type === 'q' || piecesOnRay[1].type === 'r') &&
        piecesOnRay[1].val > piecesOnRay[0].val
      ) {
        return `${piece.type.toUpperCase()} on ${fromSq} relatively pins ${piecesOnRay[0].type} on ${piecesOnRay[0].sq} to ${piecesOnRay[1].type} on ${piecesOnRay[1].sq}`;
      }
    }
    return null;
  }

  private static findRelativePin(chess: Chess, playerColor: 'w' | 'b'): string | null {
    const enemyColor = playerColor === 'w' ? 'b' : 'w';
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    // For all friendly line pieces (b, r, q)
    for (const f of files) {
      for (const r of ranks) {
        const sq = `${f}${r}` as Square;
        const p = chess.get(sq);
        if (!p || p.color !== playerColor) continue;
        if (p.type !== 'b' && p.type !== 'r' && p.type !== 'q') continue;

        const dirs: [number, number][] = [];
        if (p.type === 'b' || p.type === 'q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
        if (p.type === 'r' || p.type === 'q') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);

        const startFile = f.charCodeAt(0) - 97;
        const startRank = parseInt(r, 10) - 1;

        for (const [df, dr] of dirs) {
          let curF = startFile + df;
          let curR = startRank + dr;
          const piecesOnRay: { sq: Square; type: string; color: string; val: number }[] = [];

          while (curF >= 0 && curF < 8 && curR >= 0 && curR < 8) {
            const raySq = `${String.fromCharCode(97 + curF)}${curR + 1}` as Square;
            const piece = chess.get(raySq);
            if (piece) {
              piecesOnRay.push({ sq: raySq, type: piece.type, color: piece.color, val: PIECE_VALUES[piece.type] || 0 });
            }
            curF += df;
            curR += dr;
          }

          if (
            piecesOnRay.length >= 2 &&
            piecesOnRay[0].color === enemyColor &&
            piecesOnRay[1].color === enemyColor &&
            piecesOnRay[1].type !== 'k' &&
            (piecesOnRay[1].type === 'q' || piecesOnRay[1].type === 'r') &&
            piecesOnRay[1].val > piecesOnRay[0].val
          ) {
            return `${p.type.toUpperCase()} on ${sq} relatively pins ${piecesOnRay[0].type} on ${piecesOnRay[0].sq} to ${piecesOnRay[1].type} on ${piecesOnRay[1].sq}`;
          }
        }
      }
    }
    return null;
  }

  private static verifySkewerConcept(
    initialFen: string,
    moveObj: any,
    afterMove: Chess,
    playerColor: 'w' | 'b',
    materialDelta: number,
    leadsToMate: boolean
  ): { isValid: boolean; reason: string } {
    const enemyColor = playerColor === 'w' ? 'b' : 'w';
    const isRayPiece = moveObj.piece === 'r' || moveObj.piece === 'b' || moveObj.piece === 'q';
    if (!isRayPiece && !leadsToMate && materialDelta <= 0) {
      return { isValid: false, reason: `Not a skewer: Skewers require line pieces (Rook, Bishop, Queen).` };
    }

    // Check rays from moved piece
    const file = moveObj.to.charCodeAt(0) - 97;
    const rank = parseInt(moveObj.to[1], 10) - 1;

    const dirs: [number, number][] = [];
    if (moveObj.piece === 'r' || moveObj.piece === 'q') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    if (moveObj.piece === 'b' || moveObj.piece === 'q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

    let foundSkewer = false;
    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      const piecesOnRay: { sq: Square; type: string; color: string; val: number }[] = [];

      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        const sq = `${String.fromCharCode(97 + f)}${r + 1}` as Square;
        const p = afterMove.get(sq);
        if (p) {
          piecesOnRay.push({ sq, type: p.type, color: p.color, val: PIECE_VALUES[p.type] || 0 });
        }
        f += df;
        r += dr;
      }

      if (piecesOnRay.length >= 2 && piecesOnRay[0].color === enemyColor && piecesOnRay[1].color === enemyColor) {
        // High value or King in front, lower value behind
        if (piecesOnRay[0].type === 'k' || piecesOnRay[0].val > piecesOnRay[1].val) {
          foundSkewer = true;
          break;
        }
      }
    }

    if (!foundSkewer && !leadsToMate && materialDelta <= 0) {
      return {
        isValid: false,
        reason: `Not a skewer: No ray alignment with high-value piece in front and target behind found from ${moveObj.to}.`,
      };
    }

    return { isValid: true, reason: `Verified skewer.` };
  }

  private static verifyCheckmateConcept(
    initialFen: string,
    moveObj: any,
    afterMove: Chess,
    leadsToMate: boolean,
    isBackRank: boolean
  ): { isValid: boolean; reason: string } {
    if (moveObj.captured === 'k') {
      return { isValid: false, reason: 'Illegal move: Kings cannot be captured.' };
    }

    if (!afterMove.inCheck() && !leadsToMate) {
      return { isValid: false, reason: `Move ${moveObj.san} does not deliver check or mate.` };
    }

    if (!afterMove.isCheckmate() && !leadsToMate) {
      // Check why it's not mate
      const escapes = afterMove.moves({ verbose: true });
      return {
        isValid: false,
        reason: `Fake mate: Opponent is in check but has ${escapes.length} legal move(s) to escape, block, or capture (${escapes.map((e) => e.san).slice(0, 3).join(', ')}).`,
      };
    }

    if (isBackRank) {
      // Verify king is on 8th or 1st rank
      const enemyKingSq = afterMove.turn() === 'b'
        ? ChessTruthEngine['findKingSquare'](afterMove, 'b')
        : ChessTruthEngine['findKingSquare'](afterMove, 'w');

      if (!enemyKingSq) {
        return { isValid: false, reason: 'Not a back-rank mate: King not found on the board.' };
      }

      if (enemyKingSq[1] !== '8' && enemyKingSq[1] !== '1') {
        return { isValid: false, reason: `Not a back-rank mate: King is on rank ${enemyKingSq[1]}, not the back rank.` };
      }
    }

    return { isValid: true, reason: `Verified checkmate.` };
  }

  private static verifyDiscoveredAttack(
    initialFen: string,
    moveObj: any,
    afterMove: Chess,
    playerColor: 'w' | 'b'
  ): { isValid: boolean; reason: string } {
    const enemyColor = playerColor === 'w' ? 'b' : 'w';
    const vacatedSq = moveObj.from as Square;
    const vFile = vacatedSq.charCodeAt(0) - 97;
    const vRank = parseInt(vacatedSq[1], 10) - 1;

    // A discovered attack MUST fire through the square that was vacated (moveObj.from)
    const directions: [number, number, PieceSymbol[]][] = [
      [1, 0, ['r', 'q']],
      [-1, 0, ['r', 'q']],
      [0, 1, ['r', 'q']],
      [0, -1, ['r', 'q']],
      [1, 1, ['b', 'q']],
      [1, -1, ['b', 'q']],
      [-1, 1, ['b', 'q']],
      [-1, -1, ['b', 'q']],
    ];

    let verifiedDiscovered = false;

    for (const [df, dr, allowedTypes] of directions) {
      // Step backwards from vacatedSq to find the friendly discovering line piece
      let bf = vFile - df;
      let br = vRank - dr;
      let discoveringPieceSq: Square | null = null;

      while (bf >= 0 && bf < 8 && br >= 0 && br < 8) {
        const sq = `${String.fromCharCode(97 + bf)}${br + 1}` as Square;
        const p = afterMove.get(sq);
        if (p) {
          if (p.color === playerColor && allowedTypes.includes(p.type)) {
            discoveringPieceSq = sq;
          }
          break; // ray ends at first piece encountered
        }
        bf -= df;
        br -= dr;
      }

      if (!discoveringPieceSq) continue;

      // Step forwards from vacatedSq through to find the enemy target
      let ff = vFile + df;
      let fr = vRank + dr;

      while (ff >= 0 && ff < 8 && fr >= 0 && fr < 8) {
        const targetSq = `${String.fromCharCode(97 + ff)}${fr + 1}` as Square;
        const targetPiece = afterMove.get(targetSq);

        if (targetPiece) {
          if (targetPiece.color === enemyColor) {
            // Target found along the unobstructed ray passing through vacatedSq!
            verifiedDiscovered = true;
          }
          break; // ray ends at first piece encountered
        }
        ff += df;
        fr += dr;
      }

      if (verifiedDiscovered) break;
    }

    if (!verifiedDiscovered) {
      return {
        isValid: false,
        reason: `Not a discovered attack: The move did not unmask an unobstructed line attack from behind ${vacatedSq} against any enemy target.`,
      };
    }

    return { isValid: true, reason: `Verified discovered attack firing through ${vacatedSq}.` };
  }
}
