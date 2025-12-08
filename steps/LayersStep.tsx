
import React from 'react';
import { Plus, Trash2, User, Sparkles } from 'lucide-react';
import { AppState, PromptLayer } from '../types';
import { LAYER_QUICK_PROMPTS } from '../presets/layers';

interface LayersStepProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
}

const LayersStep: React.FC<LayersStepProps> = ({ state, updateState }) => {
  const { layers, config, inputImages, selectedInputId, modelReferenceImage } = state;

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          updateState({ modelReferenceImage: ev.target!.result as string });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleLayerToggle = (id: string) => {
    updateState({
      layers: layers.map(l => l.id === id && !l.isLocked ? { ...l, enabled: !l.enabled } : l)
    });
  };

  const handleLayerChange = (id: string, content: string) => {
    updateState({
      layers: layers.map(l => l.id === id ? { ...l, content } : l)
    });
  };

  const addCustomLayer = () => {
    const newLayer: PromptLayer = {
      id: `custom-${Date.now()}`,
      name: '사용자 정의 조건',
      type: 'CUSTOM',
      content: '',
      enabled: true
    };
    updateState({ layers: [...layers, newLayer] });
  };

  const addQuickLayer = (item: { label: string, content: string }) => {
    const newLayer: PromptLayer = {
      id: `quick-${Date.now()}`,
      name: item.label,
      type: 'CUSTOM',
      content: item.content,
      enabled: true
    };
    updateState({ layers: [...layers, newLayer] });
  };

  const removeLayer = (id: string) => {
    updateState({ layers: layers.filter(l => l.id !== id) });
  };

  return (
      <div className="max-w-4xl mx-auto py-8 flex gap-8 h-[calc(100vh-140px)]">
        <div className="w-1/3 hidden md:block">
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">기본 입력 이미지</h3>
            {selectedInputId && (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img 
                  src={inputImages.find(i => i.id === selectedInputId)?.previewUrl} 
                  className="w-full h-auto" 
                  alt="Base" 
                />
              </div>
            )}
            
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">현재 모드</h4>
               <p className="font-medium text-slate-900">
                 {config.type === 'PRODUCT_ONLY' ? '상품/누끼 촬영 (Ghost Mannequin)' : '모델 촬영 / 가상 피팅'}
               </p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto pr-2 pb-20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">프롬프트 레이어</h2>
              <p className="text-slate-500">조건을 쌓아 올려 결과를 제어하세요.</p>
            </div>
            <button 
              onClick={addCustomLayer}
              className="flex items-center gap-2 text-sm bg-slate-900 text-white px-4 py-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <Plus size={16} /> 레이어 추가
            </button>
          </div>

          <div className="mb-6 p-4 bg-indigo-50 rounded-xl border border-indigo-100">
             <div className="flex items-center gap-2 mb-3 text-indigo-800 font-semibold text-sm">
                <Sparkles size={14} /> 퀵 프롬프트 추가 (원클릭)
             </div>
             <div className="flex flex-wrap gap-2">
                {LAYER_QUICK_PROMPTS.map((item, idx) => (
                  <button 
                    key={idx}
                    onClick={() => addQuickLayer(item)}
                    className="bg-white hover:bg-white/80 border border-indigo-200 text-indigo-700 text-xs px-3 py-1.5 rounded-lg font-medium transition-all shadow-sm hover:shadow-md"
                  >
                    + {item.label}
                  </button>
                ))}
             </div>
          </div>

          <div className="space-y-4">
            {layers.map((layer) => (
              <div 
                key={layer.id} 
                className={`border rounded-xl p-4 transition-all ${
                  layer.enabled ? 'bg-white border-slate-300 shadow-sm' : 'bg-slate-50 border-slate-200 opacity-70'
                }`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <input 
                    type="checkbox" 
                    checked={layer.enabled}
                    onChange={() => handleLayerToggle(layer.id)}
                    disabled={layer.isLocked}
                    className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-semibold uppercase tracking-wider ${
                        layer.type === 'SYSTEM' ? 'text-blue-600' : layer.type === 'USER' ? 'text-indigo-600' : 'text-emerald-600'
                      }`}>
                        {layer.type}
                      </span>
                      <span className="font-medium text-slate-900">{layer.name}</span>
                    </div>
                  </div>
                  {layer.type === 'CUSTOM' && (
                    <button onClick={() => removeLayer(layer.id)} className="text-slate-400 hover:text-red-500">
                      <Trash2 size={16} />
                    </button>
                  )}
                </div>
                
                <textarea
                  value={layer.content}
                  onChange={(e) => handleLayerChange(layer.id, e.target.value)}
                  disabled={!layer.enabled || layer.isLocked}
                  className="w-full text-sm p-3 rounded-lg border border-slate-200 bg-slate-50 focus:bg-white focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 outline-none transition-all resize-none"
                  rows={2}
                  placeholder="구체적인 내용을 입력하세요..."
                />
                
                {layer.name === '모델' && config.type !== 'PRODUCT_ONLY' && layer.enabled && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                         <User size={12}/> 모델 얼굴 참조
                       </span>
                       {modelReferenceImage && (
                         <button 
                           onClick={() => updateState({ modelReferenceImage: null })}
                           className="text-xs text-red-500 hover:text-red-700 font-medium"
                         >
                           삭제
                         </button>
                       )}
                    </div>
                    
                    {modelReferenceImage ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                         <img src={modelReferenceImage} alt="Face Ref" className="w-10 h-10 rounded-full object-cover border border-slate-300" />
                         <span className="text-sm text-slate-700 font-medium text-indigo-700">얼굴 참조 적용됨</span>
                      </div>
                    ) : (
                      <label className="flex items-center gap-2 cursor-pointer bg-slate-50 hover:bg-indigo-50 border border-dashed border-slate-300 hover:border-indigo-300 rounded-lg p-2 transition-all group">
                        <div className="w-8 h-8 bg-white rounded-full flex items-center justify-center text-slate-400 group-hover:text-indigo-500 border border-slate-200">
                          <Plus size={14} />
                        </div>
                        <span className="text-sm text-slate-600 group-hover:text-indigo-700">얼굴 이미지 가져오기 (선택사항)</span>
                        <input type="file" accept="image/*" className="hidden" onChange={handleFaceUpload} />
                      </label>
                    )}
                    <p className="text-[10px] text-slate-400 mt-2">인물 사진을 업로드하면 생성되는 모델에 해당 얼굴 특징을 적용합니다.</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
  );
};

export default LayersStep;
