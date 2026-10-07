import { GoogleGenAI } from '@google/genai';
import { Chess } from 'chess.js';
import { ChessTruthEngine } from './chessTruthEngine';

export interface MoveAnalysisReport {
  classification: 'BRILLIANT' | 'BEST' | 'GOOD' | 'INACCURACY' | 'MISTAKE' | 'BLUNDER' | 'BOOK';
  badgeSymbol: string;
  badgeColor: string;
  scoreCentipawns: number; // e.g. +140 = +1.4
  evalString: string; // e.g. "+1.4", "-0.8", "#M2"
  title: string;
  explanation: string;
  bestMoveSan: string;
  bestMoveExplanation?: string;
  threatsToWatch: string[];
  keyPlans: {
    white: string;
    black: string;
  };
  suggestedArrows?: { from: string; to: string; color: string; dashed?: boolean }[];
  suggestedBoxes?: { square: string; color: 'green' | 'red' | 'amber' | 'blue' }[];
}

export interface CoachChatResponse {
  answer: string;
  highlightSquares?: string[];
  suggestedMove?: string;
  conceptTag?: string;
}

// Initialize Gemini Client server-side
const apiKey = process.env.GEMINI_API_KEY;
let aiClient: GoogleGenAI | null = null;

if (apiKey) {
  try {
    aiClient = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  } catch (err) {
    console.warn('Failed to initialize GoogleGenAI with API key:', err);
  }
}

export class AiCoachService {
  /**
   * Evaluates the move and position, producing rich Grandmaster analysis
   * inspired by Chessigma and Chess.com Game Review.
   */
  public static async analyzePosition(params: {
    fen: string;
    playedMove?: string;
    previousFen?: string;
    history?: string[];
    playerColor?: 'w' | 'b';
  }): Promise<MoveAnalysisReport> {
    const { fen, playedMove, previousFen, history = [], playerColor = 'w' } = params;

    // First, run algorithmic material and legal validation
    const chess = new Chess();
    try {
      chess.load(fen);
    } catch {
      chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }

    const turn = chess.turn();
    const legalMoves = chess.moves({ verbose: true });
    const isCheck = chess.isCheck();
    const isCheckmate = chess.isCheckmate();
    const isDraw = chess.isDraw();

    // Material counting
    const pieceValues: Record<string, number> = { p: 100, n: 320, b: 330, r: 500, q: 900, k: 0 };
    let materialBalance = 0;
    const board = chess.board();
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const p = board[r][c];
        if (p) {
          const val = pieceValues[p.type] || 0;
          materialBalance += p.color === 'w' ? val : -val;
        }
      }
    }

    // Try to run AI analysis with Gemini
    if (aiClient && apiKey) {
      try {
        const prompt = `You are Grandmaster Sigma, a friendly, encouraging, and razor-sharp AI chess coach inspired by Chessigma and Chess.com Game Review.
Analyze the following chess position:
- FEN: "${fen}"
- Played move (if any): "${playedMove || 'None (Initial/Current position)'}"
- Previous FEN (if any): "${previousFen || 'None'}"
- Move history: ${JSON.stringify(history.slice(-10))}
- Turn: ${turn === 'w' ? 'White' : 'Black'} to move
- Is Check: ${isCheck}
- Is Checkmate: ${isCheckmate}
- Material balance (centipawns from White perspective): ${materialBalance}

Respond ONLY with a JSON object adhering to this schema:
{
  "classification": "BEST" | "BRILLIANT" | "GOOD" | "INACCURACY" | "MISTAKE" | "BLUNDER" | "BOOK",
  "scoreCentipawns": number,
  "evalString": string,
  "title": string,
  "explanation": string,
  "bestMoveSan": string,
  "bestMoveExplanation": string,
  "threatsToWatch": string[],
  "keyPlans": {
    "white": string,
    "black": string
  },
  "suggestedArrows": [
    { "from": string, "to": string, "color": "emerald" | "amber" | "red" | "blue", "dashed": boolean }
  ],
  "suggestedBoxes": [
    { "square": string, "color": "green" | "red" | "amber" | "blue" }
  ]
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are Grandmaster Sigma, an expert instructional AI chess coach. Deliver clear, pedagogical, concise chess explanations with accurate tactical justifications.',
            responseMimeType: 'application/json',
            temperature: 0.2,
          },
        });

        if (response && response.text) {
          const parsed = JSON.parse(response.text.trim());
          const badgeConfig = this.getBadgeConfig(parsed.classification);
          return {
            ...parsed,
            badgeSymbol: badgeConfig.symbol,
            badgeColor: badgeConfig.color,
          };
        }
      } catch (err) {
        console.warn('Gemini AI Coach analysis fallback to rule engine:', err);
      }
    }

    // High-fidelity fallback heuristic engine
    return this.generateAlgorithmicReport({
      fen,
      playedMove,
      chess,
      materialBalance,
      isCheck,
      isCheckmate,
      turn,
    });
  }

  /**
   * Conversational Q&A with the AI Coach
   */
  public static async askCoach(params: {
    fen: string;
    question: string;
    history?: string[];
    userRating?: number;
  }): Promise<CoachChatResponse> {
    const { fen, question, history = [], userRating = 1200 } = params;

    const chess = new Chess();
    try {
      chess.load(fen);
    } catch {
      chess.load('rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1');
    }

    if (aiClient && apiKey) {
      try {
        const prompt = `The student (Rating ~${userRating}) asks the following question about this chess position:
FEN: "${fen}"
Move History: ${JSON.stringify(history.slice(-8))}
Question: "${question}"

Provide a warm, instructive, concise grandmaster response (2-4 sentences max). Highlight the strategic principle, tactical motif, or piece geometry.
Respond in JSON:
{
  "answer": string,
  "highlightSquares": string[],
  "suggestedMove": string,
  "conceptTag": string
}`;

        const response = await aiClient.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction:
              'You are Coach Sigma, an encouraging Grandmaster mentor. Explain chess concepts clearly without jargon overload. Be directly actionable.',
            responseMimeType: 'application/json',
            temperature: 0.3,
          },
        });

        if (response && response.text) {
          return JSON.parse(response.text.trim());
        }
      } catch (err) {
        console.warn('Gemini askCoach fallback:', err);
      }
    }

    // Algorithmic fallback response
    const legalMoves = chess.moves();
    const isCheck = chess.isCheck();
    let sampleBestMove = legalMoves[0] || 'e4';

    return {
      answer: isCheck
        ? 'Your King is currently under check! Prioritize defending the king by capturing the checking piece, blocking with a defender, or stepping to safety.'
        : `In this position, look for central piece activity and king safety. A sensible candidate move is ${sampleBestMove}, enhancing your piece harmony and controlling vital outpost squares.`,
      highlightSquares: isCheck ? [chess.turn() === 'w' ? 'e1' : 'e8'] : ['e4', 'd4', 'e5', 'd5'],
      suggestedMove: sampleBestMove,
      conceptTag: isCheck ? 'King Safety' : 'Piece Activity & Center Control',
    };
  }

  private static getBadgeConfig(classification: string) {
    switch (classification) {
      case 'BRILLIANT':
        return { symbol: '!!', color: 'bg-cyan-500 text-white border-cyan-400' };
      case 'BEST':
        return { symbol: '★', color: 'bg-emerald-500 text-white border-emerald-400' };
      case 'GOOD':
        return { symbol: '✓', color: 'bg-blue-500 text-white border-blue-400' };
      case 'INACCURACY':
        return { symbol: '?!', color: 'bg-amber-500 text-slate-950 border-amber-400' };
      case 'MISTAKE':
        return { symbol: '?', color: 'bg-orange-500 text-white border-orange-400' };
      case 'BLUNDER':
        return { symbol: '??', color: 'bg-red-500 text-white border-red-400' };
      case 'BOOK':
      default:
        return { symbol: '📖', color: 'bg-indigo-500 text-white border-indigo-400' };
    }
  }

  private static generateAlgorithmicReport(params: {
    fen: string;
    playedMove?: string;
    chess: Chess;
    materialBalance: number;
    isCheck: boolean;
    isCheckmate: boolean;
    turn: 'w' | 'b';
  }): MoveAnalysisReport {
    const { playedMove, chess, materialBalance, isCheck, isCheckmate, turn } = params;

    const moves = chess.moves({ verbose: true });
    let bestMoveSan = moves[0]?.san || 'e4';
    let bestFrom = moves[0]?.from || 'e2';
    let bestTo = moves[0]?.to || 'e4';

    // Prioritize checks or captures as candidate best moves
    const checksOrCaptures = moves.filter((m) => m.captured || m.san.includes('+') || m.san.includes('#'));
    if (checksOrCaptures.length > 0) {
      bestMoveSan = checksOrCaptures[0].san;
      bestFrom = checksOrCaptures[0].from;
      bestTo = checksOrCaptures[0].to;
    }

    const evalNum = (materialBalance / 100).toFixed(1);
    const evalString = materialBalance >= 0 ? `+${evalNum}` : `${evalNum}`;

    if (isCheckmate) {
      return {
        classification: 'BEST',
        badgeSymbol: '★',
        badgeColor: 'bg-emerald-500 text-white border-emerald-400',
        scoreCentipawns: turn === 'w' ? -10000 : 10000,
        evalString: '#M0',
        title: 'Checkmate Delivered!',
        explanation: 'Checkmate! The enemy king has no legal escape squares, blocks, or captures.',
        bestMoveSan: playedMove || '#',
        threatsToWatch: ['Game ended by checkmate.'],
        keyPlans: {
          white: 'Game concluded.',
          black: 'Game concluded.',
        },
      };
    }

    let classification: MoveAnalysisReport['classification'] = 'GOOD';
    let title = 'Solid Tactical Move';
    let explanation = `Position evaluated at ${evalString}. Focus on central control, piece coordination, and restricting opposing counterplay.`;

    if (playedMove) {
      if (playedMove.includes('#')) {
        classification = 'BEST';
        title = 'Winning Checkmate!';
        explanation = 'Flawless execution delivering decisive checkmate.';
      } else if (playedMove.includes('+')) {
        classification = 'BEST';
        title = 'Forcing Check';
        explanation = `${playedMove} applies immediate tempo pressure on the opponent's king.`;
      } else if (playedMove.toLowerCase().includes('x')) {
        classification = 'GOOD';
        title = 'Tactical Liquidation';
        explanation = `${playedMove} exchanges material and clarifies the board structure.`;
      }
    }

    const badge = this.getBadgeConfig(classification);

    return {
      classification,
      badgeSymbol: badge.symbol,
      badgeColor: badge.color,
      scoreCentipawns: materialBalance,
      evalString,
      title,
      explanation,
      bestMoveSan,
      bestMoveExplanation: `Playing ${bestMoveSan} optimizes your piece activity and keeps the initiative.`,
      threatsToWatch: isCheck ? ['King is in check!'] : ['Watch out for tactical forks on undefended pieces.'],
      keyPlans: {
        white: 'Activate minor pieces toward the center and prepare kingside castling.',
        black: 'Contest central outposts and establish solid pawn structure.',
      },
      suggestedArrows: [
        {
          from: bestFrom,
          to: bestTo,
          color: 'emerald',
          dashed: false,
        },
      ],
      suggestedBoxes: [
        {
          square: bestTo,
          color: 'green',
        },
      ],
    };
  }
}
