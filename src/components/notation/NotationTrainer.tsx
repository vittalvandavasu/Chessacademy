import React, { useState, useEffect } from 'react';
import { Chessboard, ArrowGuideItem } from '../chess/Chessboard';
import {
  Volume2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  RefreshCw,
  ArrowRight,
  BookOpen,
  Sparkles,
  Award,
  ChevronRight,
  Play,
} from 'lucide-react';
import { playSuccessSound, playErrorSound, playMoveSound } from '../../lib/chess/soundEffects';

export type NotationMode =
  | 'read'
  | 'write'
  | 'listen'
  | 'error_detection'
  | 'disambiguation'
  | 'check_mate'
  | 'castling';

interface NotationExercise {
  id: string;
  mode: NotationMode;
  title: string;
  category: 'reading' | 'writing' | 'captures' | 'check' | 'disambiguation' | 'castling';
  fen: string;
  arrows?: ArrowGuideItem[];
  notationDisplay?: string; // shown in read/error mode
  spokenText?: string; // read aloud in listen mode
  prompt: string;
  conceptNote: string;
  options?: { id: string; label: string; isCorrect: boolean; explanation: string }[];
  targetSan?: string; // for write/listen modes
  acceptedSans?: string[];
  whyExplanation: string;
}

const NOTATION_DRILLS: NotationExercise[] = [
  // 1. READ MODE
  {
    id: 'read-1',
    mode: 'read',
    category: 'captures',
    title: 'Interpreting Captures: Nxe5',
    fen: 'r1bqk2r/pppp1ppp/2n5/4p3/3Pn3/2P2N2/P1P1BPPP/R1BQK2R w KQkq - 0 7',
    notationDisplay: 'Nxe5',
    prompt: 'What does the notation "Nxe5" specifically represent?',
    conceptNote: 'The uppercase letter indicates the piece type ("N" for Knight). The lowercase "x" indicates a capture. The coordinates "e5" are the destination square.',
    options: [
      {
        id: 'opt-1',
        label: 'A Knight captures an enemy piece on the e5 square.',
        isCorrect: true,
        explanation: 'Correct! "N" = Knight, "x" = captures, "e5" = destination square.',
      },
      {
        id: 'opt-2',
        label: 'A Pawn on the n-file moves to e5.',
        isCorrect: false,
        explanation: 'Incorrect. "N" designates the Knight (pawns have no piece letter), and "x" denotes a capture.',
      },
      {
        id: 'opt-3',
        label: 'A Knight moves to e5 without capturing.',
        isCorrect: false,
        explanation: 'Incorrect. A non-capturing move is written simply as Ne5 without the "x".',
      },
      {
        id: 'opt-4',
        label: 'The King captures on e5.',
        isCorrect: false,
        explanation: 'Incorrect. The King uses the uppercase symbol "K", whereas the Knight uses "N".',
      },
    ],
    whyExplanation: 'In standard FIDE algebraic notation, pieces are designated by a single capital letter (K, Q, R, B, N). The lowercase letter "x" is inserted between the piece letter and the destination square strictly when an enemy piece is removed from the board.',
  },
  {
    id: 'read-2',
    mode: 'read',
    category: 'reading',
    title: 'Pawn Move Notation: e4',
    fen: 'rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR b KQkq e3 0 1',
    notationDisplay: 'e4',
    prompt: 'Why does "e4" lack an initial capital letter?',
    conceptNote: 'In algebraic notation, pawn moves are identified solely by their destination square (or origin file on captures). No "P" is ever used.',
    options: [
      {
        id: 'opt-1',
        label: 'Pawn moves omit any piece symbol; only the destination square is written.',
        isCorrect: true,
        explanation: 'Spot on. Standard FIDE notation never uses "P". A move by a pawn to e4 is recorded merely as "e4".',
      },
      {
        id: 'opt-2',
        label: 'It is an abbreviation for Pe4 because it is move one.',
        isCorrect: false,
        explanation: 'Incorrect. "Pe4" is considered archaic or non-standard notation in modern chess literature.',
      },
      {
        id: 'opt-3',
        label: 'Because the piece is still on its home rank.',
        isCorrect: false,
        explanation: 'Incorrect. All pawn moves regardless of rank omit any capital letter.',
      },
    ],
    whyExplanation: 'Economical brevity is a core principle of algebraic notation. Because pawns make up 50% of the pieces, omitting "P" keeps scoresheets uncluttered and immediately distinguishes pawn maneuvers from piece maneuvers.',
  },

  // 2. WRITE MODE
  {
    id: 'write-1',
    mode: 'write',
    category: 'writing',
    title: 'Record White’s Developing Move',
    fen: 'rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    arrows: [{ from: 'g1', to: 'f3', color: 'emerald' }],
    prompt: 'Look at the highlighted move for White (Knight from g1 to f3). Enter the exact algebraic notation:',
    conceptNote: 'Enter the piece capital letter followed immediately by the destination square coordinates. Remember: capital letters matter!',
    targetSan: 'Nf3',
    acceptedSans: ['Nf3', 'nf3'],
    whyExplanation: 'White’s Knight develops from its starting square g1 to f3. We write the piece symbol "N" (capitalized) followed by the coordinate "f3". The origin square "g1" is NOT written because no other Knight could reach f3.',
  },
  {
    id: 'write-2',
    mode: 'write',
    category: 'captures',
    title: 'Record the Pawn Capture',
    fen: 'rnbqkbnr/ppp1pppp/8/3p4/4P3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    arrows: [{ from: 'e4', to: 'd5', color: 'crimson' }],
    prompt: 'White’s pawn on e4 captures Black’s pawn on d5. Enter the correct notation for this capture:',
    conceptNote: 'When a pawn captures, start with the pawn’s origin file (in lowercase), then "x", then the destination square.',
    targetSan: 'exd5',
    acceptedSans: ['exd5', 'ed5'],
    whyExplanation: 'Pawn captures always identify the file the pawn originated on, followed by "x" and the landing square (e.g., "exd5"). This eliminates ambiguity if White had another pawn able to capture on d5.',
  },

  // 3. LISTEN MODE
  {
    id: 'listen-1',
    mode: 'listen',
    category: 'writing',
    title: 'Audio Dictation: Master Voice',
    fen: 'r1bqkb1r/pppp1ppp/2n2n2/4p3/2B1P3/5N2/PPPP1PPP/RNBQK2R w KQkq - 4 4',
    spokenText: 'Bishop takes f7 check',
    prompt: 'Listen carefully to the coach’s dictation. Transcribe the move in standard algebraic notation:',
    conceptNote: 'Use standard symbols: "B" for Bishop, "x" for capture, "f7" for square, and "+" for check.',
    targetSan: 'Bxf7+',
    acceptedSans: ['Bxf7+', 'Bxf7', 'bxf7+'],
    whyExplanation: 'The coach dictated "Bishop takes f7 check". The piece is "B", the capture is "x", the destination is "f7", and the check must be denoted with a plus sign "+". Result: "Bxf7+".',
  },
  {
    id: 'listen-2',
    mode: 'listen',
    category: 'writing',
    title: 'Audio Dictation: Central Thrust',
    fen: 'rnbqkbnr/ppp1pppp/8/8/3pP3/8/PPPP1PPP/RNBQKBNR w KQkq - 0 2',
    spokenText: 'Knight to c3',
    prompt: 'Listen to the move spoken by Cadet Coach and enter the notation:',
    conceptNote: 'Standard move with no capture.',
    targetSan: 'Nc3',
    acceptedSans: ['Nc3', 'nc3'],
    whyExplanation: 'The Knight moves peacefully to c3 without capturing. Notation: "Nc3".',
  },

  // 4. ERROR DETECTION MODE
  {
    id: 'err-1',
    mode: 'error_detection',
    category: 'reading',
    title: 'Detect Redundant Origin Square',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/4p3/1b2P3/2NP1N2/PPP2PPP/R1BQKB1R w KQkq - 1 5',
    notationDisplay: 'Nf3xe5',
    prompt: 'A learner submitted "Nf3xe5" for a Knight capture on e5. What is fundamentally wrong with this notation?',
    conceptNote: 'Algebraic notation was designed to replace descriptive notation ("P-K4") with minimal, non-redundant coordinates.',
    options: [
      {
        id: 'opt-1',
        label: 'Standard algebraic notation does not include the origin square unless necessary for disambiguation.',
        isCorrect: true,
        explanation: 'Exactly right! Writing the origin square "f3" when only one knight can reach e5 violates standard brevity.',
      },
      {
        id: 'opt-2',
        label: 'The capture symbol "x" should be placed before the piece letter.',
        isCorrect: false,
        explanation: 'Incorrect. The capture symbol always follows the piece letter.',
      },
      {
        id: 'opt-3',
        label: 'Knights cannot capture enemy pieces on the 5th rank.',
        isCorrect: false,
        explanation: 'Incorrect. Pieces can capture anywhere legally reachable.',
      },
    ],
    whyExplanation: 'Standard FIDE algebraic notation is strictly concise: piece + [optional disambiguation] + capture symbol + destination square. Since only the knight on f3 could capture on e5, specifying "f3" is redundant and incorrect.',
  },
  {
    id: 'err-2',
    mode: 'error_detection',
    category: 'writing',
    title: 'Archaic Pawn Prefix Error',
    fen: 'rnbqkbnr/pppppppp/8/8/3P4/8/PPP1PPPP/RNBQKBNR b KQkq d3 0 1',
    notationDisplay: 'Pd4',
    prompt: 'A game record lists White’s opening move as "Pd4". What error does this contain?',
    conceptNote: 'Pawn notation rule: No piece letter ever precedes a pawn move.',
    options: [
      {
        id: 'opt-1',
        label: 'Pawns do not have an uppercase symbol letter ("P") in algebraic notation; the move must be simply "d4".',
        isCorrect: true,
        explanation: 'Spot on. Pawns are recognized solely by the absence of an initial uppercase letter.',
      },
      {
        id: 'opt-2',
        label: 'The move must be written in full as "Pawn to d4".',
        isCorrect: false,
        explanation: 'Incorrect. Full word names are never used in scoresheets.',
      },
      {
        id: 'opt-3',
        label: 'The move should have an exclamation mark by default.',
        isCorrect: false,
        explanation: 'Incorrect. Annotation symbols (!, ?) reflect subjective evaluation, not factual move legality.',
      },
    ],
    whyExplanation: 'In modern chess notation, the capital letter "P" does not exist. White playing a pawn to d4 is recorded simply as "d4".',
  },

  // 5. DISAMBIGUATION MODE
  {
    id: 'dis-1',
    mode: 'disambiguation',
    category: 'disambiguation',
    title: 'Disambiguating by File: Nbd2 vs Nfd2',
    fen: 'r1bqk2r/ppppbppp/2n2n2/4p3/4P3/2N2N2/PPPP1PPP/R1BQKB1R w KQkq - 4 4',
    arrows: [{ from: 'b1', to: 'd2', color: 'emerald' }],
    prompt: 'Both the Knight on c3 and a Knight on f3 could move to d2 (or here, White wants to move the Knight on b1 to d2 when another knight could also reach d2). How is the move written?',
    conceptNote: 'When two identical pieces can move to the same destination square, indicate the ORIGIN FILE of the moving piece immediately after the piece letter.',
    options: [
      {
        id: 'opt-1',
        label: 'Nbd2 (identifying the moving knight is from the b-file)',
        isCorrect: true,
        explanation: 'Correct! The origin file "b" disambiguates this knight from any other knight.',
      },
      {
        id: 'opt-2',
        label: 'Nd2 (standard move)',
        isCorrect: false,
        explanation: 'Incorrect! If another knight can also reach d2, Nd2 is ambiguous and illegal on a scoresheet.',
      },
      {
        id: 'opt-3',
        label: 'N1d2 (identifying the 1st rank)',
        isCorrect: false,
        explanation: 'Rule hierarchy: always disambiguate by FILE first. Rank is only used if both pieces share the same file.',
      },
    ],
    whyExplanation: 'FIDE Disambiguation Hierarchy:\n1. If pieces are on different files, specify the origin file (e.g., Nbd2 or Nfd2).\n2. If pieces are on the same file, specify the origin rank (e.g., R1e2 or R7e2).\n3. Only if both file and rank are identical (rare three-piece scenarios with promoted queens) do you specify both (e.g., Qh4e1).',
  },
  {
    id: 'dis-2',
    mode: 'disambiguation',
    category: 'disambiguation',
    title: 'Rook Disambiguation by File: Rae1',
    fen: 'r4rk1/pp1q1ppp/2n1bn2/3p4/8/2N1PN2/PPP1BPPP/R2Q1RK1 w - - 5 11',
    arrows: [{ from: 'a1', to: 'e1', color: 'emerald' }],
    prompt: 'White’s rooks are on a1 and f1. White moves the a1-rook to e1. What is the correct notation?',
    conceptNote: 'Both rooks can legally move to e1. Apply file disambiguation.',
    options: [
      {
        id: 'opt-1',
        label: 'Rae1',
        isCorrect: true,
        explanation: 'Superb! "R" = Rook, "a" = from the a-file, "e1" = destination square.',
      },
      {
        id: 'opt-2',
        label: 'Re1',
        isCorrect: false,
        explanation: 'Ambiguous! Without the "a", the arbiter cannot tell if the a1-rook or f1-rook moved.',
      },
      {
        id: 'opt-3',
        label: 'R1e1',
        isCorrect: false,
        explanation: 'Incorrect. Both rooks are on the 1st rank, so the rank does not differentiate them; the file ("a" vs "f") must be used.',
      },
    ],
    whyExplanation: 'Because the rooks stand on different files (a-file and f-file), the letter of the file must be used: Rae1 distinguishes it from Rfe1.',
  },

  // 6. CHECK / CHECKMATE
  {
    id: 'chk-1',
    mode: 'check_mate',
    category: 'check',
    title: 'Check (+) vs Checkmate (#)',
    fen: 'r1bqkb1r/pppp1ppp/2n5/4p2Q/2B1P3/8/PPPP1PPP/RNB1K1NR w KQkq - 2 4',
    arrows: [{ from: 'h5', to: 'f7', color: 'crimson' }],
    prompt: 'White plays Qxf7. The Black King is under attack with no legal moves, no blocking squares, and no defender. What symbol completes the notation?',
    conceptNote: 'Check is "+". Checkmate is "#".',
    options: [
      {
        id: 'opt-1',
        label: '# (Pound/Hash symbol for Checkmate: Qxf7#)',
        isCorrect: true,
        explanation: 'Correct! The game is decisively won; checkmate is written with "#".',
      },
      {
        id: 'opt-2',
        label: '+ (Plus symbol for Check: Qxf7+)',
        isCorrect: false,
        explanation: 'Incorrect. "+" represents regular check where the king still has legal escapes. Here the game is over.',
      },
      {
        id: 'opt-3',
        label: '++ (Double Check)',
        isCorrect: false,
        explanation: 'Historically "++" was sometimes used for checkmate or double check, but modern FIDE standards strictly prescribe "#" for checkmate.',
      },
    ],
    whyExplanation: 'Standard FIDE tournament rules: Check is always denoted with a single plus sign (+). Checkmate ends the game and is denoted with the octothorpe/hash symbol (#).',
  },

  // 7. CASTLING
  {
    id: 'cst-1',
    mode: 'castling',
    category: 'castling',
    title: 'Kingside (O-O) vs Queenside (O-O-O)',
    fen: 'r1bqk2r/pppp1ppp/2n2n2/2b1p3/2B1P3/3P1N2/PPP2PPP/RNBQK2R w KQkq - 1 5',
    arrows: [
      { from: 'e1', to: 'g1', color: 'emerald' },
      { from: 'h1', to: 'f1', color: 'emerald' },
    ],
    prompt: 'White moves their King two squares toward the h-file and the Rook hops over to f1. How is this recorded?',
    conceptNote: 'Castling uses capital letter O\'s separated by hyphens (never zeroes). Two O\'s for kingside, three O\'s for queenside.',
    options: [
      {
        id: 'opt-1',
        label: 'O-O (capital letters O, representing short/kingside castling)',
        isCorrect: true,
        explanation: 'Precisely! Kingside castling is written as "O-O".',
      },
      {
        id: 'opt-2',
        label: '0-0 (number zeroes)',
        isCorrect: false,
        explanation: 'Incorrect. Official FIDE rules specify the capital letter O, not numeric digit zero.',
      },
      {
        id: 'opt-3',
        label: 'O-O-O (long/queenside castling)',
        isCorrect: false,
        explanation: 'Incorrect. Queenside castling traverses three squares on the c-file and is written O-O-O.',
      },
      {
        id: 'opt-4',
        label: 'Kg1',
        isCorrect: false,
        explanation: 'Incorrect. Castling is a special maneuver involving two pieces and has its own dedicated symbol.',
      },
    ],
    whyExplanation: 'Castling is the only move in chess where two friendly pieces move in a single turn. Kingside (short) castling is written "O-O" (two letters). Queenside (long) castling is written "O-O-O" (three letters).',
  },
];

interface MasteryStats {
  reading: number;
  writing: number;
  captures: number;
  check: number;
  disambiguation: number;
  castling: number;
}

export const NotationTrainer: React.FC = () => {
  const [activeTab, setActiveTab] = useState<NotationMode>('read');
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [typedInput, setTypedInput] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [showWhyModal, setShowWhyModal] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Skill Mastery tracking (starts with realistic diagnostic percentages)
  const [mastery, setMastery] = useState<MasteryStats>(() => {
    try {
      const saved = localStorage.getItem('chesscadet_notation_mastery');
      if (saved) return JSON.parse(saved);
    } catch {}
    return {
      reading: 90,
      writing: 72,
      captures: 88,
      check: 44,
      disambiguation: 21,
      castling: 95,
    };
  });

  // Filter exercises for current tab
  const exercisesForMode = NOTATION_DRILLS.filter((d) => d.mode === activeTab);
  const exercise = exercisesForMode[currentIndex] || NOTATION_DRILLS[0];

  // Speech synthesis for listen mode
  const speakCurrentMove = () => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (!exercise.spokenText) return;

    const utterance = new SpeechSynthesisUtterance(exercise.spokenText);
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    window.speechSynthesis.speak(utterance);
  };

  useEffect(() => {
    setSelectedOption(null);
    setTypedInput('');
    setIsAnswered(false);
    setIsCorrect(false);
    setShowWhyModal(false);

    if (activeTab === 'listen') {
      const timer = setTimeout(() => {
        speakCurrentMove();
      }, 400);
      return () => clearTimeout(timer);
    }
  }, [activeTab, currentIndex]);

  const handleSelectOption = (opt: { id: string; isCorrect: boolean }) => {
    if (isAnswered) return;
    setSelectedOption(opt.id);
    setIsAnswered(true);
    setIsCorrect(opt.isCorrect);

    if (opt.isCorrect) {
      playSuccessSound();
      updateCategoryMastery(exercise.category, +4);
    } else {
      playErrorSound();
      updateCategoryMastery(exercise.category, -3);
    }
  };

  const handleVerifyTyped = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (isAnswered || !typedInput.trim()) return;

    const cleanInput = typedInput.trim();
    const correct =
      (exercise.acceptedSans && exercise.acceptedSans.some((s) => s.toLowerCase() === cleanInput.toLowerCase())) ||
      cleanInput.toLowerCase() === (exercise.targetSan || '').toLowerCase();

    setIsAnswered(true);
    setIsCorrect(correct);

    if (correct) {
      playSuccessSound();
      updateCategoryMastery(exercise.category, +5);
    } else {
      playErrorSound();
      updateCategoryMastery(exercise.category, -3);
    }
  };

  const updateCategoryMastery = (cat: keyof MasteryStats, delta: number) => {
    setMastery((prev) => {
      const updated = {
        ...prev,
        [cat]: Math.max(10, Math.min(100, prev[cat] + delta)),
      };
      try {
        localStorage.setItem('chesscadet_notation_mastery', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  const handleNextExercise = () => {
    if (currentIndex < exercisesForMode.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      // Advance to next mode or cycle
      const modes: NotationMode[] = [
        'read',
        'write',
        'listen',
        'error_detection',
        'disambiguation',
        'check_mate',
        'castling',
      ];
      const nextModeIdx = (modes.indexOf(activeTab) + 1) % modes.length;
      setActiveTab(modes[nextModeIdx]);
      setCurrentIndex(0);
    }
  };

  // Find the user's weakest area
  const categoryEntries = Object.entries(mastery) as [keyof MasteryStats, number][];
  const weakest = categoryEntries.reduce((min, cur) => (cur[1] < min[1] ? cur : min), categoryEntries[0]);

  const categoryLabels: Record<keyof MasteryStats, string> = {
    reading: 'Reading moves',
    writing: 'Writing moves',
    captures: 'Captures',
    check: 'Check & Checkmate notation',
    disambiguation: 'Disambiguation',
    castling: 'Castling notation',
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Editorial Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#D5D0C5] pb-6">
        <div>
          <div className="text-[11px] uppercase font-semibold tracking-widest text-[#315C45] mb-1">
            Chess Language & Fluency
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-display text-[#171717]">
            Algebraic Notation Trainer
          </h1>
          <p className="text-xs sm:text-sm text-[#171717]/70 max-w-2xl mt-1">
            Master the universal dialect of chess literature, game records, and master analysis. Learn to read, write, and transcribe positions fluently.
          </p>
        </div>

        {/* Diagnostic Weakness Alert */}
        <div className="p-3.5 bg-[#E8E3D8] border border-[#D5D0C5] rounded flex items-center gap-3">
          <div className="w-9 h-9 rounded bg-[#F5F1E8] border border-[#D5D0C5] flex items-center justify-center text-[#B94A48] flex-shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div className="text-left">
            <div className="text-[10px] uppercase font-semibold text-[#171717]/60 tracking-wider">
              Diagnostic Focus
            </div>
            <div className="text-xs font-semibold text-[#171717]">
              Weakest Area: <span className="text-[#B94A48]">{categoryLabels[weakest[0]]}</span> ({weakest[1]}%)
            </div>
            <button
              onClick={() => {
                if (weakest[0] === 'disambiguation') setActiveTab('disambiguation');
                else if (weakest[0] === 'check') setActiveTab('check_mate');
                else if (weakest[0] === 'writing') setActiveTab('write');
                else setActiveTab('read');
                setCurrentIndex(0);
              }}
              className="text-[11px] text-[#315C45] font-semibold hover:underline mt-0.5 inline-block"
            >
              Practice targeted positions →
            </button>
          </div>
        </div>
      </div>

      {/* Mode Navigation Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 border-b border-[#D5D0C5]">
        {[
          { id: 'read', label: '1. Read Mode' },
          { id: 'write', label: '2. Write Mode' },
          { id: 'listen', label: '3. Listen Mode' },
          { id: 'error_detection', label: '4. Error Detection' },
          { id: 'disambiguation', label: '5. Disambiguation' },
          { id: 'check_mate', label: '6. Check / Checkmate' },
          { id: 'castling', label: '7. Castling' },
        ].map((tab) => {
          const isSelected = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                setActiveTab(tab.id as NotationMode);
                setCurrentIndex(0);
              }}
              className={`py-2 px-3.5 text-xs font-medium whitespace-nowrap transition-all border-b-2 ${
                isSelected
                  ? 'border-[#315C45] text-[#315C45] font-semibold'
                  : 'border-transparent text-[#171717]/60 hover:text-[#171717]'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Split-Screen Interactive Training Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Large Interactive Chessboard (Remains Visible) */}
        <div className="lg:col-span-7 flex flex-col items-center">
          <div className="w-full max-w-[500px]">
            <Chessboard
              fen={exercise.fen}
              interactive={false}
              arrowGuide={exercise.arrows || []}
              showToolbar={true}
              className="shadow-sm"
            />
          </div>

          {/* Notation Display Plaque for Read/Error Modes */}
          {exercise.notationDisplay && (
            <div className="mt-4 px-6 py-2.5 bg-[#E8E3D8] border border-[#D5D0C5] rounded flex items-center gap-3">
              <span className="text-[11px] uppercase font-semibold text-[#171717]/60 tracking-wider">
                Notation Symbol:
              </span>
              <span className="text-xl font-bold font-mono text-[#315C45] tracking-wide">
                {exercise.notationDisplay}
              </span>
            </div>
          )}
        </div>

        {/* Right: Lesson Explanation & Adaptive Exercise */}
        <div className="lg:col-span-5 space-y-6">
          <div className="p-6 bg-[#E8E3D8]/50 border border-[#D5D0C5] rounded space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold tracking-widest text-[#315C45]">
                {exercise.title}
              </span>
              <span className="text-[11px] font-mono text-[#171717]/60">
                Exercise {currentIndex + 1} of {exercisesForMode.length}
              </span>
            </div>

            <h3 className="text-lg font-bold font-display text-[#171717]">{exercise.prompt}</h3>

            <p className="text-xs text-[#171717]/80 leading-relaxed bg-[#F5F1E8] p-3 border border-[#D5D0C5] rounded">
              <strong className="text-[#315C45]">Rule Guide:</strong> {exercise.conceptNote}
            </p>

            {/* Mode: Listen Mode Speech Controls */}
            {activeTab === 'listen' && (
              <div className="p-3 bg-[#F5F1E8] border border-[#D5D0C5] rounded flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Volume2 className={`w-4 h-4 ${isSpeaking ? 'text-[#315C45] animate-pulse' : 'text-[#171717]/70'}`} />
                  <span className="text-xs font-semibold text-[#171717]">
                    {isSpeaking ? 'Reading move aloud...' : 'Listen to dictation'}
                  </span>
                </div>
                <button
                  onClick={speakCurrentMove}
                  className="py-1 px-2.5 bg-[#315C45] hover:bg-[#284a37] text-white text-xs font-medium rounded flex items-center gap-1.5 transition-colors"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>Replay Audio</span>
                </button>
              </div>
            )}

            {/* Interaction Area: Multiple Choice (Read, Error, Disambiguation, Check, Castling) */}
            {exercise.options && (
              <div className="space-y-2.5 pt-2">
                {exercise.options.map((opt) => {
                  const isSelected = selectedOption === opt.id;
                  let btnStyle = 'border-[#D5D0C5] bg-[#F5F1E8] hover:border-[#315C45]/50 text-[#171717]';
                  if (isAnswered) {
                    if (opt.isCorrect) {
                      btnStyle = 'border-[#315C45] bg-[#315C45]/10 text-[#315C45] font-semibold';
                    } else if (isSelected && !opt.isCorrect) {
                      btnStyle = 'border-[#B94A48] bg-[#B94A48]/10 text-[#B94A48]';
                    } else {
                      btnStyle = 'opacity-50 border-[#D5D0C5] bg-[#F5F1E8] text-[#171717]';
                    }
                  }

                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      disabled={isAnswered}
                      className={`w-full p-3 text-left border rounded text-xs transition-all flex items-start gap-2.5 ${btnStyle}`}
                    >
                      <span className="w-4 h-4 rounded-full border border-current flex items-center justify-center flex-shrink-0 mt-0.5 text-[10px]">
                        {opt.id.split('-')[1]}
                      </span>
                      <span>{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* Interaction Area: Typed Notation (Write & Listen Modes) */}
            {(activeTab === 'write' || activeTab === 'listen') && (
              <form onSubmit={handleVerifyTyped} className="space-y-3 pt-2">
                <div>
                  <label className="block text-[11px] font-semibold text-[#171717]/70 uppercase tracking-wider mb-1">
                    Enter Exact Algebraic Notation:
                  </label>
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={typedInput}
                      onChange={(e) => setTypedInput(e.target.value)}
                      disabled={isAnswered}
                      placeholder="e.g., Nf3, exd5, O-O"
                      className="flex-1 px-3 py-2 bg-[#F5F1E8] border border-[#D5D0C5] rounded font-mono text-sm text-[#171717] focus:outline-none focus:border-[#315C45]"
                      autoFocus
                    />
                    {!isAnswered ? (
                      <button
                        type="submit"
                        disabled={!typedInput.trim()}
                        className="py-2 px-4 bg-[#315C45] hover:bg-[#284a37] disabled:opacity-50 text-white text-xs font-semibold rounded transition-colors"
                      >
                        Submit
                      </button>
                    ) : null}
                  </div>
                </div>
              </form>
            )}

            {/* Cadet Coach Subtle Feedback Layer */}
            {isAnswered && (
              <div
                className={`p-4 border rounded space-y-2 animate-in fade-in duration-200 ${
                  isCorrect
                    ? 'border-[#315C45]/50 bg-[#315C45]/5 text-[#171717]'
                    : 'border-[#B94A48]/50 bg-[#B94A48]/5 text-[#171717]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 font-semibold text-xs">
                    {isCorrect ? (
                      <>
                        <CheckCircle2 className="w-4 h-4 text-[#315C45]" />
                        <span className="text-[#315C45]">Nice. You identified the destination and notation correctly.</span>
                      </>
                    ) : (
                      <>
                        <AlertCircle className="w-4 h-4 text-[#B94A48]" />
                        <span className="text-[#B94A48]">Not quite. Review the algebraic notation conventions.</span>
                      </>
                    )}
                  </div>

                  {/* Prominent WHY? Trigger */}
                  <button
                    onClick={() => setShowWhyModal(!showWhyModal)}
                    className="text-xs font-bold text-[#315C45] hover:underline uppercase tracking-wider flex items-center gap-1"
                  >
                    <span>WHY?</span>
                    <HelpCircle className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Expanded Deeper Explanation */}
                {showWhyModal && (
                  <div className="pt-2 border-t border-[#D5D0C5] text-xs text-[#171717]/80 leading-relaxed font-sans space-y-2 bg-[#F5F1E8] p-3 rounded">
                    <div className="font-semibold text-[#171717]">Cadet Coach Masterclass Rationale:</div>
                    <p className="whitespace-pre-line">{exercise.whyExplanation}</p>
                    {exercise.targetSan && (
                      <div className="font-mono text-xs text-[#315C45]">
                        Standard Notation: <strong>{exercise.targetSan}</strong>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Continue CTA */}
                <div className="pt-2 flex justify-end">
                  <button
                    onClick={handleNextExercise}
                    className="py-2 px-4 bg-[#315C45] hover:bg-[#284a37] text-white text-xs font-semibold rounded flex items-center gap-2 transition-colors shadow-xs"
                  >
                    <span>CONTINUE →</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Skill Mastery Progress Table (Academic, serious, no childish badges) */}
          <div className="p-5 bg-[#F5F1E8] border border-[#D5D0C5] rounded space-y-3">
            <div className="flex items-center justify-between border-b border-[#D5D0C5] pb-2">
              <span className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                CHESS NOTATION MASTERY
              </span>
              <span className="text-[11px] font-mono text-[#315C45] font-semibold">
                Academic Standard
              </span>
            </div>

            <div className="space-y-2 text-xs">
              {[
                { label: 'Reading moves', val: mastery.reading },
                { label: 'Writing moves', val: mastery.writing },
                { label: 'Captures', val: mastery.captures },
                { label: 'Check notation (+ / #)', val: mastery.check },
                { label: 'Disambiguation (Nbd2, Rae1)', val: mastery.disambiguation },
                { label: 'Castling (O-O / O-O-O)', val: mastery.castling },
              ].map((item) => (
                <div key={item.label} className="space-y-1">
                  <div className="flex justify-between text-[11px]">
                    <span className="text-[#171717]/80">{item.label}</span>
                    <span className="font-mono font-semibold text-[#171717]">{item.val}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#E8E3D8] rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 rounded-full ${
                        item.val < 50 ? 'bg-[#B94A48]' : item.val < 75 ? 'bg-[#C7A45D]' : 'bg-[#315C45]'
                      }`}
                      style={{ width: `${item.val}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 text-[11px] text-[#171717]/70 italic border-t border-[#D5D0C5]">
              "Your weakest area is disambiguation. Recommended: Practice 5 positions."
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
