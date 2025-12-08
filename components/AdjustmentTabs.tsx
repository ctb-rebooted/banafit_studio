
import React from 'react';
import { Wand2, User, X, Upload, Watch, Mountain } from 'lucide-react';
import { BACKGROUND_PRESETS } from '../presets/backgrounds';

// --- Shared Helper ---
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

// --- 1. Text Edit Tab ---
export const TextEditTab = ({ editPrompt, setEditPrompt, onSubmit, isGenerating }: any) => {
    const QUICK_EDITS = [
        { label: "워터마크 제거", text: "이미지 내의 텍스트와 워터마크를 자연스럽게 제거해줘" },
        { label: "조명 밝게", text: "전체적인 조명을 더 밝고 화사하게 만들어줘" },
        { label: "선명하게", text: "이미지를 더 선명하고 또렷하게 만들어줘" }
    ];
    
    return (
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
            <button onClick={onSubmit} disabled={isGenerating || !editPrompt} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">편집 적용</button>
        </div>
    );
};

// --- 2. Color Edit Tab ---
export const ColorEditTab = ({ editColor, setEditColor, onSubmit, isGenerating }: any) => {
    const COLOR_PALETTE = [
        { name: "Black", hex: "#000000" },
        { name: "White", hex: "#FFFFFF" },
        { name: "Navy", hex: "#1a2a44" },
        { name: "Red", hex: "#c92a2a" },
        { name: "Beige", hex: "#f5f5dc" },
        { name: "Grey", hex: "#808080" },
    ];

    return (
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
            <button onClick={onSubmit} disabled={isGenerating} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">색상 적용하기</button>
        </div>
    );
};

// --- 3. Background Tab ---
export const BackgroundTab = ({ editPrompt, setEditPrompt, bgImage, setBgImage, onSubmit, isGenerating }: any) => {
    return (
        <div className="space-y-4">
        <h3 className="font-semibold text-slate-900">배경 교체</h3>
        
        {/* 프리셋 배경 */}
        <div>
            <label className="text-xs font-medium text-slate-500 mb-2 block">스타일 프리셋</label>
            <div className="grid grid-cols-3 gap-2">
                {BACKGROUND_PRESETS.map((bg: any) => (
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

        <button onClick={onSubmit} disabled={isGenerating || (!editPrompt && !bgImage)} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
            배경 적용
        </button>
        </div>
    );
};

// --- 4. Face Tab ---
export const FaceTab = ({ editPrompt, setEditPrompt, faceEditImage, setFaceEditImage, onSubmit, isGenerating }: any) => {
    return (
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

            <button onClick={onSubmit} disabled={isGenerating || !faceEditImage} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
            얼굴 교체 실행
            </button>
        </div>
    );
};

// --- 5. Accessory Tab ---
export const AccessoryTab = ({ editPrompt, setEditPrompt, accImage, setAccImage, accLocation, setAccLocation, onSubmit, isGenerating }: any) => {
    return (
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

            <button onClick={onSubmit} disabled={isGenerating || !accImage} className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm font-medium hover:bg-slate-800 disabled:opacity-50">
            악세사리 착용
            </button>
        </div>
    );
};
