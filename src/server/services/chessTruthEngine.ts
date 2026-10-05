import { Chess, Square, PieceSymbol, Color } from 'chess.js';

export interface AttackMap {
  square: Square;
  piece: { type: PieceSymbol; color: Color } | null;
  attackedByWhite: Square[];
  attackedByBlack: Square[];
  isDefended: boolean;
  isHanging: boolean;
}

export interface ComprehensiveAttackAnalysis {
  attackMap: Map<Square, AttackMap>;
  whiteKingEscapes: Square[];
  blackKingEscapes: Square[];
  whiteCheckingPieces: Square[];
  blackCheckingPieces: Square[];
  pinnedPieces: { square: Square; pinnedTo: Square; pinningPiece: Square; isAbsolute: boolean }[];
}

export const PIECE_VALUES: Record<PieceSymbol, number> = {
  p: 1,
  n: 3,
  b: 3,
  r: 5,
  q: 9,
  k: 100,
};

export class ChessTruthEngine {
  /**
   * Independently computes complete attack map, defended/undefended status,
   * checking lines, and king escape squares.
   */
  public static analyzePosition(chess: Chess): ComprehensiveAttackAnalysis {
    const attackMap = new Map<Square, AttackMap>();
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    // Initialize all 64 squares
    for (const f of files) {
      for (const r of ranks) {
        const sq = `${f}${r}` as Square;
        const p = chess.get(sq);
        attackMap.set(sq, {
          square: sq,
          piece: p ? { type: p.type, color: p.color } : null,
          attackedByWhite: [],
          attackedByBlack: [],
          isDefended: false,
          isHanging: false,
        });
      }
    }

    // Populate attacks from each piece
    for (const f of files) {
      for (const r of ranks) {
        const sq = `${f}${r}` as Square;
        const piece = chess.get(sq);
        if (!piece) continue;

        const attackedSquares = this.getAttackedSquares(chess, sq, piece.type, piece.color);
        for (const targetSq of attackedSquares) {
          const targetEntry = attackMap.get(targetSq);
          if (targetEntry) {
            if (piece.color === 'w') {
              targetEntry.attackedByWhite.push(sq);
            } else {
              targetEntry.attackedByBlack.push(sq);
            }
          }
        }
      }
    }

    // Determine defended & hanging status
    for (const [, entry] of attackMap.entries()) {
      if (!entry.piece) continue;
      const defenders = entry.piece.color === 'w' ? entry.attackedByWhite : entry.attackedByBlack;
      const attackers = entry.piece.color === 'w' ? entry.attackedByBlack : entry.attackedByWhite;

      entry.isDefended = defenders.length > 0;
      entry.isHanging = attackers.length > 0 && defenders.length === 0;
    }

    // Calculate King Escape Squares
    const whiteKingSq = this.findKingSquare(chess, 'w');
    const blackKingSq = this.findKingSquare(chess, 'b');

    const whiteKingEscapes: Square[] = whiteKingSq
      ? this.calculateKingEscapes(chess, whiteKingSq, 'w', attackMap)
      : [];
    const blackKingEscapes: Square[] = blackKingSq
      ? this.calculateKingEscapes(chess, blackKingSq, 'b', attackMap)
      : [];

    // Checking pieces
    const whiteCheckingPieces: Square[] = whiteKingSq
      ? attackMap.get(whiteKingSq)?.attackedByBlack || []
      : [];
    const blackCheckingPieces: Square[] = blackKingSq
      ? attackMap.get(blackKingSq)?.attackedByWhite || []
      : [];

    // Pinned pieces
    const pinnedPieces = this.findPinnedPieces(chess);

    return {
      attackMap,
      whiteKingEscapes,
      blackKingEscapes,
      whiteCheckingPieces,
      blackCheckingPieces,
      pinnedPieces,
    };
  }

  public static getAttackedSquares(
    chess: Chess,
    fromSq: Square,
    type: PieceSymbol,
    color: Color
  ): Square[] {
    const file = fromSq.charCodeAt(0) - 97;
    const rank = parseInt(fromSq[1], 10) - 1;
    const result: Square[] = [];

    const toSq = (f: number, r: number): Square | null => {
      if (f >= 0 && f < 8 && r >= 0 && r < 8) {
        return `${String.fromCharCode(97 + f)}${r + 1}` as Square;
      }
      return null;
    };

    if (type === 'p') {
      const dir = color === 'w' ? 1 : -1;
      const left = toSq(file - 1, rank + dir);
      const right = toSq(file + 1, rank + dir);
      if (left) result.push(left);
      if (right) result.push(right);
      return result;
    }

    if (type === 'n') {
      const deltas = [
        [1, 2], [2, 1], [-1, 2], [-2, 1],
        [1, -2], [2, -1], [-1, -2], [-2, -1],
      ];
      for (const [df, dr] of deltas) {
        const sq = toSq(file + df, rank + dr);
        if (sq) result.push(sq);
      }
      return result;
    }

    if (type === 'k') {
      for (let df = -1; df <= 1; df++) {
        for (let dr = -1; dr <= 1; dr++) {
          if (df !== 0 || dr !== 0) {
            const sq = toSq(file + df, rank + dr);
            if (sq) result.push(sq);
          }
        }
      }
      return result;
    }

    // Ray pieces: Bishop, Rook, Queen
    const dirs: [number, number][] = [];
    if (type === 'b' || type === 'q') {
      dirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);
    }
    if (type === 'r' || type === 'q') {
      dirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
    }

    for (const [df, dr] of dirs) {
      let f = file + df;
      let r = rank + dr;
      while (f >= 0 && f < 8 && r >= 0 && r < 8) {
        const sq = toSq(f, r);
        if (sq) {
          result.push(sq);
          if (chess.get(sq)) break; // ray obstructed by piece
        }
        f += df;
        r += dr;
      }
    }

    return result;
  }

  private static findKingSquare(chess: Chess, color: Color): Square | null {
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];
    for (const f of files) {
      for (const r of ranks) {
        const sq = `${f}${r}` as Square;
        const p = chess.get(sq);
        if (p && p.type === 'k' && p.color === color) {
          return sq;
        }
      }
    }
    return null;
  }

  private static calculateKingEscapes(
    chess: Chess,
    kingSq: Square,
    kingColor: Color,
    attackMap: Map<Square, AttackMap>
  ): Square[] {
    const file = kingSq.charCodeAt(0) - 97;
    const rank = parseInt(kingSq[1], 10) - 1;
    const escapes: Square[] = [];

    for (let df = -1; df <= 1; df++) {
      for (let dr = -1; dr <= 1; dr++) {
        if (df === 0 && dr === 0) continue;
        const f = file + df;
        const r = rank + dr;
        if (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const destSq = `${String.fromCharCode(97 + f)}${r + 1}` as Square;
          const occ = chess.get(destSq);
          // King cannot land on square occupied by friendly piece
          if (occ && occ.color === kingColor) continue;

          // King cannot land on square attacked by enemy
          const entry = attackMap.get(destSq);
          const enemyAttackers = kingColor === 'w' ? entry?.attackedByBlack : entry?.attackedByWhite;
          if (enemyAttackers && enemyAttackers.length > 0) continue;

          escapes.push(destSq);
        }
      }
    }

    return escapes;
  }

  private static findPinnedPieces(chess: Chess): { square: Square; pinnedTo: Square; pinningPiece: Square; isAbsolute: boolean }[] {
    const pinned: { square: Square; pinnedTo: Square; pinningPiece: Square; isAbsolute: boolean }[] = [];
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    // Check absolute pins against both Kings
    for (const color of ['w', 'b'] as Color[]) {
      const kingSq = this.findKingSquare(chess, color);
      if (!kingSq) continue;
      const kf = kingSq.charCodeAt(0) - 97;
      const kr = parseInt(kingSq[1], 10) - 1;

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

      for (const [df, dr, pinningTypes] of directions) {
        let f = kf + df;
        let r = kr + dr;
        let candidatePinned: Square | null = null;

        while (f >= 0 && f < 8 && r >= 0 && r < 8) {
          const sq = `${String.fromCharCode(97 + f)}${r + 1}` as Square;
          const piece = chess.get(sq);

          if (piece) {
            if (!candidatePinned) {
              if (piece.color === color) {
                candidatePinned = sq; // friendly piece in the line
              } else {
                break; // enemy piece directly adjacent, not a pin
              }
            } else {
              // We already have a candidate pinned piece. Is this an enemy line attacker?
              if (piece.color !== color && pinningTypes.includes(piece.type)) {
                pinned.push({
                  square: candidatePinned,
                  pinnedTo: kingSq,
                  pinningPiece: sq,
                  isAbsolute: true,
                });
              }
              break; // ray ends
            }
          }
          f += df;
          r += dr;
        }
      }
    }

    return pinned;
  }

  /**
   * Evaluates material balance delta for a side from FEN position
   */
  public static calculateMaterialBalance(chess: Chess, forColor: Color): number {
    let balance = 0;
    const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
    const ranks = ['1', '2', '3', '4', '5', '6', '7', '8'];

    for (const f of files) {
      for (const r of ranks) {
        const sq = `${f}${r}` as Square;
        const p = chess.get(sq);
        if (p) {
          const val = PIECE_VALUES[p.type] || 0;
          if (p.color === forColor) {
            balance += val;
          } else {
            balance -= val;
          }
        }
      }
    }
    return balance;
  }

  /**
   * Checks if attackingColor has a decisive mating threat against defending replies.
   */
  public static hasMatingThreat(chess: Chess, attackingColor: Color): boolean {
    const defendingMoves = chess.moves();
    if (defendingMoves.length === 0) return chess.isCheckmate();

    let mateCount = 0;
    for (const defMove of defendingMoves) {
      const sim = new Chess(chess.fen());
      try {
        sim.move(defMove);
      } catch {
        continue;
      }
      const attackReplies = sim.moves();
      if (attackReplies.some((m) => m.includes('#'))) {
        mateCount++;
      }
    }
    return mateCount > 0;
  }
}
