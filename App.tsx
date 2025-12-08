
import React from 'react';
import { Loader2, Wand2, ChevronRight } from 'lucide-react';
import { WorkflowStep } from './types';
import { useBanafit } from './hooks/useBanafit';
import StepIndicator from './components/StepIndicator';

// Steps
import UploadStep from './steps/UploadStep';
import ConditionsStep from './steps/ConditionsStep';
import LayersStep from './steps/LayersStep';
import GenerationStep from './steps/GenerationStep';
import AdjustmentStep from './steps/AdjustmentStep';
import FinalStep from './steps/FinalStep';

export default function App() {
  const { state, actions } = useBanafit();

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 pb-20">
      <StepIndicator currentStep={state.step} />
      
      <main className="px-6">
        {state.step === WorkflowStep.UPLOAD && (
          <UploadStep 
            inputImages={state.inputImages} 
            selectedInputId={state.selectedInputId} 
            onFileUpload={actions.handleFileUpload} 
            onSelectImage={(id) => actions.updateState({ selectedInputId: id })}
          />
        )}
        {state.step === WorkflowStep.CONDITIONS && (
          <ConditionsStep 
            config={state.config} 
            onUpdateConfig={actions.updateConfig}
            onUpdateLayers={(layers) => actions.updateState({ layers })}
          />
        )}
        {state.step === WorkflowStep.LAYERS && (
          <LayersStep state={state} updateState={actions.updateState} />
        )}
        {state.step === WorkflowStep.GENERATION && (
          <GenerationStep 
             state={state} 
             onRunGeneration={actions.runGeneration} 
             onSelectResult={(id, step) => actions.updateState({ selectedResultId: id, step })}
          />
        )}
        {state.step === WorkflowStep.ADJUSTMENT && (
          <AdjustmentStep 
             state={state} 
             updateState={actions.updateState}
             onAdjustment={actions.handleAdjustment}
          />
        )}
        {state.step === WorkflowStep.FINAL && (
          <FinalStep 
             state={state}
             updateState={actions.updateState}
             onGoBack={actions.prevStep}
             onReset={() => actions.updateState({ 
                 step: WorkflowStep.UPLOAD, 
                 inputImages: [], 
                 generatedImages: [],
                 selectedInputId: null,
                 selectedResultId: null
               })}
          />
        )}
      </main>

      {/* 하단 고정 네비게이션 바 */}
      {state.step !== WorkflowStep.FINAL && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-lg z-50">
          <div className="max-w-6xl mx-auto flex items-center justify-between">
             <button 
               onClick={actions.prevStep}
               disabled={state.step === WorkflowStep.UPLOAD}
               className="px-6 py-2 rounded-lg text-slate-500 font-medium hover:bg-slate-50 disabled:opacity-30 disabled:hover:bg-transparent"
             >
               이전
             </button>

             <div className="flex items-center gap-4">
                {state.step === WorkflowStep.LAYERS ? (
                    <button 
                    onClick={actions.runGeneration}
                    disabled={state.isGenerating}
                    className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 text-white font-bold hover:shadow-lg hover:shadow-indigo-200 transition-all flex items-center gap-2 disabled:opacity-70"
                  >
                    {state.isGenerating ? <Loader2 className="animate-spin" /> : <Wand2 size={18} />}
                    이미지 생성
                  </button>
                ) : (
                  <button 
                    onClick={actions.nextStep}
                    disabled={!actions.canGoNext()}
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
