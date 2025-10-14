import { useRef, useState } from 'react';
import { saveTemplateImage, toTemplateKey } from '../utils/storage';
import TaskIcon from './TaskIcon';

type Props = { title: string; onPick: (dataUrl: string) => void };

export default function TaskImagePicker({ title, onPick }: Props) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFiles = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      setPreview(dataUrl);
      onPick(dataUrl);
      saveTemplateImage(toTemplateKey(title), dataUrl);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="flex items-center gap-3">
      <button 
        type="button" 
        onClick={() => fileRef.current?.click()} 
        className="bg-white/80 hover:bg-white/90 text-black font-bold py-3 px-4 rounded-xl transition-all duration-300 shadow-lg border-2 border-white/50 backdrop-blur-sm text-base"
      >
        📷 UPLOAD ICON
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files?.[0])}
      />
      {preview && <TaskIcon imageUrl={preview} size="small" />}
    </div>
  );
}
