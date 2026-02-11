import { revalidatePath } from "next/cache";

const DEFAULT_REVALIDATE_PATHS = ["/", "/projects"] as const;

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
  revalidatePath("/projects/[slug]", "page");

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
    return ["/", "/projects", "/projects/[slug]"];
  }

  for (const path of uniquePaths) {
    if (path === "/projects/[slug]") {
      revalidatePath(path, "page");
    } else {
      revalidatePath(path);
    }
  }

  return Array.from(uniquePaths);
}
