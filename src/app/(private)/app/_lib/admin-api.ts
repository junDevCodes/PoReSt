export type ApiErrorPayload = {
  error?:
    | string
    | {
        code?: string;
        message?: string;
        fields?: Record<string, string>;
      };
};

export type ApiResult<T> = {
  data: T | null;
  error: string | null;
  fields: Record<string, string> | null;
};

const NETWORK_ERROR_MESSAGE = "네트워크 연결을 확인해주세요. 잠시 후 다시 시도해주세요.";

function isResponseLike(response: unknown): response is Response {
  if (!response || typeof response !== "object") {
    return false;
  }

  const candidate = response as { json?: unknown; ok?: unknown; status?: unknown };
  return (
    typeof candidate.json === "function" &&
    typeof candidate.ok === "boolean" &&
    typeof candidate.status === "number"
  );
}

function normalizeApiError(
  payload: ApiErrorPayload,
  status: number,
): {
  message: string;
  fields: Record<string, string> | null;
} {
  if (typeof payload.error === "string") {
    return { message: payload.error, fields: null };
  }

  if (payload.error?.message) {
    return {
      message: payload.error.message,
      fields: payload.error.fields ?? null,
    };
  }

  return {
    message: `요청 처리에 실패했습니다. (HTTP ${status})`,
    fields: null,
  };
}

export async function parseApiResponse<T>(response: Response | unknown): Promise<ApiResult<T>> {
  if (!isResponseLike(response)) {
    return {
      data: null,
      error: NETWORK_ERROR_MESSAGE,
      fields: null,
    };
  }

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    return {
      data: null,
      error: "응답 본문을 해석할 수 없습니다.",
      fields: null,
    };
  }

  if (response.ok) {
    const record = (payload ?? {}) as { data?: T };
    return {
      data: record.data ?? null,
      error: null,
      fields: null,
    };
  }

  const { message, fields } = normalizeApiError(
    (payload ?? {}) as ApiErrorPayload,
    response.status,
  );
  return {
    data: null,
    error: message,
    fields,
  };
}
