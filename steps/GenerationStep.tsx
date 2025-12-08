
import React from 'react';
import { RefreshCw, X, Loader2, Sliders, CheckCircle } from 'lucide-react';
import { AppState, WorkflowStep } from '../types';

interface GenerationStepProps {
  state: AppState;
  onRunGeneration: () => void;
  onSelectResult: (id: string, nextStep: WorkflowStep) => void;
}

const GenerationStep: React.FC<GenerationStepProps> = ({ state, onRunGeneration, onSelectResult }) => {
  const { generatedImages, isGenerating, error, inputImages } = state;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">생성 결과</h2>
          <p className="text-slate-500">이미지를 선택하여 조정하거나 다듬을 수 있습니다.</p>
        </div>
        {generatedImages.length > 0 && !isGenerating && (
           <button 
             onClick={onRunGeneration}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
           >
             <RefreshCw size={16} /> 추가 생성
           </button>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <X size={18} /> {error}
        </div>
      )}

      {isGenerating && generatedImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
          <p className="text-lg font-medium text-slate-900">변형을 생성하고 있습니다...</p>
          <p className="text-slate-500">Gemini 2.5 Flash 모델을 사용 중입니다. 잠시만 기다려주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {inputImages.map(input => (
             <div key={`input-${input.id}`} className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-slate-200 opacity-60 hover:opacity-100 transition-opacity">
                <img src={input.previewUrl} className="w-full h-full object-cover grayscale" />
                <div className="absolute top-2 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">원본</div>
             </div>
          ))}
          
          {generatedImages.map((img) => (
            <div 
              key={img.id} 
              className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white"
            >
              <img src={img.imageUrl} alt="Result" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                 <button 
                  onClick={() => onSelectResult(img.id, WorkflowStep.ADJUSTMENT)}
                  className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-indigo-50 flex items-center gap-2"
                 >
                   <Sliders size={14} /> 조정 / 편집
                 </button>
                 <button 
                  onClick={() => onSelectResult(img.id, WorkflowStep.FINAL)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-indigo-700 flex items-center gap-2"
                 >
                   <CheckCircle size={14} /> 선택 완료
                 </button>
              </div>
            </div>
          ))}
           {isGenerating && (
             <div className="aspect-[4/5] rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
             </div>
           )}
        </div>
      )}
    </div>
  );
};

export default GenerationStep;
