
import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, Layers, Wand2, Sliders, CheckCircle, Image as ImageIcon, 
  X, Plus, ChevronRight, Settings, Loader2, Download, RefreshCw, Trash2,
  ArrowRight, ArrowLeft, User, Sparkles, Eraser, Pipette, Palette,
  Mountain, Shirt, Watch
} from 'lucide-react';
import { 
  AppState, WorkflowStep, InputImage, PromptLayer, 
  GeneratedImage, GenerationConfig 
} from './types';
import { generateBatchImages, generateImageVariation, ReferenceConfig } from './services/geminiService';

// --- 컴포넌트 섹션 ---

/**
 * 상단 단계 표시기 (Step Indicator)
 * 현재 진행 중인 워크플로우 단계를 시각적으로 보여줍니다.
 */
const StepIndicator = ({ currentStep }: { currentStep: WorkflowStep }) => {
  const steps = [
    { id: WorkflowStep.UPLOAD, label: '업로드' },
    { id: WorkflowStep.CONDITIONS, label: '조건 설정' },
    { id: WorkflowStep.LAYERS, label: '프롬프트' },
    { id: WorkflowStep.GENERATION, label: '생성' },
    { id: WorkflowStep.ADJUSTMENT, label: '편집' },
    { id: WorkflowStep.FINAL, label: '내보내기' },
  ];

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="w-full bg-white border-b border-slate-200 px-6 py-4 sticky top-0 z-50 shadow-sm">
      <div className="max-w-6xl mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold">B</div>
            <span className="font-bold text-xl text-slate-800 tracking-tight">Banafit</span>
        </div>
        <div className="hidden md:flex items-center space-x-2">
          {steps.map((step, idx) => (
            <React.Fragment key={step.id}>
              <div className={`flex items-center gap-2 ${idx <= currentIndex ? 'text-indigo-600' : 'text-slate-400'}`}>
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-medium border ${
                  idx < currentIndex ? 'bg-indigo-600 text-white border-indigo-600' : 
                  idx === currentIndex ? 'bg-white border-indigo-600' : 'bg-slate-50 border-slate-300'
                }`}>
                  {idx < currentIndex ? <CheckCircle size={14} /> : idx + 1}
                </div>
                <span className={`text-sm font-medium ${idx === currentIndex ? 'text-slate-900' : ''}`}>{step.label}</span>
              </div>
              {idx < steps.length - 1 && (
                <div className={`h-0.5 w-6 ${idx < currentIndex ? 'bg-indigo-600' : 'bg-slate-200'}`} />
              )}
            </React.Fragment>
          ))}
        </div>
      </div>
    </div>
  );
};

// --- 메인 앱 섹션 ---

// 기본 레이어 프리셋 정의
const LAYER_PRESETS = {
  // 모델 촬영용 기본 프리셋
  MODEL: [
    { id: 'sys-1', name: '시스템 코어 (기본)', type: 'SYSTEM' as const, content: 'High quality professional fashion photography, photorealistic, 8k resolution, detailed texture.', enabled: true, isLocked: true },
    { id: 'user-1', name: '모델', type: 'USER' as const, content: 'Female fashion model, confident pose, natural makeup.', enabled: true },
    { id: 'user-2', name: '조명 및 배경', type: 'USER' as const, content: 'Soft studio lighting, neutral background.', enabled: true },
  ],
  // 제품/고스트 마네킹용 프리셋
  PRODUCT: [
    { id: 'sys-1', name: '시스템 코어 (기본)', type: 'SYSTEM' as const, content: 'High quality professional product photography, 8k resolution, detailed texture, sharp focus.', enabled: true, isLocked: true },
    { id: 'prod-1', name: '고스트 마네킹', type: 'USER' as const, content: 'Ghost mannequin effect, invisible mannequin, hollow clothing, 3D volume, neck insert detail, maintain original view angle and perspective.', enabled: true },
    { id: 'prod-2', name: '배경 및 조명', type: 'USER' as const, content: 'Pure white background, clean isolation, soft diffuse lighting, no shadows.', enabled: true },
  ]
};

// 배경 프리셋 (색상 및 스타일)
const BACKGROUND_PRESETS = [
    { id: 'bg-1', name: 'Pure White', color: '#ffffff', prompt: 'Clean pure white background, minimal product photography' },
    { id: 'bg-2', name: 'Soft Gray', color: '#f3f4f6', prompt: 'Soft light gray studio background, professional look' },
    { id: 'bg-3', name: 'Beige Tone', color: '#f5f5dc', prompt: 'Warm beige tone background, natural and organic feel' },
    { id: 'bg-4', name: 'Dark Studio', color: '#1f2937', prompt: 'Dark charcoal studio background, dramatic lighting' },
    { id: 'bg-5', name: 'Urban Street', color: '#9ca3af', prompt: 'Blurred urban street background, city vibe, bokeh' },
    { id: 'bg-6', name: 'Nature', color: '#a7f3d0', prompt: 'Blurred nature background, park with sunlight, greenery' },
];

export default function App() {
  // 전체 애플리케이션 상태 관리
  const [state, setState] = useState<AppState>({
    step: WorkflowStep.UPLOAD,
    inputImages: [],
    selectedInputId: null,
    config: {
      count: 3,
      type: 'MODEL_CHANGE',
      keepModel: false,
      removeWatermark: false
    },
    layers: LAYER_PRESETS.MODEL, // 초기값은 모델 프리셋
    generatedImages: [],
    selectedResultId: null,
    isGenerating: false,
    error: null,
    modelReferenceImage: null
  });

  // 편집 단계의 상태들
  const [editTab, setEditTab] = useState<'TEXT' | 'COLOR' | 'BG' | 'FACE' | 'ACC'>('TEXT');
  const [editPrompt, setEditPrompt] = useState("");
  const [editColor, setEditColor] = useState("#000000");
  
  // 배경 편집 상태
  const [bgImage, setBgImage] = useState<{preview: string, base64: string} | null>(null);
  
  // 얼굴 편집 상태
  const [faceEditImage, setFaceEditImage] = useState<{preview: string, base64: string} | null>(null);
  
  // 악세사리 편집 상태
  const [accLocation, setAccLocation] = useState("Right Hand");
  const [accImage, setAccImage] = useState<{preview: string, base64: string} | null>(null);


  useEffect(() => {
    // 선택된 결과물이 바뀌면 편집 상태 초기화
    setEditPrompt("");
    setEditColor("#000000");
    setBgImage(null);
    setFaceEditImage(null);
    setAccImage(null);
    setAccLocation("Right Hand");
    setEditTab('TEXT');
  }, [state.selectedResultId]);

  // --- 핸들러 함수들 ---

  // 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const files = Array.from(e.target.files) as File[];
      
      const fileReaders = files.map(file => {
        return new Promise<InputImage>((resolve) => {
          const reader = new FileReader();
          reader.onload = (ev) => {
            if (ev.target?.result) {
              resolve({
                id: Math.random().toString(36).substr(2, 9),
                file: file,
                previewUrl: URL.createObjectURL(file),
                base64: ev.target.result as string
              });
            }
          };
          reader.readAsDataURL(file);
        });
      });

      Promise.all(fileReaders).then(newImages => {
        setState(prev => ({
          ...prev,
          inputImages: [...prev.inputImages, ...newImages],
          selectedInputId: prev.selectedInputId || newImages[0]?.id
        }));
      });
    }
  };

  // 얼굴 참조 이미지 업로드 처리 (레이어 단계)
  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (ev.target?.result) {
          setState(prev => ({
            ...prev,
            modelReferenceImage: ev.target!.result as string
          }));
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  // 공통 이미지 업로드 헬퍼
  const handleSingleImageUpload = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: {preview: string, base64: string} | null) => void) => {
     if (e.target.files && e.target.files[0]) {
        const file = e.target.files[0];
        const reader = new FileReader();
        reader.onload = (ev) => {
           if (ev.target?.result) {
              setter({
                  preview: URL.createObjectURL(file),
                  base64: ev.target.result as string
              });
           }
        };
        reader.readAsDataURL(file);
     }
  };

  // 생성 유형 변경 핸들러
  const handleTypeChange = (typeId: string) => {
    let newLayers: PromptLayer[];
    if (typeId === 'PRODUCT_ONLY') {
      newLayers = [...LAYER_PRESETS.PRODUCT];
    } else {
      newLayers = [...LAYER_PRESETS.MODEL];
    }
    setState(prev => ({
      ...prev,
      config: { ...prev.config, type: typeId as any },
      layers: newLayers
    }));
  };

  // 레이어 ON/OFF 토글
  const handleLayerToggle = (id: string) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id && !l.isLocked ? { ...l, enabled: !l.enabled } : l)
    }));
  };

  // 레이어 내용 수정
  const handleLayerChange = (id: string, content: string) => {
    setState(prev => ({
      ...prev,
      layers: prev.layers.map(l => l.id === id ? { ...l, content } : l)
    }));
  };

  // 사용자 정의 레이어 추가
  const addCustomLayer = () => {
    const newLayer: PromptLayer = {
      id: `custom-${Date.now()}`,
      name: '사용자 정의 조건',
      type: 'CUSTOM',
      content: '',
      enabled: true
    };
    setState(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
  };

  // 퀵 프롬프트로 레이어 추가
  const addQuickLayer = (item: { label: string, content: string }) => {
    const newLayer: PromptLayer = {
      id: `quick-${Date.now()}`,
      name: item.label,
      type: 'CUSTOM',
      content: item.content,
      enabled: true
    };
    setState(prev => ({ ...prev, layers: [...prev.layers, newLayer] }));
  };

  // 레이어 삭제
  const removeLayer = (id: string) => {
    setState(prev => ({ ...prev, layers: prev.layers.filter(l => l.id !== id) }));
  };

  // 활성화된 레이어들을 조합하여 최종 프롬프트 생성
  const buildPrompt = () => {
    let promptParts = state.layers
      .filter(l => l.enabled)
      .map(l => l.content);
    
    if (state.config.removeWatermark) {
      const removalPrompt = "ENSURE ALL WATERMARKS, LOGOS, AND TEXT ARE COMPLETELY REMOVED FROM THE IMAGE. Clean background, professional retouching.";
      promptParts = [removalPrompt, ...promptParts];
    }

    return promptParts.join(', ');
  };

  // 이미지 생성 실행 (핵심 로직)
  const runGeneration = async () => {
    const inputImage = state.inputImages.find(img => img.id === state.selectedInputId);
    if (!inputImage) {
      setState(prev => ({ ...prev, error: "입력 이미지를 먼저 선택해주세요." }));
      return;
    }

    setState(prev => ({ ...prev, isGenerating: true, step: WorkflowStep.GENERATION, error: null }));

    try {
      const fullPrompt = buildPrompt();
      const results = await generateBatchImages(
        inputImage.base64, 
        fullPrompt, 
        state.config.count,
        state.modelReferenceImage
      );
      
      const newGeneratedImages: GeneratedImage[] = results.map(base64 => ({
        id: Math.random().toString(36).substr(2, 9),
        parentId: inputImage.id,
        imageUrl: base64,
        base64Data: base64,
        promptUsed: fullPrompt,
        timestamp: Date.now()
      }));

      setState(prev => ({
        ...prev,
        generatedImages: [...prev.generatedImages, ...newGeneratedImages],
        isGenerating: false
      }));

    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: err.message }));
    }
  };

  // 결과물 재조정 (Inpainting/Editing)
  const handleAdjustment = async (prompt: string, sourceImageBase64: string, refConfig: ReferenceConfig | null = null) => {
    setState(prev => ({ ...prev, isGenerating: true, error: null }));
    try {
      const resultBase64 = await generateImageVariation(sourceImageBase64, prompt, refConfig);
      const newImage: GeneratedImage = {
        id: Math.random().toString(36).substr(2, 9),
        parentId: state.selectedInputId!,
        imageUrl: resultBase64,
        base64Data: resultBase64,
        promptUsed: prompt,
        timestamp: Date.now()
      };
      
      setState(prev => ({
        ...prev,
        generatedImages: [newImage, ...prev.generatedImages],
        selectedResultId: newImage.id,
        isGenerating: false
      }));
    } catch (err: any) {
      setState(prev => ({ ...prev, isGenerating: false, error: err.message }));
    }
  };

  // --- 단계별 렌더링 함수들 ---

  const renderUploadStep = () => (
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
          <input type="file" className="hidden" accept="image/*" multiple onChange={handleFileUpload} />
        </label>

        {state.inputImages.length > 0 && (
          <div className="grid grid-cols-4 gap-4 w-full">
            {state.inputImages.map(img => (
              <div 
                key={img.id} 
                className={`relative aspect-[4/5] rounded-lg overflow-hidden border-2 cursor-pointer ${state.selectedInputId === img.id ? 'border-indigo-600 ring-2 ring-indigo-100' : 'border-slate-200'}`}
                onClick={() => setState(prev => ({ ...prev, selectedInputId: img.id }))}
              >
                <img src={img.previewUrl} alt="Upload" className="w-full h-full object-cover" />
                {state.selectedInputId === img.id && (
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

  const renderConditionsStep = () => (
    <div className="max-w-2xl mx-auto py-10 space-y-8">
      {/* ... 기존 내용 유지 ... */}
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
                onClick={() => setState(prev => ({ ...prev, config: { ...prev.config, count } }))}
                className={`flex-1 py-3 px-4 rounded-lg border text-sm font-medium transition-all ${
                  state.config.count === count 
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
                  state.config.type === type.id
                    ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-200' 
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div>
                  <h4 className={`font-medium ${state.config.type === type.id ? 'text-indigo-900' : 'text-slate-900'}`}>{type.label}</h4>
                  <p className="text-sm text-slate-500">{type.desc}</p>
                </div>
                {state.config.type === type.id && <CheckCircle className="text-indigo-600" size={20} />}
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-3">부가 옵션</label>
          <div 
            onClick={() => setState(prev => ({ ...prev, config: { ...prev.config, removeWatermark: !prev.config.removeWatermark } }))}
            className={`p-4 rounded-lg border cursor-pointer flex items-center justify-between transition-all ${
              state.config.removeWatermark
                ? 'bg-indigo-50 border-indigo-600 ring-1 ring-indigo-200' 
                : 'bg-white border-slate-200 hover:border-slate-300'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className={`p-2 rounded-lg ${state.config.removeWatermark ? 'bg-indigo-200 text-indigo-800' : 'bg-slate-100 text-slate-500'}`}>
                <Eraser size={20} />
              </div>
              <div>
                <h4 className={`font-medium ${state.config.removeWatermark ? 'text-indigo-900' : 'text-slate-900'}`}>워터마크 및 텍스트 제거</h4>
                <p className="text-sm text-slate-500">원본 이미지에 있는 로고나 글자를 지우고 생성합니다.</p>
              </div>
            </div>
            
            <div className={`w-12 h-6 rounded-full p-1 transition-colors ${state.config.removeWatermark ? 'bg-indigo-600' : 'bg-slate-300'}`}>
              <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${state.config.removeWatermark ? 'translate-x-6' : 'translate-x-0'}`} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderLayersStep = () => {
    // ... 기존 내용 유지 ...
    const LAYER_QUICK_PROMPTS = [
      { label: "스튜디오 조명", content: "Professional studio lighting, softbox, neutral background, sharp details" },
      { label: "자연광/야외", content: "Natural sunlight, outdoor setting, golden hour, street photography style" },
      { label: "럭셔리 무드", content: "High-end luxury fashion style, elegant atmosphere, detailed texture, cinematic lighting" },
      { label: "미니멀 배경", content: "Clean minimalist background, solid color, distraction-free, modern look" },
      { label: "클로즈업", content: "Close-up portrait shot, focus on face and details, shallow depth of field" },
      { label: "전신 샷", content: "Full body shot, wide angle, showing shoes and styling, fashion magazine composition" }
    ];

    return (
      <div className="max-w-4xl mx-auto py-8 flex gap-8 h-[calc(100vh-140px)]">
        <div className="w-1/3 hidden md:block">
          <div className="sticky top-24">
            <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wide mb-4">기본 입력 이미지</h3>
            {state.selectedInputId && (
              <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
                <img 
                  src={state.inputImages.find(i => i.id === state.selectedInputId)?.previewUrl} 
                  className="w-full h-auto" 
                  alt="Base" 
                />
              </div>
            )}
            
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200">
               <h4 className="text-xs font-bold text-slate-500 uppercase mb-1">현재 모드</h4>
               <p className="font-medium text-slate-900">
                 {state.config.type === 'PRODUCT_ONLY' ? '상품/누끼 촬영 (Ghost Mannequin)' : '모델 촬영 / 가상 피팅'}
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
            {state.layers.map((layer) => (
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
                
                {layer.name === '모델' && state.config.type !== 'PRODUCT_ONLY' && layer.enabled && (
                  <div className="mt-4 pt-4 border-t border-slate-200">
                    <div className="flex items-center justify-between mb-2">
                       <span className="text-xs font-semibold text-slate-500 uppercase flex items-center gap-1">
                         <User size={12}/> 모델 얼굴 참조
                       </span>
                       {state.modelReferenceImage && (
                         <button 
                           onClick={() => setState(prev => ({...prev, modelReferenceImage: null}))}
                           className="text-xs text-red-500 hover:text-red-700 font-medium"
                         >
                           삭제
                         </button>
                       )}
                    </div>
                    
                    {state.modelReferenceImage ? (
                      <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-lg border border-slate-200">
                         <img src={state.modelReferenceImage} alt="Face Ref" className="w-10 h-10 rounded-full object-cover border border-slate-300" />
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

  const renderGenerationStep = () => (
    <div className="max-w-6xl mx-auto py-8">
      {/* ... 기존 내용 유지 ... */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-2xl font-bold text-slate-900">생성 결과</h2>
          <p className="text-slate-500">이미지를 선택하여 조정하거나 다듬을 수 있습니다.</p>
        </div>
        {state.generatedImages.length > 0 && !state.isGenerating && (
           <button 
             onClick={runGeneration}
             className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-700 hover:bg-slate-50 font-medium"
           >
             <RefreshCw size={16} /> 추가 생성
           </button>
        )}
      </div>

      {state.error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg flex items-center gap-2">
          <X size={18} /> {state.error}
        </div>
      )}

      {state.isGenerating && state.generatedImages.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-96 bg-white rounded-2xl border border-slate-200 shadow-sm">
          <Loader2 size={48} className="animate-spin text-indigo-600 mb-4" />
          <p className="text-lg font-medium text-slate-900">변형을 생성하고 있습니다...</p>
          <p className="text-slate-500">Gemini 2.5 Flash 모델을 사용 중입니다. 잠시만 기다려주세요.</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {state.inputImages.map(input => (
             <div key={`input-${input.id}`} className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-slate-200 opacity-60 hover:opacity-100 transition-opacity">
                <img src={input.previewUrl} className="w-full h-full object-cover grayscale" />
                <div className="absolute top-2 left-2 bg-slate-800 text-white text-xs px-2 py-1 rounded">원본</div>
             </div>
          ))}
          
          {state.generatedImages.map((img) => (
            <div 
              key={img.id} 
              className="relative group aspect-[4/5] rounded-xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-md transition-all cursor-pointer bg-white"
            >
              <img src={img.imageUrl} alt="Result" className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-3">
                 <button 
                  onClick={() => {
                    setState(prev => ({ ...prev, selectedResultId: img.id, step: WorkflowStep.ADJUSTMENT }));
                  }}
                  className="bg-white text-slate-900 px-4 py-2 rounded-full font-medium text-sm hover:bg-indigo-50 flex items-center gap-2"
                 >
                   <Sliders size={14} /> 조정 / 편집
                 </button>
                 <button 
                  onClick={() => {
                    setState(prev => ({ ...prev, selectedResultId: img.id, step: WorkflowStep.FINAL }));
                  }}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-full font-medium text-sm hover:bg-indigo-700 flex items-center gap-2"
                 >
                   <CheckCircle size={14} /> 선택 완료
                 </button>
              </div>
            </div>
          ))}
           {state.isGenerating && (
             <div className="aspect-[4/5] rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-400" />
             </div>
           )}
        </div>
      )}
    </div>
  );

  const renderAdjustmentStep = () => {
    const selectedImage = state.generatedImages.find(img => img.id === state.selectedResultId) || 
                          state.inputImages.find(img => img.id === state.selectedInputId);
    
    const QUICK_EDITS = [
      { label: "워터마크 제거", text: "이미지 내의 텍스트와 워터마크를 자연스럽게 제거해줘" },
      { label: "조명 밝게", text: "전체적인 조명을 더 밝고 화사하게 만들어줘" }
    ];

    const COLOR_PALETTE = [
      { name: "Black", hex: "#000000" },
      { name: "White", hex: "#FFFFFF" },
      { name: "Navy", hex: "#1a2a44" },
      { name: "Red", hex: "#c92a2a" },
      { name: "Beige", hex: "#f5f5dc" },
      { name: "Grey", hex: "#808080" },
    ];

    const handleEditSubmit = (e: React.FormEvent) => {
      e.preventDefault();
      if (!editPrompt.trim() || !selectedImage) return;
      
      const sourceBase64 = 'base64Data' in selectedImage ? (selectedImage as GeneratedImage).base64Data : (selectedImage as InputImage).base64;
      if (sourceBase64) {
         let refConfig: ReferenceConfig | null = null;
         
         if (editTab === 'BG' && bgImage) {
            refConfig = { data: bgImage.base64, type: 'BACKGROUND' };
         } else if (editTab === 'FACE' && faceEditImage) {
            refConfig = { data: faceEditImage.base64, type: 'FACE' };
         } else if (editTab === 'ACC' && accImage) {
            refConfig = { data: accImage.base64, type: 'ACCESSORY' };
         }
         
         // 악세사리의 경우 위치 정보를 프롬프트에 추가
         let finalPrompt = editPrompt;
         if (editTab === 'ACC') {
             finalPrompt = `${editPrompt} at ${accLocation}`;
         }

         handleAdjustment(finalPrompt, sourceBase64, refConfig);
         setEditPrompt(""); // 제출 후 프롬프트 초기화 (선택 사항)
      }
    };

    const handleColorSubmit = () => {
      if (!selectedImage) return;
      const sourceBase64 = 'base64Data' in selectedImage ? (selectedImage as GeneratedImage).base64Data : (selectedImage as InputImage).base64;
      if (sourceBase64) {
         const colorPrompt = `Change the color of the main product/clothing to ${editColor}. Maintain original texture, shadows, and fabric details.`;
         handleAdjustment(colorPrompt, sourceBase64);
      }
    };

    if (!selectedImage) return <div>선택된 이미지가 없습니다</div>;

    const isGenerated = 'promptUsed' in selectedImage;
    const displayUrl = isGenerated ? (selectedImage as GeneratedImage).imageUrl : (selectedImage as InputImage).previewUrl;

    const TabButton = ({ id, icon: Icon, label }: any) => (
      <button 
        onClick={() => setEditTab(id)}
        className={`flex-1 py-3 text-sm font-medium flex flex-col items-center gap-1 transition-colors relative ${editTab === id ? 'text-indigo-600 bg-indigo-50' : 'text-slate-500 hover:text-slate-700'}`}
      >
        <Icon size={18} />
        {label}
        {editTab === id && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-indigo-600" />}
      </button>
    );

    return (
      <div className="max-w-6xl mx-auto py-6 h-[calc(100vh-140px)] flex gap-6">
        {/* 왼쪽: 캔버스 */}
        <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center p-8 relative overflow-hidden">
            <img 
              src={displayUrl} 
              alt="To Edit" 
              className="max-h-full max-w-full shadow-lg rounded-lg object-contain"
            />
             {state.isGenerating && (
                <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                   <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
                     <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                     <p className="font-medium">편집 내용 적용 중...</p>
                   </div>
                </div>
             )}
        </div>

        {/* 오른쪽: 컨트롤 패널 */}
        <div className="w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
          {/* 상단 탭 */}
          <div className="flex border-b border-slate-200">
             <TabButton id="TEXT" icon={Wand2} label="텍스트" />
             <TabButton id="COLOR" icon={Palette} label="색상" />
             <TabButton id="BG" icon={Mountain} label="배경" />
             <TabButton id="FACE" icon={User} label="얼굴" />
             <TabButton id="ACC" icon={Watch} label="소품" />
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            
            {/* 1. 텍스트 탭 */}
            {editTab === 'TEXT' && (
               <div className="space-y-4">
                 <h3 className="font-semibold text-slate-900">AI 텍스트 정밀 보정</h3>
                 <div className="flex flex-wrap gap-2">
                    {QUICK_EDITS.map((item, idx) => (
                      <button 
                        key={idx}
                        type="button"
                        onClick={() => setEditPrompt(item.text)}
                        className="text-xs bg-slate-50 hover:bg-indigo-50 text-slate-600 px-3 py-1.5 rounded-full border border-slate-200 hover:border-indigo-200 transition-colors"
                      >
                         {item.label}
                      </button>
                    ))}
                  </div>
                  <textarea 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder='예: "빈티지 필터 추가", "더 웃는 표정으로"'
                    className="w-full text-sm p-3 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 outline-none h-32 resize-none"
                  />
                  <button onClick={handleEditSubmit} disabled={state.isGenerating || !editPrompt} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">편집 적용</button>
               </div>
            )}

            {/* 2. 색상 탭 */}
            {editTab === 'COLOR' && (
              <div className="space-y-6">
                 <h3 className="font-semibold text-slate-900">제품 색상 변경</h3>
                 <div className="flex items-center gap-3">
                    <input 
                       type="color" 
                       value={editColor}
                       onChange={(e) => setEditColor(e.target.value)}
                       className="w-16 h-16 p-1 rounded-xl cursor-pointer border border-slate-200"
                    />
                    <div className="flex-1">
                       <p className="text-xs text-slate-500 mb-1">HEX CODE</p>
                       <input type="text" value={editColor} readOnly className="w-full font-mono bg-slate-50 border border-slate-200 rounded px-2 py-1" />
                    </div>
                 </div>
                 <div>
                    <p className="text-xs text-slate-500 mb-2">프리셋 색상</p>
                    <div className="flex flex-wrap gap-2">
                      {COLOR_PALETTE.map((color) => (
                        <button
                          key={color.name}
                          onClick={() => setEditColor(color.hex)}
                          className="w-8 h-8 rounded-full border border-slate-200 shadow-sm hover:scale-110 transition-transform"
                          style={{ backgroundColor: color.hex }}
                        />
                      ))}
                    </div>
                 </div>
                 <button onClick={handleColorSubmit} disabled={state.isGenerating} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">색상 적용하기</button>
              </div>
            )}

            {/* 3. 배경 탭 (New) */}
            {editTab === 'BG' && (
              <div className="space-y-4">
                <h3 className="font-semibold text-slate-900">배경 교체</h3>
                
                {/* 프리셋 배경 */}
                <div>
                   <label className="text-xs font-medium text-slate-500 mb-2 block">스타일 프리셋</label>
                   <div className="grid grid-cols-3 gap-2">
                      {BACKGROUND_PRESETS.map(bg => (
                        <button 
                          key={bg.id}
                          onClick={() => setEditPrompt(bg.prompt)}
                          className="h-12 rounded-lg border border-slate-200 hover:border-indigo-500 hover:ring-1 hover:ring-indigo-200 transition-all flex items-center justify-center text-xs text-center p-1"
                          style={{ background: `linear-gradient(to bottom right, ${bg.color}, #ffffff)` }}
                        >
                          {bg.name}
                        </button>
                      ))}
                   </div>
                </div>

                {/* 커스텀 배경 업로드 */}
                <div className="border-t border-slate-100 pt-4">
                   <label className="text-xs font-medium text-slate-500 mb-2 block">또는 배경 이미지 업로드</label>
                   {bgImage ? (
                      <div className="relative rounded-lg overflow-hidden border border-slate-200 mb-2 group">
                         <img src={bgImage.preview} alt="BG" className="w-full h-32 object-cover" />
                         <button onClick={() => setBgImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors">
                            <X size={14} />
                         </button>
                      </div>
                   ) : (
                      <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                         <div className="text-center text-xs text-slate-500">
                            <Upload size={16} className="mx-auto mb-1" />
                            <span>배경용 이미지 업로드</span>
                         </div>
                         <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSingleImageUpload(e, setBgImage)} />
                      </label>
                   )}
                </div>

                {/* 텍스트 입력 */}
                <div>
                  <label className="text-xs font-medium text-slate-500 mb-1 block">배경 설명 (프롬프트)</label>
                  <textarea 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="예: 현대적인 사무실 배경으로 교체해줘"
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  />
                </div>

                <button onClick={handleEditSubmit} disabled={state.isGenerating || (!editPrompt && !bgImage)} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                   배경 적용
                </button>
              </div>
            )}

            {/* 4. 얼굴 탭 (New) */}
            {editTab === 'FACE' && (
               <div className="space-y-4">
                 <h3 className="font-semibold text-slate-900">얼굴 보정 및 교체</h3>
                 <p className="text-xs text-slate-500">원하는 모델의 얼굴 이미지를 업로드하여 현재 결과물의 얼굴을 교체하거나 보강합니다.</p>
                 
                 {faceEditImage ? (
                    <div className="relative rounded-lg overflow-hidden border border-slate-200 mb-2">
                       <img src={faceEditImage.preview} alt="Face" className="w-full h-40 object-cover" />
                       <button onClick={() => setFaceEditImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors">
                          <X size={14} />
                       </button>
                    </div>
                 ) : (
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                       <div className="text-center text-xs text-slate-500">
                          <User size={20} className="mx-auto mb-2 text-slate-400" />
                          <span>교체할 얼굴 사진 업로드</span>
                       </div>
                       <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSingleImageUpload(e, setFaceEditImage)} />
                    </label>
                 )}
                 
                 <textarea 
                    value={editPrompt}
                    onChange={(e) => setEditPrompt(e.target.value)}
                    placeholder="추가 요청 사항 (예: 자연스럽게 웃는 표정)"
                    className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-20 resize-none"
                  />

                 <button onClick={handleEditSubmit} disabled={state.isGenerating || !faceEditImage} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                    얼굴 교체 실행
                 </button>
               </div>
            )}

            {/* 5. 악세사리 탭 (New) */}
            {editTab === 'ACC' && (
               <div className="space-y-4">
                 <h3 className="font-semibold text-slate-900">소품/악세사리 추가</h3>
                 
                 <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">착용 위치</label>
                    <select 
                      value={accLocation}
                      onChange={(e) => setAccLocation(e.target.value)}
                      className="w-full text-sm p-2 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                    >
                       <option>Right Hand (오른손)</option>
                       <option>Left Hand (왼손)</option>
                       <option>Neck (목)</option>
                       <option>Head (머리)</option>
                       <option>Right Wrist (오른쪽 손목)</option>
                       <option>Left Wrist (왼쪽 손목)</option>
                       <option>Feet (발)</option>
                    </select>
                 </div>

                 <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">악세사리 이미지</label>
                    {accImage ? (
                        <div className="relative rounded-lg overflow-hidden border border-slate-200 mb-2">
                           <img src={accImage.preview} alt="Acc" className="w-full h-32 object-contain bg-slate-50" />
                           <button onClick={() => setAccImage(null)} className="absolute top-2 right-2 bg-black/50 text-white p-1 rounded-full hover:bg-red-500 transition-colors">
                              <X size={14} />
                           </button>
                        </div>
                     ) : (
                        <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-slate-200 border-dashed rounded-lg cursor-pointer hover:bg-slate-50">
                           <div className="text-center text-xs text-slate-500">
                              <Watch size={16} className="mx-auto mb-1" />
                              <span>악세사리/소품 이미지 업로드</span>
                           </div>
                           <input type="file" className="hidden" accept="image/*" onChange={(e) => handleSingleImageUpload(e, setAccImage)} />
                        </label>
                     )}
                 </div>

                 <div>
                    <label className="text-xs font-medium text-slate-500 mb-1 block">추가 설명</label>
                    <textarea 
                      value={editPrompt}
                      onChange={(e) => setEditPrompt(e.target.value)}
                      placeholder="예: 가죽 시계, 금색 반지 등"
                      className="w-full text-sm p-2 border border-slate-200 rounded-lg focus:ring-2 focus:ring-indigo-500 h-16 resize-none"
                    />
                 </div>

                 <button onClick={handleEditSubmit} disabled={state.isGenerating || !accImage} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
                    악세사리 착용
                 </button>
               </div>
            )}

            {/* 세션 히스토리 (하단 고정) */}
            <div className="pt-4 border-t border-slate-100 mt-4">
              <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3">세션 기록</h4>
              <div className="grid grid-cols-3 gap-2">
                  {state.generatedImages.map(img => (
                    <div 
                    key={img.id} 
                    onClick={() => setState(prev => ({ ...prev, selectedResultId: img.id }))}
                    className={`aspect-[4/5] rounded-lg overflow-hidden border cursor-pointer ${state.selectedResultId === img.id ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'}`}
                    >
                      <img src={img.imageUrl} className="w-full h-full object-cover" />
                    </div>
                  ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderFinalStep = () => {
    // ... 기존 내용 유지 ...
    const selectedImage = state.generatedImages.find(img => img.id === state.selectedResultId);
    if (!selectedImage) return null;

    return (
      <div className="max-w-4xl mx-auto py-12 flex flex-col md:flex-row gap-12 items-center">
        <div className="w-full md:w-1/2">
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
             <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 flex justify-between items-center">
                <div>
                   <p className="font-semibold text-slate-900">고화질 PNG</p>
                   <p className="text-xs text-slate-500">무손실 압축, 웹 게시에 최적화</p>
                </div>
                <button 
                  onClick={() => {
                    const link = document.createElement('a');
                    link.href = selectedImage.imageUrl;
                    link.download = `banafit-export-${selectedImage.id}.png`;
                    link.click();
                  }}
                  className="bg-slate-900 hover:bg-slate-800 text-white p-3 rounded-lg transition-colors"
                >
                  <Download size={20} />
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

           <div className="pt-6 border-t border-slate-200 flex flex-col gap-3">
             <button 
               onClick={prevStep}
               className="w-full py-3 rounded-lg border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-colors flex items-center justify-center gap-2"
             >
               <ArrowLeft size={16} /> 편집 화면으로 돌아가기
             </button>

             <button 
               onClick={() => setState(prev => ({ 
                 ...prev, 
                 step: WorkflowStep.UPLOAD, 
                 inputImages: [], 
                 generatedImages: [],
                 selectedInputId: null,
                 selectedResultId: null
               }))}
               className="w-full py-2 text-slate-400 hover:text-slate-600 font-medium flex items-center justify-center gap-2 text-sm"
             >
               새 프로젝트 시작 <ArrowRight size={14} />
             </button>
           </div>
        </div>
      </div>
    );
  };

  // --- 네비게이션 로직 ---

  // 다음 단계로 이동 가능 여부 체크
  const canGoNext = () => {
    switch (state.step) {
      case WorkflowStep.UPLOAD: return state.inputImages.length > 0;
      case WorkflowStep.CONDITIONS: return true;
      case WorkflowStep.LAYERS: return true;
      case WorkflowStep.GENERATION: return state.generatedImages.length > 0;
      case WorkflowStep.ADJUSTMENT: return state.selectedResultId !== null;
      default: return false;
    }
  };

  // 다음 단계 이동 핸들러
  const nextStep = () => {
    switch (state.step) {
      case WorkflowStep.UPLOAD: setState(prev => ({ ...prev, step: WorkflowStep.CONDITIONS })); break;
      case WorkflowStep.CONDITIONS: setState(prev => ({ ...prev, step: WorkflowStep.LAYERS })); break;
      case WorkflowStep.LAYERS: 
        runGeneration(); // 레이어 단계에서 '다음' 누르면 생성 시작
        break;
      case WorkflowStep.GENERATION: 
        if (state.selectedResultId) {
            setState(prev => ({ ...prev, step: WorkflowStep.ADJUSTMENT }));
        } else {
            // 선택된 게 없으면 첫 번째 자동 선택
            const firstId = state.generatedImages[0]?.id;
            if (firstId) setState(prev => ({ ...prev, selectedResultId: firstId, step: WorkflowStep.ADJUSTMENT }));
        }
        break;
      case WorkflowStep.ADJUSTMENT: setState(prev => ({ ...prev, step: WorkflowStep.FINAL })); break;
    }
  };

  // 이전 단계 이동 핸들러
  const prevStep = () => {
    switch (state.step) {
      case WorkflowStep.CONDITIONS: setState(prev => ({ ...prev, step: WorkflowStep.UPLOAD })); break;
      case WorkflowStep.LAYERS: setState(prev => ({ ...prev, step: WorkflowStep.CONDITIONS })); break;
      case WorkflowStep.GENERATION: setState(prev => ({ ...prev, step: WorkflowStep.LAYERS })); break;
      case WorkflowStep.ADJUSTMENT: setState(prev => ({ ...prev, step: WorkflowStep.GENERATION })); break;
      case WorkflowStep.FINAL: setState(prev => ({ ...prev, step: WorkflowStep.ADJUSTMENT })); break;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <StepIndicator currentStep={state.step} />
      
      <main className="px-6">
        {state.step === WorkflowStep.UPLOAD && renderUploadStep()}
        {state.step === WorkflowStep.CONDITIONS && renderConditionsStep()}
        {state.step === WorkflowStep.LAYERS && renderLayersStep()}
        {state.step === WorkflowStep.GENERATION && renderGenerationStep()}
        {state.step === WorkflowStep.ADJUSTMENT && renderAdjustmentStep()}
        {state.step === WorkflowStep.FINAL && renderFinalStep()}
      </main>

      {/* 하단 고정 네비게이션 바 */}
      {state.step !== WorkflowStep.FINAL && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
             <button 
               onClick={prevStep}
               disabled={state.step === WorkflowStep.UPLOAD}
               className="px-6 py-2 rounded-lg text-slate-500 font-medium hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
             >
               이전
             </button>

             <div className="flex items-center gap-4">
                {state.step === WorkflowStep.LAYERS ? (
                    <button 
                    onClick={runGeneration}
                    disabled={state.isGenerating}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
                  >
                    {state.isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                    이미지 생성
                  </button>
                ) : (
                  <button 
                    onClick={nextStep}
                    disabled={!canGoNext()}
                    className="px-8 py-3 rounded-xl bg-slate-900 text-white font-bold hover:bg-slate-800 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    다음 단계 <ChevronRight size={18} />
                  </button>
                )}
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
