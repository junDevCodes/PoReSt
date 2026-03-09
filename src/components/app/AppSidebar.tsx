"use client";

import { Fragment } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
  href: string;
  label: string;
};

const NAV_GROUPS: NavItem[][] = [
  [
    { href: "/app", label: "대시보드" },
    { href: "/app/projects", label: "프로젝트" },
    { href: "/app/experiences", label: "경력" },
    { href: "/app/resumes", label: "이력서" },
    { href: "/app/portfolio/settings", label: "포트폴리오 설정" },
  ],
  [
    { href: "/app/notes", label: "노트" },
    { href: "/app/blog", label: "블로그" },
  ],
  [
    { href: "/app/experience-stories", label: "STAR 스토리" },
    { href: "/app/company-targets", label: "기업 분석" },
    { href: "/app/feedback", label: "피드백" },
  ],
  [
    { href: "/app/domain-links", label: "교차 링크" },
    { href: "/app/audit", label: "감사 로그" },
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
