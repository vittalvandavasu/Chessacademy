import { Chess, Square, Move } from 'chess.js';

export interface BoardSquareInfo {
  square: Square;
  piece: {
    type: 'p' | 'n' | 'b' | 'r' | 'q' | 'k';
    color: 'w' | 'b';
  } | null;
}

export class ChessEngine {
  private instance: Chess;

  constructor(fen?: string) {
    this.instance = new Chess(fen);
  }

  public get fen(): string {
    return this.instance.fen();
  }

  public get turn(): 'w' | 'b' {
    return this.instance.turn();
  }

  public get isCheck(): boolean {
    return this.instance.inCheck();
  }

  public get isCheckmate(): boolean {
    return this.instance.isCheckmate();
  }

  public get isDraw(): boolean {
    return this.instance.isDraw();
  }

  public get isStalemate(): boolean {
    return this.instance.isStalemate();
  }

  public get isGameOver(): boolean {
    return this.instance.isGameOver();
  }

  public reset(fen?: string): void {
    if (fen) {
      this.instance.load(fen);
    } else {
      this.instance.reset();
    }
  }

  public load(fen: string): boolean {
    try {
      this.instance.load(fen);
      return true;
    } catch {
      return false;
    }
  }

  public getLegalMoves(square?: Square): Move[] {
    try {
      if (square) {
        return this.instance.moves({ square, verbose: true });
      }
      return this.instance.moves({ verbose: true });
    } catch {
      return [];
    }
  }

  public getLegalDestinations(square: Square): Square[] {
    const moves = this.getLegalMoves(square);
    return moves.map(m => m.to as Square);
  }

  public makeMove(from: Square, to: Square, promotion: 'q' | 'r' | 'b' | 'n' = 'q'): Move | null {
    try {
      return this.instance.move({
        from,
        to,
        promotion,
      });
    } catch {
      return null;
    }
  }

  public makeSanMove(san: string): Move | null {
    try {
      return this.instance.move(san);
    } catch {
      return null;
    }
  }

  public undo(): Move | null {
    return this.instance.undo();
  }

  public getPiece(square: Square) {
    return this.instance.get(square);
  }

  public getHistory(): string[] {
    return this.instance.history();
  }

  public getPgn(): string {
    return this.instance.pgn();
  }

  public loadPgn(pgn: string): boolean {
    try {
      this.instance.loadPgn(pgn);
      return true;
    } catch {
      return false;
    }
  }

  public isPromotionMove(from: Square, to: Square): boolean {
    const piece = this.getPiece(from);
    if (!piece || piece.type !== 'p') return false;
    return (piece.color === 'w' && to[1] === '8') || (piece.color === 'b' && to[1] === '1');
  }

  public getKingSquare(color: 'w' | 'b'): Square | null {
    const board = this.instance.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece && piece.type === 'k' && piece.color === color) {
          const file = String.fromCharCode('a'.charCodeAt(0) + c);
          const rank = 8 - r;
          return `${file}${rank}` as Square;
        }
      }
    }
    return null;
  }

  public static isSquareValid(square: string): square is Square {
    return /^[a-h][1-8]$/.test(square);
  }

  public static getFileAndRank(square: Square): { file: string; rank: number } {
    return {
      file: square[0],
      rank: parseInt(square[1], 10),
    };
  }

  public static areMovesEqual(m1: string, m2: string): boolean {
    const clean = (s: string) => s.replace(/[+#?!]/g, '').trim();
    return clean(m1) === clean(m2);
  }
}
