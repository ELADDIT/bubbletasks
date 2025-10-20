import { create } from 'zustand';
import type { Task } from '../types';
import { TaskAPI } from '../services/api';

const sortActiveTasks = (tasks: Task[]) => {
  return [...tasks].sort((a, b) => {
    const aDate = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const bDate = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (aDate !== bDate) {
      return aDate - bDate;
    }
    return a.title.localeCompare(b.title);
  });
};

const sortArchivedTasks = (tasks: Task[]) => {
  return [...tasks].sort((a, b) => {
    const aTime = a.archivedAt
      ? new Date(a.archivedAt).getTime()
      : a.updatedAt
        ? new Date(a.updatedAt).getTime()
        : 0;
    const bTime = b.archivedAt
      ? new Date(b.archivedAt).getTime()
      : b.updatedAt
        ? new Date(b.updatedAt).getTime()
        : 0;

    if (aTime !== bTime) {
      return bTime - aTime;
    }

    return a.title.localeCompare(b.title);
  });
};

interface TaskState {
  tasks: Task[];
  archivedTasks: Task[];
  isLoading: boolean;
  isLoadingArchive: boolean;
  isMutating: boolean;
  error: string | null;

  // Actions
  fetchTasks: () => Promise<void>;
  fetchArchivedTasks: () => Promise<void>;
  addTask: (title: string, estMinutes: number, imageDataUrl?: string) => Promise<void>;
  updateTask: (id: string, updates: Partial<Task>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  getSortedTasks: () => Task[];
  completeAndActivateNext: (id: string) => Promise<void>;
  clearError: () => void;
}

export const useTasks = create<TaskState>((set, get) => ({
  tasks: [],
  archivedTasks: [],
  isLoading: false,
  isLoadingArchive: false,
  isMutating: false,
  error: null,

  // Fetch all tasks from server
  fetchTasks: async () => {
    set({ isLoading: true, error: null });
    try {
      const tasks = await TaskAPI.getTasks('active');
      set({ tasks: sortActiveTasks(tasks), isLoading: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch tasks',
        isLoading: false
      });
    }
  },

  fetchArchivedTasks: async () => {
    set({ isLoadingArchive: true, error: null });
    try {
      const tasks = await TaskAPI.getTasks('archived');
      set({ archivedTasks: sortArchivedTasks(tasks), isLoadingArchive: false });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to fetch archived tasks',
        isLoadingArchive: false
      });
    }
  },

  // Add a new task
  addTask: async (title, estMinutes, imageDataUrl) => {
    set({ isMutating: true, error: null });
    try {
      const newTask = await TaskAPI.createTask(title, estMinutes, imageDataUrl);
      set(state => {
        if (newTask.isArchived) {
          return {
            archivedTasks: sortArchivedTasks([newTask, ...state.archivedTasks.filter(task => task.id !== newTask.id)]),
            isMutating: false
          };
        }

        return {
          tasks: sortActiveTasks([...state.tasks, newTask]),
          archivedTasks: state.archivedTasks.filter(task => task.id !== newTask.id),
          isMutating: false
        };
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
      set(state => {
        const filteredArchived = state.archivedTasks.filter(task => task.id !== updatedTask.id);

        if (updatedTask.isArchived) {
          return {
            tasks: state.tasks.filter(task => task.id !== updatedTask.id),
            archivedTasks: sortArchivedTasks([updatedTask, ...filteredArchived]),
            isMutating: false
          };
        }

        const updatedTasks = state.tasks.some(task => task.id === updatedTask.id)
          ? state.tasks.map(task => (task.id === updatedTask.id ? updatedTask : task))
          : [...state.tasks, updatedTask];

        return {
          tasks: sortActiveTasks(updatedTasks),
          archivedTasks: filteredArchived,
          isMutating: false
        };
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
      set(state => ({
        tasks: state.tasks.filter(task => task.id !== id),
        archivedTasks: state.archivedTasks.filter(task => task.id !== id),
        isMutating: false
      }));
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to delete task',
        isMutating: false
      });
      throw error;
    }
  },

  getSortedTasks: () => {
    return sortActiveTasks(get().tasks);
  },

  completeAndActivateNext: async (id) => {
    set({ isMutating: true, error: null });
    try {
      const sortedTasks = get().getSortedTasks();
      const completedTask = await TaskAPI.updateTask(id, { status: 'Completed', remainingSeconds: 0 });

      const nextUpcomingTask = sortedTasks.find(task => task.status === 'Upcoming' && task.id !== id);
      let activatedTask: Task | null = null;

      if (nextUpcomingTask) {
        activatedTask = await TaskAPI.updateTask(nextUpcomingTask.id, {
          status: 'Active',
          remainingSeconds: nextUpcomingTask.estMinutes * 60,
          timerStartedAt: new Date().toISOString()
        });
      }

      set(state => {
        const withoutCompleted = state.tasks.filter(task => task.id !== completedTask.id);

        let tasksWithActivation = withoutCompleted;
        if (activatedTask) {
          const hasUpcoming = withoutCompleted.some(task => task.id === activatedTask!.id);
          tasksWithActivation = hasUpcoming
            ? withoutCompleted.map(task => (task.id === activatedTask!.id ? activatedTask! : task))
            : [...withoutCompleted, activatedTask!];
        }

        const archivedWithoutCompleted = state.archivedTasks.filter(task => task.id !== completedTask.id);
        const updatedArchived = sortArchivedTasks([completedTask, ...archivedWithoutCompleted]);

        return {
          tasks: sortActiveTasks(tasksWithActivation),
          archivedTasks: updatedArchived,
          isMutating: false
        };
      });
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Failed to complete task',
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
