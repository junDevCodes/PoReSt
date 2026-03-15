/** @jest-environment jsdom */

import { readFileSync } from "node:fs";
import path from "node:path";
import { render } from "@testing-library/react";
import type {
  SerializedOwnerBlogPostListItemDto,
  SerializedOwnerNoteListItemDto,
  SerializedOwnerNotebookDto,
  SerializedOwnerProjectDto,
  SerializedOwnerResumeListItemDto,
} from "@/app/(private)/app/_lib/server-serializers";
import { BlogPostsPageClient } from "@/app/(private)/app/blog/BlogPostsPageClient";
import { NotesPageClient } from "@/app/(private)/app/notes/NotesPageClient";
import { ProjectsPageClient } from "@/app/(private)/app/projects/ProjectsPageClient";
import { ResumesPageClient } from "@/app/(private)/app/resumes/ResumesPageClient";

const toast = {
  info: jest.fn(),
  success: jest.fn(),
  error: jest.fn(),
};

jest.mock("@/components/ui/useToast", () => ({
  useToast: () => toast,
}));

jest.mock("next/navigation", () => ({
  useRouter: () => ({ push: jest.fn() }),
}));

const MIN_ACCESSIBLE_BLACK_TEXT_OPACITY = 55;
const LOW_CONTRAST_WHITE_CLASS_NAMES = [
  "text-white/50",
  "text-white/55",
  "text-white/60",
  "text-white/65",
  "text-white/70",
  "text-white/75",
  "text-white/80",
  "text-white/90",
];

const INITIAL_PROJECTS: SerializedOwnerProjectDto[] = [
  {
    id: "project-1",
    slug: "project-1",
    title: "프로젝트 1",
    subtitle: null,
    description: null,
    contentMd: "내용",
    techStack: [],
    repoUrl: null,
    demoUrl: null,
    thumbnailUrl: null,
    visibility: "PUBLIC",
    isFeatured: false,
    order: 0,
    highlightsJson: null,
    updatedAt: "2026-02-27T00:00:00.000Z",
  },
];

const INITIAL_RESUMES: SerializedOwnerResumeListItemDto[] = [
  {
    id: "resume-1",
    status: "DRAFT",
    title: "이력서 1",
    targetCompany: null,
    targetRole: null,
    level: null,
    itemCount: 1,
    updatedAt: "2026-02-27T00:00:00.000Z",
  },
];

const INITIAL_POSTS: SerializedOwnerBlogPostListItemDto[] = [
  {
    id: "blog-1",
    status: "DRAFT",
    visibility: "PRIVATE",
    title: "블로그 글 1",
    summary: "요약",
    tags: ["test"],
    lastLintedAt: null,
    updatedAt: "2026-02-27T00:00:00.000Z",
  },
];

const INITIAL_NOTEBOOKS: SerializedOwnerNotebookDto[] = [
  {
    id: "notebook-1",
    name: "노트북 1",
    description: null,
    noteCount: 1,
    updatedAt: "2026-02-27T00:00:00.000Z",
  },
];

const INITIAL_NOTES: SerializedOwnerNoteListItemDto[] = [
  {
    id: "note-1",
    notebookId: "notebook-1",
    visibility: "PRIVATE",
    title: "노트 1",
    summary: "요약",
    tags: [],
    updatedAt: "2026-02-27T00:00:00.000Z",
    notebook: {
      id: "notebook-1",
      name: "노트북 1",
    },
  },
];

function findLowContrastTextClasses(container: HTMLElement): string[] {
  const tokens = new Set<string>();

  for (const element of container.querySelectorAll<HTMLElement>("[class]")) {
    for (const className of element.className.split(/\s+/)) {
      if (!className.startsWith("text-black/")) {
        continue;
      }

      const opacity = Number(className.replace("text-black/", ""));
      if (Number.isNaN(opacity)) {
        continue;
      }

      if (opacity < MIN_ACCESSIBLE_BLACK_TEXT_OPACITY) {
        tokens.add(className);
      }
    }
  }

  return Array.from(tokens).sort();
}

function findForbiddenTextTokens(source: string): string[] {
  const tokens = new Set<string>();

  for (const token of LOW_CONTRAST_WHITE_CLASS_NAMES) {
    if (source.includes(token)) {
      tokens.add(token);
    }
  }

  return Array.from(tokens).sort();
}

describe("Test-M6-04 Wave3 라이트 테마 대비", () => {
  beforeEach(() => {
    toast.info.mockReset();
    toast.success.mockReset();
    toast.error.mockReset();
  });

  it.each([
    ["프로젝트", <ProjectsPageClient key="projects" initialProjects={INITIAL_PROJECTS} />],
    ["이력서", <ResumesPageClient key="resumes" initialResumes={INITIAL_RESUMES} />],
    ["블로그", <BlogPostsPageClient key="blog" initialPosts={INITIAL_POSTS} />],
    [
      "노트",
      <NotesPageClient
        key="notes"
        initialNotes={INITIAL_NOTES}
        initialNotebooks={INITIAL_NOTEBOOKS}
      />,
    ],
  ])(
    "%s 주요 관리 화면은 라이트 테마에서 대비 기준 미달 텍스트 토큰을 사용하지 않아야 한다",
    (_, view) => {
      const { container } = render(view);

      expect(findLowContrastTextClasses(container)).toEqual([]);
    },
  );
});

describe("Test-M6-11 Private 5개 화면 라이트 대비", () => {
  it.each([
    ["피드백", "src/app/(private)/app/feedback/page.tsx"],
    ["경험 스토리", "src/app/(private)/app/experience-stories/page.tsx"],
    ["기업 타겟", "src/app/(private)/app/company-targets/page.tsx"],
    ["도메인 링크", "src/app/(private)/app/domain-links/page.tsx"],
    ["감사 로그", "src/app/(private)/app/audit/page.tsx"],
  ])("%s 화면은 라이트 테마에서 저대비 흰색 텍스트 토큰을 사용하지 않아야 한다", (_, filePath) => {
    const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

    expect(findForbiddenTextTokens(source)).toEqual([]);
  });
});

describe("Test-M6-12 서브페이지 9개 라이트 대비", () => {
  // T46-2에서 처리되지 않은 상세/편집/new 서브페이지의 저대비 다크 토큰 정리 검증
  it.each([
    ["피드백 생성", "src/app/(private)/app/feedback/new/page.tsx"],
    ["피드백 상세", "src/app/(private)/app/feedback/[id]/page.tsx"],
    ["노트 상세 클라이언트", "src/app/(private)/app/notes/[id]/NoteDetailClient.tsx"],
    ["이력서 생성", "src/app/(private)/app/resumes/new/page.tsx"],
    ["이력서 편집", "src/app/(private)/app/resumes/[id]/edit/page.tsx"],
    ["프로젝트 생성", "src/app/(private)/app/projects/new/page.tsx"],
    ["프로젝트 편집", "src/app/(private)/app/projects/[id]/edit/page.tsx"],
    ["블로그 생성", "src/app/(private)/app/blog/new/page.tsx"],
    ["블로그 편집", "src/app/(private)/app/blog/[id]/edit/page.tsx"],
  ])(
    "%s 서브페이지는 라이트 테마에서 저대비 흰색 텍스트 토큰을 사용하지 않아야 한다",
    (_, filePath) => {
      const source = readFileSync(path.join(process.cwd(), filePath), "utf8");

      expect(findForbiddenTextTokens(source)).toEqual([]);
    },
  );
});
