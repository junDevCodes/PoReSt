"use client";

type ConfirmDialogProps = {
  open: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
  isLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  open,
  title,
  description,
  confirmText = "확인",
  cancelText = "취소",
  isDanger = false,
  isLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-2xl border border-black/10 bg-white p-6 shadow-2xl">
        <h2 className="text-lg font-semibold text-[#1a1a1a]">{title}</h2>
        <p className="mt-2 text-sm leading-6 text-black/65">{description}</p>

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="rounded-lg border border-black/20 px-4 py-2 text-sm font-semibold text-black/75 disabled:opacity-60"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`rounded-lg px-4 py-2 text-sm font-semibold text-white disabled:opacity-60 ${
              isDanger ? "bg-rose-600 hover:bg-rose-700" : "bg-black hover:bg-black/90"
            }`}
          >
            {isLoading ? "처리 중..." : confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
