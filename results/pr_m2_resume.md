# PR 제목
M2 완료: Resume API/UI/PDF/동기화 배지 구현 및 통합 테스트 실통과

# PR 본문
## Pull Request Checklist

### PR Type
- [x] New feature
- [x] Documentation update
- [x] UI/UX improvement
- [x] Test update

### Description
M2(Resume) 범위 구현을 마무리했습니다.  
이력서 CRUD, 항목 CRUD, 프리뷰, PDF 다운로드, 동기화 상태 배지/알림 UI를 포함하고,
통합 테스트(DB 연결 포함)까지 실통과를 확인했습니다.

### Changes Made
- Resume 도메인 모듈 추가
  - `src/modules/resumes/interface.ts`
  - `src/modules/resumes/implementation.ts`
  - `src/modules/resumes/http.ts`
  - `src/modules/resumes/index.ts`
- Resume API 라우트 추가
  - `src/app/api/app/resumes/route.ts`
  - `src/app/api/app/resumes/[id]/route.ts`
  - `src/app/api/app/resumes/[id]/items/route.ts`
  - `src/app/api/app/resumes/[id]/items/[itemId]/route.ts`
  - `src/app/api/app/resumes/[id]/preview/route.ts`
- Resume UI 추가
  - `src/app/(private)/app/resumes/page.tsx`
  - `src/app/(private)/app/resumes/new/page.tsx`
  - `src/app/(private)/app/resumes/[id]/edit/page.tsx`
  - `src/app/(private)/app/page.tsx` (메뉴 링크 반영)
- Resume 편집 보조 유틸 및 테스트 추가
  - reorder/compare/pdf/sync 유틸
  - 관련 단위 테스트 4종
- 테스트 보정
  - `src/modules/resumes/tests/implementation.integration.test.ts`의 테스트 데이터 생성 시 `techTags` 기본값 반영
- 문서 동기화
  - `plans/task.md`
  - `plans/checklist.md`
  - `results/progress_2026-02-07.md`

### Testing
- [x] `npm run lint` 통과
- [x] `npm run build` 통과
- [x] `npx jest --runInBand` 통과 (16 suites, 57 tests)
- [x] M2 포함 통합 테스트 실통과
  - projects implementation
  - projects delete
  - experiences implementation
  - portfolio-settings implementation
  - resumes implementation

### Reviewer Notes
- 통합 테스트는 `DATABASE_URL_TEST`를 사용하는 테스트 전용 DB 기준으로 실행했습니다.
- Prisma CLI 실행 시 `DATABASE_URL_UNPOOLED`가 테스트 DB를 가리키도록 확인했습니다.
- 에러 코드 매핑(401/403/404/409/422) 기존 정책 유지 여부 확인 부탁드립니다.
