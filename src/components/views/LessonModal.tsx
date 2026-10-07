import React, { useState } from 'react';
import { Lesson } from '../../types/chess';
import { Chessboard } from '../chess/Chessboard';
import { ExerciseEngine } from '../exercise/ExerciseEngine';
import {
  X,
  BookOpen,
  CheckCircle2,
  ArrowRight,
  HelpCircle,
  Brain,
  RotateCcw,
} from 'lucide-react';
import { playSuccessSound, playErrorSound } from '../../lib/chess/soundEffects';

interface LessonModalProps {
  lesson: Lesson;
  onClose: () => void;
  onCompleteLesson: (lessonId: string, xp: number) => void;
}

export const LessonModal: React.FC<LessonModalProps> = ({
  lesson,
  onClose,
  onCompleteLesson,
}) => {
  const [activeStep, setActiveStep] = useState<'concept' | 'exercises' | 'report'>('concept');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [showConceptWhy, setShowConceptWhy] = useState(false);

  // Concept check state for Step 1
  const [conceptChoiceSelected, setConceptChoiceSelected] = useState<number | null>(null);
  const [conceptChoiceAnswered, setConceptChoiceAnswered] = useState(false);

  const currentSection = lesson.sections[0];
  const totalExercises = currentSection?.exercises.length || 0;
  const currentExercise = currentSection?.exercises[currentExerciseIndex];

  const handleConceptAnswer = (idx: number, isCorrect: boolean) => {
    setConceptChoiceSelected(idx);
    setConceptChoiceAnswered(true);
    if (isCorrect) playSuccessSound();
    else playErrorSound();
  };

  const handleExerciseSolved = (result: { xp: number }) => {
    setEarnedXp((prev) => prev + result.xp);
    setSolvedCount((prev) => prev + 1);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      setActiveStep('report');
      onCompleteLesson(lesson.id, lesson.xpReward + earnedXp);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-[#171717]/50 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-6xl bg-[#F5F1E8] border border-[#D5D0C5] shadow-2xl text-[#171717] overflow-hidden flex flex-col max-h-[94vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-[#D5D0C5] flex items-center justify-between bg-[#E8E3D8]/80">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded border border-[#D5D0C5] bg-[#F5F1E8] flex items-center justify-center text-[#315C45]">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[10px] uppercase font-semibold tracking-widest text-[#315C45]">
                Curriculum Lesson · {lesson.concept}
              </div>
              <h2 className="text-lg font-bold font-display text-[#171717]">
                {lesson.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <span className="text-xs font-mono text-[#171717]/60">
              {activeStep === 'concept'
                ? 'Phase 1: Theory & Concept Check'
                : activeStep === 'exercises'
                ? `Phase 2: Drill ${currentExerciseIndex + 1}/${totalExercises}`
                : 'Phase 3: Coach’s Report'}
            </span>
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-[#D5D0C5]/50 text-[#171717]/70 hover:text-[#171717] transition-colors"
              title="Close Lesson"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body: Two-Column Split-Screen Learning Environment */}
        <div className="flex-1 overflow-y-auto p-6">
          {activeStep === 'concept' ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* LEFT: Large Interactive Chessboard (Hero of the UI) */}
              <div className="lg:col-span-7 flex flex-col items-center">
                <div className="w-full max-w-[500px]">
                  <Chessboard
                    fen={currentSection.demonstrationFen}
                    arrowGuide={currentSection.demonstrationArrows || []}
                    interactive={false}
                    showToolbar={true}
                    className="shadow-sm"
                  />
                </div>
                <div className="mt-3 text-xs font-mono text-[#171717]/60 text-center">
                  Theoretical Demonstration Diagram · Key Moves Illustrated
                </div>
              </div>

              {/* RIGHT: Lesson Explanation + Interactive Concept Check */}
              <div className="lg:col-span-5 space-y-6">
                <div className="p-6 bg-[#E8E3D8]/60 border border-[#D5D0C5] rounded space-y-4">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-[#315C45]">
                    Concept Breakdown
                  </div>
                  <h3 className="text-xl font-bold font-display text-[#171717]">
                    {currentSection.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-[#171717]/80 leading-relaxed font-sans">
                    {currentSection.conceptIntro}
                  </p>

                  {currentSection.bulletPoints && (
                    <ul className="space-y-1.5 text-xs text-[#171717]/85 pt-1">
                      {currentSection.bulletPoints.map((pt, i) => (
                        <li key={i} className="flex items-start gap-2">
                          <span className="w-1.5 h-1.5 rounded-full bg-[#315C45] mt-1.5 shrink-0" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  <div className="p-3 bg-[#F5F1E8] border border-[#D5D0C5] rounded text-xs text-[#171717]">
                    <strong className="text-[#315C45]">Key Takeaway:</strong>{' '}
                    {currentSection.keyTakeaway}
                  </div>
                </div>

                {/* Immediate Interactive Concept Check */}
                <div className="p-6 bg-[#F5F1E8] border border-[#D5D0C5] rounded space-y-3">
                  <div className="text-xs font-bold uppercase tracking-wider text-[#171717]">
                    Interactive Check: Identify the Tactical Concept
                  </div>
                  <p className="text-xs text-[#171717]/70">
                    Which candidate move demonstrated on the board establishes central domination or initiates the tactical threat?
                  </p>

                  <div className="space-y-2 pt-1">
                    {[
                      {
                        label: `Play ${currentSection.demonstrationMove || 'the designated move'} to seize line control`,
                        isCorrect: true,
                        why: 'Superb. You identified the forcing destination square correctly. Establishing control on this key square restricts enemy mobility.',
                      },
                      {
                        label: 'Retreat the piece to passive home squares',
                        isCorrect: false,
                        why: 'Passive retreats surrender square control and allow the opponent to develop unhindered.',
                      },
                      {
                        label: 'Push flank pawns without central control',
                        isCorrect: false,
                        why: 'Flank operations before central stabilization leave your position susceptible to central counter-punches.',
                      },
                    ].map((opt, idx) => {
                      const isSelected = conceptChoiceSelected === idx;
                      let btnClass = 'border-[#D5D0C5] bg-[#E8E3D8]/50 text-[#171717] hover:border-[#315C45]/50';
                      if (conceptChoiceAnswered) {
                        if (opt.isCorrect) btnClass = 'border-[#315C45] bg-[#315C45]/10 text-[#315C45] font-semibold';
                        else if (isSelected) btnClass = 'border-[#B94A48] bg-[#B94A48]/10 text-[#B94A48]';
                        else btnClass = 'opacity-50 border-[#D5D0C5] text-[#171717]';
                      }

                      return (
                        <button
                          key={idx}
                          onClick={() => handleConceptAnswer(idx, opt.isCorrect)}
                          disabled={conceptChoiceAnswered}
                          className={`w-full p-2.5 text-left border rounded text-xs transition-all ${btnClass}`}
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Cadet Coach Subtle Layer */}
                  {conceptChoiceAnswered && (
                    <div className="p-3 bg-[#E8E3D8] border border-[#D5D0C5] rounded space-y-2 animate-in fade-in">
                      <div className="flex items-center justify-between text-xs font-semibold">
                        <span className={conceptChoiceSelected === 0 ? 'text-[#315C45]' : 'text-[#B94A48]'}>
                          {conceptChoiceSelected === 0
                            ? 'Nice. You identified the destination square correctly.'
                            : 'Not quite. Review the highlighted squares on the board.'}
                        </span>
                        <button
                          onClick={() => setShowConceptWhy(!showConceptWhy)}
                          className="text-[11px] font-bold text-[#315C45] uppercase tracking-wider hover:underline flex items-center gap-1"
                        >
                          <span>WHY?</span>
                          <HelpCircle className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      {showConceptWhy && (
                        <p className="text-xs text-[#171717]/80 leading-relaxed pt-1 border-t border-[#D5D0C5]">
                          The move demonstrated on the board coordinates multiple pieces against a single target. By claiming this square, you prevent the opponent from developing their knight or rook.
                        </p>
                      )}

                      <div className="pt-2 flex justify-end">
                        <button
                          onClick={() => setActiveStep('exercises')}
                          className="py-2 px-4 bg-[#315C45] hover:bg-[#284a37] text-white text-xs font-semibold rounded flex items-center gap-2 transition-colors shadow-xs"
                        >
                          <span>START EXERCISES ({totalExercises} DRILLS) →</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ) : activeStep === 'exercises' && currentExercise ? (
            /* Step 2: Interactive Drills */
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between text-xs text-[#171717]/70 border-b border-[#D5D0C5] pb-2">
                <span className="font-semibold uppercase tracking-wider">
                  Exercise {currentExerciseIndex + 1} of {totalExercises}
                </span>
                <span className="font-mono text-[#315C45] font-semibold">
                  Accrued Score: +{earnedXp} Points
                </span>
              </div>

              <ExerciseEngine
                key={currentExercise.id}
                exercise={currentExercise}
                onSolve={handleExerciseSolved}
                onNext={handleNextExercise}
                showNextButton={true}
              />
            </div>
          ) : (
            /* Step 3: Coach’s Report (Concise, serious, no childish badges) */
            <div className="max-w-md mx-auto py-8 space-y-6">
              <div className="p-8 bg-[#E8E3D8] border border-[#D5D0C5] rounded space-y-6 text-center">
                <div className="space-y-1">
                  <div className="text-[11px] uppercase tracking-widest font-bold text-[#315C45]">
                    LESSON COMPLETE
                  </div>
                  <div className="text-4xl font-bold font-mono text-[#171717]">
                    82%
                  </div>
                  <div className="text-base font-bold font-display text-[#171717]">
                    {lesson.title}
                  </div>
                </div>

                {/* Mastered vs Still Developing Checklist */}
                <div className="text-left space-y-4 border-t border-b border-[#D5D0C5] py-4 text-xs">
                  <div>
                    <div className="font-bold text-[#315C45] uppercase tracking-wider text-[11px] mb-1.5">
                      Mastered:
                    </div>
                    <ul className="space-y-1 text-[#171717]">
                      <li className="flex items-center gap-2">
                        <span className="text-[#315C45] font-bold">✓</span>
                        <span>Piece symbols & destination squares</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#315C45] font-bold">✓</span>
                        <span>Forcing line calculation</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <span className="text-[#315C45] font-bold">✓</span>
                        <span>Pinning mechanics against high-value targets</span>
                      </li>
                    </ul>
                  </div>

                  <div>
                    <div className="font-bold text-[#C7A45D] uppercase tracking-wider text-[11px] mb-1.5">
                      Still Developing:
                    </div>
                    <ul className="space-y-1 text-[#171717]/80">
                      <li className="flex items-center gap-2">
                        <span className="text-[#C7A45D]">○</span>
                        <span>Disambiguation under multi-piece pressure</span>
                      </li>
                    </ul>
                  </div>
                </div>

                {/* Next Step & Primary CTA */}
                <div className="space-y-3">
                  <div className="text-xs text-[#171717]/70">
                    NEXT STEP: <strong className="text-[#171717]">Mastering Double Attacks</strong>
                  </div>
                  <button
                    onClick={onClose}
                    className="w-full py-3 px-4 bg-[#315C45] hover:bg-[#284a37] text-white font-semibold text-xs tracking-wider uppercase rounded transition-colors shadow-xs"
                  >
                    CONTINUE →
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
