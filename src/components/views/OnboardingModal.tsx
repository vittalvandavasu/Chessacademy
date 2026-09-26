import React, { useState } from 'react';
import { ArrowRight, Check, Sparkles } from 'lucide-react';

interface OnboardingModalProps {
  onSelectExperience: (option: string, startingPathId: string) => void;
  onClose: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  onSelectExperience,
  onClose,
}) => {
  // Pre-select first or casual option so the primary CTA is immediately usable
  const [selectedIdx, setSelectedIdx] = useState<number>(0);

  const options = [
    {
      label: "I'm completely new",
      desc: 'Start with piece movements, board geography, and core rules.',
      pathId: 'path-foundations',
    },
    {
      label: 'I know how the pieces move',
      desc: 'Learn check, checkmate, castling, en passant, and basic notation.',
      pathId: 'path-foundations',
    },
    {
      label: 'I play casually',
      desc: 'Learn forks, pins, skewers, and back rank mating patterns.',
      pathId: 'path-first-tactics',
    },
    {
      label: 'I know basic tactics',
      desc: 'Refine multi-step tactical combinations and opening principles.',
      pathId: 'path-first-tactics',
    },
    {
      label: 'I play regularly',
      desc: 'Advance to deflection, decoy, overloading, and positional outposts.',
      pathId: 'path-intermediate-tactics',
    },
    {
      label: "I'm an experienced player",
      desc: 'Deep tactical calculations, complex king & pawn endgames, and strategy.',
      pathId: 'path-endgames',
    },
  ];

  const handleConfirm = () => {
    const choice = options[selectedIdx] || options[0];
    onSelectExperience(choice.label, choice.pathId);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-6 bg-slate-950/90 backdrop-blur-md">
      <div className="relative w-full max-w-xl my-auto bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl flex flex-col max-h-[92vh] sm:max-h-[85vh] overflow-hidden">
        {/* Fixed Header */}
        <div className="p-5 sm:p-6 border-b border-slate-800 bg-slate-900 shrink-0">
          <div className="text-[11px] uppercase font-semibold tracking-wider text-emerald-400 mb-1">
            Diagnostic Placement
          </div>
          <h2 className="text-xl sm:text-2xl font-bold text-slate-100 font-display">
            What best describes your chess experience?
          </h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1">
            Select your comfort level to calibrate your starting path and adaptive exercise difficulty.
          </p>
        </div>

        {/* Scrollable Options List */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-2.5 min-h-0 overscroll-contain">
          {options.map((opt, idx) => {
            const isSelected = selectedIdx === idx;
            return (
              <div
                key={idx}
                onClick={() => setSelectedIdx(idx)}
                className={`p-3.5 rounded-xl border cursor-pointer transition-all flex items-center justify-between ${
                  isSelected
                    ? 'bg-slate-800 border-emerald-500/70 shadow-sm'
                    : 'bg-slate-950/60 border-slate-800/80 hover:border-slate-700 hover:bg-slate-800/40'
                }`}
              >
                <div className="pr-2">
                  <div className="text-xs sm:text-sm font-bold text-slate-100">{opt.label}</div>
                  <div className="text-[11px] text-slate-400 mt-0.5 leading-snug">{opt.desc}</div>
                </div>

                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center shrink-0 ml-2 ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-500 text-slate-950'
                      : 'border-slate-700 bg-slate-950'
                  }`}
                >
                  {isSelected && <Check className="w-3.5 h-3.5 stroke-[3]" />}
                </div>
              </div>
            );
          })}
        </div>

        {/* Always-visible Sticky Footer */}
        <div className="p-4 sm:p-5 border-t border-slate-800 bg-slate-950/95 shrink-0 flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="py-2 px-3 text-xs text-slate-400 hover:text-slate-200 transition-colors text-center sm:text-left"
          >
            Skip for now (Use Alex Demo)
          </button>

          <button
            type="button"
            onClick={handleConfirm}
            className="py-2.5 px-6 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center justify-center gap-2 shadow-md hover:shadow-emerald-500/20 active:scale-[0.98]"
          >
            <span>Personalize My Curriculum</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

