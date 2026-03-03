---
description: Railway 또는 Render를 이용해 MVP를 팀원에게 배포하는 가이드
---

# 배포 가이드 (Railway / Render)

이 가이드는 현재 로컬에서 개발된 서비스를 Railway 또는 Render를 사용하여 팀원들이 접속할 수 있도록 배포하는 절차를 설명합니다.

## 1. 사전 준비
- [GitHub](https://github.com) 계정
- [Railway](https://railway.app) 또는 [Render](https://render.com) 계정 (GitHub 로그인 가능)

## 2. 배포 절차 (Railway 기준 추천)

1. **GitHub 푸시**: 먼저 최신 코드를 GitHub의 작업 브랜치에 푸시합니다.
2. **서비스 연결**:
   - Railway 접속 후 `New Project` -> `Deploy from GitHub repo` 선택
   - `memorial-photo-ai` 저장소 선택
3. **환경 변수(Variables) 설정 (중요)**:
   - 배포 설정 화면의 `Variables` 탭에서 다음 항목을 추가합니다:
     - `FAL_KEY`: 내 `.env` 파일에 있는 값 복사
     - `PORT`: `3000`
4. **배포 시작**: 변수를 저장하면 자동으로 빌드와 배포가 시작됩니다.

## 3. 유저 공유 방법
- 배포가 완료되면 생성된 도메인 주소(예: `xxx.up.railway.app`)를 공유합니다. 누구나 별도의 로그인 없이 접속할 수 있습니다.

## 4. 로컬 테스트 (배포 전 확인)
- 배포 전에 본인의 컴퓨터에서 잘 작동하는지 확인하려면:
  1. `.env` 파일에 `BASIC_AUTH_USER`, `BASIC_AUTH_PASS`를 추가합니다.
  2. `npm start` 후 접속할 때 로그인 창이 뜨는지 확인합니다.
