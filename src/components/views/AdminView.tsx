import React, { useState, useEffect } from 'react';
import { Exercise, TacticalConcept, ExerciseType } from '../../types/chess';
import { Chessboard } from '../chess/Chessboard';
import { ChessEngine } from '../../lib/chess/chessEngine';
import { StorageService } from '../../services/storageService';
import { ApiClient } from '../../services/apiClient';
import { PUZZLES_DATA } from '../../data/puzzlesData';
import {
  Database,
  Plus,
  Play,
  CheckCircle2,
  AlertCircle,
  FileCode,
  Sparkles,
  Layers,
  Settings,
  Shield,
  ArrowRight,
} from 'lucide-react';

interface AdminViewProps {
  userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  onSwitchToAdmin?: () => void;
}

export const AdminView: React.FC<AdminViewProps> = ({
  userRole = 'STUDENT',
  onSwitchToAdmin,
}) => {
  const [fen, setFen] = useState('r1bqk2r/pppp1ppp/2n5/4p3/1bB1P3/2NP1N2/PPP2PPP/R2QK2R b KQkq - 0 1');
  const [concept, setConcept] = useState<TacticalConcept>('PIN');
  const [exerciseType, setExerciseType] = useState<ExerciseType>('FIND_THE_TACTIC');
  const [difficulty, setDifficulty] = useState<1 | 2 | 3 | 4 | 5>(2);
  const [targetMoves, setTargetMoves] = useState('Bxc3+, d5');
  const [conceptHint, setConceptHint] = useState('Notice the white knight on c3 is pinned to the King on e1.');
  const [areaHint, setAreaHint] = useState('Focus on the c3 square and a5-e1 diagonal.');
  const [pieceHint, setPieceHint] = useState('Move Black’s dark-square bishop.');
  const [moveHint, setMoveHint] = useState('Play Bxc3+ to exploit the pin.');
  const [explanation, setExplanation] = useState('Excellently spotted! The pinned knight cannot defend itself properly.');
  const [xp, setXp] = useState(30);

  const [savedSuccess, setSavedSuccess] = useState(false);
  const [verificationFeedback, setVerificationFeedback] = useState<any | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [customExercises, setCustomExercises] = useState<Exercise[]>(() =>
    StorageService.getCustomExercises()
  );

  const handleSaveExercise = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setVerificationFeedback(null);

    const movesArray = targetMoves.split(',').map((m) => m.trim());
    const payload = {
      conceptKey: concept,
      exerciseType,
      difficulty,
      fen,
      targetMoves: movesArray,
      conceptHint,
      areaHint,
      pieceHint,
      moveHint,
      explanation,
      xp,
    };

    try {
      const res = await ApiClient.createAdminExercise(payload);
      setVerificationFeedback(res.verification);
      setSavedSuccess(true);

      const localObj: Exercise = {
        id: res.exercise.id,
        type: exerciseType,
        concept,
        difficulty,
        fen,
        targetMoves: movesArray,
        conceptHint,
        areaHint,
        pieceHint,
        moveHint,
        explanation,
        xp,
      };

      StorageService.saveCustomExercise(localObj);
      setCustomExercises([localObj, ...customExercises]);
      setTimeout(() => setSavedSuccess(false), 5000);
    } catch (err: any) {
      setErrorMessage(
        err.message || 'Server rejected creation. Make sure you have the ADMIN role assigned.'
      );
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
              Content Management System & Puzzle Pipeline
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded font-mono ${
              userRole === 'ADMIN' ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-400'
            }`}>
              CURRENT ROLE: {userRole}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-display">
            Curriculum & Exercise Architect
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mt-1">
            Design, test, and publish interactive chess positions. All positions run through the server verification pipeline.
          </p>
        </div>

        {userRole !== 'ADMIN' && onSwitchToAdmin && (
          <button
            onClick={onSwitchToAdmin}
            className="py-2.5 px-4 bg-amber-600 hover:bg-amber-500 text-slate-950 font-bold text-xs rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
          >
            <Shield className="w-4 h-4" />
            <span>Switch to Admin Persona</span>
          </button>
        )}
      </div>

      {/* RBAC Notice if user is not ADMIN */}
      {userRole !== 'ADMIN' && (
        <div className="p-4 bg-amber-950/40 border border-amber-500/30 rounded-xl flex items-center justify-between gap-4 text-xs text-amber-200">
          <div className="flex items-center gap-2.5">
            <Shield className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              Server-enforced RBAC: Publishing to the production database requires the <strong>ADMIN</strong> role. Student accounts will receive 403 Forbidden.
            </span>
          </div>
          {onSwitchToAdmin && (
            <button
              onClick={onSwitchToAdmin}
              className="px-3 py-1.5 bg-amber-500 text-slate-950 font-semibold rounded-md hover:bg-amber-400 transition-colors whitespace-nowrap"
            >
              Authorize as Admin
            </button>
          )}
        </div>
      )}

      {/* Platform Analytics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-xs uppercase font-medium">Published Exercises</span>
          <div className="text-2xl font-bold text-slate-100 font-mono-nums mt-1">
            {PUZZLES_DATA.length + customExercises.length}
          </div>
          <span className="text-[11px] text-emerald-400 font-mono-nums">+100% Validated in Database</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-xs uppercase font-medium">Average Success Rate</span>
          <div className="text-2xl font-bold text-slate-100 font-mono-nums mt-1">74.2%</div>
          <span className="text-[11px] text-slate-500 font-mono-nums">First attempt benchmark</span>
        </div>
        <div className="p-5 bg-slate-900 border border-slate-800 rounded-xl">
          <span className="text-slate-400 text-xs uppercase font-medium">Most Missed Concept</span>
          <div className="text-2xl font-bold text-red-400 font-display mt-1">Back Rank Mate</div>
          <span className="text-[11px] text-slate-500">37% accuracy across learners</span>
        </div>
      </div>

      {/* Exercise Authoring Studio */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        {/* Left: Interactive Preview Board */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-slate-100 font-display">
              Live Position Preview
            </h3>
            <span className="text-xs text-slate-400 font-mono-nums">Interactive FEN</span>
          </div>

          <div className="max-w-[420px] mx-auto">
            <Chessboard fen={fen} interactive={true} className="shadow-xl" />
          </div>

          <div>
            <label className="block text-slate-300 text-xs font-semibold mb-1">
              Position FEN (Forsyth-Edwards Notation)
            </label>
            <input
              type="text"
              value={fen}
              onChange={(e) => setFen(e.target.value)}
              className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-xs font-mono text-slate-200 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>

        {/* Right: Exercise Metadata & Progressive Hints Form */}
        <form onSubmit={handleSaveExercise} className="space-y-4 text-xs">
          <h3 className="text-base font-bold text-slate-100 font-display mb-1">
            Exercise Parameters & Hint Tree
          </h3>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-slate-300 font-semibold mb-1">Tactical Concept</label>
              <select
                value={concept}
                onChange={(e) => setConcept(e.target.value as any)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value="PIN">Pin</option>
                <option value="FORK">Fork</option>
                <option value="SKEWER">Skewer</option>
                <option value="BACK_RANK_MATE">Back Rank Mate</option>
                <option value="DISCOVERED_ATTACK">Discovered Attack</option>
                <option value="DEFLECTION">Deflection</option>
                <option value="SMOTHERED_MATE">Smothered Mate</option>
                <option value="OPPOSITION">Opposition</option>
                <option value="CENTER_CONTROL">Center Control</option>
              </select>
            </div>

            <div>
              <label className="block text-slate-300 font-semibold mb-1">Difficulty (1-5)</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(parseInt(e.target.value, 10) as any)}
                className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 focus:outline-none focus:border-emerald-500"
              >
                <option value={1}>1 (Foundational)</option>
                <option value={2}>2 (Novice)</option>
                <option value={3}>3 (Intermediate)</option>
                <option value={4}>4 (Advanced)</option>
                <option value={5}>5 (Master)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Target Moves (comma separated SAN, e.g. "Bxc3+, d5")
            </label>
            <input
              type="text"
              value={targetMoves}
              onChange={(e) => setTargetMoves(e.target.value)}
              required
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 font-mono focus:outline-none focus:border-emerald-500"
            />
          </div>

          {/* Progressive hints 1-4 */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <span className="font-semibold text-slate-300 block">4-Tier Progressive Hint Tree</span>

            <div>
              <span className="text-slate-400 text-[11px] block">Hint 1: Conceptual Principle</span>
              <input
                type="text"
                value={conceptHint}
                onChange={(e) => setConceptHint(e.target.value)}
                className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Hint 2: Board Area / Target Squares</span>
              <input
                type="text"
                value={areaHint}
                onChange={(e) => setAreaHint(e.target.value)}
                className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Hint 3: Candidate Piece to Move</span>
              <input
                type="text"
                value={pieceHint}
                onChange={(e) => setPieceHint(e.target.value)}
                className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>

            <div>
              <span className="text-slate-400 text-[11px] block">Hint 4: Concrete Move Guidance</span>
              <input
                type="text"
                value={moveHint}
                onChange={(e) => setMoveHint(e.target.value)}
                className="w-full p-1.5 bg-slate-950 border border-slate-800 rounded-md text-slate-200 text-xs focus:outline-none focus:border-emerald-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-slate-300 font-semibold mb-1">
              Pedagogical Explanation (Post-Solve)
            </label>
            <textarea
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              rows={2}
              className="w-full p-2 bg-slate-950 border border-slate-800 rounded-lg text-slate-200 text-xs focus:outline-none focus:border-emerald-500 resize-none"
            />
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-slate-800">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">XP Reward:</span>
              <input
                type="number"
                value={xp}
                onChange={(e) => setXp(parseInt(e.target.value, 10))}
                className="w-16 p-1.5 bg-slate-950 border border-slate-800 rounded-md text-center text-xs text-emerald-400 font-bold"
              />
            </div>

            <button
              type="submit"
              className="py-2 px-5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Verify & Publish Exercise</span>
            </button>
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded-lg bg-red-950/70 border border-red-500/40 text-red-300 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {savedSuccess && verificationFeedback && (
            <div className="p-3 rounded-lg bg-emerald-950/70 border border-emerald-500/40 text-emerald-300 space-y-1">
              <div className="flex items-center gap-2 font-bold">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Verified & Committed to Database! Status: {verificationFeedback.status}</span>
              </div>
              <div className="text-[11px] text-slate-300 font-mono">
                FEN Valid: {String(verificationFeedback.isFenValid)} · Legal Moves: {String(verificationFeedback.areTargetMovesLegal)}
              </div>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};
