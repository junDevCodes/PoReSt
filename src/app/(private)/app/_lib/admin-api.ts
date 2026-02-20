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

function normalizeApiError(payload: ApiErrorPayload, status: number): {
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

export async function parseApiResponse<T>(response: Response): Promise<ApiResult<T>> {
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

  const { message, fields } = normalizeApiError((payload ?? {}) as ApiErrorPayload, response.status);
  return {
    data: null,
    error: message,
    fields,
  };
}
