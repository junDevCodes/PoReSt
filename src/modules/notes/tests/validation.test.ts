import {
  parseNoteCreateInput,
  parseNoteEdgeActionInput,
  parseNoteUpdateInput,
  parseNotebookCreateInput,
  parseNotebookUpdateInput,
} from "@/modules/notes/implementation";
import { NoteServiceError } from "@/modules/notes/interface";

describe("notes validation", () => {
  it("노트 생성 입력에서 제목은 필수여야 한다", () => {
    const input = {
      notebookId: "notebook-id",
      contentMd: "본문",
    };

    expect(() => parseNoteCreateInput(input)).toThrow(NoteServiceError);
    expect(() => parseNoteCreateInput(input)).toThrow("노트 입력값이 올바르지 않습니다.");
  });

  it("노트 수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    expect(() => parseNoteUpdateInput({})).toThrow(NoteServiceError);
    expect(() => parseNoteUpdateInput({})).toThrow("노트 수정 입력값이 올바르지 않습니다.");
  });

  it("엣지 액션 입력에서 edgeId는 필수여야 한다", () => {
    expect(() => parseNoteEdgeActionInput({})).toThrow(NoteServiceError);
    expect(() => parseNoteEdgeActionInput({})).toThrow("노트 엣지 요청 입력값이 올바르지 않습니다.");
  });

  it("노트북 생성 입력에서 name은 필수여야 한다", () => {
    expect(() => parseNotebookCreateInput({ description: "테스트" })).toThrow(NoteServiceError);
    expect(() => parseNotebookCreateInput({ description: "테스트" })).toThrow(
      "노트북 입력값이 올바르지 않습니다.",
    );
  });

  it("노트북 수정 입력이 비어 있으면 검증 에러를 발생시켜야 한다", () => {
    expect(() => parseNotebookUpdateInput({})).toThrow(NoteServiceError);
    expect(() => parseNotebookUpdateInput({})).toThrow("노트북 수정 입력값이 올바르지 않습니다.");
  });
});
