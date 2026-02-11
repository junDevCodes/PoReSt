import {
  parseResumeCreateInput,
  parseResumeItemCreateInput,
  parseResumeItemUpdateInput,
  parseResumeUpdateInput,
} from "@/modules/resumes/implementation";
import { ResumeServiceError } from "@/modules/resumes/interface";

describe("resumes validation", () => {
  it("이력서 생성 입력에서 제목은 필수여야 한다", () => {
    // 준비: 제목이 없는 입력 데이터
    const input = {
      targetCompany: "테스트 회사",
    };

    // 실행 및 검증: 검증 에러 발생 확인
    expect(() => parseResumeCreateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeCreateInput(input)).toThrow("이력서 입력값이 올바르지 않습니다.");
  });

  it("이력서 수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    // 준비: 비어 있는 수정 입력
    const input = {};

    // 실행 및 검증: 최소 1개 필드 수정 규칙 확인
    expect(() => parseResumeUpdateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeUpdateInput(input)).toThrow("이력서 수정 입력값이 올바르지 않습니다.");
  });

  it("이력서 항목 생성 시 experienceId는 필수여야 한다", () => {
    // 준비: 경험 ID가 누락된 항목 입력
    const input = {
      sortOrder: 1,
    };

    // 실행 및 검증: 검증 에러 발생 확인
    expect(() => parseResumeItemCreateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeItemCreateInput(input)).toThrow("이력서 항목 입력값이 올바르지 않습니다.");
  });

  it("이력서 항목 수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    // 준비: 비어 있는 항목 수정 입력
    const input = {};

    // 실행 및 검증: 최소 1개 필드 수정 규칙 확인
    expect(() => parseResumeItemUpdateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeItemUpdateInput(input)).toThrow("이력서 항목 수정 입력값이 올바르지 않습니다.");
  });
});
