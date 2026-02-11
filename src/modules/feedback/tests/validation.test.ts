import {
  parseFeedbackCompareInput,
  parseFeedbackRequestCreateInput,
} from "@/modules/feedback/implementation";
import { FeedbackServiceError } from "@/modules/feedback/interface";

describe("feedback validation", () => {
  it("피드백 요청 생성 입력에서 targetType은 필수여야 한다", () => {
    const input = {
      targetId: "target-1",
    };

    expect(() => parseFeedbackRequestCreateInput(input)).toThrow(FeedbackServiceError);
    expect(() => parseFeedbackRequestCreateInput(input)).toThrow("피드백 요청 입력값이 올바르지 않습니다.");
  });

  it("피드백 요청 생성 입력에서 targetId는 비어 있을 수 없다", () => {
    const input = {
      targetType: "RESUME",
      targetId: "   ",
    };

    expect(() => parseFeedbackRequestCreateInput(input)).toThrow(FeedbackServiceError);
    expect(() => parseFeedbackRequestCreateInput(input)).toThrow("피드백 요청 입력값이 올바르지 않습니다.");
  });

  it("비교 입력에서 currentRequestId와 previousRequestId는 서로 달라야 한다", () => {
    const input = {
      currentRequestId: "req-1",
      previousRequestId: "req-1",
    };

    expect(() => parseFeedbackCompareInput(input)).toThrow(FeedbackServiceError);
    expect(() => parseFeedbackCompareInput(input)).toThrow("피드백 비교 입력값이 올바르지 않습니다.");
  });
});
