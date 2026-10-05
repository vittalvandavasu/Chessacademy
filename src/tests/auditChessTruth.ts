import { Chess } from 'chess.js';
import { CURRICULUM_DATA } from '../data/curriculumData';
import { PUZZLES_DATA } from '../data/puzzlesData';

interface AuditIssue {
  id: string;
  source: 'curriculum' | 'puzzles';
  concept: string;
  fen: string;
  targetMoves: string[];
  issues: string[];
}

const pieceValues: Record<string, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

function auditExercise(
  ex: any,
  source: 'curriculum' | 'puzzles'
): AuditIssue | null {
  const issues: string[] = [];

  // 1. FEN validity
  let chess: Chess;
  try {
    chess = new Chess(ex.fen);
  } catch (err: any) {
    return {
      id: ex.id,
      source,
      concept: ex.concept,
      fen: ex.fen,
      targetMoves: ex.targetMoves || [],
      issues: [`Invalid FEN: ${err.message}`],
    };
  }

  const turn = chess.turn();

  // 2. Target moves legality & evaluation
  for (const moveStr of ex.targetMoves || []) {
    const sim = new Chess(ex.fen);
    let moveObj = null;
    try {
      moveObj = sim.move(moveStr);
    } catch (e: any) {
      issues.push(`Target move "${moveStr}" threw error: ${e.message}`);
      continue;
    }

    if (!moveObj) {
      issues.push(`Target move "${moveStr}" is ILLEGAL in position ${ex.fen}`);
      continue;
    }

    const movedTo = moveObj.to;
    const movedPiece = moveObj.piece;

    // Check if the moving piece can be immediately captured by opponent
    const opponentMoves = sim.moves({ verbose: true });
    const capturingOpponentMoves = opponentMoves.filter((m) => m.to === movedTo);

    if (capturingOpponentMoves.length > 0) {
      // Opponent can capture the piece on movedTo
      // Check if it's protected or if capturing opponent piece is of higher/lower value
      const captureStr = capturingOpponentMoves.map((m) => m.san).join(', ');
      
      // If move gave check, only legal captures can be played
      // Check if opponent can just capture and escape:
      // If opponent captures with a pawn or piece of equal/lower value:
      for (const cap of capturingOpponentMoves) {
        const capturerVal = pieceValues[cap.piece] || 1;
        const movedPieceVal = pieceValues[movedPiece] || 1;
        
        // Sim the capture
        const simAfterCapture = new Chess(sim.fen());
        simAfterCapture.move(cap.san);
        
        // Can player recapture?
        const playerRecaptures = simAfterCapture.moves({ verbose: true }).filter((m) => m.to === movedTo);
        
        if (playerRecaptures.length === 0) {
          // Check if this is a recognized theoretical opening gambit (e.g. Queen's Gambit c4)
          const isTheoreticalGambit = (ex.concept === 'QUEENS_GAMBIT' || ex.concept === 'GAMBIT') && movedPiece === 'p';
          if (!isTheoreticalGambit) {
            issues.push(
              `BLUNDER/HANGING PIECE: After ${moveStr}, opponent can simply play ${cap.san} (${cap.from}->${cap.to}) capturing the ${movedPiece} for free!`
            );
          }
        } else if (capturerVal < movedPieceVal) {
          // Captured by lesser value piece (e.g. Knight captured by Pawn)
          issues.push(
            `UNFAVORABLE TRADE: After ${moveStr}, opponent can play ${cap.san} trading a ${cap.piece} (${capturerVal} pts) for the ${movedPiece} (${movedPieceVal} pts).`
          );
        }
      }
    }

    // Concept specific truth check
    if (ex.concept === 'FORK') {
      // Verify fork: does the moved piece attack >= 2 enemy pieces/targets?
      // Attacked squares from movedTo
      const attacksFromTarget = getSquaresAttackedByPiece(movedPiece, movedTo, sim);
      const enemyPiecesAttacked: { square: string; type: string; color: string }[] = [];

      for (const sq of attacksFromTarget) {
        const p = sim.get(sq as any);
        if (p && p.color !== turn) {
          enemyPiecesAttacked.push({ square: sq, type: p.type, color: p.color });
        }
      }

      if (enemyPiecesAttacked.length < 2) {
        issues.push(
          `NOT A FORK: Move ${moveStr} lands on ${movedTo} which only attacks ${enemyPiecesAttacked.length} enemy piece(s): [${enemyPiecesAttacked.map((x) => x.type + '@' + x.square).join(', ')}]. A fork requires attacking >= 2 pieces.`
        );
      }
    }

    if (ex.concept === 'SKEWER') {
      // Skewer: line attack against piece with another piece behind it on same line
      // The moved piece must attack a piece along a ray that extends to another piece
      // Or move must deliver check where king is in front of another piece
      const rayCheck = checkSkewerRay(sim, movedPiece, movedTo, turn);
      if (!rayCheck.isSkewer) {
        issues.push(`NOT A SKEWER: Move ${moveStr} does not create a verified line skewer: ${rayCheck.reason}`);
      }
    }

    if (ex.concept === 'BACK_RANK_MATE') {
      // Must deliver check along 8th or 1st rank against king with trapped pawns
      if (!sim.inCheck()) {
        issues.push(`BACK_RANK_MATE: Move ${moveStr} does not give check or mate.`);
      }
    }
  }

  // 3. Multi-step solutionSequence legality
  if (ex.solutionSequence && ex.solutionSequence.length > 0) {
    const simSeq = new Chess(ex.fen);
    ex.solutionSequence.forEach((step: any, idx: number) => {
      const u = simSeq.move(step.userMove);
      if (!u) {
        issues.push(`Sequence step ${idx + 1} userMove "${step.userMove}" is ILLEGAL.`);
      } else if (step.opponentReply) {
        const o = simSeq.move(step.opponentReply);
        if (!o) {
          issues.push(`Sequence step ${idx + 1} opponentReply "${step.opponentReply}" is ILLEGAL.`);
        }
      }
    });
  }

  if (issues.length > 0) {
    return {
      id: ex.id,
      source,
      concept: ex.concept,
      fen: ex.fen,
      targetMoves: ex.targetMoves || [],
      issues,
    };
  }

  return null;
}

function getSquaresAttackedByPiece(pieceType: string, fromSquare: string, chess: Chess): string[] {
  const file = fromSquare.charCodeAt(0) - 97;
  const rank = parseInt(fromSquare[1], 10) - 1;
  const attacked: string[] = [];

  const toSq = (f: number, r: number) => {
    if (f >= 0 && f < 8 && r >= 0 && r < 8) {
      return String.fromCharCode(97 + f) + (r + 1);
    }
    return null;
  };

  if (pieceType === 'n') {
    const knightDeltas = [
      [1, 2], [2, 1], [-1, 2], [-2, 1],
      [1, -2], [2, -1], [-1, -2], [-2, -1]
    ];
    for (const [df, dr] of knightDeltas) {
      const sq = toSq(file + df, rank + dr);
      if (sq) attacked.push(sq);
    }
  } else if (pieceType === 'p') {
    const dir = chess.turn() === 'b' ? 1 : -1; // piece just moved, turn switched!
    const left = toSq(file - 1, rank + dir);
    const right = toSq(file + 1, rank + dir);
    if (left) attacked.push(left);
    if (right) attacked.push(right);
  } else {
    // For rook, bishop, queen, king - use rays
    const dirs: number[][] = [];
    if (pieceType === 'r' || pieceType === 'q') {
      dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    }
    if (pieceType === 'b' || pieceType === 'q') {
      dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }
    if (pieceType === 'k') {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df !== 0 || dr !== 0) {
            const sq = toSq(file + df, rank + dr);
            if (sq) attacked.push(sq);
          }
        }
      }
      return attacked;
    }

    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        const sq = String.fromCharCode(97 + f) + (r + 1);
        attacked.push(sq);
        if (chess.get(sq as any)) break; // ray blocked
        f += df;
        r += dr;
      }
    }
  }

  return attacked;
}

function checkSkewerRay(chess: Chess, pieceType: string, fromSquare: string, movingColor: string): { isSkewer: boolean; reason: string } {
  const file = fromSquare.charCodeAt(0) - 97;
  const rank = parseInt(fromSquare[1], 10) - 1;
  const dirs: number[][] = [];
  if (pieceType === 'r' || pieceType === 'q') dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
  if (pieceType === 'b' || pieceType === 'q') dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

  let foundRay = false;
  for (const [df, dr] of dirs) {
    let f = file + df;
    let r = rank + dr;
    const piecesOnRay: { square: string; type: string; color: string }[] = [];
    while (f >= 0 && f < 8 && r >= 0 && r < 8) {
      const sq = String.fromCharCode(97 + f) + (r + 1);
      const piece = chess.get(sq as any);
      if (piece) {
        piecesOnRay.push({ square: sq, type: piece.type, color: piece.color });
      }
      f += df;
      r += dr;
    }

    if (piecesOnRay.length >= 2 && piecesOnRay[0].color !== movingColor && piecesOnRay[1].color !== movingColor) {
      // Enemy piece in front, enemy piece behind
      const frontVal = pieceValues[piecesOnRay[0].type] || 0;
      const rearVal = pieceValues[piecesOnRay[1].type] || 0;
      if (frontVal >= rearVal || piecesOnRay[0].type === 'k') {
        foundRay = true;
        break;
      }
    }
  }

  if (foundRay) return { isSkewer: true, reason: 'Line skewer verified.' };
  return { isSkewer: false, reason: 'No ray with high-value piece in front and piece behind found.' };
}

// RUN AUDIT
console.log('=== AUDITING CHESS TRUTH ACROSS ENTIRE APPLICATION ===\n');

const allCurriculumExercises: any[] = [];
for (const path of CURRICULUM_DATA) {
  for (const mod of path.modules) {
    for (const les of mod.lessons) {
      for (const sec of les.sections) {
        for (const ex of sec.exercises) {
          allCurriculumExercises.push(ex);
        }
      }
    }
  }
}

console.log(`Total Curriculum Exercises: ${allCurriculumExercises.length}`);
console.log(`Total Tactical Puzzles: ${PUZZLES_DATA.length}`);

const failedCurriculum: AuditIssue[] = [];
for (const ex of allCurriculumExercises) {
  const res = auditExercise(ex, 'curriculum');
  if (res) failedCurriculum.push(res);
}

const failedPuzzles: AuditIssue[] = [];
for (const puz of PUZZLES_DATA) {
  const res = auditExercise(puz, 'puzzles');
  if (res) failedPuzzles.push(res);
}

console.log('\n--- CURRICULUM AUDIT RESULTS ---');
console.log(`Failed Exercises: ${failedCurriculum.length} / ${allCurriculumExercises.length}`);
for (const f of failedCurriculum) {
  console.log(`\n[FAIL] ID: ${f.id} (${f.concept})`);
  console.log(`  FEN: ${f.fen}`);
  console.log(`  TargetMoves: ${JSON.stringify(f.targetMoves)}`);
  for (const iss of f.issues) {
    console.log(`  -> ${iss}`);
  }
}

console.log('\n--- PUZZLE BANK AUDIT RESULTS ---');
console.log(`Failed Puzzles: ${failedPuzzles.length} / ${PUZZLES_DATA.length}`);
for (const f of failedPuzzles) {
  console.log(`\n[FAIL] ID: ${f.id} (${f.concept})`);
  console.log(`  FEN: ${f.fen}`);
  console.log(`  TargetMoves: ${JSON.stringify(f.targetMoves)}`);
  for (const iss of f.issues) {
    console.log(`  -> ${iss}`);
  }
}
