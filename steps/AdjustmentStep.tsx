
import React, { useState, useEffect } from 'react';
import { Loader2, Wand2, Palette, Mountain, User, Watch } from 'lucide-react';
import { AppState, GeneratedImage, InputImage, ReferenceConfig } from '../types';
import { TextEditTab, ColorEditTab, BackgroundTab, FaceTab, AccessoryTab } from '../components/AdjustmentTabs';

interface AdjustmentStepProps {
  state: AppState;
  updateState: (updates: Partial<AppState>) => void;
  onAdjustment: (prompt: string, sourceImageBase64: string, refConfig: ReferenceConfig | null) => void;
}

const AdjustmentStep: React.FC<AdjustmentStepProps> = ({ state, updateState, onAdjustment }) => {
  const { generatedImages, inputImages, selectedResultId, selectedInputId, isGenerating } = state;
  const selectedImage = generatedImages.find(img => img.id === selectedResultId) || 
                        inputImages.find(img => img.id === selectedInputId);

  // Local state for adjustment configurations
  const [editTab, setEditTab] = useState<'TEXT' | 'COLOR' | 'BG' | 'FACE' | 'ACC'>('TEXT');
  const [editPrompt, setEditPrompt] = useState("");
  const [editColor, setEditColor] = useState("#000000");
  const [bgImage, setBgImage] = useState<{preview: string, base64: string} | null>(null);
  const [faceEditImage, setFaceEditImage] = useState<{preview: string, base64: string} | null>(null);
  const [accLocation, setAccLocation] = useState("Right Hand");
  const [accImage, setAccImage] = useState<{preview: string, base64: string} | null>(null);

  useEffect(() => {
    // Reset local state when selected image changes
    setEditPrompt("");
    setEditColor("#000000");
    setBgImage(null);
    setFaceEditImage(null);
    setAccImage(null);
    setAccLocation("Right Hand");
    setEditTab('TEXT');
  }, [selectedResultId]);

  const handleEditSubmit = () => {
    if (!selectedImage) return;
    
    const sourceBase64 = 'base64Data' in selectedImage ? (selectedImage as GeneratedImage).base64Data : (selectedImage as InputImage).base64;
    if (sourceBase64) {
       let refConfig: ReferenceConfig | null = null;
       let finalPrompt = editPrompt;
       
       if (editTab === 'BG' && bgImage) {
          refConfig = { data: bgImage.base64, type: 'BACKGROUND' };
          // 사용자가 입력한 텍스트가 없으면 기본 명령어 추가
          if (!finalPrompt.trim()) {
            finalPrompt = "Change the background to the reference image provided.";
          }
       } else if (editTab === 'FACE') {
          // 이미지가 있으면 참조 설정, 없으면 텍스트 명령만 수행
          if (faceEditImage) {
            refConfig = { data: faceEditImage.base64, type: 'FACE' };
            if (!finalPrompt.trim()) {
              finalPrompt = "Swap the face of the person with the reference face provided.";
            }
          } else {
             // 이미지가 없는 경우, 텍스트가 필수임 (버튼에서 이미 막지만 이중 안전장치)
             if (!finalPrompt.trim()) return;
          }
       } else if (editTab === 'ACC' && accImage) {
          refConfig = { data: accImage.base64, type: 'ACCESSORY' };
          // 악세사리는 위치 정보가 필수이므로 조합
          finalPrompt = `${finalPrompt || 'Add this accessory'} at ${accLocation}`;
       } else if (editTab === 'TEXT') {
           // 텍스트 모드에서는 입력값이 필수
           if (!finalPrompt.trim()) return;
       }

       onAdjustment(finalPrompt, sourceBase64, refConfig);
       setEditPrompt(""); 
    }
  };

  const handleColorSubmit = () => {
    if (!selectedImage) return;
    const sourceBase64 = 'base64Data' in selectedImage ? (selectedImage as GeneratedImage).base64Data : (selectedImage as InputImage).base64;
    if (sourceBase64) {
       const colorPrompt = `Change the color of the main product/clothing to ${editColor}. Maintain original texture, shadows, and fabric details.`;
       onAdjustment(colorPrompt, sourceBase64, null);
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
      {/* Canvas */}
      <div className="flex-1 bg-slate-100 rounded-xl flex items-center justify-center p-8 relative overflow-hidden">
          <img 
            src={displayUrl} 
            alt="To Edit" 
            className="max-h-full max-w-full shadow-lg rounded-lg object-contain"
          />
           {isGenerating && (
              <div className="absolute inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center rounded-xl z-10">
                 <div className="bg-white p-6 rounded-xl shadow-xl flex flex-col items-center">
                   <Loader2 size={32} className="animate-spin text-indigo-600 mb-2" />
                   <p className="font-medium">편집 내용 적용 중...</p>
                 </div>
              </div>
           )}
      </div>

      {/* Control Panel */}
      <div className="w-96 flex flex-col bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="flex border-b border-slate-200">
           <TabButton id="TEXT" icon={Wand2} label="텍스트" />
           <TabButton id="COLOR" icon={Palette} label="색상" />
           <TabButton id="BG" icon={Mountain} label="배경" />
           <TabButton id="FACE" icon={User} label="얼굴" />
           <TabButton id="ACC" icon={Watch} label="소품" />
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {editTab === 'TEXT' && (
             <TextEditTab 
                editPrompt={editPrompt} setEditPrompt={setEditPrompt} 
                onSubmit={handleEditSubmit} isGenerating={isGenerating} 
             />
          )}
          {editTab === 'COLOR' && (
             <ColorEditTab 
                editColor={editColor} setEditColor={setEditColor} 
                onSubmit={handleColorSubmit} isGenerating={isGenerating} 
             />
          )}
          {editTab === 'BG' && (
             <BackgroundTab 
                editPrompt={editPrompt} setEditPrompt={setEditPrompt}
                bgImage={bgImage} setBgImage={setBgImage}
                onSubmit={handleEditSubmit} isGenerating={isGenerating}
             />
          )}
          {editTab === 'FACE' && (
             <FaceTab 
                editPrompt={editPrompt} setEditPrompt={setEditPrompt}
                faceEditImage={faceEditImage} setFaceEditImage={setFaceEditImage}
                onSubmit={handleEditSubmit} isGenerating={isGenerating}
             />
          )}
          {editTab === 'ACC' && (
             <AccessoryTab 
                editPrompt={editPrompt} setEditPrompt={setEditPrompt}
                accImage={accImage} setAccImage={setAccImage}
                accLocation={accLocation} setAccLocation={setAccLocation}
                onSubmit={handleEditSubmit} isGenerating={isGenerating}
             />
          )}

          {/* History */}
          <div className="pt-4 border-t border-slate-100 mt-4">
            <h4 className="text-xs font-semibold uppercase text-slate-500 tracking-wider mb-3">세션 기록</h4>
            <div className="grid grid-cols-3 gap-2">
                {generatedImages.map(img => (
                  <div 
                  key={img.id} 
                  onClick={() => updateState({ selectedResultId: img.id })}
                  className={`aspect-[4/5] rounded-lg overflow-hidden border cursor-pointer ${selectedResultId === img.id ? 'border-indigo-600 ring-2 ring-indigo-200' : 'border-slate-200'}`}
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

export default AdjustmentStep;
