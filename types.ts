
// 워크플로우의 각 단계를 정의하는 열거형 (Enum)
export enum WorkflowStep {
  UPLOAD = 'UPLOAD',           // 1. 이미지 업로드 단계
  CONDITIONS = 'CONDITIONS',   // 2. 생성 조건 설정 단계
  LAYERS = 'LAYERS',           // 3. 프롬프트 레이어 구성 단계
  GENERATION = 'GENERATION',   // 4. 이미지 생성 및 결과 확인 단계
  ADJUSTMENT = 'ADJUSTMENT',   // 5. 선택된 이미지 세부 조정 단계
  FINAL = 'FINAL'              // 6. 최종 결과 확인 및 내보내기 단계
}

// 사용자가 업로드한 원본 이미지 데이터 구조
export interface InputImage {
  id: string;          // 고유 식별자
  file: File;          // 원본 파일 객체
  previewUrl: string;  // 화면 표시용 Blob URL
  base64: string;      // API 전송용 Base64 문자열
}

// 프롬프트(명령어)를 구성하는 개별 레이어
export interface PromptLayer {
  id: string;
  name: string;        // 레이어 이름 (예: 모델, 조명)
  type: 'SYSTEM' | 'USER' | 'CUSTOM'; // 프롬프트 유형
  content: string;     // 실제 프롬프트 텍스트
  enabled: boolean;    // 활성화 여부
  isLocked?: boolean;  // 시스템 필수 레이어 잠금 여부 (삭제 불가)
}

// Gemini가 생성한 결과 이미지 데이터 구조
export interface GeneratedImage {
  id: string;
  parentId: string;    // 어떤 원본 이미지에서 생성되었는지 참조 (InputImage id)
  imageUrl: string;    // 결과 이미지 URL (Base64 data URI)
  base64Data?: string; // 재편집(Re-editing)을 위한 원본 Base64 데이터
  promptUsed: string;  // 생성 시 사용된 전체 프롬프트
  timestamp: number;   // 생성 시간
}

// 이미지 생성 설정값
export interface GenerationConfig {
  count: number; // 생성할 이미지 수 (1, 3, 5)
  type: 'MODEL_CHANGE' | 'TRY_ON' | 'PRODUCT_ONLY'; // 생성 유형 (모델 변경, 착용샷, 상품 누끼)
  keepModel: boolean; // 모델 유지 여부 (현재 미사용, 확장성 고려)
  removeWatermark: boolean; // 워터마크 및 텍스트 제거 옵션 추가
}

// 애플리케이션의 전체 상태 (State)
export interface AppState {
  step: WorkflowStep;                // 현재 진행 단계
  inputImages: InputImage[];         // 업로드된 이미지 목록
  selectedInputId: string | null;    // 현재 선택된 원본 이미지 ID
  config: GenerationConfig;          // 생성 설정
  layers: PromptLayer[];             // 프롬프트 레이어 목록
  generatedImages: GeneratedImage[]; // 생성된 결과 이미지 목록
  selectedResultId: string | null;   // 편집/내보내기를 위해 선택된 결과 이미지 ID
  isGenerating: boolean;             // 생성 중 로딩 상태
  error: string | null;              // 에러 메시지
  modelReferenceImage: string | null;// 얼굴 참조용 모델 이미지 (Base64)
}
