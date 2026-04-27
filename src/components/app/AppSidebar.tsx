"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
  /** false로 설정 시 자동 prefetch 비활성화 */
  prefetch?: boolean;
};

// prefetch 분류: 핵심(dogfooding 일상 접근) vs 저빈도(비일상). 2026-03-22 기준.
// 핵심 메뉴는 prefetch 기본값(자동) 유지, 저빈도 메뉴는 prefetch={false}로 클릭 시에만 로드.
// loading.tsx 스켈레톤이 전 페이지 적용되어 있어 체감 저하 없음.
// telemetry 도입 후 재분류 예정.
const NAV_GROUPS: NavItem[][] = [
  [
    { href: "/app", label: "대시보드" },
    { href: "/app/jundev-os", label: "Control Plane", prefetch: false },
    { href: "/app/projects", label: "프로젝트" },
    { href: "/app/experiences", label: "경력" },
    { href: "/app/skills", label: "기술 스택" },
    { href: "/app/resumes", label: "이력서" },
    { href: "/app/portfolio/settings", label: "포트폴리오 설정", prefetch: false },
  ],
  [
    { href: "/app/notes", label: "노트" },
    { href: "/app/blog", label: "블로그", prefetch: false },
  ],
  [
    { href: "/app/experience-stories", label: "STAR 스토리", prefetch: false },
    { href: "/app/company-targets", label: "기업 분석", prefetch: false },
    { href: "/app/cover-letters", label: "자기소개서" },
    { href: "/app/job-tracker", label: "지원 트래커", prefetch: false },
    { href: "/app/testimonials", label: "추천서", prefetch: false },
    { href: "/app/feedback", label: "피드백", prefetch: false },
  ],
  [
    { href: "/app/analytics", label: "방문 분석", prefetch: false },
    { href: "/app/growth-timeline", label: "성장 타임라인", prefetch: false },
    { href: "/app/domain-links", label: "교차 링크", prefetch: false },
    { href: "/app/audit", label: "감사 로그", prefetch: false },
  ],
];

function isActivePath(pathname: string, href: string) {
  if (href === "/app") {
    return pathname === "/app";
  }
  return pathname.startsWith(href);
}

export function AppSidebar() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {NAV_GROUPS.map((group, groupIndex) => (
        <Fragment key={groupIndex}>
          {groupIndex > 0 && <div className="my-2 border-t border-black/10" />}
          <div className="flex flex-col gap-1">
            {group.map((item) => {
              const active = isActivePath(pathname, item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  prefetch={item.prefetch}
                  className={`rounded-lg px-3 py-2 text-sm font-medium transition ${
                    active
                      ? "bg-black text-white dark:bg-white/15"
                      : "text-black/70 hover:bg-black/5 hover:text-black"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </div>
        </Fragment>
      ))}
    </nav>
  );
}
