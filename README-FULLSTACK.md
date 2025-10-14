# BubbleTasks - Client-Server Architecture

A task management application with a React frontend and Node.js backend.

## Project Structure

```
bubbletasks/                      # Root project directory
├── client/                       # React frontend
│   ├── src/                      # React source code
│   │   ├── components/           # React components
│   │   ├── services/             # API service layer
│   │   ├── store/                # Zustand state management
│   │   └── utils/                # Utility functions
│   ├── public/                   # Static assets
│   ├── index.html                # HTML entry point
│   ├── vite.config.ts            # Vite configuration
│   ├── tailwind.config.js        # Tailwind CSS config
│   └── package.json              # Frontend dependencies
├── server/                       # Node.js backend
│   ├── server.js                 # Express server
│   ├── package.json              # Server dependencies
│   ├── tasks.json                # JSON file database (auto-generated)
│   └── uploads/                  # Uploaded images (auto-generated)
└── package.json                  # Root project management
```

## Getting Started

### Prerequisites
- Node.js 20.19+ or 22.12+
- npm

### Quick Start (Recommended)

```bash
# Install all dependencies for both client and server
npm run install:all

# Run both client and server simultaneously
npm run dev
```

This will start:
- **Backend server** on `http://localhost:3001`
- **Frontend client** on `http://localhost:5173`

### Manual Setup (Alternative)

#### 1. Install Dependencies
```bash
# Install root project management tools
npm install

# Install client dependencies
npm run install:client

# Install server dependencies  
npm run install:server
```

#### 2. Run Servers Individually
```bash
# Terminal 1 - Start backend server
npm run dev:server

# Terminal 2 - Start frontend client  
npm run dev:client
```

## API Endpoints

The backend provides the following REST API endpoints:

- `GET /api/health` - Health check
- `GET /api/tasks` - Get all tasks
- `POST /api/tasks` - Create a new task
- `PUT /api/tasks/:id` - Update a task
- `DELETE /api/tasks/:id` - Delete a task
- `POST /api/upload` - Upload an image file

## Features

### Frontend (React + Vite)
- ✨ Modern glassmorphism UI design
- 🎯 Task creation and management
- 📷 Image upload for task icons
- 🔄 Real-time state management with Zustand
- 📱 Responsive design
- ⚡ Fast development with Vite and HMR

### Backend (Node.js + Express)
- 🚀 RESTful API
- 📁 File-based JSON storage
- 🖼️ Image upload handling with Multer
- 🔒 CORS enabled for cross-origin requests
- ⚡ Auto-restart with --watch flag
- 🛡️ Error handling and validation

## Development

### Available Scripts

From the root directory:

- `npm run dev` - Run both client and server simultaneously  
- `npm run dev:client` - Run only the frontend client
- `npm run dev:server` - Run only the backend server
- `npm run install:all` - Install dependencies for both client and server
- `npm run install:client` - Install only client dependencies
- `npm run install:server` - Install only server dependencies
- `npm run build:client` - Build the frontend for production

### Data Persistence

Tasks are stored in `server/tasks.json`. This file is automatically created and updated when tasks are added, modified, or deleted.

### Image Storage

Uploaded images are stored in the `server/uploads/` directory and served as static files.

## Architecture Benefits

### Separation of Concerns
- **Frontend**: Handles UI, user interactions, and presentation logic
- **Backend**: Manages data persistence, business logic, and API endpoints

### Scalability
- Server can be deployed independently
- Multiple clients can connect to the same backend
- Easy to add authentication, databases, and other backend services

### Development
- Frontend and backend can be developed separately
- API-first approach enables mobile app development
- Easy testing of individual components

## Next Steps

To make this production-ready, consider:

1. **Database**: Replace JSON file with PostgreSQL, MongoDB, or SQLite
2. **Authentication**: Add user accounts and JWT tokens
3. **File Storage**: Use cloud storage (AWS S3, Cloudinary) for images
4. **Deployment**: Deploy backend (Railway, Render) and frontend (Vercel, Netlify)
5. **Environment Variables**: Use `.env` files for configuration
6. **Validation**: Add input validation with libraries like Joi or Zod
7. **Testing**: Add unit and integration tests
8. **Logging**: Add proper logging with Winston or similar
9. **Rate Limiting**: Add API rate limiting for security
10. **Caching**: Add Redis for caching and session management

## Troubleshooting

### CORS Issues
Make sure both servers are running on their correct ports (frontend: 5173, backend: 3001).

### Port Conflicts
If ports are in use, the servers will automatically try alternative ports.

### API Connection Issues
Check that the backend server is running and accessible at `http://localhost:3001/api/health`.