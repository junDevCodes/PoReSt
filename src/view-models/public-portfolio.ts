const MAX_FEATURED_PROJECTS = 3;
const SECTION_KEYS = ["problem", "approach", "architecture", "results", "links"] as const;

type SectionKey = (typeof SECTION_KEYS)[number];
type UnknownRecord = Record<string, unknown>;

function isRecord(value: unknown): value is UnknownRecord {
  return typeof value === "object" && value !== null;
}

function toNullableString(value: unknown): string | null {
  if (typeof value !== "string") {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toDateLabel(value: unknown): string {
  if (value instanceof Date) {
    return value.toISOString().slice(0, 10);
  }

  if (typeof value === "string" || typeof value === "number") {
    const parsed = new Date(value);
    if (!Number.isNaN(parsed.getTime())) {
      return parsed.toISOString().slice(0, 10);
    }
  }

  return "";
}

function toStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  return value
    .map((item) => (typeof item === "string" ? item.trim() : ""))
    .filter((item) => item.length > 0);
}

function sanitizeExternalUrl(value: unknown): string | null {
  const raw = toNullableString(value);
  if (!raw) {
    return null;
  }

  try {
    const parsed = new URL(raw);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return null;
    }
    return parsed.toString();
  } catch {
    return null;
  }
}

function extractSections(contentMd: string): Record<SectionKey, string> {
  const sections: Record<SectionKey, string[]> = {
    problem: [],
    approach: [],
    architecture: [],
    results: [],
    links: [],
  };

  const lines = contentMd.split("\n");
  let currentSection: SectionKey = "approach";

  for (const line of lines) {
    const heading = line.match(/^##\s*(problem|approach|architecture|results|links)\s*$/i);
    if (heading?.[1]) {
      const nextSection = heading[1].toLowerCase();
      if (SECTION_KEYS.includes(nextSection as SectionKey)) {
        currentSection = nextSection as SectionKey;
      }
      continue;
    }

    sections[currentSection].push(line);
  }

  const normalized = {} as Record<SectionKey, string>;
  for (const key of SECTION_KEYS) {
    normalized[key] = sections[key].join("\n").trim();
  }

  return normalized;
}

export type PublicHomeViewModel = {
  publicSlug: string | null;
  profile: {
    displayName: string;
    headline: string;
    bio: string;
    avatarUrl: string | null;
    links: Array<{
      label: string;
      url: string;
    }>;
  };
  featuredProjects: Array<{
    id: string;
    publicSlug: string;
    publicPath: string;
    slug: string;
    title: string;
    subtitle: string | null;
    description: string | null;
    techStack: string[];
    repoUrl: string | null;
    demoUrl: string | null;
  }>;
  featuredExperiences: Array<{
    id: string;
    company: string;
    role: string;
    period: string;
    summary: string | null;
  }>;
};

export type PublicProjectsListItemViewModel = {
  id: string;
  publicSlug: string;
  publicPath: string;
  slug: string;
  title: string;
  description: string | null;
  techStack: string[];
  thumbnailUrl: string | null;
  updatedAtLabel: string;
};

export type PublicProjectDetailViewModel = {
  id: string;
  slug: string;
  title: string;
  subtitle: string | null;
  techStack: string[];
  repoUrl: string | null;
  demoUrl: string | null;
  updatedAtLabel: string;
  sections: Record<SectionKey, string>;
};

export function toPublicHomeViewModel(input: unknown): PublicHomeViewModel {
  const root = isRecord(input) ? input : {};
  const rootPublicSlug = toNullableString(root.publicSlug);
  const profileRaw = isRecord(root.profile) ? root.profile : {};
  const featuredProjectsRaw = Array.isArray(root.featuredProjects) ? root.featuredProjects : [];
  const featuredExperiencesRaw = Array.isArray(root.featuredExperiences)
    ? root.featuredExperiences
    : [];

  const profileLinks = Array.isArray(profileRaw.links) ? profileRaw.links : [];

  return {
    publicSlug: rootPublicSlug,
    profile: {
      displayName: toNullableString(profileRaw.displayName) ?? "이름을 준비 중입니다.",
      headline: toNullableString(profileRaw.headline) ?? "헤드라인을 준비 중입니다.",
      bio: toNullableString(profileRaw.bio) ?? "소개 문구를 준비 중입니다.",
      avatarUrl: sanitizeExternalUrl(profileRaw.avatarUrl),
      links: profileLinks
        .map((link) => {
          const record = isRecord(link) ? link : {};
          const label = toNullableString(record.label);
          const url = sanitizeExternalUrl(record.url);
          if (!label || !url) {
            return null;
          }

          return { label, url };
        })
        .filter((link): link is { label: string; url: string } => link !== null),
    },
    featuredProjects: featuredProjectsRaw
      .map((project) => {
        const record = isRecord(project) ? project : {};
        const id = toNullableString(record.id);
        const slug = toNullableString(record.slug);
        const title = toNullableString(record.title);
        if (!id || !slug || !title) {
          return null;
        }

        const publicSlug = toNullableString(record.publicSlug) ?? rootPublicSlug ?? "owner";
        const publicPath = `/u/${encodeURIComponent(publicSlug)}/projects/${encodeURIComponent(slug)}`;

        return {
          id,
          publicSlug,
          publicPath,
          slug,
          title,
          subtitle: toNullableString(record.subtitle),
          description: toNullableString(record.description),
          techStack: toStringArray(record.techStack),
          repoUrl: sanitizeExternalUrl(record.repoUrl),
          demoUrl: sanitizeExternalUrl(record.demoUrl),
        };
      })
      .filter((project): project is PublicHomeViewModel["featuredProjects"][number] => project !== null)
      .slice(0, MAX_FEATURED_PROJECTS),
    featuredExperiences: featuredExperiencesRaw
      .map((experience) => {
        const record = isRecord(experience) ? experience : {};
        const id = toNullableString(record.id);
        const company = toNullableString(record.company);
        const role = toNullableString(record.role);
        if (!id || !company || !role) {
          return null;
        }

        const start = toDateLabel(record.startDate);
        const end = toDateLabel(record.endDate);

        return {
          id,
          company,
          role,
          period: end ? `${start} ~ ${end}` : `${start} ~ 현재`,
          summary: toNullableString(record.summary),
        };
      })
      .filter(
        (experience): experience is PublicHomeViewModel["featuredExperiences"][number] =>
          experience !== null,
      ),
  };
}

export function toPublicProjectsListViewModel(input: unknown): PublicProjectsListItemViewModel[] {
  const items = Array.isArray(input) ? input : [];

  return items
    .map((item) => {
      const record = isRecord(item) ? item : {};
      const id = toNullableString(record.id);
      const slug = toNullableString(record.slug);
      const title = toNullableString(record.title);
      const publicSlug = toNullableString(record.publicSlug) ?? "owner";
      if (!id || !slug || !title) {
        return null;
      }

      return {
        id,
        publicSlug,
        publicPath: `/u/${encodeURIComponent(publicSlug)}/projects/${encodeURIComponent(slug)}`,
        slug,
        title,
        description: toNullableString(record.description),
        techStack: toStringArray(record.techStack),
        thumbnailUrl: sanitizeExternalUrl(record.thumbnailUrl),
        updatedAtLabel: toDateLabel(record.updatedAt),
      };
    })
    .filter((item): item is PublicProjectsListItemViewModel => item !== null);
}

export function toPublicProjectDetailViewModel(input: unknown): PublicProjectDetailViewModel | null {
  const root = isRecord(input) ? input : {};
  const id = toNullableString(root.id);
  const slug = toNullableString(root.slug);
  const title = toNullableString(root.title);
  if (!id || !slug || !title) {
    return null;
  }

  const contentMd = toNullableString(root.contentMd) ?? "";
  const sections = extractSections(contentMd);

  return {
    id,
    slug,
    title,
    subtitle: toNullableString(root.subtitle),
    techStack: toStringArray(root.techStack),
    repoUrl: sanitizeExternalUrl(root.repoUrl),
    demoUrl: sanitizeExternalUrl(root.demoUrl),
    updatedAtLabel: toDateLabel(root.updatedAt),
    sections,
  };
}
