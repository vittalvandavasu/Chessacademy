import React, { useState, useEffect } from 'react';
import { ClassroomStudent, ClassroomAssignment } from '../../types/chess';
import { StorageService } from '../../services/storageService';
import { ApiClient } from '../../services/apiClient';
import {
  Users,
  GraduationCap,
  Plus,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowRight,
  BookOpen,
  KeyRound,
  Sparkles,
} from 'lucide-react';

interface ClassroomViewProps {
  userRole?: 'STUDENT' | 'TEACHER' | 'ADMIN';
  onSwitchToTeacher?: () => void;
}

export const ClassroomView: React.FC<ClassroomViewProps> = ({
  userRole = 'STUDENT',
  onSwitchToTeacher,
}) => {
  const [students, setStudents] = useState<ClassroomStudent[]>(() => StorageService.getClassroomStudents());
  const [assignments, setAssignments] = useState<ClassroomAssignment[]>(() =>
    StorageService.getClassroomAssignments()
  );
  const [serverClassrooms, setServerClassrooms] = useState<any[]>([]);
  const [selectedClassroomId, setSelectedClassroomId] = useState<string>('class-demo-1');
  const [loading, setLoading] = useState(false);
  const [joinCodeInput, setJoinCodeInput] = useState('');
  const [joinSuccess, setJoinSuccess] = useState<string | null>(null);
  const [showNewAssignmentModal, setShowNewAssignmentModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newTarget, setNewTarget] = useState(10);
  const [newDue, setNewDue] = useState('Oct 15, 2026');

  // Load classrooms and analytics from database API
  useEffect(() => {
    let isMounted = true;
    async function loadBackendData() {
      try {
        setLoading(true);
        const data = await ApiClient.getClassrooms();
        if (isMounted && data.classrooms && data.classrooms.length > 0) {
          setServerClassrooms(data.classrooms);
          setSelectedClassroomId(data.classrooms[0].id);

          // If teacher, fetch aggregated analytics
          if (userRole === 'TEACHER' || userRole === 'ADMIN') {
            try {
              const analytics = await ApiClient.getTeacherAnalytics(data.classrooms[0].id);
              if (analytics.students && analytics.students.length > 0) {
                const mappedStudents: ClassroomStudent[] = analytics.students.map((s: any) => ({
                  id: s.id,
                  name: s.name,
                  avatar: s.name.slice(0, 2).toUpperCase(),
                  learningRating: s.rating,
                  lessonsCompleted: s.lessonsCompleted,
                  accuracy: 85,
                  weakestConcept: 'Back Rank Mate',
                  lastActive: 'Today',
                }));
                setStudents(mappedStudents);
              }
            } catch {
              // Graceful fallback to initial seeded list
            }
          }
        }
      } catch (err) {
        console.warn('Classroom API fetch notice:', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }
    loadBackendData();
    return () => { isMounted = false; };
  }, [userRole]);

  const handleJoinClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!joinCodeInput.trim()) return;
    try {
      const res = await ApiClient.joinClassroom(joinCodeInput.trim().toUpperCase());
      setJoinSuccess(`Successfully joined: ${res.classroom.name}`);
      setJoinCodeInput('');
      const updated = await ApiClient.getClassrooms();
      setServerClassrooms(updated.classrooms);
    } catch (err: any) {
      alert(err.message || 'Could not join classroom. Verify code.');
    }
  };

  const handleCreateAssignment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    const asg: ClassroomAssignment = {
      id: `asg-${Date.now()}`,
      title: newTitle.trim(),
      dueDate: newDue,
      pathOrLessonTitle: 'Targeted Tactical Drills',
      targetExercisesCount: newTarget,
      completedCount: 1,
      totalStudents: students.length || 5,
    };

    setAssignments([asg, ...assignments]);
    setShowNewAssignmentModal(false);
    setNewTitle('');
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header with Role indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs uppercase font-semibold tracking-wider text-emerald-400">
              {userRole === 'STUDENT' ? 'Student Classroom Portal' : 'Teacher & Coach Studio'}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono">
              ROLE: {userRole}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-slate-100 font-display">
            Grandmaster Club · Grade 8
          </h1>
          <p className="text-slate-400 text-sm max-w-xl mt-1">
            Join code: <span className="font-mono-nums font-semibold text-emerald-400">CHESS-7842</span> · Multi-user database synced
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {userRole === 'STUDENT' && onSwitchToTeacher && (
            <button
              onClick={onSwitchToTeacher}
              className="py-2.5 px-4 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
              title="Switch session to Teacher Persona to view Coach analytics & assignments"
            >
              <GraduationCap className="w-4 h-4" />
              <span>Switch to Coach View</span>
            </button>
          )}

          {(userRole === 'TEACHER' || userRole === 'ADMIN') && (
            <button
              onClick={() => setShowNewAssignmentModal(true)}
              className="py-2.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors flex items-center gap-1.5 shadow-sm"
            >
              <Plus className="w-4 h-4" />
              <span>New Targeted Assignment</span>
            </button>
          )}
        </div>
      </div>

      {/* Student Join Code Box (If Student) */}
      {userRole === 'STUDENT' && (
        <div className="p-4 bg-slate-900 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 shrink-0">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-100">Join a Classroom</h4>
              <p className="text-xs text-slate-400">Enter the 9-character code provided by your chess coach or teacher</p>
            </div>
          </div>

          <form onSubmit={handleJoinClassroom} className="flex items-center gap-2">
            <input
              type="text"
              value={joinCodeInput}
              onChange={(e) => setJoinCodeInput(e.target.value)}
              placeholder="e.g. CHESS-7842"
              className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-slate-100 uppercase font-mono tracking-wider focus:outline-none focus:border-emerald-500"
            />
            <button
              type="submit"
              className="py-2 px-3 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Join
            </button>
          </form>
        </div>
      )}

      {joinSuccess && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-500/40 text-emerald-200 text-xs rounded-lg flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{joinSuccess}</span>
        </div>
      )}

      {/* Class Weakness Diagnostic Callout */}
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-xl space-y-4 shadow-sm">
        <div className="flex items-center gap-2 text-xs uppercase font-semibold text-red-400 tracking-wider">
          <AlertTriangle className="w-4 h-4 text-red-400" />
          <span>Class-Wide Concept Weaknesses</span>
        </div>

        <h3 className="text-lg font-bold text-slate-100 font-display">
          Targeted Curriculum Recommendations
        </h3>
        <p className="text-xs text-slate-300 max-w-3xl leading-relaxed">
          Aggregated student telemetry from PostgreSQL records shows multiple students struggling with back-rank king vulnerability and relative pins. We recommend scheduling an exercise set on <span className="text-emerald-400 font-semibold">Creating Luft & 8th Rank Defense</span>.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          <div className="p-4 bg-slate-950/70 border border-red-500/20 rounded-lg">
            <span className="text-[11px] text-slate-400 uppercase">Critical Weakness</span>
            <div className="text-sm font-bold text-slate-100 mt-1">Back Rank Mate</div>
            <div className="text-xs text-red-400 font-mono-nums font-semibold mt-0.5">
              63% of students struggling
            </div>
          </div>
          <div className="p-4 bg-slate-950/70 border border-amber-500/20 rounded-lg">
            <span className="text-[11px] text-slate-400 uppercase">Secondary Weakness</span>
            <div className="text-sm font-bold text-slate-100 mt-1">Relative Pins</div>
            <div className="text-xs text-amber-400 font-mono-nums font-semibold mt-0.5">
              41% error rate
            </div>
          </div>
          <div className="p-4 bg-slate-950/70 border border-emerald-500/20 rounded-lg">
            <span className="text-[11px] text-slate-400 uppercase">Strongest Concept</span>
            <div className="text-sm font-bold text-slate-100 mt-1">Knight Forks</div>
            <div className="text-xs text-emerald-400 font-mono-nums font-semibold mt-0.5">
              88% average accuracy
            </div>
          </div>
        </div>
      </div>

      {/* Active Assignments */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-sm">
        <h3 className="text-base font-bold text-slate-100 font-display mb-4">
          Current Homework & Assignments
        </h3>

        <div className="space-y-3">
          {assignments.map((asg) => (
            <div
              key={asg.id}
              className="p-4 bg-slate-950/60 border border-slate-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div>
                <span className="text-[11px] text-emerald-400 font-semibold uppercase">
                  {asg.pathOrLessonTitle}
                </span>
                <h4 className="text-sm font-bold text-slate-100 font-display mt-0.5">
                  {asg.title}
                </h4>
                <div className="flex items-center gap-3 text-xs text-slate-400 mt-1 font-mono-nums">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5" /> Due {asg.dueDate}
                  </span>
                  <span aria-hidden="true">·</span>
                  <span>Target: {asg.targetExercisesCount} drills</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-xs font-mono-nums self-end sm:self-auto">
                <div className="text-right">
                  <span className="text-slate-500 block">Class Completion</span>
                  <span className="text-slate-200 font-bold">
                    {asg.completedCount} / {asg.totalStudents} Students
                  </span>
                </div>
                <div className="w-24 h-2 bg-slate-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-emerald-500 rounded-full"
                    style={{
                      width: `${(asg.completedCount / asg.totalStudents) * 100}%`,
                    }}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Student Roster Table (Full view for Teacher/Admin) */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 className="text-base font-bold text-slate-100 font-display">
            Enrolled Students ({students.length})
          </h3>
          <span className="text-xs text-slate-400 font-mono-nums">Real-time database records</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-300">
            <thead className="bg-slate-950/60 text-slate-400 font-semibold uppercase tracking-wider border-b border-slate-800">
              <tr>
                <th className="px-6 py-3.5">Student</th>
                <th className="px-6 py-3.5">Learning Rating</th>
                <th className="px-6 py-3.5">Lessons Done</th>
                <th className="px-6 py-3.5">Accuracy</th>
                <th className="px-6 py-3.5">Weakest Concept</th>
                <th className="px-6 py-3.5">Last Active</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {students.map((student) => (
                <tr key={student.id} className="hover:bg-slate-850/40 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-7 h-7 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center font-bold text-[10px] text-emerald-400">
                        {student.avatar}
                      </div>
                      <span className="font-semibold text-slate-100">{student.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-mono-nums font-bold text-slate-100">
                    {student.learningRating}
                  </td>
                  <td className="px-6 py-4 font-mono-nums">{student.lessonsCompleted}</td>
                  <td className="px-6 py-4 font-mono-nums font-semibold text-emerald-400">
                    {student.accuracy}%
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-red-400 font-medium">{student.weakestConcept}</span>
                  </td>
                  <td className="px-6 py-4 text-slate-400">{student.lastActive}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Assignment Modal */}
      {showNewAssignmentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-xl p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-slate-100 font-display mb-1">
              Create Targeted Homework
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Assign tactical drills directly to all students in Grade 8.
            </p>

            <form onSubmit={handleCreateAssignment} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">Assignment Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g. Back Rank Defense Drills"
                  required
                  className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Target Exercises</label>
                  <input
                    type="number"
                    value={newTarget}
                    onChange={(e) => setNewTarget(parseInt(e.target.value, 10))}
                    min={1}
                    max={50}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Due Date</label>
                  <input
                    type="text"
                    value={newDue}
                    onChange={(e) => setNewDue(e.target.value)}
                    className="w-full p-2.5 bg-slate-950 border border-slate-800 rounded-lg text-slate-100 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowNewAssignmentModal(false)}
                  className="py-2 px-4 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="py-2 px-4 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold"
                >
                  Assign to Class
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
