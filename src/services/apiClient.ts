export interface AttemptResponse {
  isLegal: boolean;
  isSuccess: boolean;
  verdict?: string;
  playedSan?: string;
  resultingFen?: string;
  isCheck?: boolean;
  isCheckmate?: boolean;
  explanation: string;
  opponentReplySan?: string;
  opponentReplyFen?: string;
  nextStepIndex?: number;
  isSequenceComplete: boolean;
  gamification?: {
    xpAwarded: number;
    ratingDelta: number;
    newRating: number;
    newTotalXp: number;
    newStreak: number;
    isRewardEligible: boolean;
    unlockedAchievements: string[];
  };
}

export class ApiClient {
  private static async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const res = await fetch(`/api${endpoint}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      credentials: 'include', // Includes HTTP-only auth cookie
    });

    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || 'Server request failed');
    }
    return data;
  }

  // Auth APIs
  public static async getMe() {
    return this.request<{ user: any }>('/me');
  }

  public static async login(credentials: { email: string; password: string }) {
    return this.request<{ user: any; token: string }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  public static async register(data: { email: string; password: string; fullName: string; role?: string }) {
    return this.request<{ user: any; token: string }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  public static async magicLink(email: string) {
    return this.request<{ user: any; token: string; message: string }>('/auth/magic-link', {
      method: 'POST',
      body: JSON.stringify({ email }),
    });
  }

  public static async googleAuth(googleData: { email: string; fullName: string; googleId: string; avatarUrl?: string }) {
    return this.request<{ user: any; token: string }>('/auth/google', {
      method: 'POST',
      body: JSON.stringify(googleData),
    });
  }

  public static async switchDemoRole(role: 'STUDENT' | 'TEACHER' | 'ADMIN') {
    return this.request<{ user: any; token: string; switchedToRole: string }>('/auth/demo-switch', {
      method: 'POST',
      body: JSON.stringify({ role }),
    });
  }

  public static async logout() {
    return this.request<{ message: string }>('/auth/logout', { method: 'POST' });
  }

  // Curriculum & Exercises
  public static async getPaths() {
    return this.request<{ paths: any[] }>('/paths');
  }

  public static async getLesson(id: string) {
    return this.request<{ lesson: any }>(`/lessons/${id}`);
  }

  public static async completeLesson(id: string) {
    return this.request<{ message: string; xpAwarded: number; isCompleted: boolean }>(`/lessons/${id}/complete`, {
      method: 'POST',
    });
  }

  public static async submitExerciseAttempt(
    exerciseId: string,
    payload: {
      from: string;
      to: string;
      promotion?: 'q' | 'r' | 'b' | 'n';
      stepIndex?: number;
      hintsUsed?: number;
      timeTakenMs?: number;
    }
  ): Promise<AttemptResponse> {
    return this.request<AttemptResponse>(`/exercises/${exerciseId}/attempt`, {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Mastery & Practice
  public static async getMastery() {
    return this.request<{ masteryList: any[] }>('/mastery');
  }

  public static async getDailyPractice() {
    return this.request<{ session: any }>('/daily-practice');
  }

  public static async getProgress() {
    return this.request<{ profile: any; completedLessons: string[]; totalAttemptsCount: number }>('/progress');
  }

  // Classroom
  public static async getClassrooms() {
    return this.request<{ classrooms: any[] }>('/classrooms');
  }

  public static async createClassroom(name: string) {
    return this.request<{ classroom: any }>('/classrooms', {
      method: 'POST',
      body: JSON.stringify({ name }),
    });
  }

  public static async joinClassroom(joinCode: string) {
    return this.request<{ message: string; classroom: any }>(`/classrooms/join`, {
      method: 'POST',
      body: JSON.stringify({ joinCode }),
    });
  }

  public static async getTeacherAnalytics(classroomId: string) {
    return this.request<any>(`/teacher/classrooms/${classroomId}/analytics`);
  }

  // Admin CMS
  public static async getAdminExercises() {
    return this.request<{ exercises: any[] }>('/admin/exercises');
  }

  public static async createAdminExercise(exercise: any) {
    return this.request<{ exercise: any; verification: any }>('/admin/exercises', {
      method: 'POST',
      body: JSON.stringify(exercise),
    });
  }

  public static async verifyAdminExercise(id: string) {
    return this.request<{ verification: any }>(`/admin/exercises/${id}/verify`, {
      method: 'POST',
    });
  }

  // LocalStorage Migration
  public static async migrateLocalStorage(payload: any) {
    return this.request<{ message: string; migrated: boolean }>('/migrate', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }
}
