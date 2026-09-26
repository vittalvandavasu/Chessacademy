import React, { useState } from 'react';
import { UserProfile, StorageService } from '../../services/storageService';
import { UserStats } from '../../types/chess';
import { ApiClient } from '../../services/apiClient';
import {
  X,
  Award,
  User,
  Flame,
  Zap,
  Shield,
  RotateCcw,
  LogIn,
  LogOut,
  UploadCloud,
  CheckCircle2,
  GraduationCap,
} from 'lucide-react';

interface ProfileModalProps {
  user: UserProfile & { role?: string; id?: string };
  stats: UserStats;
  onClose: () => void;
  onUpdateUser: (user: UserProfile) => void;
  onResetDemo: () => void;
  onOpenAuth: () => void;
  onLogout: () => void;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  user,
  stats,
  onClose,
  onUpdateUser,
  onResetDemo,
  onOpenAuth,
  onLogout,
}) => {
  const [migrationStatus, setMigrationStatus] = useState<string | null>(null);
  const [migrating, setMigrating] = useState(false);

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationStatus(null);
    try {
      const res = await ApiClient.migrateLocalStorage({
        totalXp: stats.totalXp,
        learningRating: stats.learningRating,
        completedLessons: StorageService.getCompletedLessons(),
        currentStreakDays: stats.currentStreakDays,
      });
      setMigrationStatus(res.message || 'Progress synced into database!');
    } catch (err: any) {
      setMigrationStatus('Migration error: ' + err.message);
    } finally {
      setMigrating(false);
    }
  };

  const userRole = user.role || 'STUDENT';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-slate-950/85 backdrop-blur-sm">
      <div className="relative w-full max-w-md my-auto bg-slate-900 border border-slate-800 rounded-2xl p-5 sm:p-6 shadow-2xl space-y-5 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-emerald-400" />
            <h3 className="text-base font-bold text-slate-100 font-display">Account & Profile</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-emerald-500/20 border-2 border-emerald-500/40 text-emerald-400 flex items-center justify-center font-bold text-lg font-display shrink-0">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-slate-100 truncate">{user.name}</h4>
              <span className={`text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold ${
                userRole === 'ADMIN'
                  ? 'bg-amber-500/20 text-amber-300'
                  : userRole === 'TEACHER'
                  ? 'bg-indigo-500/20 text-indigo-300'
                  : 'bg-emerald-500/20 text-emerald-300'
              }`}>
                {userRole}
              </span>
            </div>
            <p className="text-xs text-slate-400 truncate">{user.email}</p>
            <div className="text-[11px] text-emerald-400 font-semibold mt-0.5">
              {user.chessExperience}
            </div>
          </div>
        </div>

        {/* Metric tiles */}
        <div className="grid grid-cols-2 gap-3 p-4 bg-slate-950/60 border border-slate-800 rounded-xl text-xs font-mono-nums">
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Learning Rating</span>
            <span className="text-slate-100 font-bold text-base">{stats.learningRating}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Total XP (Level {stats.level})</span>
            <span className="text-emerald-400 font-bold text-base">+{stats.totalXp}</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Streak Days</span>
            <span className="text-amber-400 font-bold text-base">{stats.currentStreakDays}d</span>
          </div>
          <div>
            <span className="text-slate-500 block text-[10px] uppercase">Lessons Solved</span>
            <span className="text-slate-100 font-bold text-base">{stats.lessonsCompleted}</span>
          </div>
        </div>

        {/* Sync LocalStorage to Database */}
        <div className="p-3 bg-slate-950/40 border border-slate-800 rounded-xl space-y-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs text-slate-300 font-medium">
              <UploadCloud className="w-4 h-4 text-emerald-400" />
              <span>Sync Local Progress to Database</span>
            </div>
            <button
              onClick={handleMigrate}
              disabled={migrating}
              className="py-1 px-2.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs rounded border border-slate-700 transition-colors disabled:opacity-50"
            >
              {migrating ? 'Syncing...' : 'Sync Now'}
            </button>
          </div>
          {migrationStatus && (
            <p className="text-[11px] text-emerald-400">{migrationStatus}</p>
          )}
        </div>

        {/* Actions */}
        <div className="pt-2 border-t border-slate-800 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <button
              onClick={onOpenAuth}
              className="py-2 px-3 text-xs bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg border border-slate-700 transition-colors flex items-center gap-1.5"
            >
              <LogIn className="w-3.5 h-3.5 text-emerald-400" />
              <span>Switch User / Roles</span>
            </button>

            <button
              onClick={onLogout}
              className="py-2 px-3 text-xs text-slate-400 hover:text-red-400 transition-colors flex items-center gap-1.5"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1">
            <button
              onClick={onResetDemo}
              className="text-[11px] text-slate-500 hover:text-red-400 transition-colors flex items-center gap-1"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Reset Demo Progress</span>
            </button>

            <button
              onClick={onClose}
              className="py-1.5 px-4 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
