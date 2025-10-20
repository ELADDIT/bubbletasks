// Types for BubbleTasks application
export type TaskStatus = 'Upcoming' | 'Active' | 'Paused' | 'Completed' | 'Cancelled';

export interface Task {
  id: string;
  title: string;
  estMinutes: number;
  status: TaskStatus;
  imageDataUrl?: string;
  templateKey: string;
  remainingSeconds?: number;
  timerStartedAt?: string;
  createdAt?: string;
  updatedAt?: string;
  isArchived: boolean;
  archivedAt?: string;
}
