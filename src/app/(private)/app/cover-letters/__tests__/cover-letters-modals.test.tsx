/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import GenerateCoverLetterModal from "../GenerateCoverLetterModal";
import RegisterCoverLetterModal from "../RegisterCoverLetterModal";

describe("GenerateCoverLetterModal", () => {
  const defaultForm = {
    targetCompany: "",
    targetRole: "",
    jobDescription: "",
    motivationHint: "",
  };

  it("열기 시 필드 4개가 렌더되고 닫기 버튼이 작동한다", () => {
    const onClose = jest.fn();
    render(
      <GenerateCoverLetterModal
        generateForm={defaultForm}
        setGenerateForm={jest.fn()}
        isGenerating={false}
        onClose={onClose}
        onGenerate={jest.fn()}
      />,
    );

    expect(screen.getByText("AI 자기소개서 생성")).toBeInTheDocument();
    expect(screen.getByLabelText(/지원 회사/)).toBeInTheDocument();
    expect(screen.getByLabelText(/지원 직무/)).toBeInTheDocument();
    expect(screen.getByLabelText(/채용 공고/)).toBeInTheDocument();
    expect(screen.getByLabelText(/지원 동기 힌트/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("필수 필드 비어있으면 생성 버튼이 비활성화된다", () => {
    render(
      <GenerateCoverLetterModal
        generateForm={defaultForm}
        setGenerateForm={jest.fn()}
        isGenerating={false}
        onClose={jest.fn()}
        onGenerate={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "생성" })).toBeDisabled();
  });

  it("필수 필드 입력 시 생성 버튼이 활성화된다", () => {
    const onGenerate = jest.fn();
    render(
      <GenerateCoverLetterModal
        generateForm={{ ...defaultForm, targetCompany: "네이버", targetRole: "백엔드" }}
        setGenerateForm={jest.fn()}
        isGenerating={false}
        onClose={jest.fn()}
        onGenerate={onGenerate}
      />,
    );

    const btn = screen.getByRole("button", { name: "생성" });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onGenerate).toHaveBeenCalledTimes(1);
  });

  it("생성 중에는 취소 버튼과 생성 버튼이 비활성화된다", () => {
    const onClose = jest.fn();
    render(
      <GenerateCoverLetterModal
        generateForm={{ ...defaultForm, targetCompany: "네이버", targetRole: "백엔드" }}
        setGenerateForm={jest.fn()}
        isGenerating={true}
        onClose={onClose}
        onGenerate={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "AI 분석 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("RegisterCoverLetterModal", () => {
  const defaultForm = {
    title: "",
    targetCompany: "",
    targetRole: "",
    contentMd: "",
  };

  it("열기 시 필드가 렌더되고 닫기 버튼이 작동한다", () => {
    const onClose = jest.fn();
    render(
      <RegisterCoverLetterModal
        registerForm={defaultForm}
        setRegisterForm={jest.fn()}
        isRegistering={false}
        onClose={onClose}
        onRegister={jest.fn()}
      />,
    );

    expect(screen.getByText("합격본 등록")).toBeInTheDocument();
    expect(screen.getByLabelText(/제목/)).toBeInTheDocument();
    expect(screen.getByLabelText(/회사/)).toBeInTheDocument();
    expect(screen.getByLabelText(/직무/)).toBeInTheDocument();
    expect(screen.getByLabelText(/자기소개서 본문/)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("필수 필드 비어있으면 등록 버튼이 비활성화된다", () => {
    render(
      <RegisterCoverLetterModal
        registerForm={defaultForm}
        setRegisterForm={jest.fn()}
        isRegistering={false}
        onClose={jest.fn()}
        onRegister={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "등록" })).toBeDisabled();
  });

  it("필수 필드 입력 시 등록 버튼이 활성화된다", () => {
    const onRegister = jest.fn();
    render(
      <RegisterCoverLetterModal
        registerForm={{ ...defaultForm, title: "합격 자소서", contentMd: "본문입니다." }}
        setRegisterForm={jest.fn()}
        isRegistering={false}
        onClose={jest.fn()}
        onRegister={onRegister}
      />,
    );

    const btn = screen.getByRole("button", { name: "등록" });
    expect(btn).not.toBeDisabled();
    fireEvent.click(btn);
    expect(onRegister).toHaveBeenCalledTimes(1);
  });

  it("등록 중에는 취소 버튼과 등록 버튼이 비활성화된다", () => {
    const onClose = jest.fn();
    render(
      <RegisterCoverLetterModal
        registerForm={{ ...defaultForm, title: "합격 자소서", contentMd: "본문입니다." }}
        setRegisterForm={jest.fn()}
        isRegistering={true}
        onClose={onClose}
        onRegister={jest.fn()}
      />,
    );

    expect(screen.getByRole("button", { name: "등록 중..." })).toBeDisabled();
    expect(screen.getByRole("button", { name: "취소" })).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "취소" }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
