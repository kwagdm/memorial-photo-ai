# Memorial Photo AI

Experimental side project using Antigravity to build an AI-powered memorial photo generator.

---

# Progress

- [x] PR1: Initial UI scaffold
- [x] PR2a: Client-side file validation
- [x] PR2b: Server-side file upload handling
- [x] PR3a: Mock AI generation flow (Korean standard)

---

# PR Log

## PR1 – Initial UI Scaffold

### Objective
Create the basic photo upload UI.

### Implemented
- Photo upload button
- Drag & drop area
- Image preview
- Remove image option

### Next Step
Add client-side validation.

---

## PR2a – Client-side File Validation

### Objective
Implement client-side validation before server upload.

### Implemented
- 5MB file size limit  
- JPG/PNG type restriction  
- Error message for invalid files  
- Store selected file in state for future API usage  

### Next Step
PR2b will connect file upload to server storage.

---

## PR2b – Server Upload Handling

### Objective
Enable actual file transmission from client to server.

### Implemented
- **Backend**: Node.js Express server + Multer (`server.js`)
- **Frontend**: Fetch API logic to send `FormData` (`script.js`)
- **Storage**: Files saved to local `uploads/` directory
- **UX**: Loading state ("업로드 중...") and success/failure alerts

### Next Step
PR3a will simulate the AI transformation flow.

---

## PR3a – Mock AI Generation Flow (Korean Standard)

### Objective
AI 연동 전 단계로, 한국 정서에 맞는 "AI 변환 흐름" 프로토타입을 구축하고 UI/UX를 개선합니다.

### Implemented
- **Backend (Mock API)**:
    - `/generate` 엔드포인트 구현: 실제 AI 연동 전, 4초의 대기 시간을 가져 시각적 흐름 제공.
    - **보안 강화**: 서버 측(Multer)에서도 5MB 용량 제한을 강제하여 비정상적인 업로드 차단.
- **Frontend (UI/UX)**:
    - **로딩 최적화**: 생성 중에는 기존 업로드 UI를 숨기고 "AI가 영정사진을 생성 중입니다..."라는 메시지와 함께 몰입감 있는 로딩 상태 제공.
    - **결과 화면 (Result View)**: 생성이 완료되면 업로드 화면을 대체하여 결과 이미지를 크게 보여주는 전용 뷰 구현.
    - **한국형 프로토타입 반영**: 한국 장례 표준인 **검은색 프레임**과 **상단 사선 리본**이 적용된 정중한 영정사진 샘플 이미지 적용.
    - **초기화 기능**: "다른 사진으로 시도하기" 기능을 추가하여 페이지 새로고침 없이 연속 작업 가능하도록 개선.

### Why
비용이 발생하는 실제 AI API 연동 전, 한국 사용자가 기대하는 최종 결과물의 형태와 서비스 흐름을 완벽히 검증하기 위함입니다.

### Next Step
PR3b에서 실제 AI 모델(OpenAI/Gemini 등)을 연동하여 이미지 변환을 구현합니다.

---

## PR4 – AI 품질 혁신 & 프라이버시 (Replicate FLUX)

### Objective
"나노바나나 프로"급(초고화질) 영정사진을 무료로 생성하고, 사용자의 데이터가 서버에 절대 남지 않도록 보안을 강화합니다.

### Implemented

#### 🎨 Frontend (눈에 보이는 변화)
- **압도적인 화질**: 기존 흐릿했던 결과물 대신, **8K급 초고해상도** 영정사진을 받아볼 수 있습니다.
- **한국형 디테일**: 한복의 질감, 은은한 조명, 정중한 표정이 완벽하게 구현됩니다. (프롬프트 최적화 완료)
- **속도**: 고화질 변환을 위해 약 30~50초 정도 소요되지만, 기다릴 가치가 있는 결과물이 나옵니다.

#### ⚙️ Backend (보이지 않는 기술)
- **AI 엔진 교체**: 
    - 기존: Hugging Face (품질 낮음) / Gemini Imagen 4 (유료)
    - **변경**: **Replicate FLUX Pro 1.1** (무료 티어 지원 + 최상급 품질)
- **Zero-Retention 프라이버시 시스템**:
    1. 사진 업로드 → AI 변환 → **서버에서 원본 즉시 자동 삭제**.
    2. 결과 사진 → **파일로 저장 안 함**.
    3. 오직 브라우저 메모리상에서만 잠시 보여지고 사라집니다. (서버 디스크에 흔적 0%)
- **인프라**: Node.js 버전을 최신(v20)으로 업그레이드하여 안정성을 높였습니다.

### Why
가장 중요한 '마지막 사진'인 만큼 최고의 품질을 제공해야 하며, 민감한 개인정보인 만큼 절대 저장되지 않아야 한다는 원칙을 지켰습니다.
