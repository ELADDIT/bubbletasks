// Types for BubbleTasks application
export type TaskStatus = 'Queued' | 'Active' | 'Paused' | 'Done';

export interface Task {
  id: string;
  title: string;
  estMinutes: number;
  status: TaskStatus;
  imageDataUrl?: string;
  templateKey: string;
}
