
import { GoogleGenAI } from "@google/genai";
import { ReferenceConfig } from "../types";

// 사용할 모델 정의 (이미지 생성/편집용 최신 모델)
const IMAGE_MODEL = 'gemini-2.5-flash-image';

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
  // Initialize client inside function to avoid top-level crash if process is undefined during load
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

  try {
    const inputMimeType = getMimeType(imageBase64) || mimeType;
    
    // API에 전송할 컨텐츠 파트 구성
    // 첫 번째 파트: 원본 이미지
    const parts: any[] = [
      {
        inlineData: {
          mimeType: inputMimeType,
          data: cleanBase64(imageBase64),
        },
      }
    ];

    let finalPrompt = prompt;
    
    // 참조 이미지가 있는 경우 처리
    if (referenceConfig && referenceConfig.data) {
      const refMimeType = getMimeType(referenceConfig.data);
      parts.push({
        inlineData: {
          mimeType: refMimeType,
          data: cleanBase64(referenceConfig.data),
        },
      });
      
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

    // 마지막 파트: 텍스트 프롬프트 추가
    parts.push({ text: finalPrompt });

    // 모델 호출 (generateContent)
    const response = await ai.models.generateContent({
      model: IMAGE_MODEL,
      contents: {
        parts: parts,
      },
    });

    // 응답에서 이미지 데이터 추출
    const responseParts = response.candidates?.[0]?.content?.parts;
    
    if (!responseParts) {
      const finishReason = response.candidates?.[0]?.finishReason;
      if (finishReason) {
         throw new Error(`생성이 중단되었습니다. 사유: ${finishReason}`);
      }
      throw new Error("생성된 컨텐츠가 없습니다.");
    }

    let textResponse = "";

    // 파트를 순회하며 이미지를 찾습니다.
    for (const part of responseParts) {
      if (part.inlineData && part.inlineData.data) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
      if (part.text) {
        textResponse += part.text;
      }
    }

    if (textResponse) {
       // 텍스트가 반환되었지만 이미지가 없는 경우, 모델이 명령을 거부했거나 챗 모드로 동작한 것임
       const msg = textResponse.length > 200 ? textResponse.substring(0, 200) + "..." : textResponse;
       console.warn("AI returned text instead of image:", textResponse);
       throw new Error(`AI가 이미지를 생성하지 않고 텍스트로 응답했습니다: "${msg}"`);
    }

    throw new Error("응답에서 이미지 데이터를 찾을 수 없습니다.");

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
