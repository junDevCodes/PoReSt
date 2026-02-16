# PoReSt 실행 태스크 (T13~T36)

기준일: 2026-02-16

## P0 구현 트랙 (G1~G5)
- [완료] T13: G1 `/api/app/me` 구현/테스트/문서 동기화
- [완료] T14: G2 Notebook CRUD API/서비스/테스트 보강
- [완료] T15: G2 Notes 작성 파이프라인 UI 정리 및 회귀 검증
- [완료] T16: G3 Public Projects 검색/필터/cursor API 확장
- [완료] T17: G4 Feedback targets API + 생성 UX 자동화
- [완료] T18: G5 Blog Lint Rule10 추가 + 테스트 보강

## P1 구현 트랙 (G6~G9)
- [완료] T19: G6 스키마 설계(`ResumeShareLink`) + 마이그레이션
- [완료] T20: G6 공유 링크 API(생성/조회/삭제) 구현
- [완료] T21: G6 공개 공유 조회 API/UI 검증
- [완료] T22: G7 Export 이력 스키마/정책 확정
- [완료] T23: G7 Export 이력 API + 재다운로드 흐름 구현
- T24: G8 Audit Log 스키마/수집 포인트 반영
- T25: G8 Audit 조회 API + 관리자 UI 최소 구현
- T26: G9 Request ID/구조화 로그 표준화
- T27: G9 Sentry 연동 및 운영 알림 검증

## P2 구현 트랙 (G10~G12 + 튜닝)
- T28: G10 DomainLink 스키마/관계 설계
- T29: G10 링크 생성/해제 API 구현
- T30: G10 교차 링크 UI(노트/프로젝트/이력/블로그) 구현
- T31: G11 임베딩 생성 배치 파이프라인 설계
- T32: G11 임베딩 생성/재빌드 실행 API 구현
- T33: G11 유사도 검색 고도화 + 인덱스 튜닝
- T34: G12 공개 사용자 디렉토리 API 구현
- T35: G12 공개 사용자 디렉토리 UI 구현
- T36: P2 성능/비용 검증 및 운영 문서 반영

## 완료 처리 규칙
- 완료된 태스크는 `plans/history.md`에 결과(테스트/배포/리스크 포함) 기록 후 상태 전환한다.
- 섹션 단위 완료 시 커밋 메시지는 `domain(scope): 설명` 형식을 사용한다.
