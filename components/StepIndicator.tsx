
import React from 'react';
import { CheckCircle } from 'lucide-react';
import { WorkflowStep } from '../types';

interface StepIndicatorProps {
  currentStep: WorkflowStep;
}

const StepIndicator: React.FC<StepIndicatorProps> = ({ currentStep }) => {
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

export default StepIndicator;
