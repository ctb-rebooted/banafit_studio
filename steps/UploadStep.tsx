
import React from 'react';
import { Upload, CheckCircle } from 'lucide-react';
import { AppState, InputImage } from '../types';

interface UploadStepProps {
  inputImages: InputImage[];
  selectedInputId: string | null;
  onFileUpload: (files: File[]) => void;
  onSelectImage: (id: string) => void;
}

const UploadStep: React.FC<UploadStepProps> = ({ inputImages, selectedInputId, onFileUpload, onSelectImage }) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileUpload(Array.from(e.target.files));
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh]">
      <div className="max-w-xl w-full text-center space-y-8">
        <div>
          <h2 className="text-3xl font-bold text-slate-900 mb-2">워크플로우 시작</h2>
          <p className="text-slate-500">제품 사진이나 모델 사진을 업로드하여 시작하세요.</p>
        </div>
        
        <label className="flex flex-col items-center justify-center w-full h-64 border-2 border-slate-300 border-dashed rounded-2xl cursor-pointer bg-white hover:bg-slate-50 hover:border-indigo-500 transition-all group">
          <div className="flex flex-col items-center justify-center pt-5 pb-6">
            <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4 text-slate-400 group-hover:text-indigo-600 group-hover:bg-indigo-50 transition-colors">
              <Upload size={32} />
            </div>
            <p className="mb-2 text-sm text-slate-500"><span className="font-semibold text-slate-900">클릭하여 업로드</span> 또는 드래그 앤 드롭</p>
            <p className="text-xs text-slate-400">JPG, PNG (최대 10MB)</p>
          </div>
          <input type="file" className="hidden" accept="image/*" multiple onChange={handleChange} />
        </label>

        {inputImages.length > 0 && (
          <div className="grid grid-cols-4 gap-4 w-full">
            {inputImages.map(img => (
              <div 
                key={img.id} 
                className={`relative aspect-[4/5] rounded-lg overflow-hidden border-2 cursor-pointer ${selectedInputId === img.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                onClick={() => onSelectImage(img.id)}
              >
                <img src={img.previewUrl} alt="Upload" className="w-full h-full object-cover" />
                {selectedInputId === img.id && (
                  <div className="absolute top-2 right-2 bg-indigo-600 text-white rounded-full p-1">
                    <CheckCircle size={12} />
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default UploadStep;
