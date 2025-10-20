import { memo, useCallback } from 'react';
import type { Task } from '../types';
import TaskIcon from './TaskIcon';
import Timer from './Timer';
import { useTasks } from '../store/useTasks';

// Memoize the component to prevent unnecessary re-renders
const Bubble = memo(function Bubble({ task }: { task: Task }) {
  const { updateTask, completeAndActivateNext } = useTasks();

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active':
        return 'from-green-400/30 to-green-600/30 border-green-300/40';
      case 'Paused':
        return 'from-yellow-400/30 to-yellow-600/30 border-yellow-300/40';
      case 'Completed':
        return 'from-purple-400/30 to-purple-600/30 border-purple-300/40';
      case 'Cancelled':
        return 'from-slate-400/30 to-slate-600/30 border-slate-400/40';
      case 'Upcoming':
        return 'from-blue-400/30 to-blue-600/30 border-blue-300/40';
      default:
        return 'from-slate-500/20 to-slate-700/30 border-slate-400/30';
    }
  };

  const handleTimerComplete = useCallback(async () => {
    try {
      await completeAndActivateNext(task.id);
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  }, [completeAndActivateNext, task.id]);

  const handleTimerTick = useCallback(async (remainingSeconds: number) => {
    // Update the task's remaining time in the store (throttled)
    if (task.remainingSeconds !== remainingSeconds) {
      try {
        await updateTask(task.id, { remainingSeconds });
      } catch (error) {
        console.error('Error updating timer:', error);
      }
    }
  }, [task.id, task.remainingSeconds, updateTask]);

  return (
    <div className={`flex items-center gap-3 p-3 backdrop-blur-sm bg-gradient-to-r ${getStatusColor(task.status)} border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
      <TaskIcon imageUrl={task.imageDataUrl} size="medium" />
      <div className="flex-1">
        <div className="font-semibold text-white text-lg drop-shadow-sm">{task.title}</div>
        <div className="flex items-center justify-between">
          <div className="text-white/80 text-sm">{task.status} • {task.estMinutes} minutes</div>
          {task.status === 'Active' && (
            <Timer
              totalMinutes={task.estMinutes}
              remainingSeconds={task.remainingSeconds ?? task.estMinutes * 60}
              isActive={true}
              onTimeUp={handleTimerComplete}
              onTick={handleTimerTick}
            />
          )}
        </div>
      </div>
    </div>
  );
});

export default Bubble;
