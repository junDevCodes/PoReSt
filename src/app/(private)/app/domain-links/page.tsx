import { prisma } from "@/lib/prisma";
import { getRequiredOwnerSession } from "@/app/(private)/app/_lib/server-auth";
import { serializeOwnerDomainLinkList } from "@/app/(private)/app/_lib/server-serializers";
import { createProjectsService } from "@/modules/projects";
import { createExperiencesService } from "@/modules/experiences";
import { createSkillsService } from "@/modules/skills";
import { createResumesService } from "@/modules/resumes";
import { createNotesService } from "@/modules/notes";
import { createBlogService } from "@/modules/blog";
import { createDomainLinksService } from "@/modules/domain-links";
import { DomainLinksPageClient } from "./DomainLinksPageClient";
import type { DomainOptionsState } from "./DomainLinksPageClient";

const projectsService = createProjectsService({ prisma });
const experiencesService = createExperiencesService({ prisma });
const skillsService = createSkillsService({ prisma });
const resumesService = createResumesService({ prisma });
const notesService = createNotesService({ prisma });
const blogService = createBlogService({ prisma });
const domainLinksService = createDomainLinksService({ prisma });

function toEntityOption(id: string, label: string, fallbackPrefix: string) {
  return { id, label: label?.trim() ? label : `${fallbackPrefix} (${id.slice(0, 8)})` };
}

function buildEntityOptions(
  projects: Awaited<ReturnType<typeof projectsService.listProjectsForOwner>>,
  experiences: Awaited<ReturnType<typeof experiencesService.listExperiencesForOwner>>,
  skills: Awaited<ReturnType<typeof skillsService.listSkillsForOwner>>,
  resumes: Awaited<ReturnType<typeof resumesService.listResumesForOwner>>,
  notes: Awaited<ReturnType<typeof notesService.listNotesForOwner>>,
  blogPosts: Awaited<ReturnType<typeof blogService.listPostsForOwner>>,
): DomainOptionsState {
  return {
    PROJECT: projects.map((item) => toEntityOption(item.id, item.title, "프로젝트")),
    EXPERIENCE: experiences.map((item) =>
      toEntityOption(
        item.id,
        [item.company, item.role].filter(Boolean).join(" / "),
        "경력",
      ),
    ),
    SKILL: skills.map((item) =>
      toEntityOption(item.id, [item.category, item.name].filter(Boolean).join(" / "), "기술"),
    ),
    RESUME: resumes.map((item) => toEntityOption(item.id, item.title, "이력서")),
    NOTE: notes.map((item) => toEntityOption(item.id, item.title, "노트")),
    BLOG_POST: blogPosts.map((item) => toEntityOption(item.id, item.title, "블로그")),
  };
}

export default async function DomainLinksPage() {
  const { ownerId } = await getRequiredOwnerSession("/app/domain-links");

  const [projects, experiences, skills, resumes, notes, blogPosts, links] = await Promise.all([
    projectsService.listProjectsForOwner(ownerId),
    experiencesService.listExperiencesForOwner(ownerId),
    skillsService.listSkillsForOwner(ownerId),
    resumesService.listResumesForOwner(ownerId),
    notesService.listNotesForOwner(ownerId),
    blogService.listPostsForOwner(ownerId),
    domainLinksService.listLinksForOwner(ownerId, { limit: 100 }),
  ]);

  return (
    <DomainLinksPageClient
      initialOptions={buildEntityOptions(projects, experiences, skills, resumes, notes, blogPosts)}
      initialLinks={serializeOwnerDomainLinkList(links)}
    />
  );
}
