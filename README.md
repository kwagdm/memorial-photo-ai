# Memorial Photo AI (한국형 영정사진 생성기)

**"누구나 존엄하게 준비하는 가장 아름다운 마지막 사진"**

이 프로젝트는 누구나 쉽고, 안전하게 고품질의 영정사진을 미리 준비할 수 있도록 돕는 AI 서비스입니다.
복잡한 스튜디오 예약 없이, 가지고 있는 사진 한 장으로 품격 있는 마지막을 준비하세요.

---

## 🌟 핵심 가치 (Core Values)

### 1. 차세대 프리미엄 AI 엔진 (Flux Pro Kontext)
기존 SDXL 엔진의 한계를 넘어선 압도적인 화질과 인물 재현성을 제공합니다.
- **개인화된 헤어 보존**: 사용자의 고유한 머리 스타일을 AI가 분석하여 백발/은발로 자연스럽게 변환하며 고유의 분위기를 유지합니다.
- **박물관급 퀄리티**: 35mm Raw 사진 질감과 정교한 피부 묘사로 실제 스튜디오 촬영과 같은 결과물을 만듭니다.
- **지능형 상복 합성**: 고정된 템플릿이 아닌, AI가 인물의 체형에 맞춰 정중한 검은 정장을 직접 생성합니다.

### 2. 철저한 프라이버시 (Zero-Retention)
가장 민감할 수 있는 사진 데이터, 서버에 **아무것도 남기지 않습니다.**
- **즉시 파기**: 업로드된 원본 사진은 AI 변환 즉시 영구 삭제됩니다.
- **기록 없음**: 생성된 결과물은 파일로 저장되지 않고, 오직 사용자 브라우저에서만 잠시 확인 가능합니다.

---

## 🛠️ 개발 여정 (Development Journey)

### 📍 [PR7] 프리미엄 개인화 & 전문 합성 (Premium Personalization) - **Current**
**"더 생생하게, 더 고결하게"**
- **Flux Pro 마이그레이션**: 업계 최고 수준의 Flux Pro (Kontext) 엔진으로 전면 교체하여 얼굴 재현 성능을 극대화했습니다.
- **Hairstyle Preservation**: 고정된 가발 형태가 아닌, 본인의 헤어 스타일을 유지하며 노화시키는 기술을 적용했습니다.
- **Frame-on-Save UX**: 감상의 몰입도를 위해 화면에서는 생생한 인물 사진을 보여주고, 저장 시에만 전통 액자 프레임을 결합합니다.
- **Sharp 합성 엔진**: Node.js 전문 이미지 처리 라이브러리(`sharp`)를 도입하여 액자 합성의 투명도와 화질을 프로 수준으로 끌어올렸습니다.

### 📍 [PR6] 성별 포용성 & 하이브리드 안정화 (Inclusive Stability)
- **성별 자동 인식 (Gender-Aware)**: 유저의 성별을 자동으로 감지하고 그에 맞는 상복 스타일과 명령어를 적용합니다.

### 📍 [PR5] 인물 유지 혁신 (Identity Milestone)

### 📍 [PR4] 지능형 UX & 검증 (Intelligent UX)

### 📍 [PR3] AI 엔진 & 프라이버시 (AI Base)

---

## 💻 Tech Stack (기술 스택)
- **AI Engine**: Fal.ai Flux Pro (Kontext)
- **Image Processing**: Sharp (High-performance Node.js imaging)
- **Backend**: Node.js v20 (Express)
- **Frontend**: Vanilla JS / CSS / Face-api.js (Local detection)
