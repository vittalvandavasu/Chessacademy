import React, { useState } from 'react';
import { UserProfile, StorageService } from '../../services/storageService';
import { UserStats } from '../../types/chess';
import { ApiClient } from '../../services/apiClient';
import {
  X,
  User,
  Flame,
  Award,
  RotateCcw,
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
      setMigrationStatus('Sync notice: ' + (err.message || 'Saved locally'));
    } finally {
      setMigrating(false);
    }
  };

  const userRole = user.role || 'STUDENT';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center p-3 sm:p-4 bg-[#171717]/40 backdrop-blur-xs">
      <div className="relative w-full max-w-md my-auto bg-[#F5F1E8] border border-[#D5D0C5] rounded shadow-2xl p-6 text-[#171717] space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-[#D5D0C5]">
          <div className="flex items-center gap-2">
            <span className="w-7 h-7 rounded border border-[#D5D0C5] bg-[#E8E3D8] flex items-center justify-center text-[#315C45]">
              <User className="w-4 h-4" />
            </span>
            <h3 className="text-base font-bold font-display text-[#171717]">
              Academic Dossier
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded hover:bg-[#E8E3D8] text-[#171717]/70 hover:text-[#171717] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* User Card */}
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[#E8E3D8] border border-[#D5D0C5] text-[#315C45] flex items-center justify-center font-bold text-lg font-display shrink-0">
            {user.name.split(' ').map((n) => n[0]).join('')}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-base font-bold text-[#171717] truncate">{user.name}</h4>
              <span className="text-[10px] px-1.5 py-0.5 rounded font-mono font-semibold bg-[#E8E3D8] text-[#315C45] border border-[#D5D0C5]">
                {userRole}
              </span>
            </div>
            <p className="text-xs text-[#171717]/60 truncate">{user.email}</p>
            <div className="text-[11px] text-[#315C45] font-semibold mt-0.5">
              {user.chessExperience}
            </div>
          </div>
        </div>

        {/* Academic Stats Grid */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-[#E8E3D8] border border-[#D5D0C5] rounded text-center">
          <div>
            <span className="text-[10px] text-[#171717]/60 uppercase block">Rating</span>
            <span className="text-base font-bold text-[#171717] font-mono">
              {stats.learningRating}
            </span>
          </div>
          <div className="border-x border-[#D5D0C5]">
            <span className="text-[10px] text-[#171717]/60 uppercase block">Discipline</span>
            <span className="text-base font-bold text-[#315C45] font-mono">
              {stats.currentStreakDays}d
            </span>
          </div>
          <div>
            <span className="text-[10px] text-[#171717]/60 uppercase block">Level</span>
            <span className="text-base font-bold text-[#171717] font-mono">
              {stats.level}
            </span>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-2 pt-2 border-t border-[#D5D0C5]">
          <button
            onClick={handleMigrate}
            disabled={migrating}
            className="w-full py-2.5 px-3 bg-[#E8E3D8] hover:bg-[#D5D0C5] border border-[#D5D0C5] rounded text-xs font-semibold text-[#171717] transition-colors flex items-center justify-center gap-2"
          >
            <UploadCloud className="w-3.5 h-3.5 text-[#315C45]" />
            <span>{migrating ? 'Syncing...' : 'Sync Progress to Cloud'}</span>
          </button>

          {migrationStatus && (
            <p className="text-[11px] text-center text-[#315C45] font-medium">
              {migrationStatus}
            </p>
          )}

          {onOpenAuth && (
            <button
              onClick={() => {
                onClose();
                onOpenAuth();
              }}
              className="w-full py-2 px-3 border border-[#D5D0C5] hover:bg-[#E8E3D8] rounded text-xs font-semibold text-[#171717] transition-colors"
            >
              Switch Role (Student / Teacher / Admin)
            </button>
          )}

          <div className="flex items-center justify-between pt-3">
            <button
              onClick={onResetDemo}
              className="text-xs text-[#171717]/60 hover:text-[#B94A48] flex items-center gap-1 transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset Demo State</span>
            </button>

            <button
              onClick={onLogout}
              className="text-xs text-[#171717]/60 hover:text-[#171717] flex items-center gap-1 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Sign Out</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
