import React from 'react';
import { TacticalConcept } from '../../types/chess';
import { CONCEPT_CARDS_DATA } from '../../data/conceptCardsData';
import { X, BookOpen, Eye, AlertTriangle, Lightbulb, Compass } from 'lucide-react';

interface ConceptCardModalProps {
  concept: TacticalConcept;
  isOpen: boolean;
  onClose: () => void;
}

export const ConceptCardModal: React.FC<ConceptCardModalProps> = ({ concept, isOpen, onClose }) => {
  if (!isOpen) return null;

  const card = CONCEPT_CARDS_DATA[concept] || {
    concept,
    title: concept.replace(/_/g, ' '),
    tagline: 'Key chess tactical pattern',
    definition: 'A fundamental chess motif applied across tactical combinations.',
    recognitionCues: ['Look for geometric alignments', 'Search for undefended pieces'],
    commonMistakes: ['Moving too quickly before calculating forcing opponent responses'],
    transferablePrinciple: 'Always look for checks, captures, and threats first.',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-2xl bg-slate-900 border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[11px] font-semibold text-emerald-400 uppercase tracking-wider block">
                Chess Tactical Concept
              </span>
              <h2 className="text-lg font-bold text-slate-100 font-display">{card.title}</h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg text-slate-400 hover:text-slate-100 hover:bg-slate-800 flex items-center justify-center transition-colors"
            title="Close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Tagline & Definition */}
          <div className="bg-slate-800/60 border border-slate-700/60 rounded-xl p-4">
            <span className="text-xs italic text-emerald-300 font-medium block mb-2">
              "{card.tagline}"
            </span>
            <p className="text-sm text-slate-200 leading-relaxed">{card.definition}</p>
          </div>

          {/* Recognition Cues */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-slate-300">
              <Eye className="w-4 h-4 text-emerald-400" />
              <span>Recognition Cues: What To Look For</span>
            </div>
            <ul className="space-y-2">
              {card.recognitionCues.map((cue, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0 mt-2" />
                  <span>{cue}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Common Mistakes */}
          <div>
            <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-400" />
              <span>Common Pitfalls & Mistakes</span>
            </div>
            <ul className="space-y-2">
              {card.commonMistakes.map((mistake, idx) => (
                <li
                  key={idx}
                  className="flex items-start gap-2.5 text-xs sm:text-sm text-slate-300 bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/80"
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0 mt-2" />
                  <span>{mistake}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Transferable Principle */}
          <div className="bg-gradient-to-r from-emerald-950/40 via-slate-800/60 to-slate-900 border border-emerald-500/30 rounded-xl p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-emerald-400 mb-1.5">
              <Lightbulb className="w-4 h-4" />
              <span>Pattern To Remember</span>
            </div>
            <p className="text-xs sm:text-sm text-slate-200 leading-relaxed font-medium">
              {card.transferablePrinciple}
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-800 bg-slate-900/90 flex items-center justify-between">
          <span className="text-xs text-slate-400 flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5 text-slate-500" />
            Codecademy for Chess · Curriculum Concept Library
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors shadow-sm"
          >
            Got it, back to puzzle
          </button>
        </div>
      </div>
    </div>
  );
};
