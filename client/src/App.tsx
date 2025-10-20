
import { useEffect, useState } from 'react';
import TaskForm from './components/TaskForm';
import { useTasks } from './store/useTasks';
import Bubble from './components/Bubble';

function App() {
  const {
    tasks,
    archivedTasks,
    isLoading,
    isLoadingArchive,
    isMutating,
    error,
    fetchTasks,
    fetchArchivedTasks,
    clearError
  } = useTasks();
  const [showArchive, setShowArchive] = useState(false);

  // Fetch tasks on component mount
  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (showArchive && archivedTasks.length === 0 && !isLoadingArchive) {
      fetchArchivedTasks();
    }
  }, [showArchive, archivedTasks.length, isLoadingArchive, fetchArchivedTasks]);

  const handleToggleArchive = async () => {
    if (!showArchive && archivedTasks.length === 0 && !isLoadingArchive) {
      try {
        await fetchArchivedTasks();
      } catch (error) {
        console.error('Failed to load archive:', error);
      }
    }
    setShowArchive(prev => !prev);
  };

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

          <div className="mt-6 flex justify-end">
            <button
              onClick={handleToggleArchive}
              className="px-4 py-2 rounded-xl border border-white/30 bg-white/10 text-white/80 hover:bg-white/20 transition-colors duration-200"
            >
              {showArchive ? 'Hide Archive' : 'Show Archive'}
            </button>
          </div>

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

          {showArchive && (
            <div className="mt-8 backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-5">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-white/90">Archive</h2>
                {isLoadingArchive && (
                  <span className="text-sm text-white/60">Loading...</span>
                )}
              </div>

              {!isLoadingArchive && archivedTasks.length === 0 && (
                <p className="mt-3 text-sm text-white/60">No archived tasks yet.</p>
              )}

              {archivedTasks.length > 0 && (
                <div className="mt-4 space-y-3">
                  {archivedTasks.map(task => (
                    <Bubble key={task.id} task={task} />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
