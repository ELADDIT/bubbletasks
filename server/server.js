import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3001;
const uploadsDir = path.join(__dirname, 'uploads');

await fs.mkdir(uploadsDir, { recursive: true });

// Middleware
app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173', 'http://localhost:5174', 'http://127.0.0.1:5174'],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json({ limit: '10mb' })); // For base64 images
app.use(express.static(uploadsDir)); // Serve uploaded files

// Configure multer for file uploads
const upload = multer({
  dest: uploadsDir,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB limit
  }
});

// Data storage (in production, use a real database)
let tasks = [];
const TASKS_FILE = path.join(__dirname, 'tasks.json');

// Load tasks from file on startup
async function loadTasks() {
  try {
    const data = await fs.readFile(TASKS_FILE, 'utf8');
    tasks = JSON.parse(data);
    console.log(`Loaded ${tasks.length} tasks from file`);
  } catch (error) {
    console.log('No existing tasks file found, starting fresh');
    tasks = [];
  }
}

async function saveTasks() {
  try {
    await fs.writeFile(
      TASKS_FILE,
      JSON.stringify(tasks, null, 2),
      'utf8'
    );
    console.log(`Saved ${tasks.length} tasks to file`);
  } catch (error) {
    console.error('Error saving tasks:', error);
  }
}

// Task status types
const TASK_STATUSES = ['Queued', 'Active', 'Paused', 'Done'];

// API Routes

// GET /api/tasks - Get all tasks
app.get('/api/tasks', (req, res) => {
  res.json({
    success: true,
    tasks: tasks
  });
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, estMinutes, imageDataUrl } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    // Determine status based on existing tasks
    const hasActiveTask = tasks.some(task => task.status === 'Active');
    const status = hasActiveTask ? 'Queued' : 'Active';

    const newTask = {
      id: nanoid(),
      title: title.trim(),
      estMinutes: estMinutes || 25,
      status: status,
      imageDataUrl: imageDataUrl || null,
      templateKey: title.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    tasks.push(newTask);
    await saveTasks();

    res.status(201).json({
      success: true,
      task: newTask
    });
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// PUT /api/tasks/:id - Update a task
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, estMinutes, status, imageDataUrl } = req.body;

    const timerMetadataUpdates = Object.entries(req.body).reduce((acc, [key, value]) => {
      if ((key === 'remainingSeconds' || key.startsWith('timer')) && value !== undefined) {
        acc[key] = value;
      }
      return acc;
    }, {});
    
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    // Validate status if provided
    if (status && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task status'
      });
    }

    // Update task
    const updatedTask = {
      ...tasks[taskIndex],
      ...(title && { title: title.trim() }),
      ...(estMinutes !== undefined && { estMinutes }),
      ...(status && { status }),
      ...(imageDataUrl !== undefined && { imageDataUrl }),
      ...timerMetadataUpdates,
      updatedAt: new Date().toISOString()
    };

    tasks[taskIndex] = updatedTask;
    await saveTasks();

    res.json({
      success: true,
      task: updatedTask
    });
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// DELETE /api/tasks/:id - Delete a task
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const taskIndex = tasks.findIndex(task => task.id === id);
    if (taskIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

    const deletedTask = tasks.splice(taskIndex, 1)[0];
    await saveTasks();

    res.json({
      success: true,
      task: deletedTask
    });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/upload - Upload image file
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const imageUrl = `http://localhost:${PORT}/${req.file.filename}`;
    
    res.json({
      success: true,
      imageUrl: imageUrl,
      filename: req.file.filename
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'BubbleTasks API is running',
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error'
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found'
  });
});

// Start server
async function startServer() {
  try {
    await loadTasks();
    console.log('✅ Tasks loaded successfully');
    
    const server = app.listen(PORT, '127.0.0.1', () => {
      console.log(`🚀 BubbleTasks API server running on http://localhost:${PORT}`);
      console.log('📚 Available endpoints:');
      console.log('  GET    /api/health');
      console.log('  GET    /api/tasks');
      console.log('  POST   /api/tasks');
      console.log('  PUT    /api/tasks/:id');
      console.log('  DELETE /api/tasks/:id');
      console.log('  POST   /api/upload');
    });

    server.on('error', (err) => {
      console.error('❌ Server error:', err);
    });

    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer().catch(console.error);