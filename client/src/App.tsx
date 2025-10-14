
import { useEffect } from 'react';
import TaskForm from './components/TaskForm';
import { useTasks } from './store/useTasks';
import Bubble from './components/Bubble';

function App() {
  const { tasks, isLoading, isMutating, error, fetchTasks, clearError } = useTasks();
  
  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  console.log('Current tasks:', tasks);

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-lg mx-auto">
        {/* Glassmorphism container */}
        <div className="backdrop-blur-lg bg-white/20 rounded-3xl border border-white/30 shadow-2xl p-8">
          <h1 className="text-4xl font-bold text-white text-center mb-8 drop-shadow-lg">
            BubbleTasks
          </h1>
          
          <TaskForm />
          
          {/* Error display */}
          {error && (
            <div className="mt-4 p-3 bg-red-500/80 text-white rounded-xl border border-red-400/50">
              <p className="font-medium">Error: {error}</p>
              <button 
                onClick={clearError}
                className="mt-2 text-sm underline hover:no-underline"
              >
                Dismiss
              </button>
            </div>
          )}
          
          {/* Loading state */}
          {isLoading && (
            <div className="mt-6 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
              <p className="text-white/80 mt-2">Loading tasks...</p>
            </div>
          )}

          {/* Background mutation indicator */}
          {isMutating && !isLoading && (
            <div className="mt-6 text-center text-white/70">
              <p className="inline-flex items-center gap-2">
                <span className="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                Syncing changes...
              </p>
            </div>
          )}

          {/* Tasks display */}
          {!isLoading && tasks.length > 0 && (
            <div className="mt-6 space-y-3">
              {tasks.map(t => <Bubble key={t.id} task={t} />)}
            </div>
          )}
          
          {/* Empty state */}
          {!isLoading && tasks.length === 0 && !error && (
            <div className="mt-6 text-center text-white/70">
              <p>No tasks yet. Create your first task above! 🎯</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
