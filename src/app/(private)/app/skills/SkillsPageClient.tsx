"use client";

import type { FormEvent } from "react";
import { useMemo, useState } from "react";
import { parseApiResponse } from "@/app/(private)/app/_lib/admin-api";
import type { SerializedOwnerSkillDto } from "@/app/(private)/app/_lib/server-serializers";
import { EmptyBlock, ErrorBanner, LoadingBlock } from "@/components/ui/AsyncState";
import { useToast } from "@/components/ui/useToast";

/* ── 프리셋 기술 목록 ── */

type PresetSkill = { name: string; category: string; icon: string };

// icon: Simple Icons slug (https://cdn.simpleicons.org/{slug})
const PRESET_SKILLS: PresetSkill[] = [
  // Backend
  { name: "Node.js", category: "Backend", icon: "nodedotjs" },
  { name: "Spring Boot", category: "Backend", icon: "springboot" },
  { name: "Django", category: "Backend", icon: "django" },
  { name: "Express.js", category: "Backend", icon: "express" },
  { name: "FastAPI", category: "Backend", icon: "fastapi" },
  { name: "NestJS", category: "Backend", icon: "nestjs" },
  { name: "Ruby on Rails", category: "Backend", icon: "rubyonrails" },
  { name: "ASP.NET", category: "Backend", icon: "dotnet" },
  { name: "Go (Gin)", category: "Backend", icon: "go" },
  // Frontend
  { name: "React", category: "Frontend", icon: "react" },
  { name: "Vue.js", category: "Frontend", icon: "vuedotjs" },
  { name: "Angular", category: "Frontend", icon: "angular" },
  { name: "Next.js", category: "Frontend", icon: "nextdotjs" },
  { name: "Nuxt.js", category: "Frontend", icon: "devicon:nuxtjs/nuxtjs-original" },
  { name: "Svelte", category: "Frontend", icon: "svelte" },
  { name: "TypeScript", category: "Frontend", icon: "typescript" },
  { name: "Tailwind CSS", category: "Frontend", icon: "tailwindcss" },
  // Mobile
  { name: "React Native", category: "Mobile", icon: "react" },
  { name: "Flutter", category: "Mobile", icon: "flutter" },
  { name: "Swift", category: "Mobile", icon: "swift" },
  { name: "Kotlin", category: "Mobile", icon: "kotlin" },
  // Database
  { name: "MySQL", category: "Database", icon: "mysql" },
  { name: "PostgreSQL", category: "Database", icon: "postgresql" },
  { name: "MongoDB", category: "Database", icon: "mongodb" },
  { name: "Redis", category: "Database", icon: "redis" },
  { name: "Oracle", category: "Database", icon: "devicon:oracle/oracle-original" },
  { name: "MariaDB", category: "Database", icon: "mariadb" },
  { name: "Elasticsearch", category: "Database", icon: "elasticsearch" },
  // DevOps
  { name: "Docker", category: "DevOps", icon: "docker" },
  { name: "Kubernetes", category: "DevOps", icon: "kubernetes" },
  { name: "Jenkins", category: "DevOps", icon: "jenkins" },
  { name: "GitHub Actions", category: "DevOps", icon: "githubactions" },
  { name: "Terraform", category: "DevOps", icon: "terraform" },
  { name: "Ansible", category: "DevOps", icon: "ansible" },
  // Cloud
  { name: "AWS", category: "Cloud", icon: "devicon:amazonwebservices/amazonwebservices-original-wordmark" },
  { name: "Google Cloud", category: "Cloud", icon: "googlecloud" },
  { name: "Azure", category: "Cloud", icon: "devicon:azure/azure-original" },
  { name: "Firebase", category: "Cloud", icon: "firebase" },
  // AI/ML
  { name: "TensorFlow", category: "AI/ML", icon: "tensorflow" },
  { name: "PyTorch", category: "AI/ML", icon: "pytorch" },
  { name: "scikit-learn", category: "AI/ML", icon: "scikitlearn" },
  { name: "LangChain", category: "AI/ML", icon: "langchain" },
  // Message Queue
  { name: "Kafka", category: "Message Queue", icon: "apachekafka" },
  { name: "RabbitMQ", category: "Message Queue", icon: "rabbitmq" },
  // Monitoring
  { name: "Grafana", category: "Monitoring", icon: "grafana" },
  { name: "Prometheus", category: "Monitoring", icon: "prometheus" },
  { name: "Datadog", category: "Monitoring", icon: "datadog" },
  // Version Control
  { name: "Git", category: "Version Control", icon: "git" },
  { name: "GitHub", category: "Version Control", icon: "github" },
  { name: "GitLab", category: "Version Control", icon: "gitlab" },
];

function skillIconUrl(slug: string): string {
  if (slug.startsWith("devicon:")) {
    const path = slug.replace("devicon:", "");
    return `https://cdn.jsdelivr.net/gh/devicons/devicon/icons/${path}.svg`;
  }
  return `https://cdn.simpleicons.org/${slug}`;
}

const PRESET_CATEGORIES = Array.from(
  new Set(PRESET_SKILLS.map((s) => s.category)),
);

/* ── 타입 ── */

type Visibility = "PUBLIC" | "PRIVATE";

type SkillEditor = {
  name: string;
  category: string;
  level: string;
  visibility: Visibility;
};

type SkillsPageClientProps = {
  initialSkills: SerializedOwnerSkillDto[];
};

/* ── 헬퍼 ── */

const DEFAULT_CREATE_FORM = {
  name: "",
  category: "",
  level: "",
  visibility: "PUBLIC" as Visibility,
};

function createEditor(item: SerializedOwnerSkillDto): SkillEditor {
  return {
    name: item.name,
    category: item.category ?? "",
    level: item.level !== null ? String(item.level) : "",
    visibility: item.visibility === "PUBLIC" ? "PUBLIC" : "PRIVATE",
  };
}

function buildEditors(items: SerializedOwnerSkillDto[]): Record<string, SkillEditor> {
  return items.reduce<Record<string, SkillEditor>>((acc, item) => {
    acc[item.id] = createEditor(item);
    return acc;
  }, {});
}

function groupByCategory(items: SerializedOwnerSkillDto[]): Map<string, SerializedOwnerSkillDto[]> {
  const map = new Map<string, SerializedOwnerSkillDto[]>();
  for (const item of items) {
    const key = item.category ?? "기타";
    const group = map.get(key);
    if (group) {
      group.push(item);
    } else {
      map.set(key, [item]);
    }
  }
  return map;
}

function extractCategories(items: SerializedOwnerSkillDto[]): string[] {
  const set = new Set<string>();
  for (const item of items) {
    if (item.category) {
      set.add(item.category);
    }
  }
  return Array.from(set).sort();
}

/* ── 컴포넌트 ── */

export function SkillsPageClient({ initialSkills }: SkillsPageClientProps) {
  const [skills, setSkills] = useState<SerializedOwnerSkillDto[]>(initialSkills);
  const [editors, setEditors] = useState<Record<string, SkillEditor>>(buildEditors(initialSkills));
  const [createForm, setCreateForm] = useState(DEFAULT_CREATE_FORM);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 프리셋 UI 상태
  const [presetFilter, setPresetFilter] = useState<string>("전체");
  const [presetSearch, setPresetSearch] = useState("");
  const [addingPresets, setAddingPresets] = useState<Set<string>>(new Set());

  const toast = useToast();

  const categories = extractCategories(skills);
  const grouped = groupByCategory(skills);

  // 이미 등록된 기술명 집합
  const registeredNames = useMemo(
    () => new Set(skills.map((s) => s.name)),
    [skills],
  );

  // 프리셋 필터링
  const filteredPresets = useMemo(() => {
    let list = PRESET_SKILLS;
    if (presetFilter !== "전체") {
      list = list.filter((s) => s.category === presetFilter);
    }
    if (presetSearch.trim()) {
      const q = presetSearch.trim().toLowerCase();
      list = list.filter((s) => s.name.toLowerCase().includes(q));
    }
    return list;
  }, [presetFilter, presetSearch]);

  /* ── API 호출 ── */

  async function requestSkills() {
    const response = await fetch("/api/app/skills", { method: "GET" });
    return parseApiResponse<SerializedOwnerSkillDto[]>(response);
  }

  function applySkills(items: SerializedOwnerSkillDto[]) {
    setSkills(items);
    setEditors(buildEditors(items));
  }

  async function reloadSkills() {
    setIsLoading(true);
    setError(null);
    const parsed = await requestSkills();

    if (parsed.error) {
      setError(parsed.error);
      setIsLoading(false);
      return;
    }

    applySkills(parsed.data ?? []);
    setIsLoading(false);
  }

  async function handlePresetAdd(preset: PresetSkill) {
    if (registeredNames.has(preset.name)) return;

    setAddingPresets((prev) => new Set(prev).add(preset.name));
    setError(null);

    const response = await fetch("/api/app/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: preset.name,
        category: preset.category,
        visibility: "PUBLIC",
      }),
    });
    const parsed = await parseApiResponse<SerializedOwnerSkillDto>(response);

    setAddingPresets((prev) => {
      const next = new Set(prev);
      next.delete(preset.name);
      return next;
    });

    if (parsed.error) {
      toast.error(parsed.error);
      return;
    }

    toast.success(`${preset.name} 추가 완료`);
    await reloadSkills();
  }

  async function handleCreate(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsCreating(true);
    setError(null);

    const payload: Record<string, unknown> = {
      name: createForm.name,
      visibility: createForm.visibility,
    };

    if (createForm.category.trim()) {
      payload.category = createForm.category.trim();
    }

    if (createForm.level) {
      payload.level = Number(createForm.level);
    }

    const response = await fetch("/api/app/skills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const parsed = await parseApiResponse<SerializedOwnerSkillDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      setIsCreating(false);
      return;
    }

    setCreateForm(DEFAULT_CREATE_FORM);
    toast.success("기술을 추가했습니다.");
    setIsCreating(false);
    await reloadSkills();
  }

  async function handleUpdate(skillId: string) {
    const editor = editors[skillId];
    if (!editor) return;

    setError(null);

    const payload: Record<string, unknown> = {
      name: editor.name,
      visibility: editor.visibility,
    };

    if (editor.category.trim()) {
      payload.category = editor.category.trim();
    } else {
      payload.category = null;
    }

    if (editor.level) {
      payload.level = Number(editor.level);
    } else {
      payload.level = null;
    }

    const response = await fetch(`/api/app/skills/${skillId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const parsed = await parseApiResponse<SerializedOwnerSkillDto>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    toast.success("기술을 수정했습니다.");
    await reloadSkills();
  }

  async function handleDelete(skillId: string) {
    setError(null);

    const response = await fetch(`/api/app/skills/${skillId}`, {
      method: "DELETE",
    });
    const parsed = await parseApiResponse<{ id: string }>(response);

    if (parsed.error) {
      setError(parsed.error);
      toast.error(parsed.error);
      return;
    }

    toast.success("기술을 삭제했습니다.");
    await reloadSkills();
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col">
      <header>
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">관리</p>
        <h1 className="mt-2 text-3xl font-semibold">기술 스택</h1>
      </header>

      {/* ── 프리셋에서 선택 ── */}
      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">프리셋에서 선택</h2>
          <span className="text-xs text-black/40">
            {skills.length}개 등록됨
          </span>
        </div>

        {/* 검색 */}
        <div className="mt-4">
          <input
            value={presetSearch}
            onChange={(e) => setPresetSearch(e.target.value)}
            placeholder="기술명 검색..."
            className="w-full rounded-lg border border-black/15 bg-[#faf9f6] px-3 py-2 text-sm"
          />
        </div>

        {/* 카테고리 탭 */}
        <div className="mt-3 flex flex-wrap gap-1.5">
          {["전체", ...PRESET_CATEGORIES].map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setPresetFilter(tab)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition-colors ${
                presetFilter === tab
                  ? "bg-black text-white"
                  : "bg-black/5 text-black/60 hover:bg-black/10"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* 기술 pill 그리드 */}
        <div className="mt-4 flex flex-wrap gap-2">
          {filteredPresets.map((preset) => {
            const isAdded = registeredNames.has(preset.name);
            const isAdding = addingPresets.has(preset.name);
            return (
              <button
                key={`${preset.category}-${preset.name}`}
                type="button"
                disabled={isAdded || isAdding}
                onClick={() => void handlePresetAdd(preset)}
                className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition-all ${
                  isAdded
                    ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                    : isAdding
                      ? "border-black/10 bg-black/5 text-black/40"
                      : "border-black/10 bg-white text-black/80 hover:border-black/30 hover:bg-black/5 active:scale-95"
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={skillIconUrl(preset.icon)}
                  alt=""
                  width={16}
                  height={16}
                  className="h-4 w-4 shrink-0"
                  loading="lazy"
                />
                {isAdded ? (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5">
                    <path fillRule="evenodd" d="M12.416 3.376a.75.75 0 0 1 .208 1.04l-5 7.5a.75.75 0 0 1-1.154.114l-3-3a.75.75 0 0 1 1.06-1.06l2.353 2.353 4.493-6.74a.75.75 0 0 1 1.04-.207Z" clipRule="evenodd" />
                  </svg>
                ) : isAdding ? (
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-black/20 border-t-black/60" />
                ) : (
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="h-3.5 w-3.5 text-black/30">
                    <path d="M8.75 3.75a.75.75 0 0 0-1.5 0v3.5h-3.5a.75.75 0 0 0 0 1.5h3.5v3.5a.75.75 0 0 0 1.5 0v-3.5h3.5a.75.75 0 0 0 0-1.5h-3.5v-3.5Z" />
                  </svg>
                )}
                {preset.name}
              </button>
            );
          })}
          {filteredPresets.length === 0 && (
            <p className="py-4 text-sm text-black/40">검색 결과가 없습니다.</p>
          )}
        </div>
      </section>

      {/* ── 직접 추가 (접기/펼치기) ── */}
      <details className="mt-4">
        <summary className="cursor-pointer rounded-2xl border border-black/10 bg-white px-6 py-4 text-sm font-semibold text-black/60 hover:bg-black/[0.02]">
          직접 입력하여 추가
        </summary>
        <div className="rounded-b-2xl border border-t-0 border-black/10 bg-white p-6">
          <form onSubmit={handleCreate} className="grid gap-3 md:grid-cols-[1fr_1fr_100px_120px_auto]">
            <input
              value={createForm.name}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, name: event.target.value }))
              }
              placeholder="기술명 (예: React, TypeScript)"
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            />
            <div>
              <input
                list="category-suggestions"
                value={createForm.category}
                onChange={(event) =>
                  setCreateForm((prev) => ({ ...prev, category: event.target.value }))
                }
                placeholder="카테고리 (예: Frontend)"
                className="w-full rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
              />
              <datalist id="category-suggestions">
                {[...new Set([...categories, ...PRESET_CATEGORIES])].sort().map((cat) => (
                  <option key={cat} value={cat} />
                ))}
              </datalist>
            </div>
            <select
              value={createForm.level}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, level: event.target.value }))
              }
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            >
              <option value="">레벨</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
            </select>
            <select
              value={createForm.visibility}
              onChange={(event) =>
                setCreateForm((prev) => ({ ...prev, visibility: event.target.value as Visibility }))
              }
              className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
            >
              <option value="PUBLIC">PUBLIC</option>
              <option value="PRIVATE">PRIVATE</option>
            </select>
            <button
              type="submit"
              disabled={isCreating}
              className="rounded-full bg-black px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {isCreating ? "추가 중..." : "추가"}
            </button>
          </form>
        </div>
      </details>

      {error ? <ErrorBanner message={error} className="mt-6" /> : null}

      {/* ── 내 기술 목록 ── */}
      <section className="mt-8 rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">내 기술 목록</h2>

        {isLoading ? (
          <LoadingBlock message="기술 목록을 불러오는 중입니다." className="mt-4" />
        ) : skills.length === 0 ? (
          <EmptyBlock message="등록된 기술이 없습니다. 위에서 프리셋을 선택하거나 직접 추가하세요." className="mt-4" />
        ) : (
          <div className="mt-4 space-y-6">
            {Array.from(grouped.entries()).map(([category, items]) => (
              <div key={category}>
                <h3 className="mb-2 text-sm font-semibold text-black/60">{category}</h3>
                <div className="space-y-2">
                  {items.map((skill) => {
                    const editor = editors[skill.id] ?? createEditor(skill);
                    return (
                      <article
                        key={skill.id}
                        className="grid items-center gap-2 rounded-xl border border-black/10 bg-[#faf9f6] p-3 md:grid-cols-[1fr_1fr_80px_100px_60px_60px]"
                      >
                        <input
                          value={editor.name}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, name: event.target.value },
                            }))
                          }
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        />
                        <input
                          list="category-suggestions-edit"
                          value={editor.category}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, category: event.target.value },
                            }))
                          }
                          placeholder="카테고리"
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        />
                        <select
                          value={editor.level}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, level: event.target.value },
                            }))
                          }
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        >
                          <option value="">-</option>
                          <option value="1">1</option>
                          <option value="2">2</option>
                          <option value="3">3</option>
                          <option value="4">4</option>
                          <option value="5">5</option>
                        </select>
                        <select
                          value={editor.visibility}
                          onChange={(event) =>
                            setEditors((prev) => ({
                              ...prev,
                              [skill.id]: { ...editor, visibility: event.target.value as Visibility },
                            }))
                          }
                          className="rounded-lg border border-black/15 bg-white px-3 py-2 text-sm"
                        >
                          <option value="PUBLIC">PUBLIC</option>
                          <option value="PRIVATE">PRIVATE</option>
                        </select>
                        <button
                          type="button"
                          onClick={() => void handleUpdate(skill.id)}
                          className="rounded-lg border border-emerald-300 px-3 py-2 text-sm text-emerald-800"
                        >
                          저장
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(skill.id)}
                          className="rounded-lg border border-rose-300 px-3 py-2 text-sm text-rose-800"
                        >
                          삭제
                        </button>
                      </article>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
        <datalist id="category-suggestions-edit">
          {[...new Set([...categories, ...PRESET_CATEGORIES])].sort().map((cat) => (
            <option key={cat} value={cat} />
          ))}
        </datalist>
      </section>
    </div>
  );
}
