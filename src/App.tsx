
import TaskForm from './components/TaskForm';
import { useTasks } from './store/useTasks';
import Bubble from './components/Bubble';

function App() {
  const tasks = useTasks(s => s.tasks);
  
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
          
          {tasks.length > 0 && (
            <div className="mt-6 space-y-3">
              {tasks.map(t => <Bubble key={t.id} task={t} />)}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default App;
