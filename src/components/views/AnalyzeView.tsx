import React, { useState, useMemo } from 'react';
import { Chess, Square } from 'chess.js';
import { Chessboard, ArrowGuideItem } from '../chess/Chessboard';
import {
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  RotateCw,
  Copy,
  Check,
  Brain,
  HelpCircle,
  Lightbulb,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { playMoveSound, playCaptureSound, playCheckSound } from '../../lib/chess/soundEffects';

interface AnalyzeGame {
  id: string;
  title: string;
  subtitle: string;
  white: string;
  black: string;
  opening: string;
  pgn: string;
}

const FEATURED_ANALYSIS_GAMES: AnalyzeGame[] = [
  {
    id: 'centre-game',
    title: 'Centre Game: Dynamic Opening & Tactics',
    subtitle: 'Centre Game Accepted: Normal Variation',
    white: 'JuanayCarlos (539)',
    black: 'vittalacharya (546)',
    opening: 'Centre Game (C22)',
    pgn: '1. e4 e5 2. d4 exd4 3. Qxd4 Nc6 4. Qd1 Nf6 5. Bg5 h6 6. Bxf6 Qxf6 7. Nc3 Bb4 8. Qd2 d6 9. Nf3 O-O',
  },
  {
    id: 'morphy-opera',
    title: 'Morphy’s Opera House Masterpiece',
    subtitle: 'Paul Morphy vs Duke of Brunswick & Count Isouard (Paris 1858)',
    white: 'Paul Morphy (2700)',
    black: 'Duke & Count (1800)',
    opening: 'Philidor Defense',
    pgn: '1. e4 e5 2. Nf3 d6 3. d4 Bg4 4. dxe5 Bxf3 5. Qxf3 dxe5 6. Bc4 Nf6 7. Qb3 Qe7 8. Nc3 c6 9. Bg5 b5 10. Nxb5 cxb5 11. Bxb5+ Nbd7 12. O-O-O Rd8 13. Rxd7 Rxd7 14. Rd1 Qe6 15. Bxd7+ Nxd7 16. Qb8+ Nxb8 17. Rd8#',
  },
  {
    id: 'sigma-tactics',
    title: 'Pin & Outpost Exploitation',
    subtitle: 'Cadet Grandmaster Tactical Drill',
    white: 'Grandmaster Sigma (2650)',
    black: 'Cadet Challenger (1450)',
    opening: 'Italian Game Tactics',
    pgn: '1. e4 e5 2. Nf3 Nc6 3. Bc4 Nf6 4. d4 exd4 5. O-O Nxe4 6. Re1 d5 7. Bxd5 Qxd5 8. Nc3 Qa5 9. Nxe4 Be6 10. Neg5 O-O-O',
  },
];

interface MoveStep {
  ply: number;
  san: string;
  fen: string;
  from: string;
  to: string;
  color: 'w' | 'b';
  classification: 'BOOK' | 'BEST' | 'EXCELLENT' | 'GOOD' | 'INACCURACY' | 'MISTAKE' | 'BLUNDER';
  evalStr: string;
  commentary: string;
  whyDetails: string;
  arrows?: ArrowGuideItem[];
}

export const AnalyzeView: React.FC = () => {
  const [selectedGameIdx, setSelectedGameIdx] = useState(0);
  const [currentPly, setCurrentPly] = useState(0);
  const [orientation, setOrientation] = useState<'white' | 'black'>('white');
  const [copiedFen, setCopiedFen] = useState(false);
  const [customPgnInput, setCustomPgnInput] = useState('');
  const [showPgnInput, setShowPgnInput] = useState(false);
  const [showWhyDeatils, setShowWhyDetails] = useState(false);

  const currentGame = FEATURED_ANALYSIS_GAMES[selectedGameIdx];

  // Parse moves from PGN into rich analysis steps
  const steps: MoveStep[] = useMemo(() => {
    const c = new Chess();
    const result: MoveStep[] = [
      {
        ply: 0,
        san: 'Start',
        fen: c.fen(),
        from: '',
        to: '',
        color: 'w',
        classification: 'BOOK',
        evalStr: '0.0',
        commentary: 'Initial tournament board setup. White has the first move.',
        whyDetails: 'Both players possess equal central influence, piece development, and King safety.',
      },
    ];

    try {
      c.loadPgn(currentGame.pgn);
      const history = c.history({ verbose: true });
      const stepper = new Chess();

      history.forEach((m, idx) => {
        stepper.move(m);
        const plyNum = idx + 1;

        // Classify move pedagogically
        let classification: MoveStep['classification'] = 'GOOD';
        let evalStr = '+0.2';
        let commentary = `Standard move ${m.san}.`;
        let whyDetails = 'Maintaining standard piece harmony and spatial control.';
        let arrows: ArrowGuideItem[] = [];

        if (idx === 0) {
          classification = 'BOOK';
          evalStr = '+0.3';
          commentary = 'King’s Pawn Opening (1. e4). Seizes control of central squares d5 and f5 and opens paths for Queen and Bishop.';
          whyDetails = '1. e4 stakes immediate claim to the center while preparing rapid development for the light-square bishop and queen.';
          arrows = [{ from: 'e2', to: 'e4', color: 'emerald' }];
        } else if (idx === 1) {
          classification = 'BOOK';
          evalStr = '+0.2';
          commentary = 'Symmetrical response (1... e5). Contests White’s center and mirrors White’s diagonal scope.';
          whyDetails = 'Prevents White from claiming both e4 and d4 unopposed.';
          arrows = [{ from: 'e7', to: 'e5', color: 'emerald' }];
        } else if (m.san === 'd4') {
          classification = 'BEST';
          evalStr = '+0.5';
          commentary = 'Centre Game strike! Directly challenging Black’s central foothold immediately on move 2.';
          whyDetails = 'Forces Black to make a decision: capture on d4 or permit White a dominant two-pawn center.';
          arrows = [{ from: 'd2', to: 'd4', color: 'emerald' }];
        } else if (m.san === 'exd4') {
          classification = 'BEST';
          evalStr = '+0.4';
          commentary = 'Standard capture. Surrendering the pawn allows Black active piece play.';
          whyDetails = 'Defending e5 with d6 or Nc6 would lead to cramped positions or early Queen exchanges.';
        } else if (m.san === 'Qxd4') {
          classification = 'INACCURACY';
          evalStr = '0.0';
          commentary = 'Early Queen excursion. The Queen is exposed to harassment by Black’s minor pieces.';
          whyDetails = 'General Rule: Developing the Queen too early allows the opponent to develop minor pieces with tempo by attacking her.';
          arrows = [{ from: 'd1', to: 'd4', color: 'amber' }];
        } else if (m.san === 'Nc6') {
          classification = 'BEST';
          evalStr = '-0.3';
          commentary = 'Tempo gain! Developing the Knight while simultaneously threatening White’s Queen on d4.';
          whyDetails = 'Black accomplishes two vital opening goals in one turn: developing a piece and forcing White to spend time retreating.';
          arrows = [{ from: 'c6', to: 'd4', color: 'emerald' }];
        } else if (m.san.includes('#')) {
          classification = 'BEST';
          evalStr = '#';
          commentary = 'Checkmate! The enemy King is suffocated with no legal avenues of escape.';
          whyDetails = 'The culmination of complete piece coordination, open attacking files, and undefended king weaknesses.';
          arrows = [{ from: m.from, to: m.to, color: 'crimson' }];
        } else if (m.captured) {
          classification = 'EXCELLENT';
          evalStr = '+1.1';
          commentary = `Tactical exchange: ${m.san}. Capitalizing on tactical tension.`;
          whyDetails = 'Removing key defenders weakens the opponent’s king shield and increases piece activity.';
          arrows = [{ from: m.from, to: m.to, color: 'crimson' }];
        }

        result.push({
          ply: plyNum,
          san: m.san,
          fen: stepper.fen(),
          from: m.from,
          to: m.to,
          color: m.color,
          classification,
          evalStr,
          commentary,
          whyDetails,
          arrows,
        });
      });
    } catch (e) {
      console.warn('PGN parse error', e);
    }

    return result;
  }, [currentGame]);

  const currentStep = steps[Math.min(currentPly, steps.length - 1)] || steps[0];

  const handleNextPly = () => {
    if (currentPly < steps.length - 1) {
      setCurrentPly((prev) => prev + 1);
      playMoveSound();
    }
  };

  const handlePrevPly = () => {
    if (currentPly > 0) {
      setCurrentPly((prev) => prev - 1);
      playMoveSound();
    }
  };

  const handleFirstPly = () => {
    setCurrentPly(0);
    playMoveSound();
  };

  const handleLastPly = () => {
    setCurrentPly(steps.length - 1);
    playMoveSound();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5D0C5] pb-6">
        <div>
          <div className="text-[11px] uppercase font-semibold tracking-widest text-[#315C45] mb-1">
            Game Analysis & Deep Review
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#171717]">
            Tactical Analysis Board
          </h1>
          <p className="text-xs sm:text-sm text-[#171717]/70 max-w-2xl mt-1">
            Deconstruct games move-by-move. Learn why specific candidate moves succeed, understand positional imbalances, and receive Cadet Coach explanations.
          </p>
        </div>

        {/* Game Presets */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-[#E8E3D8] p-1 border border-[#D5D0C5] rounded text-xs">
            {FEATURED_ANALYSIS_GAMES.map((g, idx) => (
              <button
                key={g.id}
                onClick={() => {
                  setSelectedGameIdx(idx);
                  setCurrentPly(0);
                }}
                className={`py-1 px-3 rounded font-medium transition-colors ${
                  selectedGameIdx === idx
                    ? 'bg-[#315C45] text-white font-semibold'
                    : 'text-[#171717]/70 hover:text-[#171717]'
                }`}
              >
                {g.id === 'centre-game' ? 'Centre Game' : g.id === 'morphy-opera' ? 'Morphy Opera' : 'Tactics'}
              </button>
            ))}
          </div>

          <button
            onClick={() => {
              navigator.clipboard.writeText(currentStep.fen);
              setCopiedFen(true);
              setTimeout(() => setCopiedFen(false), 2000);
            }}
            className="py-1.5 px-3 bg-[#F5F1E8] hover:bg-[#E8E3D8] border border-[#D5D0C5] text-xs font-semibold rounded text-[#171717] transition-colors flex items-center gap-1.5"
            title="Copy FEN position"
          >
            {copiedFen ? <Check className="w-3.5 h-3.5 text-[#315C45]" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedFen ? 'Copied' : 'FEN'}</span>
          </button>
        </div>
      </div>

      {/* Two-Column Split Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Tournament Chessboard */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[500px]">
            <Chessboard
              fen={currentStep.fen}
              orientation={orientation}
              interactive={false}
              arrowGuide={currentStep.arrows || []}
              showToolbar={true}
              className="shadow-sm"
            />
          </div>

          {/* Stepper Controls */}
          <div className="w-full max-w-[500px] mt-4 flex items-center justify-between bg-[#E8E3D8] p-2 border border-[#D5D0C5] rounded">
            <div className="flex items-center gap-1">
              <button
                onClick={handleFirstPly}
                disabled={currentPly === 0}
                className="p-1.5 hover:bg-[#F5F1E8] rounded disabled:opacity-30 text-[#171717]"
                title="First Move"
              >
                <ChevronsLeft className="w-4 h-4" />
              </button>
              <button
                onClick={handlePrevPly}
                disabled={currentPly === 0}
                className="p-1.5 hover:bg-[#F5F1E8] rounded disabled:opacity-30 text-[#171717]"
                title="Previous Move"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>

            <div className="text-xs font-mono font-semibold text-[#171717]">
              Move {Math.ceil(currentPly / 2)} / {Math.ceil((steps.length - 1) / 2)} (Ply {currentPly})
            </div>

            <div className="flex items-center gap-1">
              <button
                onClick={handleNextPly}
                disabled={currentPly === steps.length - 1}
                className="p-1.5 hover:bg-[#F5F1E8] rounded disabled:opacity-30 text-[#171717]"
                title="Next Move"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                onClick={handleLastPly}
                disabled={currentPly === steps.length - 1}
                className="p-1.5 hover:bg-[#F5F1E8] rounded disabled:opacity-30 text-[#171717]"
                title="Last Move"
              >
                <ChevronsRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Right: Cadet Coach Move Commentary & Grandmaster Breakdown */}
        <div className="lg:col-span-5 space-y-6">
          {/* Active Move Plaque */}
          <div className="p-6 bg-[#E8E3D8]/60 border border-[#D5D0C5] rounded space-y-4">
            <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-2">
              <div className="flex items-center gap-2">
                <Brain className="w-4 h-4 text-[#315C45]" />
                <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                  Cadet Coach Analysis
                </span>
              </div>
              <span
                className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${
                  currentStep.classification === 'BEST' || currentStep.classification === 'EXCELLENT'
                    ? 'border-[#315C45] bg-[#315C45]/10 text-[#315C45]'
                    : currentStep.classification === 'INACCURACY' || currentStep.classification === 'MISTAKE'
                    ? 'border-[#C7A45D] bg-[#C7A45D]/10 text-[#C7A45D]'
                    : currentStep.classification === 'BLUNDER'
                    ? 'border-[#B94A48] bg-[#B94A48]/10 text-[#B94A48]'
                    : 'border-[#D5D0C5] bg-[#F5F1E8] text-[#171717]'
                }`}
              >
                {currentStep.classification} ({currentStep.evalStr})
              </span>
            </div>

            <div className="flex items-center gap-3">
              <span className="text-2xl font-bold font-mono text-[#315C45]">
                {currentStep.san}
              </span>
              <span className="text-xs text-[#171717]/60">
                {currentStep.color === 'w' ? 'White move' : 'Black response'}
              </span>
            </div>

            <p className="text-xs text-[#171717] leading-relaxed bg-[#F5F1E8] p-3 border border-[#D5D0C5] rounded">
              {currentStep.commentary}
            </p>

            {/* WHY? Trigger & Deeper Pedagogical Rationale */}
            <div className="pt-2 border-t border-[#D5D0C5]">
              <button
                onClick={() => setShowWhyDetails(!showWhyDeatils)}
                className="text-xs font-bold text-[#315C45] hover:underline uppercase tracking-wider flex items-center gap-1"
              >
                <span>WHY THIS MOVE MATTERS</span>
                <HelpCircle className="w-3.5 h-3.5" />
              </button>

              {showWhyDeatils && (
                <div className="mt-2 text-xs text-[#171717]/80 leading-relaxed bg-[#F5F1E8] p-3 border border-[#D5D0C5] rounded">
                  {currentStep.whyDetails}
                </div>
              )}
            </div>
          </div>

          {/* Complete Move Tree / Algebraic Navigation */}
          <div className="p-5 bg-[#F5F1E8] border border-[#D5D0C5] rounded space-y-3">
            <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                Game Notation Sequence
              </span>
              <span className="text-[11px] font-mono text-[#171717]/60">
                {currentGame.white} vs {currentGame.black}
              </span>
            </div>

            <div className="flex flex-wrap gap-1.5 max-h-48 overflow-y-auto text-xs font-mono py-1">
              {steps.slice(1).map((step, idx) => {
                const isSelected = currentPly === step.ply;
                const isWhite = step.color === 'w';
                const moveNum = Math.floor(idx / 2) + 1;

                return (
                  <button
                    key={step.ply}
                    onClick={() => {
                      setCurrentPly(step.ply);
                      playMoveSound();
                    }}
                    className={`py-1 px-2 rounded transition-colors ${
                      isSelected
                        ? 'bg-[#315C45] text-white font-bold'
                        : 'bg-[#E8E3D8] hover:bg-[#D5D0C5] text-[#171717]'
                    }`}
                  >
                    {isWhite && <span className="opacity-60 mr-1">{moveNum}.</span>}
                    <span>{step.san}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
