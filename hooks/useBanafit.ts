
import { useState } from 'react';
import { AppState, WorkflowStep, InputImage, PromptLayer, GeneratedImage, ReferenceConfig } from '../types';
import { LAYER_PRESETS } from '../presets/layers';
import { generateBatchImages, generateImageVariation } from '../services/geminiService';

export const useBanafit = () => {
  const [state, setState] = useState<AppState>({
    step: WorkflowStep.UPLOAD,
    inputImages: [],
    selectedInputId: null,
    config: {
      count: 3,
      type: 'MODEL_CHANGE',
      keepModel: false,
      removeWatermark: false,
      targetAge: '20s',
      targetGender: 'Female'
    },
    layers: LAYER_PRESETS.MODEL,
    generatedImages: [],
    selectedResultId: null,
    isGenerating: false,
    error: null,
    modelReferenceImage: null
  });

  // Actions
  const updateState = (updates: Partial<AppState>) => {
    setState(prev => ({ ...prev, ...updates }));
  };

  const updateConfig = (updates: Partial<AppState['config']>) => {
    setState(prev => ({ ...prev, config: { ...prev.config, ...updates } }));
  };

  const handleFileUpload = (files: File[]) => {
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
  };

  const buildPrompt = () => {
    let promptParts = state.layers
      .filter(l => l.enabled)
      .map(l => l.content);
    
    // 모델 변경 모드일 때 한국인 모델 및 연령/성별 프롬프트 주입
    if (state.config.type === 'MODEL_CHANGE' || state.config.type === 'TRY_ON') {
      const { targetAge, targetGender } = state.config;
      
      const genderTerm = targetGender === 'Female' ? 'Woman' : 'Man';
      const koreanPrompt = `CORE TASK: Replace the model with an attractive Korean ${genderTerm} in their ${targetAge}. 
      Face Details: Charming Korean facial features, K-beauty style, natural skin texture, clear eyes.
      Expression/Pose: Maintain the original pose and facial expression intensity but adapted to the new Korean identity.
      Hair: Apply a trendy hairstyle suitable for a ${targetAge} Korean ${genderTerm}.`;
      
      promptParts = [koreanPrompt, ...promptParts];
    }

    if (state.config.removeWatermark) {
      const removalPrompt = "ENSURE ALL WATERMARKS, LOGOS, AND TEXT ARE COMPLETELY REMOVED FROM THE IMAGE. Clean background, professional retouching.";
      promptParts = [removalPrompt, ...promptParts];
    }
    return promptParts.join(', ');
  };

  const runGeneration = async () => {
    const inputImage = state.inputImages.find(img => img.id === state.selectedInputId);
    if (!inputImage) {
      updateState({ error: "입력 이미지를 먼저 선택해주세요." });
      return;
    }

    updateState({ isGenerating: true, step: WorkflowStep.GENERATION, error: null });

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
      updateState({ isGenerating: false, error: err.message });
    }
  };

  const handleAdjustment = async (prompt: string, sourceImageBase64: string, refConfig: ReferenceConfig | null = null) => {
    updateState({ isGenerating: true, error: null });
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
      updateState({ isGenerating: false, error: err.message });
    }
  };

  // Navigation
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

  const nextStep = () => {
    switch (state.step) {
      case WorkflowStep.UPLOAD: updateState({ step: WorkflowStep.CONDITIONS }); break;
      case WorkflowStep.CONDITIONS: updateState({ step: WorkflowStep.LAYERS }); break;
      case WorkflowStep.LAYERS: 
        runGeneration();
        break;
      case WorkflowStep.GENERATION: 
        if (state.selectedResultId) {
            updateState({ step: WorkflowStep.ADJUSTMENT });
        } else {
            const firstId = state.generatedImages[0]?.id;
            if (firstId) updateState({ selectedResultId: firstId, step: WorkflowStep.ADJUSTMENT });
        }
        break;
      case WorkflowStep.ADJUSTMENT: updateState({ step: WorkflowStep.FINAL }); break;
    }
  };

  const prevStep = () => {
    switch (state.step) {
      case WorkflowStep.CONDITIONS: updateState({ step: WorkflowStep.UPLOAD }); break;
      case WorkflowStep.LAYERS: updateState({ step: WorkflowStep.CONDITIONS }); break;
      case WorkflowStep.GENERATION: updateState({ step: WorkflowStep.LAYERS }); break;
      case WorkflowStep.ADJUSTMENT: updateState({ step: WorkflowStep.GENERATION }); break;
      case WorkflowStep.FINAL: updateState({ step: WorkflowStep.ADJUSTMENT }); break;
    }
  };

  return {
    state,
    actions: {
      updateState,
      updateConfig,
      handleFileUpload,
      runGeneration,
      handleAdjustment,
      nextStep,
      prevStep,
      canGoNext
    }
  };
};
