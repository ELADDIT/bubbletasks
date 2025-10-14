import { create } from 'zustand';
import type { Task } from '../types';
import { TaskAPI } from '../services/api';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  isMutating: boolean;
  error: string | null;
  
  // Actions
  fetchTasks: () => Promise<void>;
  addTask: (title: string, estMinutes: number, imageDataUrl?: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTasks = create<TaskState>((set, get) => ({
  tasks: [],
  isLoading: false,
  isMutating: false,
  error: null,

  // Fetch all tasks from server
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await TaskAPI.getTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false
      });
    }
  },

  // Add a new task
  addTask: async (title, estMinutes, imageDataUrl) => {
    set({ isMutating: true, error: null });
    try {
      const newTask = await TaskAPI.createTask(title, estMinutes, imageDataUrl);
      set({
        tasks: [...get().tasks, newTask],
        isMutating: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to create task',
        isMutating: false
      });
      throw error; // Re-throw so UI can handle it
    }
  },

  // Update an existing task
  updateTask: async (id, updates) => {
    set({ isMutating: true, error: null });
    try {
      const updatedTask = await TaskAPI.updateTask(id, updates);
      set({
        tasks: get().tasks.map(task =>
          task.id === id ? updatedTask : task
        ),
        isMutating: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to update task',
        isMutating: false
      });
      throw error;
    }
  },

  // Delete a task
  deleteTask: async (id) => {
    set({ isMutating: true, error: null });
    try {
      await TaskAPI.deleteTask(id);
      set({
        tasks: get().tasks.filter(task => task.id !== id),
        isMutating: false
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isMutating: false
      });
      throw error;
    }
  },

  // Clear error state
  clearError: () => {
    set({ error: null });
  }
}));
