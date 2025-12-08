
import React, { useState } from 'react';
import { CheckCircle, Download, ArrowLeft, ArrowRight, MousePointerClick, CheckSquare, Square, Layers } from 'lucide-react';
import { AppState, WorkflowStep } from '../types';

interface FinalStepProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  onGoBack: () => void;
  onReset: () => void;
}

const FinalStep: React.FC<FinalStepProps> = ({ state, updateState, onGoBack, onReset }) => {
  const selectedImage = state.generatedImages.find(img => img.id === state.selectedResultId);
  const [selectedForDownload, setSelectedForDownload] = useState<Set<string>>(new Set());

  const handleDownload = (imageUrl: string, id: string) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `banafit-export-${id}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleBulkDownload = () => {
    let delay = 0;
    state.generatedImages.forEach((img) => {
      if (selectedForDownload.has(img.id)) {
        setTimeout(() => {
          handleDownload(img.imageUrl, img.id);
        }, delay);
        delay += 500; // 0.5초 간격으로 다운로드하여 브라우저 차단 방지
      }
    });
  };

  const toggleSelection = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    const newSet = new Set(selectedForDownload);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedForDownload(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedForDownload.size === state.generatedImages.length) {
      setSelectedForDownload(new Set());
    } else {
      const allIds = new Set(state.generatedImages.map(img => img.id));
      setSelectedForDownload(allIds);
    }
  };

  if (!selectedImage) return null;

  const isAllSelected = state.generatedImages.length > 0 && selectedForDownload.size === state.generatedImages.length;

  return (
    <div className="max-w-6xl mx-auto py-12 flex flex-col md:flex-row gap-12 items-start">
      <div className="w-full md:w-1/2 sticky top-24">
         <div className="bg-white p-2 rounded-2xl shadow-xl border border-slate-100">
           <img src={selectedImage.imageUrl} alt="Final" className="w-full rounded-xl" />
         </div>
      </div>
      <div className="w-full md:w-1/2 space-y-8">
         <div>
           <div className="inline-flex items-center gap-2 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide mb-4">
             <CheckCircle size={12} /> 내보내기 준비 완료
           </div>
           <h1 className="text-4xl font-bold text-slate-900 mb-2">최종 선택</h1>
           <p className="text-slate-500 text-lg">이미지 처리가 완료되었습니다. 다운로드하실 수 있습니다.</p>
         </div>

         <div className="space-y-4">
           <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center transition-all hover:border-indigo-200 hover:shadow-sm">
              <div>
                 <p className="font-semibold text-slate-900">고화질 PNG 다운로드</p>
                 <p className="text-xs text-slate-500">현재 선택된 이미지 ({selectedImage.id.slice(0,4)})</p>
              </div>
              <button 
                onClick={() => handleDownload(selectedImage.imageUrl, selectedImage.id)}
                className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-lg transition-colors flex items-center gap-2"
              >
                <Download size={20} />
                <span className="text-sm font-medium">Download</span>
              </button>
           </div>
           
           <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center opacity-60">
              <div>
                 <p className="font-semibold text-slate-900">배경 제거 (투명 PNG)</p>
                 <p className="text-xs text-slate-500">자동 마스킹</p>
              </div>
              <div className="text-xs bg-slate-200 px-2 py-1 rounded">준비 중</div>
           </div>
         </div>

         {/* 세션 기록 (히스토리) 섹션 */}
         <div className="border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
               <h3 className="text-sm font-semibold text-slate-900 flex items-center gap-2">
                 세션 기록
                 <span className="text-xs font-normal text-slate-500 flex items-center gap-1">
                   ({state.generatedImages.length}장)
                 </span>
               </h3>
               
               <div className="flex items-center gap-3">
                  <button 
                    onClick={toggleSelectAll}
                    className="text-xs font-medium text-slate-500 hover:text-indigo-600 flex items-center gap-1"
                  >
                    {isAllSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    전체 선택
                  </button>
                  {selectedForDownload.size > 0 && (
                    <button 
                      onClick={handleBulkDownload}
                      className="text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 px-3 py-1.5 rounded-full flex items-center gap-1 transition-colors"
                    >
                      <Layers size={12} />
                      {selectedForDownload.size}장 일괄 다운로드
                    </button>
                  )}
               </div>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 gap-3 max-h-60 overflow-y-auto p-1">
              {state.generatedImages.map((img) => {
                const isSelected = selectedForDownload.has(img.id);
                return (
                  <div 
                    key={img.id}
                    onClick={() => updateState({ selectedResultId: img.id })}
                    className={`relative group aspect-[4/5] rounded-lg overflow-hidden border cursor-pointer transition-all ${
                      state.selectedResultId === img.id 
                        ? 'border-indigo-600 ring-2 ring-indigo-200 ring-offset-1 opacity-100' 
                        : 'border-slate-200 opacity-80 hover:opacity-100 hover:border-slate-300'
                    }`}
                  >
                    <img src={img.imageUrl} alt="History" className="w-full h-full object-cover" />
                    
                    {/* Selected (Active) Indicator Overlay */}
                    {state.selectedResultId === img.id && (
                      <div className="absolute inset-0 ring-2 ring-inset ring-indigo-500/50 pointer-events-none" />
                    )}
                    
                    {/* Bulk Selection Checkbox (Top Left) */}
                    <div 
                       onClick={(e) => toggleSelection(e, img.id)}
                       className={`absolute top-1 left-1 p-1 rounded-md transition-all z-10 ${
                         isSelected 
                           ? 'bg-indigo-600 text-white shadow-sm' 
                           : 'bg-white/70 text-slate-400 hover:bg-white hover:text-indigo-500'
                       }`}
                    >
                       {isSelected ? <CheckSquare size={14} /> : <Square size={14} />}
                    </div>

                    {/* Hover Actions: Direct Download (Bottom Right) */}
                    <div className="absolute bottom-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <button 
                          onClick={(e) => {
                              e.stopPropagation(); // Prevent changing main selection
                              handleDownload(img.imageUrl, img.id);
                          }}
                          className="bg-white/90 hover:bg-white text-slate-700 hover:text-indigo-600 p-1.5 rounded-full shadow-sm backdrop-blur-sm transition-transform hover:scale-110"
                          title="이 이미지 바로 다운로드"
                        >
                           <Download size={14} />
                        </button>
                    </div>
                  </div>
                );
              })}
            </div>
         </div>

         <div className="pt-6 border-t border-slate-200 flex flex-col gap-3">
           <button 
             onClick={onGoBack}
             className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
           >
             <ArrowLeft size={16} /> 편집 화면으로 돌아가기
           </button>

           <button 
             onClick={onReset}
             className="w-full py-2 text-slate-400 hover:text-slate-600 font-medium flex items-center justify-center gap-2 text-sm"
           >
             새 프로젝트 시작 <ArrowRight size={14} />
           </button>
         </div>
      </div>
    </div>
  );
};

export default FinalStep;
