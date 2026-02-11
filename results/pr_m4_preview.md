## PR 제목
`M4 마감: Blog API/UI/Lint/Export 구현 및 배포 준비`

## PR 본문
```markdown
# Pull Request Template

## Issue Number

close #

---

## 요약 (Summary)

M4(Blog) 핵심 범위를 마감했습니다.
- BlogPost CRUD API 및 Admin UI(`/app/blog`, `/app/blog/new`, `/app/blog/[id]/edit`) 구현
- Lint 엔진 Rule 1~9 및 파이프라인 구현
- Export API(`GET /api/app/blog/posts/[id]/export`)와 HTML/MD/ZIP 내보내기 구현
- M4 배포 체크리스트/문서 동기화

---

## PR 유형 (Type of Changes)

- [x] 새로운 기능 추가 (New Feature)
- [ ] 버그 수정 (Bug Fix)
- [x] UI/UX 변경 (UI/UX Update)
- [ ] 코드 리팩토링 (Code Refactor)
- [x] 문서 수정 (Documentation Update)
- [x] 테스트 추가 / 수정 (Testing)
- [x] 빌드 설정 변경 (Build/Package Manager)
- [x] 파일 및 폴더 구조 변경 (File/Folder Structure)

---

## 스크린샷 (Screenshots - 선택)

Preview 확인 후 첨부 예정

---

## 리뷰 요청 사항 (Notes for Reviewers)

- `/api/app/blog/posts/[id]/export` 응답 헤더/다운로드 동작 검토
- Lint Rule 8/9(금칙어, 제목-본문 불일치) 검출 결과 검토
- `/app/blog/[id]/edit`에서 저장/린트/다운로드 플로우 검토
- M4 체크리스트 문서(`plans/task.md`, `plans/checklist.md`) 상태 반영 검토

---

## PR 체크리스트 (PR Checklist)

- [x] 커밋 메시지가 팀의 컨벤션에 맞게 작성되었습니다.
- [x] 변경 사항에 대한 테스트를 완료했습니다.
- [x] 빌드와 실행 테스트를 통과했습니다.
- [x] 관련 문서가 최신 상태로 업데이트되었습니다. (예: README, Wiki)
- [ ] 리뷰어와 논의한 내용이 반영되었습니다.
```
