import { revalidatePath } from "next/cache";

const DEFAULT_REVALIDATE_PATHS = ["/", "/projects"] as const;
const DYNAMIC_REVALIDATE_PAGES = [
  "/projects/[slug]",
  "/u/[publicSlug]",
  "/u/[publicSlug]/projects",
  "/u/[publicSlug]/projects/[slug]",
] as const;

function normalizePath(path: string): string | null {
  const trimmed = path.trim();
  if (!trimmed.startsWith("/")) {
    return null;
  }

  if (trimmed.length > 200) {
    return null;
  }

  return trimmed;
}

export function revalidatePublicPortfolio(projectSlug?: string) {
  for (const path of DEFAULT_REVALIDATE_PATHS) {
    revalidatePath(path);
  }
  for (const path of DYNAMIC_REVALIDATE_PAGES) {
    revalidatePath(path, "page");
  }

  if (projectSlug && projectSlug.length > 0) {
    revalidatePath(`/projects/${projectSlug}`);
  }
}

export function revalidateCustomPaths(paths: string[]) {
  const uniquePaths = new Set<string>();
  for (const path of paths) {
    const normalized = normalizePath(path);
    if (normalized) {
      uniquePaths.add(normalized);
    }
  }

  if (uniquePaths.size === 0) {
    revalidatePublicPortfolio();
    return ["/", "/projects", ...DYNAMIC_REVALIDATE_PAGES];
  }

  for (const path of uniquePaths) {
    if (path.includes("[")) {
      revalidatePath(path, "page");
    } else {
      revalidatePath(path);
    }
  }

  return Array.from(uniquePaths);
}
