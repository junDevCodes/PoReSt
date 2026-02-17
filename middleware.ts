import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";
import {
  buildForwardedHeaders,
  REQUEST_ID_HEADER,
  resolveRequestIdFromHeaders,
  writeStructuredLog,
} from "@/lib/observability";

const SIGN_IN_PATH = "/login";
const AUTH_REQUIRED_MESSAGE = "인증이 필요합니다.";

function buildRedirect(request: NextRequest, requestId: string, errorCode?: string) {
  const url = request.nextUrl.clone();
  url.pathname = SIGN_IN_PATH;
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (errorCode) {
    url.searchParams.set("error", errorCode);
  }
  const response = NextResponse.redirect(url);
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

function buildPassThroughResponse(request: NextRequest, requestId: string) {
  const response = NextResponse.next({
    request: { headers: buildForwardedHeaders(request.headers, requestId) },
  });
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

function buildApiUnauthorizedResponse(requestId: string) {
  const response = NextResponse.json(
    { error: AUTH_REQUIRED_MESSAGE, requestId },
    { status: 401 },
  );
  response.headers.set(REQUEST_ID_HEADER, requestId);
  return response;
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivatePage = pathname.startsWith("/app");
  const isPrivateApi = pathname.startsWith("/api/app");
  const requestId = resolveRequestIdFromHeaders(request.headers);

  writeStructuredLog("info", "request.received", {
    requestId,
    method: request.method,
    pathname,
    zone: isPrivateApi ? "private-api" : isPrivatePage ? "private-page" : "public",
  });

  if (!isPrivatePage && !isPrivateApi) {
    return buildPassThroughResponse(request, requestId);
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.sub) {
    writeStructuredLog("warn", "auth.unauthorized", {
      requestId,
      method: request.method,
      pathname,
      zone: isPrivateApi ? "private-api" : "private-page",
    });

    if (isPrivateApi) {
      return buildApiUnauthorizedResponse(requestId);
    }
    return buildRedirect(request, requestId, "unauthorized");
  }

  writeStructuredLog("info", "auth.authorized", {
    requestId,
    method: request.method,
    pathname,
    userId: token.sub,
    zone: isPrivateApi ? "private-api" : "private-page",
  });

  return buildPassThroughResponse(request, requestId);
}

export const config = {
  matcher: ["/app/:path*", "/api/app/:path*"],
};

