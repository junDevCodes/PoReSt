"use client";

type GenerateFormData = {
  targetCompany: string;
  targetRole: string;
  jobDescription: string;
  motivationHint: string;
};

type GenerateCoverLetterModalProps = {
  generateForm: GenerateFormData;
  setGenerateForm: React.Dispatch<React.SetStateAction<GenerateFormData>>;
  isGenerating: boolean;
  onClose: () => void;
  onGenerate: () => void;
};

export function GenerateCoverLetterModal({
  generateForm,
  setGenerateForm,
  isGenerating,
  onClose,
  onGenerate,
}: GenerateCoverLetterModalProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={(e) => {
        if (e.target === e.currentTarget && !isGenerating) onClose();
      }}
    >
      <div className="mx-4 w-full max-w-lg rounded-2xl border border-black/10 bg-white p-6 shadow-xl">
        <h2 className="text-xl font-semibold">AI 자기소개서 생성</h2>
        <p className="mt-2 text-sm text-black/60">
          지원 정보를 입력하면 합격 자소서를 참고하여 맞춤 자기소개서를 생성합니다.
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="gen-company" className="block text-sm font-medium text-black/80">
              지원 회사 <span className="text-rose-500">*</span>
            </label>
            <input
              id="gen-company"
              type="text"
              value={generateForm.targetCompany}
              onChange={(e) => setGenerateForm((f) => ({ ...f, targetCompany: e.target.value }))}
              placeholder="예: 네이버, 카카오"
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="gen-role" className="block text-sm font-medium text-black/80">
              지원 직무 <span className="text-rose-500">*</span>
            </label>
            <input
              id="gen-role"
              type="text"
              value={generateForm.targetRole}
              onChange={(e) => setGenerateForm((f) => ({ ...f, targetRole: e.target.value }))}
              placeholder="예: 백엔드 개발자, 프론트엔드 엔지니어"
              maxLength={120}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="gen-jd" className="block text-sm font-medium text-black/80">
              채용 공고 (JD)
              <span className="ml-1 font-normal text-black/40">선택</span>
            </label>
            <textarea
              id="gen-jd"
              value={generateForm.jobDescription}
              onChange={(e) => setGenerateForm((f) => ({ ...f, jobDescription: e.target.value }))}
              placeholder="채용 공고 내용을 붙여넣으면 JD에 맞춤 최적화됩니다."
              maxLength={5000}
              rows={4}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>

          <div>
            <label htmlFor="gen-hint" className="block text-sm font-medium text-black/80">
              지원 동기 힌트
              <span className="ml-1 font-normal text-black/40">선택</span>
            </label>
            <textarea
              id="gen-hint"
              value={generateForm.motivationHint}
              onChange={(e) => setGenerateForm((f) => ({ ...f, motivationHint: e.target.value }))}
              placeholder="강조하고 싶은 지원 동기나 키워드를 입력하세요."
              maxLength={2000}
              rows={3}
              className="mt-1 w-full rounded-lg border border-black/15 px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-3">
          <button
            type="button"
            onClick={() => { if (!isGenerating) onClose(); }}
            disabled={isGenerating}
            className="rounded-lg border border-black/15 px-4 py-2 text-sm disabled:opacity-60"
          >
            취소
          </button>
          <button
            type="button"
            onClick={onGenerate}
            disabled={isGenerating || !generateForm.targetCompany.trim() || !generateForm.targetRole.trim()}
            className="rounded-lg bg-violet-600 px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isGenerating ? "AI 분석 중..." : "생성"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default GenerateCoverLetterModal;
