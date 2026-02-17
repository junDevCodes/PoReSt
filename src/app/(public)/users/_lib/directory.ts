const DEFAULT_USERS_LIMIT = 20;
const MAX_USERS_LIMIT = 50;

export type PublicUsersSearchParamsInput = {
  q?: string;
  limit?: string;
  cursor?: string;
};

export type ParsedPublicUsersSearchParams = {
  q?: string;
  limit: number;
  cursor?: string;
};

export function parsePublicUsersSearchParams(
  input: PublicUsersSearchParamsInput,
): ParsedPublicUsersSearchParams {
  const parsedLimit = Number.parseInt(input.limit ?? "", 10);
  const normalizedLimit =
    Number.isFinite(parsedLimit) && parsedLimit > 0
      ? Math.min(parsedLimit, MAX_USERS_LIMIT)
      : DEFAULT_USERS_LIMIT;

  const normalizedQ = input.q?.trim();
  const normalizedCursor = input.cursor?.trim();

  return {
    q: normalizedQ && normalizedQ.length > 0 ? normalizedQ : undefined,
    limit: normalizedLimit,
    cursor: normalizedCursor && normalizedCursor.length > 0 ? normalizedCursor : undefined,
  };
}

export function buildUsersPageHref(
  params: {
    q?: string;
    limit?: string;
  },
  cursor: string,
): string {
  const search = new URLSearchParams();
  const q = params.q?.trim();
  const limit = params.limit?.trim();

  if (q) {
    search.set("q", q);
  }
  if (limit) {
    search.set("limit", limit);
  }
  search.set("cursor", cursor);

  return `/users?${search.toString()}`;
}
