import {
  parseResumeCreateInput,
  parseResumeItemCreateInput,
  parseResumeItemUpdateInput,
  parseResumeShareLinkCreateInput,
  parseResumeShareLinkDeleteInput,
  parseResumeUpdateInput,
} from "@/modules/resumes/implementation";
import { ResumeServiceError } from "@/modules/resumes/interface";

describe("resumes validation", () => {
  it("이력서 생성 입력에서 제목은 필수여야 한다", () => {
    const input = {
      targetCompany: "테스트 회사",
    };

    expect(() => parseResumeCreateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeCreateInput(input)).toThrow("이력서 입력값이 올바르지 않습니다.");
  });

  it("이력서 수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    const input = {};

    expect(() => parseResumeUpdateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeUpdateInput(input)).toThrow("이력서 수정 입력값이 올바르지 않습니다.");
  });

  it("이력서 항목 생성 시 experienceId는 필수여야 한다", () => {
    const input = {
      sortOrder: 1,
    };

    expect(() => parseResumeItemCreateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeItemCreateInput(input)).toThrow("이력서 항목 입력값이 올바르지 않습니다.");
  });

  it("이력서 항목 수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    const input = {};

    expect(() => parseResumeItemUpdateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeItemUpdateInput(input)).toThrow("이력서 항목 수정 입력값이 올바르지 않습니다.");
  });

  it("공유 링크 생성 입력에서 과거 만료시각은 허용하지 않아야 한다", () => {
    const input = {
      expiresAt: "2000-01-01T00:00:00.000Z",
    };

    expect(() => parseResumeShareLinkCreateInput(input)).toThrow(ResumeServiceError);
    expect(() => parseResumeShareLinkCreateInput(input)).toThrow("expiresAt은 현재 시각 이후여야 합니다.");
  });

  it("공유 링크 삭제 입력에서 shareLinkId는 필수여야 한다", () => {
    expect(() => parseResumeShareLinkDeleteInput({})).toThrow(ResumeServiceError);
    expect(() => parseResumeShareLinkDeleteInput({})).toThrow("공유 링크 삭제 입력값이 올바르지 않습니다.");
  });
});
