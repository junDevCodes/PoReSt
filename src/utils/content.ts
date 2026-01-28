import { getCollection, getEntry, type CollectionEntry } from 'astro:content';

// 데이터 접근 계층(DAL)
// - View(Astro/React)가 astro:content(또는 향후 Keystatic/DB)에 직접 의존하지 않도록 추상화한다.
// - 점진 이행 기간 동안 레거시 tech_stack(string[])를 신규 techs(reference[])로 매핑하는 fallback을 제공한다.

export type KnowledgeCategory =
  | 'cs'
  | 'language'
  | 'framework'
  | 'library'
  | 'tooling'
  | 'platform'
  | 'database';

export interface Knowledge {
  id: string;
  displayName: string;
  category: KnowledgeCategory;
  summary?: string;
  icon?: string;
  aliases?: string[];
  tags?: string[];
}

export interface Project {
  slug: string;
  title: string;
  category: string;
  role?: string;
  teamSize?: number;
  startDate: Date;
  endDate?: Date;
  githubUrl?: string;
  demoUrl?: string;
  order: number;
  visible: boolean;
  techs: Knowledge[];
  // Astro MDX 렌더링 컴포넌트(필요 시)
  Content?: unknown;
}

export interface Profile {
  name: string;
  title: string;
  summary: string;
  area: string[];
  email?: string;
  phone?: string;
  photo?: string;
}

export interface Work {
  company: string;
  position: string;
  department?: string;
  start_date: Date;
  end_date?: Date;
  is_current: boolean;
  description?: string;
  achievements?: string[];
  order: number;
  visible: boolean;
}

export interface Education {
  school: string;
  major: string;
  degree: string;
  status: string;
  start_date: Date;
  end_date?: Date;
  gpa?: string;
  order: number;
  visible: boolean;
}

export interface Certification {
  name: string;
  issuer: string;
  date: Date;
  type?: string;
  score?: string;
  order: number;
  visible: boolean;
}

export interface ResumePageData {
  profile: Profile | null;
  work: Work[];
  education: Education[];
  certifications: Certification[];
  projects: Project[];
}

async function safeGetCollection<T extends Parameters<typeof getCollection>[0]>(
  collection: T,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  filter?: any
): Promise<Array<CollectionEntry<T>>> {
  // 일부 컬렉션은 아직 데이터 파일이 없을 수 있다.
  // - 이 경우 빌드/프리렌더 과정에서 경고가 발생할 수 있으므로, DAL에서 안전하게 빈 배열로 처리한다.
  try {
    // getCollection의 filter 타입은 컬렉션별로 달라지므로, 호출부를 단순화하기 위해 any를 제한적으로 사용한다.
    // (외부로 노출되는 타입은 strict하게 유지)
    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    return await getCollection(collection, filter);
  } catch {
    return [];
  }
}

const LEGACY_TECH_OVERRIDES: Record<string, string> = {
  // 언어/플랫폼
  'c++': 'cpp',
  cpp: 'cpp',
  'c#': 'csharp',
  // DB
  postgresql: 'postgresql',
  postgres: 'postgresql',
  // 라이브러리
  'scikit-learn': 'scikit-learn',
  sklearn: 'scikit-learn',
  pytorch: 'pytorch',
  // 기타
  'free rtos': 'freertos',
  freertos: 'freertos',
};

function normalizeLegacyTechToKnowledgeId(raw: string): string {
  const trimmed = raw.trim();
  const lower = trimmed.toLowerCase();
  const override = LEGACY_TECH_OVERRIDES[lower];
  if (override) return override;

  // 일반적인 slugify (간단 버전)
  // - 알파벳/숫자 외는 '-'로 치환
  // - 연속 '-' 정리
  return lower
    .replace(/\+/g, 'p') // "c++" 같은 케이스의 안전장치(override가 우선이지만, 예외적으로 남을 수 있음)
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function mapKnowledgeEntryToModel(entry: CollectionEntry<'knowledge'>): Knowledge {
  const data = entry.data;
  return {
    id: entry.slug,
    displayName: data.display_name,
    category: data.category,
    summary: data.summary,
    icon: data.icon,
    aliases: data.aliases,
    tags: data.tags,
  };
}

function extractReferenceId(value: unknown): string | null {
  // Astro reference 필드는 런타임에서 string 또는 객체 형태로 내려올 수 있다.
  // - string: "python"
  // - object: { collection: "knowledge", slug: "python" } 등
  if (typeof value === 'string') return value;
  if (!value || typeof value !== 'object') return null;

  const v = value as Record<string, unknown>;
  if (typeof v.slug === 'string') return v.slug;
  if (typeof v.id === 'string') return v.id;
  if (typeof v.entry === 'string') return v.entry;
  return null;
}

async function resolveKnowledgeByIds(ids: string[]): Promise<Knowledge[]> {
  const unique = Array.from(new Set(ids)).filter(Boolean);
  const entries = await Promise.all(unique.map((id) => getEntry('knowledge', id)));
  return entries.filter((e): e is CollectionEntry<'knowledge'> => Boolean(e)).map(mapKnowledgeEntryToModel);
}

async function populateProjectTechs(project: CollectionEntry<'projects'>): Promise<Knowledge[]> {
  const data = project.data;

  // 1) 신규 관계 필드 우선
  const rawTechs = (data.techs ?? []) as unknown;
  const techIds = Array.isArray(rawTechs)
    ? rawTechs.map(extractReferenceId).filter((v): v is string => Boolean(v))
    : [];

  if (techIds.length > 0) {
    const resolved = await resolveKnowledgeByIds(techIds);
    if (resolved.length > 0) return resolved;
  }

  // 2) 레거시 문자열 배열 fallback
  const legacy = (data.tech_stack ?? []) as unknown as string[] | undefined;

  if (Array.isArray(legacy) && legacy.length > 0) {
    // resolveKnowledgeByIds를 호출하지 않고, 직접 매핑합니다.
    return legacy.map(name => ({
      id: name.toLowerCase().replace(/\s+/g, '-'), // 임시 ID
      slug: name.toLowerCase().replace(/\s+/g, '-'), // 임시 Slug
      body: '',
      collection: 'knowledge',
      data: {
        name: name,       // 기존 텍스트 이름 사용
        icon: null,       // 레거시는 아이콘 없음 -> UI에서 텍스트만 렌더링
        description: 'Legacy Data', 
        category: 'Etc',  // 필수 필드라면 기본값 채움
        order: 99,
        visible: true
      }
    })) as unknown as Knowledge[]; // 타입 강제 캐스팅 (TS 에러 방지)
  }

  return [];
}

export async function getProfile(): Promise<Profile | null> {
  const entry = await getEntry('profile', 'jylee');
  if (!entry) return null;

  return {
    name: entry.data.name,
    title: entry.data.title,
    summary: entry.data.summary,
    area: entry.data.area,
    email: entry.data.email,
    phone: entry.data.phone,
    photo: entry.data.photo,
  };
}

export async function listWork(): Promise<Work[]> {
  const entries = await safeGetCollection('work', ({ data }: CollectionEntry<'work'>) => data.visible);
  return entries
    .sort((a, b) => a.data.order - b.data.order)
    .map((e) => e.data);
}

export async function listEducation(): Promise<Education[]> {
  const entries = await safeGetCollection('education', ({ data }: CollectionEntry<'education'>) => data.visible);
  return entries
    .sort((a, b) => a.data.order - b.data.order)
    .map((e) => e.data);
}

export async function listCertifications(): Promise<Certification[]> {
  const entries = await safeGetCollection(
    'certifications',
    ({ data }: CollectionEntry<'certifications'>) => data.visible
  );
  return entries
    .sort((a, b) => a.data.order - b.data.order)
    .map((e) => e.data);
}

export async function listKnowledge(params?: {
  category?: KnowledgeCategory;
  query?: string;
}): Promise<Knowledge[]> {
  const entries = await safeGetCollection('knowledge');
  const mapped = entries.map(mapKnowledgeEntryToModel);

  const filteredByCategory = params?.category
    ? mapped.filter((k) => k.category === params.category)
    : mapped;

  const q = params?.query?.trim().toLowerCase();
  if (!q) return filteredByCategory;

  return filteredByCategory.filter((k) => {
    const haystacks = [
      k.id,
      k.displayName,
      ...(k.aliases ?? []),
      ...(k.tags ?? []),
    ].map((s) => s.toLowerCase());
    return haystacks.some((s) => s.includes(q));
  });
}

export async function getKnowledge(id: string): Promise<Knowledge | null> {
  const entry = await getEntry('knowledge', id);
  if (!entry) return null;
  return mapKnowledgeEntryToModel(entry);
}

export async function listProjects(options?: { includeContent?: boolean }): Promise<Project[]> {
  const includeContent = options?.includeContent ?? false;
  const entries = await safeGetCollection('projects', ({ data }: CollectionEntry<'projects'>) => data.visible);

  const sorted = entries.sort((a, b) => a.data.order - b.data.order);
  const projects = await Promise.all(
    sorted.map(async (entry) => {
      const techs = await populateProjectTechs(entry);
      const base: Project = {
        slug: entry.slug,
        title: entry.data.title,
        category: entry.data.category,
        role: entry.data.role,
        teamSize: entry.data.team_size,
        startDate: entry.data.start_date,
        endDate: entry.data.end_date,
        githubUrl: entry.data.github_url,
        demoUrl: entry.data.demo_url,
        order: entry.data.order,
        visible: entry.data.visible,
        techs,
      };

      if (!includeContent) return base;
      const rendered = await entry.render();
      return { ...base, Content: rendered.Content };
    })
  );

  return projects;
}

export async function getProject(slug: string): Promise<Project | null> {
  const entry = await getEntry('projects', slug);
  if (!entry) return null;

  const techs = await populateProjectTechs(entry);
  const rendered = await entry.render();

  return {
    slug: entry.slug,
    title: entry.data.title,
    category: entry.data.category,
    role: entry.data.role,
    teamSize: entry.data.team_size,
    startDate: entry.data.start_date,
    endDate: entry.data.end_date,
    githubUrl: entry.data.github_url,
    demoUrl: entry.data.demo_url,
    order: entry.data.order,
    visible: entry.data.visible,
    techs,
    Content: rendered.Content,
  };
}

export async function getResumePageData(): Promise<ResumePageData> {
  const [profile, work, education, certifications, projects] = await Promise.all([
    getProfile(),
    listWork(),
    listEducation(),
    listCertifications(),
    listProjects({ includeContent: true }),
  ]);

  return { profile, work, education, certifications, projects };
}

