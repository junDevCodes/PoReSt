import type { NextAuthOptions } from "next-auth";
import GitHub from "next-auth/providers/github";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

const isProd = process.env.NODE_ENV === "production";
const ownerEmail = process.env.OWNER_EMAIL?.toLowerCase();

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  secret: process.env.AUTH_SECRET,
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/auth/signin",
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
    async signIn({ user }) {
      if (user?.isOwner === true) {
        return true;
      }

      if (ownerEmail && user?.email?.toLowerCase() === ownerEmail) {
        return true;
      }

      return false;
    },
    async jwt({ token, user }) {
      if (user) {
        const isOwner =
          user.isOwner === true || (ownerEmail && user.email?.toLowerCase() === ownerEmail);
        token.isOwner = Boolean(isOwner);
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
