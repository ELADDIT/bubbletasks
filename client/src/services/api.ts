import type { Task, TaskStatus } from '../types';

// API configuration
const API_BASE_URL = 'http://localhost:3001/api';

// API service for communicating with the backend
export class TaskAPI {
  // Get all tasks
  static async getTasks() {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`);
      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to fetch tasks');
      }
      
      return data.tasks;
    } catch (error) {
      console.error('Error fetching tasks:', error);
      throw error;
    }
  }

  // Create a new task
  static async createTask(title: string, estMinutes: number, imageDataUrl?: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title,
          estMinutes,
          imageDataUrl
        })
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to create task');
      }
      
      return data.task;
    } catch (error) {
      console.error('Error creating task:', error);
      throw error;
    }
  }

  // Update a task
  static async updateTask(
    id: string,
    updates: Partial<Pick<Task, 'title' | 'estMinutes' | 'status' | 'imageDataUrl' | 'remainingSeconds' | 'timerStartedAt'>> & {
      status?: TaskStatus;
    }
  ) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updates)
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to update task');
      }
      
      return data.task;
    } catch (error) {
      console.error('Error updating task:', error);
      throw error;
    }
  }

  // Delete a task
  static async deleteTask(id: string) {
    try {
      const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
        method: 'DELETE',
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to delete task');
      }
      
      return data.task;
    } catch (error) {
      console.error('Error deleting task:', error);
      throw error;
    }
  }

  // Upload image file
  static async uploadImage(file: File) {
    try {
      const formData = new FormData();
      formData.append('image', file);

      const response = await fetch(`${API_BASE_URL}/upload`, {
        method: 'POST',
        body: formData
      });

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to upload image');
      }
      
      return data.imageUrl;
    } catch (error) {
      console.error('Error uploading image:', error);
      throw error;
    }
  }

  // Check server health
  static async checkHealth() {
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const data = await response.json();
      return data.success;
    } catch (error) {
      console.error('Error checking server health:', error);
      return false;
    }
  }
}