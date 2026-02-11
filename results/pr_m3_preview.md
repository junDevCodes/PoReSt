## PR 제목
`M3 마감: Notes API/UI/그래프 시각화 및 인덱스 최적화`

## PR 본문
```markdown
# 📝 Pull Request Template

## #️⃣ Issue Number

close #

---

## 📝 요약 (Summary)

M3(Notes) 핵심 범위를 마감했습니다.  
노트 CRUD/Search, Candidate Generator(유사도 계산/후보 생성), Confirm/Reject 상태 전이, 노트 상세 그래프 시각화, 인덱스 최적화 마이그레이션을 반영했습니다.

---

## 🛠️ PR 유형 (Type of Changes)

- [x] ✨ 새로운 기능 추가 (New Feature)
- [ ] 🐛 버그 수정 (Bug Fix)
- [x] 🎨 UI/UX 변경 (UI/UX Update)
- [ ] 🛠️ 코드 리팩토링 (Code Refactor)
- [x] 📚 문서 수정 (Documentation Update)
- [x] 🧪 테스트 추가 / 수정 (Testing)
- [x] 🔧 빌드 설정 변경 (Build/Package Manager)
- [x] 🚚 파일 및 폴더 구조 변경 (File/Folder Structure)

---

## 📸 스크린샷 (Screenshots - 선택)

Preview 확인 후 첨부 예정

---

## 💬 리뷰 요청 사항 (Notes for Reviewers)

- `/api/app/notes*` owner scope 강제와 401/403/404/409/422 매핑 검토
- Candidate 생성/Confirm/Reject 상태 전이 검토
- `/app/notes/[id]` 그래프 렌더링/액션 반영 흐름 검토
- 마이그레이션 `20260211193000_m3_notes_index_tuning` 적용성 검토

---

## ✅ PR 체크리스트 (PR Checklist)

- [x] 📖 커밋 메시지가 팀의 컨벤션에 맞게 작성되었습니다.
- [x] 🧪 변경 사항에 대한 테스트를 완료했습니다.
- [x] 🛠️ 빌드와 실행 테스트를 통과했습니다.
- [x] 📚 관련 문서가 최신 상태로 업데이트되었습니다. (예: README, Wiki)
- [ ] 🤝 리뷰어와 논의한 내용이 반영되었습니다.
```
