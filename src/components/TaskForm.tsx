import { useState } from 'react';
import { useTasks } from '../store/useTasks';
import TaskImagePicker from './TaskImagePicker';

export default function TaskForm() {
  const addTask = useTasks(s => s.addTask);
  const [title, setTitle] = useState('');
  const [mins, setMins] = useState(25);
  const [pickedImage, setPickedImage] = useState<string | undefined>(undefined);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    addTask(title.trim(), mins, pickedImage);
    setTitle('');
    setPickedImage(undefined);
  };

  return (
    <form onSubmit={onSubmit} className="backdrop-blur-sm bg-white/10 rounded-2xl border border-white/20 p-6 space-y-4">
      <input
        className="w-full backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl px-4 py-3 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-transparent"
        placeholder="Task title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
      />
      
      <div className="flex items-center gap-3">
        <label className="text-white/90 text-sm font-medium">Minutes:</label>
        <input
          type="number"
          className="w-20 backdrop-blur-sm bg-white/20 border border-white/30 rounded-xl px-3 py-2 text-white placeholder-white/70 focus:outline-none focus:ring-2 focus:ring-blue-300/50 focus:border-transparent"
          value={mins}
          onChange={(e) => setMins(parseInt(e.target.value))}
        />
      </div>
      
      <TaskImagePicker title={title} onPick={setPickedImage} />
      
      <button 
        type="submit" 
        className="w-full backdrop-blur-sm bg-gradient-to-r from-blue-400/30 to-blue-600/30 hover:from-blue-400/40 hover:to-blue-600/40 border border-white/30 text-white font-semibold py-3 px-6 rounded-xl transition-all duration-300 shadow-lg hover:shadow-blue-500/25 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
      >
        Add Task
      </button>
    </form>
  );
}
