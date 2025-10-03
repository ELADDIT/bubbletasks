import type { Task } from '../types';

export default function Bubble({ task }: { task: Task }) {
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'from-green-400/30 to-green-600/30 border-green-300/40';
      case 'Paused': return 'from-yellow-400/30 to-yellow-600/30 border-yellow-300/40';
      case 'Done': return 'from-purple-400/30 to-purple-600/30 border-purple-300/40';
      default: return 'from-blue-400/30 to-blue-600/30 border-blue-300/40';
    }
  };

  return (
    <div className={`flex items-center gap-4 p-4 backdrop-blur-sm bg-gradient-to-r ${getStatusColor(task.status)} border rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300`}>
      <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-md">
        {task.imageDataUrl ? (
          <img src={task.imageDataUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full grid place-items-center text-white/80 text-sm font-semibold">?</div>
        )}
      </div>
      <div className="flex-1">
        <div className="font-semibold text-white text-lg drop-shadow-sm">{task.title}</div>
        <div className="text-white/80 text-sm">{task.status} • {task.estMinutes} minutes</div>
      </div>
    </div>
  );
}
