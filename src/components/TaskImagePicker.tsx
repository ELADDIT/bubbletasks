import { useRef, useState } from 'react';
import { saveTemplateImage, toTemplateKey } from '../utils/storage';

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
        className="backdrop-blur-sm bg-white/20 hover:bg-white/30 border border-white/30 text-white font-medium py-2 px-4 rounded-xl transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-300/50"
      >
        📷 Upload Icon
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files?.[0])}
      />
      {preview && (
        <div className="w-12 h-12 rounded-full overflow-hidden border-2 border-white/40 shadow-lg">
          <img src={preview} alt="preview" className="w-full h-full object-cover" />
        </div>
      )}
    </div>
  );
}
