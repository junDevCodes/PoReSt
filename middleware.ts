import { type NextRequest, NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

const SIGN_IN_PATH = "/login";
const AUTH_REQUIRED_MESSAGE = "인증이 필요합니다.";
const OWNER_REQUIRED_MESSAGE = "오너 권한이 필요합니다.";

function buildRedirect(request: NextRequest, errorCode?: string) {
  const url = request.nextUrl.clone();
  url.pathname = SIGN_IN_PATH;
  url.searchParams.set("next", `${request.nextUrl.pathname}${request.nextUrl.search}`);
  if (errorCode) {
    url.searchParams.set("error", errorCode);
  }
  return NextResponse.redirect(url);
}

export default async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isPrivatePage = pathname.startsWith("/app");
  const isPrivateApi = pathname.startsWith("/api/app");

  if (!isPrivatePage && !isPrivateApi) {
    return NextResponse.next();
  }

  const token = await getToken({ req: request, secret: process.env.AUTH_SECRET });
  if (!token?.sub) {
    if (isPrivateApi) {
      return NextResponse.json({ error: AUTH_REQUIRED_MESSAGE }, { status: 401 });
    }
    return buildRedirect(request, "unauthorized");
  }

  const isOwner = (token as { isOwner?: boolean }).isOwner === true;
  if (!isOwner) {
    if (isPrivateApi) {
      return NextResponse.json({ error: OWNER_REQUIRED_MESSAGE }, { status: 403 });
    }
    return buildRedirect(request, "owner");
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/app/:path*", "/api/app/:path*"],
};

