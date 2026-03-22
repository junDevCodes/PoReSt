"use client";

import type { RegisterFormData } from "./types";

type RegisterCoverLetterModalProps = {
  registerForm: RegisterFormData;
  setRegisterForm: React.Dispatch<React.SetStateAction<RegisterFormData>>;
  isRegistering: boolean;
  onClose: () => void;
  onRegister: () => void;
};

export default function RegisterCoverLetterModal({
  registerForm,
  setRegisterForm,
  isRegistering,
  onClose,
  onRegister,
}: RegisterCoverLetterModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isRegistering) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold">합격본 등록</h2>
        <p className="mt-2 text-sm text-black/60">
          합격한 자기소개서를 등록하면 AI 생성 시 참고 자료로 활용됩니다.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="reg-title" className="block text-sm font-medium text-black/80">
              제목 <span className="text-rose-500">*</span>
            </label>
            <input
              id="reg-title"
              type="text"
              value={registerForm.title}
              onChange={(e) => setRegisterForm((f) => ({ ...f, title: e.target.value }))}
              placeholder="예: 네이버 백엔드 합격 자소서"
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="reg-company" className="block text-sm font-medium text-black/80">
                회사
              </label>
              <input
                id="reg-company"
                type="text"
                value={registerForm.targetCompany}
                onChange={(e) => setRegisterForm((f) => ({ ...f, targetCompany: e.target.value }))}
                placeholder="예: 네이버"
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label htmlFor="reg-role" className="block text-sm font-medium text-black/80">
                직무
              </label>
              <input
                id="reg-role"
                type="text"
                value={registerForm.targetRole}
                onChange={(e) => setRegisterForm((f) => ({ ...f, targetRole: e.target.value }))}
                placeholder="예: 백엔드 개발자"
                maxLength={120}
                className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
              />
            </div>
          </div>

          <div>
            <label htmlFor="reg-content" className="block text-sm font-medium text-black/80">
              자기소개서 본문 <span className="text-rose-500">*</span>
            </label>
            <textarea
              id="reg-content"
              value={registerForm.contentMd}
              onChange={(e) => setRegisterForm((f) => ({ ...f, contentMd: e.target.value }))}
              placeholder="합격한 자기소개서 전문을 붙여넣으세요."
              maxLength={50000}
              rows={8}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { if (!isRegistering) onClose(); }}
            disabled={isRegistering}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onRegister}
            disabled={isRegistering || !registerForm.title.trim() || !registerForm.contentMd.trim()}
            className="rounded-lg bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isRegistering ? "등록 중..." : "등록"}
          </button>
        </div>
      </div>
    </div>
  );
}
