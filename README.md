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
