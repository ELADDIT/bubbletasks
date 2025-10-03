import { create } from 'zustand';
import { nanoid } from 'nanoid';
import type { Task } from '../types';
import { loadTemplateImage } from '../utils/storage';

interface TaskState {
  tasks: Task[];
  addTask: (title: string, estMinutes: number, imageDataUrl?: string) => void;
}

export const useTasks = create<TaskState>((set, get) => ({
  tasks: [],
  addTask: (title, estMinutes, imageFromPicker) => {
    const templateKey = title ? title.trim().toLowerCase() : 'task';
    const savedImage = loadTemplateImage(templateKey);
    const imageDataUrl = imageFromPicker ?? savedImage;

    const newTask: Task = {
      id: nanoid(),
      title,
      estMinutes,
      status: get().tasks.some(t => t.status === 'Active') ? 'Queued' : 'Active',
      imageDataUrl,
      templateKey,
    };

    set({ tasks: [...get().tasks, newTask] });
  },
}));
