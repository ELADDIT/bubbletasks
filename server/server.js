import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { nanoid } from 'nanoid';
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { execFile } from 'child_process';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const execFileAsync = promisify(execFile);

const app = express();
const portFromEnv = Number.parseInt(process.env.PORT ?? '', 10);
const PORT = Number.isFinite(portFromEnv) ? portFromEnv : 3001;
const HOST = process.env.HOST || '0.0.0.0';
const DEFAULT_CORS_ORIGINS = [
  'http://localhost:4173',
  'http://127.0.0.1:4173',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:5174',
  'http://127.0.0.1:5174'
];
const ALLOWED_ORIGINS = new Set(
  (process.env.CORS_ORIGINS ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean)
);
DEFAULT_CORS_ORIGINS.forEach((origin) => ALLOWED_ORIGINS.add(origin));
const corsOriginHandler = (origin, callback) => {
  if (!origin || ALLOWED_ORIGINS.has(origin)) {
    return callback(null, true);
  }
  return callback(new Error(`Origin ${origin} not allowed by CORS`));
};
const uploadsDir = path.join(__dirname, 'uploads');
const dataDir = path.join(__dirname, 'data');
const dbPath = path.join(dataDir, 'tasks.sqlite');

await fs.mkdir(dataDir, { recursive: true });
await fs.mkdir(uploadsDir, { recursive: true });

// Middleware
app.use(cors({
  origin: corsOriginHandler,
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

// --- Database helpers ---------------------------------------------------

const TASK_STATUSES = ['Upcoming', 'Active', 'Paused', 'Completed', 'Cancelled'];
const ACTIVE_STATUS_SET = new Set(['Upcoming', 'Active']);
const VALID_SCOPE_SET = new Set(['active', 'archived', 'all']);

const BASE_SELECT = `
  SELECT
    id,
    title,
    est_minutes AS estMinutes,
    status,
    image_data_url AS imageDataUrl,
    template_key AS templateKey,
    remaining_seconds AS remainingSeconds,
    timer_started_at AS timerStartedAt,
    created_at AS createdAt,
    updated_at AS updatedAt,
    is_archived AS isArchived,
    archived_at AS archivedAt
  FROM tasks
`;

function toSqlValue(value) {
  if (value === null || value === undefined) {
    return 'NULL';
  }
  if (typeof value === 'number') {
    return Number.isFinite(value) ? value.toString() : 'NULL';
  }
  if (typeof value === 'boolean') {
    return value ? '1' : '0';
  }
  return `'${String(value).replace(/'/g, "''")}'`;
}

function normalizeTask(row) {
  return {
    ...row,
    imageDataUrl: row.imageDataUrl ?? undefined,
    remainingSeconds: row.remainingSeconds ?? undefined,
    timerStartedAt: row.timerStartedAt ?? undefined,
    createdAt: row.createdAt ?? undefined,
    updatedAt: row.updatedAt ?? undefined,
    isArchived: Boolean(row.isArchived),
    archivedAt: row.archivedAt ?? undefined
  };
}

async function runSql(sql, { json = false } = {}) {
  const statement = `${sql.trim()}`;
  const args = json ? ['-batch', '-json', dbPath, statement] : ['-batch', dbPath, statement];
  const result = await execFileAsync('sqlite3', args);
  if (json) {
    const output = result.stdout.trim();
    return output ? JSON.parse(output) : [];
  }
  return result;
}

async function initializeDatabase() {
  const schemaSql = `
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      est_minutes INTEGER NOT NULL,
      status TEXT NOT NULL,
      image_data_url TEXT,
      template_key TEXT NOT NULL,
      remaining_seconds INTEGER,
      timer_started_at TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      is_archived INTEGER NOT NULL DEFAULT 0,
      archived_at TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_tasks_is_archived ON tasks (is_archived, created_at);
    CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks (status);
  `;

  await runSql(schemaSql);
}

async function fetchTasks(scope = 'active') {
  let whereClause = 'WHERE is_archived = 0';
  let orderClause = 'ORDER BY created_at ASC, title COLLATE NOCASE ASC';

  if (scope === 'archived') {
    whereClause = 'WHERE is_archived = 1';
    orderClause = 'ORDER BY archived_at DESC, updated_at DESC';
  } else if (scope === 'all') {
    whereClause = '';
    orderClause = 'ORDER BY is_archived ASC, created_at ASC';
  }

  const rows = await runSql(`${BASE_SELECT} ${whereClause} ${orderClause};`, { json: true });
  return rows.map(normalizeTask);
}

async function getTaskById(id) {
  const rows = await runSql(`${BASE_SELECT} WHERE id = ${toSqlValue(id)} LIMIT 1;`, { json: true });
  return rows.length > 0 ? normalizeTask(rows[0]) : null;
}

async function getActiveTaskCount() {
  const rows = await runSql(
    'SELECT COUNT(*) AS activeCount FROM tasks WHERE status = "Active" AND is_archived = 0;',
    { json: true }
  );
  return rows.length > 0 ? Number(rows[0].activeCount) : 0;
}

async function createTaskRecord(task) {
  const insertSql = `
    INSERT INTO tasks (
      id, title, est_minutes, status, image_data_url, template_key,
      remaining_seconds, timer_started_at, created_at, updated_at, is_archived, archived_at
    ) VALUES (
      ${toSqlValue(task.id)},
      ${toSqlValue(task.title)},
      ${toSqlValue(task.estMinutes)},
      ${toSqlValue(task.status)},
      ${toSqlValue(task.imageDataUrl ?? null)},
      ${toSqlValue(task.templateKey)},
      ${toSqlValue(task.remainingSeconds ?? null)},
      ${toSqlValue(task.timerStartedAt ?? null)},
      ${toSqlValue(task.createdAt)},
      ${toSqlValue(task.updatedAt)},
      ${toSqlValue(task.isArchived ? 1 : 0)},
      ${toSqlValue(task.archivedAt ?? null)}
    );
  `;

  await runSql(insertSql);
  return getTaskById(task.id);
}

async function updateTaskRecord(id, updates) {
  const existing = await getTaskById(id);
  if (!existing) {
    return null;
  }

  const now = new Date().toISOString();

  const nextTitle = updates.title !== undefined ? updates.title.trim() : existing.title;
  const nextEstMinutes = updates.estMinutes !== undefined ? updates.estMinutes : existing.estMinutes;
  const nextStatus = updates.status ?? existing.status;
  const nextImageDataUrl = updates.imageDataUrl !== undefined ? updates.imageDataUrl : existing.imageDataUrl ?? null;
  const nextRemainingSeconds = updates.remainingSeconds !== undefined ? updates.remainingSeconds : existing.remainingSeconds ?? null;
  const nextTimerStartedAt = updates.timerStartedAt !== undefined ? updates.timerStartedAt : existing.timerStartedAt ?? null;

  const willArchive = !ACTIVE_STATUS_SET.has(nextStatus);
  const nextIsArchived = willArchive;
  const nextArchivedAt = willArchive ? (existing.archivedAt ?? now) : null;

  const updateSql = `
    UPDATE tasks SET
      title = ${toSqlValue(nextTitle)},
      est_minutes = ${toSqlValue(nextEstMinutes)},
      status = ${toSqlValue(nextStatus)},
      image_data_url = ${toSqlValue(nextImageDataUrl)},
      remaining_seconds = ${toSqlValue(nextRemainingSeconds)},
      timer_started_at = ${toSqlValue(nextTimerStartedAt)},
      updated_at = ${toSqlValue(now)},
      is_archived = ${toSqlValue(nextIsArchived ? 1 : 0)},
      archived_at = ${toSqlValue(nextArchivedAt)}
    WHERE id = ${toSqlValue(id)};
  `;

  await runSql(updateSql);
  return getTaskById(id);
}

async function deleteTaskRecord(id) {
  const existing = await getTaskById(id);
  if (!existing) {
    return null;
  }

  await runSql(`DELETE FROM tasks WHERE id = ${toSqlValue(id)};`);
  return existing;
}

const databaseReady = initializeDatabase();

// API Routes

// GET /api/tasks - Get tasks by scope (active by default)
app.get('/api/tasks', async (req, res) => {
  try {
    await databaseReady;
    const scopeParam = typeof req.query.scope === 'string' ? req.query.scope.toLowerCase() : 'active';

    if (!VALID_SCOPE_SET.has(scopeParam)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid scope parameter. Use "active", "archived", or "all".'
      });
    }

    const tasks = await fetchTasks(scopeParam);

    res.json({
      success: true,
      tasks
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    });
  }
});

// POST /api/tasks - Create a new task
app.post('/api/tasks', async (req, res) => {
  try {
    await databaseReady;
    const { title, estMinutes, imageDataUrl } = req.body;

    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        error: 'Task title is required'
      });
    }

    const parsedMinutes = Number(estMinutes);
    const normalizedEstMinutes = Number.isFinite(parsedMinutes) && parsedMinutes > 0
      ? Math.round(parsedMinutes)
      : 25;

    const hasActiveTask = (await getActiveTaskCount()) > 0;
    const status = hasActiveTask ? 'Upcoming' : 'Active';

    const now = new Date().toISOString();
    const normalizedTitle = title.trim();
    const normalizedImage = imageDataUrl ? String(imageDataUrl) : null;

    const createdTask = await createTaskRecord({
      id: nanoid(),
      title: normalizedTitle,
      estMinutes: normalizedEstMinutes,
      status,
      imageDataUrl: normalizedImage,
      templateKey: normalizedTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      remainingSeconds: normalizedEstMinutes * 60,
      timerStartedAt: null,
      createdAt: now,
      updatedAt: now,
      isArchived: false,
      archivedAt: null
    });

    res.status(201).json({
      success: true,
      task: createdTask
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
    await databaseReady;
    const { id } = req.params;
    const { title, estMinutes, status, imageDataUrl, remainingSeconds } = req.body;

    if (status && !TASK_STATUSES.includes(status)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid task status'
      });
    }

    const updates = {};

    if (title !== undefined) {
      if (!title || !String(title).trim()) {
        return res.status(400).json({
          success: false,
          error: 'Task title cannot be empty'
        });
      }
      updates.title = String(title);
    }

    if (estMinutes !== undefined) {
      const parsedMinutes = Number(estMinutes);
      if (!Number.isFinite(parsedMinutes) || parsedMinutes <= 0) {
        return res.status(400).json({
          success: false,
          error: 'Estimated minutes must be a positive number'
        });
      }
      updates.estMinutes = Math.round(parsedMinutes);
    }

    if (status) {
      updates.status = status;
    }

    if (imageDataUrl !== undefined) {
      updates.imageDataUrl = imageDataUrl === null ? null : String(imageDataUrl);
    }

    if (remainingSeconds !== undefined) {
      const parsedSeconds = Number(remainingSeconds);
      if (!Number.isFinite(parsedSeconds) || parsedSeconds < 0) {
        return res.status(400).json({
          success: false,
          error: 'Remaining seconds must be zero or a positive number'
        });
      }
      updates.remainingSeconds = Math.round(parsedSeconds);
    }

    if (Object.prototype.hasOwnProperty.call(req.body, 'timerStartedAt')) {
      const timerValue = req.body.timerStartedAt;
      if (timerValue === null || timerValue === undefined || timerValue === '') {
        updates.timerStartedAt = null;
      } else {
        const parsedTimer = new Date(timerValue);
        if (Number.isNaN(parsedTimer.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'Invalid timerStartedAt value'
          });
        }
        updates.timerStartedAt = parsedTimer.toISOString();
      }
    }

    const updatedTask = await updateTaskRecord(id, updates);

    if (!updatedTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

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
    await databaseReady;
    const { id } = req.params;

    const deletedTask = await deleteTaskRecord(id);

    if (!deletedTask) {
      return res.status(404).json({
        success: false,
        error: 'Task not found'
      });
    }

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

    const baseUrlFromEnv = process.env.PUBLIC_IMAGE_BASE_URL?.replace(/\/$/, '');
    const requestHost = req.get('host');
    const derivedBaseUrl = requestHost ? `${req.protocol}://${requestHost}` : `http://localhost:${PORT}`;
    const publicBaseUrl = baseUrlFromEnv || derivedBaseUrl;
    const imageUrl = `${publicBaseUrl}/${req.file.filename}`;
    
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
  if (error?.message && error.message.includes('not allowed by CORS')) {
    console.warn(`Blocked CORS request from origin: ${req.get('origin')}`);
    return res.status(403).json({
      success: false,
      error: 'CORS origin not allowed'
    });
  }

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
    await databaseReady;
    console.log('✅ Database ready');

    const server = app.listen(PORT, HOST, () => {
      console.log(`🚀 BubbleTasks API server running on http://${HOST === '0.0.0.0' ? 'localhost' : HOST}:${PORT}`);
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