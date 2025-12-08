
import { PromptLayer } from '../types';

export const LAYER_PRESETS = {
  // 모델 촬영용 기본 프리셋
  MODEL: [
    { id: 'sys-1', name: '시스템 코어 (기본)', type: 'SYSTEM', content: 'High quality professional fashion photography, photorealistic, 8k resolution, detailed texture.', enabled: true, isLocked: true },
    { id: 'user-1', name: '모델', type: 'USER', content: 'Female fashion model, confident pose, natural makeup.', enabled: true },
    { id: 'user-2', name: '조명 및 배경', type: 'USER', content: 'Soft studio lighting, neutral background.', enabled: true },
  ] as PromptLayer[],
  // 제품/고스트 마네킹용 프리셋
  PRODUCT: [
    { id: 'sys-1', name: '시스템 코어 (기본)', type: 'SYSTEM', content: 'High quality professional product photography, 8k resolution, detailed texture, sharp focus.', enabled: true, isLocked: true },
    { id: 'prod-1', name: '고스트 마네킹', type: 'USER', content: 'Ghost mannequin effect, invisible mannequin, hollow clothing, 3D volume, neck insert detail, maintain original view angle and perspective.', enabled: true },
    { id: 'prod-2', name: '배경 및 조명', type: 'USER', content: 'Pure white background, clean isolation, soft diffuse lighting, no shadows.', enabled: true },
  ] as PromptLayer[]
};

export const LAYER_QUICK_PROMPTS = [
  { label: "스튜디오 조명", content: "Professional studio lighting, softbox, neutral background, sharp details" },
  { label: "자연광/야외", content: "Natural sunlight, outdoor setting, golden hour, street photography style" },
  { label: "럭셔리 무드", content: "High-end luxury fashion style, elegant atmosphere, detailed texture, cinematic lighting" },
  { label: "미니멀 배경", content: "Clean minimalist background, solid color, distraction-free, modern look" },
  { label: "클로즈업", content: "Close-up portrait shot, focus on face and details, shallow depth of field" },
  { label: "전신 샷", content: "Full body shot, wide angle, showing shoes and styling, fashion magazine composition" }
];
