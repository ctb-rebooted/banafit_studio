
import React from 'react';
import { CheckCircle, Eraser, UserCircle2 } from 'lucide-react';
import { AppState } from '../types';
import { LAYER_PRESETS } from '../presets/layers';

interface ConditionsStepProps {
  config: AppState['config'];
  onUpdateConfig: (updates: Partial<AppState['config']>) => void;
  onUpdateLayers: (layers: any[]) => void;
}

const ConditionsStep: React.FC<ConditionsStepProps> = ({ config, onUpdateConfig, onUpdateLayers }) => {
  
  const handleTypeChange = (typeId: string) => {
    let newLayers;
    if (typeId === 'PRODUCT_ONLY') {
      newLayers = [...LAYER_PRESETS.PRODUCT];
    } else {
      newLayers = [...LAYER_PRESETS.MODEL];
    }
    onUpdateConfig({ type: typeId as any });
    onUpdateLayers(newLayers);
  };

  return (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-slate-900">생성 설정</h2>
        <p className="text-slate-500">생성할 변형의 수와 유형을 정의하세요.</p>
      </div>

      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm space-y-8">
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">생성 수량</label>
          <div className="flex gap-4">
            {[1, 3, 5].map(count => (
              <button
                key={count}
                onClick={() => onUpdateConfig({ count })}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  config.count === count 
                    ? 'bg-indigo-50 border-indigo-600 text-indigo-700' 
                    : 'bg-white border-slate-200 text-slate-600 hover:border-slate-300'
                }`}
              >
                {count} {count === 1 ? '장' : '장'}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">생성 유형</label>
          <div className="space-y-3">
            {[
              { id: 'MODEL_CHANGE', label: '모델 변경', desc: '의상은 유지하고 모델과 배경을 변경합니다.' },
              { id: 'TRY_ON', label: '가상 피팅 (Virtual Try-On)', desc: '특정 모델에게 의상을 입힙니다.' },
              { id: 'PRODUCT_ONLY', label: '고스트 마네킹 / 상품', desc: '깔끔한 제품 누끼 컷을 생성합니다.' }
            ].map((type: any) => (
              <div 
                key={type.id}
                onClick={() => handleTypeChange(type.id)}
                className={`p-4 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
                  config.type === type.id
                    ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className={`font-medium ${config.type === type.id ? 'text-indigo-900' : 'text-slate-900'}`}>{type.label}</h4>
                  <p className="text-sm text-slate-500">{type.desc}</p>
                </div>
                {config.type === type.id && <CheckCircle className="text-indigo-600" size={20} />}
              </div>
            ))}
          </div>
        </div>

        {/* 모델 세부 설정 (모델 변경 모드일 때만 표시) */}
        {(config.type === 'MODEL_CHANGE' || config.type === 'TRY_ON') && (
           <div className="p-5 bg-slate-50 rounded-xl border border-slate-200">
             <div className="flex items-center gap-2 mb-4">
               <UserCircle2 size={18} className="text-indigo-600" />
               <h4 className="font-semibold text-slate-900">타겟 모델 설정</h4>
             </div>
             
             <div className="grid grid-cols-2 gap-6">
               {/* 연령대 선택 */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">연령대 (Age)</label>
                  <div className="grid grid-cols-2 gap-2">
                     {['20s', '30s', '40s', '50s'].map((age) => (
                       <button
                         key={age}
                         onClick={() => onUpdateConfig({ targetAge: age as any })}
                         className={`py-2 px-3 text-sm rounded-lg border transition-all ${
                           config.targetAge === age
                           ? 'bg-white border-indigo-600 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                           : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                         }`}
                       >
                         {age}
                       </button>
                     ))}
                  </div>
               </div>
               
               {/* 성별 선택 */}
               <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-2">성별 (Gender)</label>
                  <div className="flex gap-2">
                     {['Female', 'Male'].map((gender) => (
                       <button
                         key={gender}
                         onClick={() => onUpdateConfig({ targetGender: gender as any })}
                         className={`flex-1 py-2 px-3 text-sm rounded-lg border transition-all ${
                           config.targetGender === gender
                           ? 'bg-white border-indigo-600 text-indigo-700 shadow-sm ring-1 ring-indigo-100'
                           : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                         }`}
                       >
                         {gender === 'Female' ? '여성' : '남성'}
                       </button>
                     ))}
                  </div>
               </div>
             </div>
           </div>
        )}

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">부가 옵션</label>
          <div 
            onClick={() => onUpdateConfig({ removeWatermark: !config.removeWatermark })}
            className={`p-4 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
              config.removeWatermark
                ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-200' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${config.removeWatermark ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                <Eraser size={20} />
              </div>
              <div>
                <h4 className={`font-medium ${config.removeWatermark ? 'text-indigo-900' : 'text-slate-900'}`}>워터마크 및 텍스트 제거</h4>
                <p className="text-sm text-slate-500">원본 이미지에 있는 로고나 글자를 지우고 생성합니다.</p>
              </div>
            </div>
            
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${config.removeWatermark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${config.removeWatermark ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConditionsStep;
