import React, { useRef } from 'react';
import { ImagePlus, X } from 'lucide-react';

interface VisionUploaderProps {
  onImageSelect: (file: File) => void;
  selectedImage: File | null;
  clearImage: () => void;
}

export const VisionUploader: React.FC<VisionUploaderProps> = ({ onImageSelect, selectedImage, clearImage }) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      onImageSelect(e.target.files[0]);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto mb-4 p-4">
      {!selectedImage ? (
        <div 
          onClick={() => fileInputRef.current?.click()}
          className="border-2 border-dashed border-slate-700 rounded-2xl bg-slate-900/50 p-8 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-500 hover:bg-slate-800/50 transition-all group h-64"
        >
          <div className="w-16 h-16 bg-slate-800 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
            <ImagePlus className="w-8 h-8 text-indigo-400" />
          </div>
          <h3 className="text-lg font-medium text-slate-200">Upload Image for Analysis</h3>
          <p className="text-sm text-slate-500 mt-2 text-center max-w-sm">
            Take a photo of a menu, sign, or document to translate it instantly using AI Vision.
          </p>
          <input 
            type="file" 
            ref={fileInputRef}
            onChange={handleFileChange}
            accept="image/*"
            className="hidden" 
          />
        </div>
      ) : (
        <div className="relative rounded-2xl overflow-hidden border border-slate-700 bg-black aspect-video flex items-center justify-center">
           <img 
             src={URL.createObjectURL(selectedImage)} 
             alt="Preview" 
             className="max-h-full max-w-full object-contain" 
           />
           <button 
             onClick={clearImage}
             className="absolute top-4 right-4 p-2 bg-black/60 hover:bg-red-500/80 backdrop-blur rounded-full text-white transition-colors"
           >
             <X className="w-5 h-5" />
           </button>
           <div className="absolute bottom-4 left-4 px-3 py-1 bg-black/60 backdrop-blur rounded-full text-xs text-indigo-300 border border-indigo-500/30">
             Ready to Analyze
           </div>
        </div>
      )}
    </div>
  );
};