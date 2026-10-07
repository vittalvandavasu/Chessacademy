import React, { useState } from 'react';
import { BoardThemeId, BOARD_THEMES } from '../chess/Chessboard';
import { PieceSet } from '../chess/ChessPieces';
import { isSoundEnabled, toggleSound } from '../../lib/chess/soundEffects';
import { X, Sliders, Volume2, VolumeX, Eye, Sparkles, Check, RotateCcw } from 'lucide-react';

interface SettingsModalProps {
  onClose: () => void;
  onResetDemo?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ onClose, onResetDemo }) => {
  const [boardTheme, setBoardTheme] = useState<BoardThemeId>(() => {
    try {
      return (localStorage.getItem('chesscadet_board_theme') as BoardThemeId) || 'tournament';
    } catch {
      return 'tournament';
    }
  });

  const [pieceSet, setPieceSet] = useState<PieceSet>(() => {
    try {
      return (localStorage.getItem('chesscadet_piece_set') as PieceSet) || 'staunton';
    } catch {
      return 'staunton';
    }
  });

  const [soundActive, setSoundActive] = useState<boolean>(() => isSoundEnabled());
  const [showCoordinates, setShowCoordinates] = useState<boolean>(() => {
    try {
      return localStorage.getItem('chesscadet_coords') !== 'false';
    } catch {
      return true;
    }
  });

  const [speechRate, setSpeechRate] = useState<string>(() => {
    try {
      return localStorage.getItem('chesscadet_speech_rate') || '1.0';
    } catch {
      return '1.0';
    }
  });

  const handleSelectTheme = (themeId: BoardThemeId) => {
    setBoardTheme(themeId);
    try {
      localStorage.setItem('chesscadet_board_theme', themeId);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSelectPieceSet = (set: PieceSet) => {
    setPieceSet(set);
    try {
      localStorage.setItem('chesscadet_piece_set', set);
      window.dispatchEvent(new Event('storage'));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleToggleSound = () => {
    const updated = toggleSound();
    setSoundActive(updated);
  };

  const handleToggleCoordinates = () => {
    const nextVal = !showCoordinates;
    setShowCoordinates(nextVal);
    try {
      localStorage.setItem('chesscadet_coords', String(nextVal));
    } catch (e) {
      console.warn(e);
    }
  };

  const handleSelectSpeechRate = (rate: string) => {
    setSpeechRate(rate);
    try {
      localStorage.setItem('chesscadet_speech_rate', rate);
    } catch (e) {
      console.warn(e);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#171717]/40 backdrop-blur-xs">
      <div className="relative w-full max-w-xl bg-[#F5F1E8] border border-[#D5D0C5] shadow-2xl text-[#171717] overflow-hidden flex flex-col max-h-[90vh]">
        {/* Editorial Header */}
        <div className="px-6 py-4 border-b border-[#D5D0C5] flex items-center justify-between bg-[#E8E3D8]/60">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded border border-[#D5D0C5] bg-[#F5F1E8] flex items-center justify-center text-[#315C45]">
              <Sliders className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-semibold tracking-widest text-[#171717]/60">
                Academy Preferences
              </div>
              <h2 className="text-lg font-bold font-display text-[#171717]">Settings & Environment</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#E8E3D8] text-[#171717]/70 hover:text-[#171717] transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section: Board Appearance */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#171717]/70 mb-3">
              Tournament Board Theme
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {(Object.keys(BOARD_THEMES) as BoardThemeId[]).map((id) => {
                const theme = BOARD_THEMES[id];
                const isSelected = boardTheme === id;
                return (
                  <button
                    key={id}
                    onClick={() => handleSelectTheme(id)}
                    className={`p-3 text-left border rounded transition-all flex flex-col gap-2 ${
                      isSelected
                        ? 'border-[#315C45] bg-[#E8E3D8] ring-1 ring-[#315C45]'
                        : 'border-[#D5D0C5] bg-[#F5F1E8] hover:border-[#171717]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#171717]">{theme.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#315C45]" />}
                    </div>
                    {/* Visual Square Preview */}
                    <div className="h-5 rounded overflow-hidden flex border border-[#171717]/15">
                      <div className="flex-1" style={{ backgroundColor: theme.lightSquare }} />
                      <div className="flex-1" style={{ backgroundColor: theme.darkSquare }} />
                      <div className="flex-1" style={{ backgroundColor: theme.lightSquare }} />
                      <div className="flex-1" style={{ backgroundColor: theme.darkSquare }} />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Piece Sets */}
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-[#171717]/70 mb-3">
              Chess Piece Styling
            </label>
            <div className="grid grid-cols-3 gap-2.5">
              {[
                { id: 'staunton', name: 'Staunton Classic', desc: 'FIDE Tournament standard' },
                { id: 'neo', name: 'Neo Digital', desc: 'Clean vector geometric' },
                { id: 'wood', name: 'Natural Wood', desc: 'Carved warm grain' },
              ].map((p) => {
                const isSelected = pieceSet === p.id;
                return (
                  <button
                    key={p.id}
                    onClick={() => handleSelectPieceSet(p.id as PieceSet)}
                    className={`p-3 text-left border rounded transition-all ${
                      isSelected
                        ? 'border-[#315C45] bg-[#E8E3D8] ring-1 ring-[#315C45]'
                        : 'border-[#D5D0C5] bg-[#F5F1E8] hover:border-[#171717]/40'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-[#171717]">{p.name}</span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-[#315C45]" />}
                    </div>
                    <div className="text-[10px] text-[#171717]/60 mt-1">{p.desc}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section: Audio & Coordinates */}
          <div className="pt-2 border-t border-[#D5D0C5] space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#171717]">Piece Movement & Capture Sounds</div>
                <div className="text-[11px] text-[#171717]/60">Physical felt-on-wood audio feedback on board actions</div>
              </div>
              <button
                onClick={handleToggleSound}
                className={`py-1.5 px-3 border rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  soundActive
                    ? 'border-[#315C45] bg-[#315C45] text-white'
                    : 'border-[#D5D0C5] bg-[#E8E3D8] text-[#171717]/70'
                }`}
              >
                {soundActive ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
                <span>{soundActive ? 'Enabled' : 'Muted'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#171717]">Board Rank & File Coordinates</div>
                <div className="text-[11px] text-[#171717]/60">Show a-h and 1-8 labels on board borders</div>
              </div>
              <button
                onClick={handleToggleCoordinates}
                className={`py-1.5 px-3 border rounded text-xs font-medium flex items-center gap-1.5 transition-colors ${
                  showCoordinates
                    ? 'border-[#315C45] bg-[#315C45] text-white'
                    : 'border-[#D5D0C5] bg-[#E8E3D8] text-[#171717]/70'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{showCoordinates ? 'Visible' : 'Hidden'}</span>
              </button>
            </div>

            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#171717]">Notation Audio Speech Rate</div>
                <div className="text-[11px] text-[#171717]/60">Voice pacing for Listen Mode notation dictation</div>
              </div>
              <div className="flex items-center gap-1 bg-[#E8E3D8] p-1 border border-[#D5D0C5] rounded">
                {['0.8', '1.0', '1.2'].map((rate) => (
                  <button
                    key={rate}
                    onClick={() => handleSelectSpeechRate(rate)}
                    className={`px-2 py-0.5 rounded text-[11px] font-mono font-medium ${
                      speechRate === rate ? 'bg-[#315C45] text-white' : 'text-[#171717]/70 hover:text-[#171717]'
                    }`}
                  >
                    {rate}x
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Reset Demo Data if provided */}
          {onResetDemo && (
            <div className="pt-4 border-t border-[#D5D0C5] flex items-center justify-between">
              <div>
                <div className="text-xs font-semibold text-[#171717]">Reset Session Baseline</div>
                <div className="text-[11px] text-[#171717]/60">Clear cached exercise history and restore initial state</div>
              </div>
              <button
                onClick={onResetDemo}
                className="py-1.5 px-3 border border-[#D5D0C5] hover:border-[#B94A48] hover:text-[#B94A48] text-xs font-medium rounded transition-colors flex items-center gap-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Reset Demo</span>
              </button>
            </div>
          )}
        </div>

        {/* Modal Bottom Bar */}
        <div className="px-6 py-3 border-t border-[#D5D0C5] bg-[#E8E3D8]/60 flex justify-end">
          <button
            onClick={onClose}
            className="py-1.5 px-4 bg-[#315C45] hover:bg-[#284a37] text-white text-xs font-semibold rounded transition-colors shadow-xs"
          >
            Apply & Close
          </button>
        </div>
      </div>
    </div>
  );
};
