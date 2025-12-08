
import { GoogleGenAI } from "@google/genai";

// 환경 변수에서 API 키를 가져옵니다.
const API_KEY = process.env.API_KEY;

if (!API_KEY) {
  console.error("환경 변수에 API_KEY가 설정되지 않았습니다.");
}

// Gemini 클라이언트 초기화
const ai = new GoogleGenAI({ apiKey: API_KEY });

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

// 참조 이미지 설정 타입 정의
export interface ReferenceConfig {
  data: string;
  type: 'FACE' | 'BACKGROUND' | 'ACCESSORY';
}

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
  if (!API_KEY) throw new Error("API 키를 찾을 수 없습니다.");

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
        finalPrompt = `[SYSTEM] Image 1 is the main reference for clothing, pose, and composition. Image 2 is the face reference.
Task: Swap the face of the model in Image 1 with the face in Image 2. Maintain the pose, lighting, and skin tone of Image 1. Blend naturally.
User Request: ${prompt}`;
      } else if (referenceConfig.type === 'BACKGROUND') {
        finalPrompt = `[SYSTEM] Image 1 is the foreground subject. Image 2 is the background reference.
Task: Replace the background of Image 1 with the scene or style shown in Image 2. Keep the main subject (person or product) from Image 1 exactly as is. Match the lighting of the subject to the new background.
User Request: ${prompt}`;
      } else if (referenceConfig.type === 'ACCESSORY') {
        finalPrompt = `[SYSTEM] Image 1 is the main model/subject. Image 2 is an accessory item.
Task: Add the accessory from Image 2 to the model in Image 1.
Placement context: ${prompt}
Ensure the accessory has correct perspective, shadow, and scaling to fit the model naturally.`;
      }
    } else {
        // 참조 이미지가 없는 경우 일반 프롬프트 처리
        finalPrompt = prompt;
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
       const msg = textResponse.length > 200 ? textResponse.substring(0, 200) + "..." : textResponse;
       throw new Error(`AI 응답 (이미지 없음): ${msg}`);
    }

    throw new Error("응답에서 이미지 데이터를 찾을 수 없습니다.");

  } catch (error: any) {
    console.error("Gemini 생성 오류:", error);
    throw new Error(error.message || "이미지 생성에 실패했습니다.");
  }
};

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
  const promises = Array.from({ length: count }).map(() => 
    generateImageVariation(imageBase64, prompt, refConfig)
  );
  
  // 모든 요청이 완료될 때까지 대기 (Promise.all)
  return Promise.all(promises);
};
