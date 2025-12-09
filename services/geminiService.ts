
import { createClient } from "@supabase/supabase-js";
import { ReferenceConfig } from "../types";

// Supabase 클라이언트 초기화
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabase 환경 변수가 설정되지 않았습니다. VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY를 확인해주세요.");
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Edge Function 이름 (필요시 변경 가능)
const EDGE_FUNCTION_NAME = 'generate-image';

/**
 * Base64 문자열에서 헤더(prefix)를 제거하는 헬퍼 함수
 * API는 순수 데이터 부분만 요구할 때가 있습니다.
 */
const cleanBase64 = (base64Str: string) => {
  return base64Str.replace(/^data:image\/(png|jpeg|jpg|webp);base64,/, '');
};

/**
 * Base64 문자열에서 MIME 타입(파일 형식)을 추출하는 헬퍼 함수
 * 예: image/png, image/jpeg
 */
const getMimeType = (base64Str: string) => {
  const match = base64Str.match(/^data:(image\/[a-zA-Z+]+);base64,/);
  return match ? match[1] : 'image/png';
};

/**
 * 단일 이미지 변형/편집을 생성합니다.
 * Supabase Edge Function을 통해 Gemini API를 호출합니다.
 * @param imageBase64 원본 이미지 (Base64)
 * @param prompt 사용자 요청 프롬프트
 * @param referenceConfig (선택) 참조 이미지 설정 (얼굴, 배경, 악세사리 등)
 * @param mimeType (선택) 이미지 타입 (기본값 png)
 */
export const generateImageVariation = async (
  imageBase64: string,
  prompt: string,
  referenceConfig?: ReferenceConfig | null,
  mimeType: string = 'image/png' // 타입 감지 실패 시 기본값
): Promise<string> => {
  try {
    const inputMimeType = getMimeType(imageBase64) || mimeType;
    
    let finalPrompt = prompt;
    
    // 참조 이미지가 있는 경우 처리
    if (referenceConfig && referenceConfig.data) {
      // 참조 유형에 따른 시스템 프롬프트 구성
      if (referenceConfig.type === 'FACE') {
        finalPrompt = `[OPERATION: FACE SWAP]
Image 1: TARGET (The main photo to be edited)
Image 2: SOURCE FACE (The face identity to copy)

INSTRUCTIONS:
1. Identify the face in Image 2.
2. Replace the face of the person in Image 1 with the face from Image 2.
3. CRITICAL: Keep the hair, body, pose, clothing, and background of Image 1 EXACTLY THE SAME. Do not regenerate the entire image.
4. Blend the new face naturally (match skin tone, lighting direction, and head angle of Image 1).

User Note: ${prompt}

OUTPUT: Return the edited image ONLY. Do not output text.`;
      } else if (referenceConfig.type === 'BACKGROUND') {
        finalPrompt = `[OPERATION: BACKGROUND REPLACEMENT]
Image 1: FOREGROUND SUBJECT
Image 2: NEW BACKGROUND

INSTRUCTIONS:
1. Extract the main subject (person or product) from Image 1.
2. Place the subject into the environment of Image 2.
3. CRITICAL: Preserve the subject's pose, clothing, and details exactly.
4. Adjust lighting and shadows on the subject to match the new background.

User Note: ${prompt}

OUTPUT: Return the edited image ONLY. Do not output text.`;
      } else if (referenceConfig.type === 'ACCESSORY') {
        finalPrompt = `[OPERATION: VIRTUAL TRY-ON]
Image 1: MODEL
Image 2: ACCESSORY

INSTRUCTIONS:
1. Place the accessory from Image 2 onto the model in Image 1.
2. Context: ${prompt}
3. Ensure realistic perspective, occlusion, and shadows.
4. Do not change the model's face or body shape.

OUTPUT: Return the edited image ONLY. Do not output text.`;
      }
    } else {
        // 참조 이미지가 없는 경우 일반 프롬프트 처리
        // 단순 텍스트 프롬프트일 때도 이미지 생성을 강제
        finalPrompt = `[OPERATION: IMAGE EDITING]
Source Image: Provided inline
Instruction: ${prompt}

Action: Apply the instruction to the source image.
Constraint: Maintain the original style and details unless strictly required to change.
OUTPUT: Return the edited image ONLY. Do not output text description.`;
    }

    // Edge Function에 전달할 요청 데이터 구성
    const requestBody = {
      imageBase64: cleanBase64(imageBase64),
      imageMimeType: inputMimeType,
      prompt: finalPrompt,
      referenceImage: referenceConfig ? {
        data: cleanBase64(referenceConfig.data),
        mimeType: getMimeType(referenceConfig.data),
        type: referenceConfig.type
      } : null
    };

    // Supabase Edge Function 호출
    const { data, error } = await supabase.functions.invoke(EDGE_FUNCTION_NAME, {
      body: requestBody
    });

    if (error) {
      console.error("Edge Function 오류:", error);
      throw new Error(error.message || "이미지 생성에 실패했습니다.");
    }

    if (!data || !data.imageBase64) {
      throw new Error(data?.error || "응답에서 이미지 데이터를 찾을 수 없습니다.");
    }

    // Base64 이미지 데이터를 data URL 형식으로 반환
    const imageData = data.imageBase64;
    const imageMimeType = data.mimeType || 'image/png';
    
    // 이미 data: URL 형식인지 확인
    if (imageData.startsWith('data:')) {
      return imageData;
    }
    
    return `data:${imageMimeType};base64,${imageData}`;

  } catch (error: any) {
    console.error("Gemini 생성 오류:", error);
    throw new Error(error.message || "이미지 생성에 실패했습니다.");
  }
};

/**
 * 배치 생성 시 다양성을 확보하기 위한 미세 변형 프롬프트 목록
 * 헤어스타일과 조명에 변화를 주어 다양한 한국인 모델 이미지를 생성하도록 유도
 */
const BATCH_VARIATIONS = [
  "Style A: Long straight silky hair, soft professional studio lighting, serene expression.",
  "Style B: Natural wavy perm hairstyle, warm sunlight from right side, subtle smile.",
  "Style C: Ponytail or tied-back hair, clean neck line, chic and confident look, high contrast lighting.",
  "Style D: Shoulder-length medium bob cut (C-curl), modern city vibe, direct gaze.",
  "Style E: Natural loose hair with volume, fashion editorial style, dramatic shadowing."
];

/**
 * 일괄(Batch) 이미지 생성을 시뮬레이션합니다.
 * API를 병렬로 여러 번 호출하여 여러 장의 변형을 만듭니다.
 */
export const generateBatchImages = async (
  imageBase64: string,
  prompt: string,
  count: number,
  faceModelBase64?: string | null
): Promise<string[]> => {
  // 얼굴 참조가 있으면 ReferenceConfig 객체로 변환
  const refConfig: ReferenceConfig | null = faceModelBase64 
    ? { data: faceModelBase64, type: 'FACE' } 
    : null;

  // 요청 수(count)만큼 비동기 호출 배열 생성
  const promises = Array.from({ length: count }).map(() => {
    // 랜덤하게 스타일 변형 선택 (순차적 할당 대신 랜덤성 부여하여 3장 생성 시에도 다양한 스타일 나오게 함)
    const randomIndex = Math.floor(Math.random() * BATCH_VARIATIONS.length);
    const variation = BATCH_VARIATIONS[randomIndex];
    
    // 얼굴 참조가 있을 때와 없을 때 프롬프트 결합 방식이 다르지만,
    // generateImageVariation 내부에서 prompt를 'User Note' 등에 삽입하므로
    // 여기서 텍스트를 확장해서 넘겨주면 됨.
    const variedPrompt = `${prompt}\n\n[System Note for Diversity: Ensure this generated image has unique characteristics. ${variation}]`;

    return generateImageVariation(imageBase64, variedPrompt, refConfig);
  });
  
  // 모든 요청이 완료될 때까지 대기 (Promise.all)
  return Promise.all(promises);
};
