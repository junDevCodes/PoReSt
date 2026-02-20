import { Prisma } from "@prisma/client";
import { PrismaAdapter } from "@auth/prisma-adapter";
import type { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";
const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();
const shouldDebug = process.env.NEXTAUTH_DEBUG === "true";
const DEFAULT_PUBLIC_SLUG = "user";
const PUBLIC_SLUG_MAX_LENGTH = 100;
const MAX_PUBLIC_SLUG_RETRY = 100;

type SignInUser = {
  id?: string | null;
  email?: string | null;
  name?: string | null;
  isOwner?: boolean | null;
};

function normalizeSlugBase(value: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");

  const sliced = normalized.slice(0, PUBLIC_SLUG_MAX_LENGTH);
  return sliced.length > 0 ? sliced : DEFAULT_PUBLIC_SLUG;
}

function createSlugCandidate(base: string, index: number): string {
  if (index === 0) {
    return base;
  }

  const suffix = `-${index + 1}`;
  const maxBaseLength = PUBLIC_SLUG_MAX_LENGTH - suffix.length;
  return `${base.slice(0, Math.max(1, maxBaseLength))}${suffix}`;
}

function isOwnerByRule(user: SignInUser): boolean {
  if (user.isOwner === true) {
    return true;
  }

  const email = user.email?.toLowerCase();
  if (ownerEmail && email && email === ownerEmail) {
    return true;
  }

  return false;
}

async function ensureUserRecord(user: SignInUser, isOwner: boolean): Promise<string | null> {
  if (user.id) {
    await prisma.user.update({
      where: { id: user.id },
      data: {
        isOwner,
        name: user.name ?? undefined,
      },
    });
    return user.id;
  }

  const email = user.email?.toLowerCase();
  if (!email) {
    return null;
  }

  const ensured = await prisma.user.upsert({
    where: { email },
    update: {
      isOwner,
      name: user.name ?? undefined,
    },
    create: {
      email,
      isOwner,
      name: user.name ?? null,
    },
    select: {
      id: true,
    },
  });

  return ensured.id;
}

async function ensurePortfolioSettingsForUser(user: SignInUser) {
  const ownerId = user.id ?? "";
  if (!ownerId) {
    return;
  }

  const existing = await prisma.portfolioSettings.findUnique({
    where: { ownerId },
    select: { id: true },
  });

  if (existing) {
    return;
  }

  const emailLocalPart = user.email?.split("@")[0] ?? "";
  const base = normalizeSlugBase(emailLocalPart || user.name || ownerId || DEFAULT_PUBLIC_SLUG);

  for (let index = 0; index < MAX_PUBLIC_SLUG_RETRY; index += 1) {
    const publicSlug = createSlugCandidate(base, index);

    try {
      await prisma.portfolioSettings.create({
        data: {
          ownerId,
          publicSlug,
          isPublic: true,
          displayName: user.name ?? null,
        },
      });
      return;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        const targets = Array.isArray(error.meta?.target) ? error.meta.target : [];
        if (targets.includes("ownerId")) {
          return;
        }
        if (targets.includes("publicSlug")) {
          continue;
        }
      }
      throw error;
    }
  }

  throw new Error("공개 슬러그를 생성하지 못했습니다.");
}

if (shouldDebug) {
  const rawDatabaseUrl = process.env.DATABASE_URL ?? "";
  if (!rawDatabaseUrl) {
    console.log("DATABASE_URL 상태: 미설정");
  } else {
    try {
      const host = new URL(rawDatabaseUrl).host;
      console.log(`DATABASE_URL 상태: 설정됨 (${host})`);
    } catch {
      console.log("DATABASE_URL 상태: 형식 오류");
    }
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  debug: process.env.NEXTAUTH_DEBUG === "true",
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  providers: [
    GitHub({
      clientId: process.env.AUTH_GITHUB_ID ?? "",
      clientSecret: process.env.AUTH_GITHUB_SECRET ?? "",
      authorization: {
        params: {
          scope: "read:user user:email",
        },
      },
    }),
  ],
  callbacks: {
    async signIn() {
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.isOwner = isOwnerByRule(user);
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.sub ?? "";
        session.user.isOwner = Boolean((token as { isOwner?: boolean }).isOwner);
      }
      return session;
    },
  },
  events: {
    async signIn({ user }) {
      try {
        const nextOwner = isOwnerByRule(user);
        const userId = await ensureUserRecord(user, nextOwner);
        await ensurePortfolioSettingsForUser({ ...user, id: userId ?? user.id });
      } catch (error) {
        console.error("로그인 후처리 오류:", error);
      }
    },
  },
  cookies: {
    sessionToken: {
      name: `${isProd ? "__Secure-" : ""}next-auth.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: isProd,
      },
    },
  },
};
