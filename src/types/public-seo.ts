import type { Metadata } from "next";

export type PublicSeoMeta = Pick<
  Metadata,
  "metadataBase" | "title" | "description" | "alternates" | "openGraph" | "twitter"
>;
