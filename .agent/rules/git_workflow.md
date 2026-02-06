---
trigger: always_on
glob: "**/*"
description: 개발 프로세스 및 자가 점검 규칙 (Branching & Self-Check)
---

# Git Workflow & Rules

안정적인 개발을 위해 다음 프로세스를 **반드시** 준수합니다.

## 1. 브랜치 전략 (Strict Branching)
메인 브랜치(`main`)에서의 직접 작업은 금지됩니다.
모든 작업 시작 전, 반드시 새로운 기능 브랜치를 생성해야 합니다.

**명령어:**
```bash
git checkout -b feat/기능명      # 기능 개발
git checkout -b fix/버그명       # 버그 수정
git checkout -b docs/문서명      # 문서 작업
```

**[경고]** 작업 시작 시 현재 브랜치가 `main`이라면, **즉시 중단**하고 브랜치 생성을 먼저 제안해야 합니다.

## 2. 작업 완료 후 자가 점검 (Post-Work Self Check)
작업을 마치고 PR/커밋을 제안하기 전, 스스로 다음 3가지를 자문자답하고 그 결과를 보여주어야 합니다.

### Q1. 브랜치 확인
- [ ] 현재 적절한 feature/fix 브랜치 위에서 작업했는가? (`git branch` 확인)

### Q2. 직접 테스트
- [ ] 내가 만든 기능이 실제로 동작하는지 직접 실행해 보았는가?
- [ ] 단순 코드 작성이 아니라, 결과물(UI/로그 등)을 확인했는가?

### Q3. 커밋 메시지
- [ ] 커밋 메시지가 "무엇을", "왜" 했는지 명확히 설명하는가?
- [ ] 비개발자도 이해할 수 있는 요약이 포함되었는가?

### Q4. 문서 현행화 (Update Documentation)
- [ ] 개발 내용(진행 상황)이 `README.md` 등에 반영되었는가?

---
**이 규칙은 `.agent/workflows/smart_commit.md`와 함께 이중 점검(Double Check) 장치로 작동합니다.**
