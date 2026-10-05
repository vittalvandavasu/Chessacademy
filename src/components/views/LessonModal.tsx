import React, { useState } from 'react';
import { Lesson, DiscussionComment } from '../../types/chess';
import { Chessboard } from '../chess/Chessboard';
import { ExerciseEngine } from '../exercise/ExerciseEngine';
import { StorageService } from '../../services/storageService';
import {
  X,
  BookOpen,
  Play,
  CheckCircle2,
  MessageSquare,
  ThumbsUp,
  ArrowRight,
  Send,
  Zap,
} from 'lucide-react';

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
  const [activeStep, setActiveStep] = useState<'concept' | 'exercises' | 'summary'>('concept');
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [earnedXp, setEarnedXp] = useState(0);
  const [solvedCount, setSolvedCount] = useState(0);
  const [discussions, setDiscussions] = useState<DiscussionComment[]>(() =>
    StorageService.getDiscussions(lesson.id)
  );
  const [newComment, setNewComment] = useState('');
  const [activeTab, setActiveTab] = useState<'lesson' | 'discussion'>('lesson');

  const currentSection = lesson.sections[0];
  const totalExercises = currentSection?.exercises.length || 0;
  const currentExercise = currentSection?.exercises[currentExerciseIndex];

  const handleExerciseSolved = (result: { xp: number }) => {
    setEarnedXp((prev) => prev + result.xp);
    setSolvedCount((prev) => prev + 1);
  };

  const handleNextExercise = () => {
    if (currentExerciseIndex < totalExercises - 1) {
      setCurrentExerciseIndex((prev) => prev + 1);
    } else {
      // Completed all exercises in section!
      setActiveStep('summary');
      onCompleteLesson(lesson.id, lesson.xpReward + earnedXp);
    }
  };

  const handlePostComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const user = StorageService.getUser();
    const stats = StorageService.getStats();
    const commentObj: DiscussionComment = {
      id: `comm-${Date.now()}`,
      lessonId: lesson.id,
      authorName: user.name,
      authorAvatar: user.name.slice(0, 2).toUpperCase(),
      authorRating: stats.learningRating,
      timestamp: 'Just now',
      content: newComment.trim(),
      upvotes: 0,
    };

    StorageService.addDiscussionComment(commentObj);
    setDiscussions([commentObj, ...discussions]);
    setNewComment('');
  };

  const handleUpvote = (id: string) => {
    setDiscussions(
      discussions.map((c) => {
        if (c.id === id) {
          const upvoted = c.userHasUpvoted;
          return {
            ...c,
            upvotes: upvoted ? c.upvotes - 1 : c.upvotes + 1,
            userHasUpvoted: !upvoted,
          };
        }
        return c;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Top Bar */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400">
              <BookOpen className="w-4 h-4" />
            </span>
            <div>
              <div className="text-[11px] uppercase font-semibold tracking-wider text-slate-400">
                Interactive Lesson
              </div>
              <h2 className="text-base sm:text-lg font-bold text-slate-100 font-display">
                {lesson.title}
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Tabs: Lesson vs Discussion */}
            <div className="flex items-center bg-slate-800 p-0.5 rounded-lg text-xs font-medium">
              <button
                onClick={() => setActiveTab('lesson')}
                className={`py-1.5 px-3 rounded-md transition-colors ${
                  activeTab === 'lesson'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Lesson
              </button>
              <button
                onClick={() => setActiveTab('discussion')}
                className={`py-1.5 px-3 rounded-md transition-colors flex items-center gap-1.5 ${
                  activeTab === 'discussion'
                    ? 'bg-slate-700 text-white shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Discussion ({discussions.length})</span>
              </button>
            </div>

            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6">
          {activeTab === 'discussion' ? (
            /* Discussion Forum */
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="border-b border-slate-800 pb-4">
                <h3 className="text-base font-bold text-slate-100 font-display mb-1">
                  Community Discussion & Analysis
                </h3>
                <p className="text-xs text-slate-400">
                  Ask questions, share tactical insights, and discuss concepts with fellow students.
                </p>
              </div>

              {/* Comment submission form */}
              <form onSubmit={handlePostComment} className="space-y-3">
                <textarea
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Share a tip or ask a question about this lesson..."
                  className="w-full h-24 p-3 bg-slate-950 border border-slate-800 rounded-lg text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-emerald-500 transition-colors resize-none"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newComment.trim()}
                    className="py-2 px-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Post Comment</span>
                  </button>
                </div>
              </form>

              {/* Comment List */}
              <div className="space-y-4 pt-2">
                {discussions.map((comment) => (
                  <div
                    key={comment.id}
                    className="p-4 bg-slate-950/60 border border-slate-800/80 rounded-xl space-y-2"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-6 h-6 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-[10px] font-bold text-emerald-400">
                          {comment.authorAvatar}
                        </div>
                        <span className="text-xs font-semibold text-slate-200">
                          {comment.authorName}
                        </span>
                        <span className="text-[11px] text-slate-400 font-mono-nums">
                          ({comment.authorRating})
                        </span>
                      </div>
                      <span className="text-[11px] text-slate-500">{comment.timestamp}</span>
                    </div>

                    <p className="text-xs text-slate-300 leading-relaxed">{comment.content}</p>

                    <div className="pt-2 flex items-center gap-4 text-xs text-slate-400">
                      <button
                        onClick={() => handleUpvote(comment.id)}
                        className={`flex items-center gap-1.5 hover:text-emerald-400 transition-colors ${
                          comment.userHasUpvoted ? 'text-emerald-400 font-semibold' : ''
                        }`}
                      >
                        <ThumbsUp className="w-3.5 h-3.5" />
                        <span className="font-mono-nums">{comment.upvotes} Helpful</span>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : activeStep === 'concept' ? (
            /* Step 1: Concept & Interactive Demonstration */
            <div className="flex flex-col lg:flex-row items-center gap-8 max-w-4xl mx-auto">
              <div className="w-full max-w-[420px] shrink-0">
                <Chessboard
                  fen={currentSection.demonstrationFen}
                  arrowGuide={currentSection.demonstrationArrows || []}
                  interactive={false}
                  showToolbar={true}
                  className="w-full max-w-[420px] shadow-2xl"
                />
                <div className="text-center mt-2 text-xs text-slate-400 font-mono-nums">
                  Interactive Diagram & Key Lines
                </div>
              </div>

              <div className="flex-1 space-y-5">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-emerald-400">
                    Step 1 · Theoretical Concept
                  </span>
                  <h3 className="text-xl font-bold text-slate-100 font-display mt-1 mb-3">
                    {currentSection.title}
                  </h3>
                  <p className="text-slate-300 text-sm leading-relaxed">
                    {currentSection.conceptIntro}
                  </p>
                </div>

                {currentSection.bulletPoints && (
                  <ul className="space-y-2 text-xs text-slate-300">
                    {currentSection.bulletPoints.map((point, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                )}

                <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-400">
                  <span className="font-semibold text-slate-200 block mb-1">Key Takeaway</span>
                  <span>{currentSection.keyTakeaway}</span>
                </div>

                <button
                  onClick={() => setActiveStep('exercises')}
                  className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg transition-colors shadow-md flex items-center justify-center gap-2"
                >
                  <span>Start Exercises ({totalExercises} drills)</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : activeStep === 'exercises' && currentExercise ? (
            /* Step 2: Interactive Exercises */
            <div>
              {/* Progress step counter */}
              <div className="flex items-center justify-between text-xs text-slate-400 mb-4 max-w-5xl mx-auto px-2">
                <span>
                  Exercise {currentExerciseIndex + 1} of {totalExercises}
                </span>
                <span className="font-mono-nums text-emerald-400">
                  Earned: +{earnedXp} XP
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
            /* Step 3: Performance Summary & Next Lesson Unlock */
            <div className="max-w-md mx-auto py-8 text-center space-y-6">
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center mx-auto shadow-lg">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-100 font-display">
                  Lesson Completed!
                </h3>
                <p className="text-slate-300 text-sm mt-1">
                  You have successfully understood the mechanics and solved all practice exercises for{' '}
                  <span className="text-emerald-400 font-medium">{lesson.title}</span>.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950 border border-slate-800 rounded-xl text-left">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase">XP Awarded</span>
                  <div className="text-xl font-bold text-emerald-400 font-mono-nums flex items-center gap-1">
                    <Zap className="w-4 h-4" />
                    <span>+{lesson.xpReward + earnedXp} XP</span>
                  </div>
                </div>
                <div>
                  <span className="text-[11px] text-slate-400 uppercase">Drills Solved</span>
                  <div className="text-xl font-bold text-slate-100 font-mono-nums">
                    {solvedCount} / {totalExercises}
                  </div>
                </div>
              </div>

              <button
                onClick={onClose}
                className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm rounded-lg shadow-md transition-colors"
              >
                Back to Curriculum
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
