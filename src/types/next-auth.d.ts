import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      isOwner: boolean;
    } & DefaultSession["user"];
  }

  interface User {
    isOwner?: boolean | null;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    isOwner?: boolean;
    isOwnerRefreshedAt?: number;
  }
}
