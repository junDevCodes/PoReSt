/** @jest-environment jsdom */

import { fireEvent, render, screen } from "@testing-library/react";
import { OwnerSignInView } from "@/components/auth/OwnerSignInView";

const signInMock = jest.fn();

jest.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

jest.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(""),
}));

jest.mock("next/image", () => {
  return function MockImage(props: Record<string, unknown>) {
    return <span aria-label={String(props.alt ?? "")} />;
  };
});

describe("OwnerSignInView", () => {
  beforeEach(() => {
    signInMock.mockReset();
    signInMock.mockResolvedValue(undefined);
  });

  it("로그인 버튼을 누르면 로딩 상태로 전환되고 중복 클릭을 막아야 한다", () => {
    render(<OwnerSignInView mode="login" />);

    const button = screen.getByRole("button", { name: "GitHub로 로그인" });
    fireEvent.click(button);

    expect(signInMock).toHaveBeenCalledTimes(1);
    expect(screen.getByRole("button", { name: "GitHub로 이동 중..." })).toBeDisabled();
  });

  it("회원가입 모드에서는 회원가입 문구를 보여줘야 한다", () => {
    render(<OwnerSignInView mode="signup" />);

    expect(screen.getByRole("heading", { name: "회원가입" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "GitHub로 회원가입" })).toBeInTheDocument();
  });
});
