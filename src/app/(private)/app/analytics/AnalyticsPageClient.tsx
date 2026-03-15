"use client";

import { useState } from "react";
import type { AnalyticsData } from "@/modules/pageviews/interface";

type SerializedAnalyticsData = {
  summary: AnalyticsData["summary"];
  dailyViews: AnalyticsData["dailyViews"];
  pageTypeBreakdown: AnalyticsData["pageTypeBreakdown"];
  topReferrers: AnalyticsData["topReferrers"];
  recentViews: Array<{
    id: string;
    pageType: string;
    pageSlug: string | null;
    referrer: string | null;
    createdAt: string;
  }>;
};

const PAGE_TYPE_LABELS: Record<string, string> = {
  home: "포트폴리오 홈",
  experiences: "경력 페이지",
  projects: "프로젝트 목록",
  project_detail: "프로젝트 상세",
};

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

function formatDateTime(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}

function SummaryCards({
  summary,
}: {
  summary: AnalyticsData["summary"];
}) {
  const items = [
    { label: "전체", value: summary.totalViews },
    { label: "오늘", value: summary.todayViews },
    { label: "이번 주", value: summary.weekViews },
    { label: "이번 달", value: summary.monthViews },
  ];

  return (
    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {items.map((item) => (
        <article
          key={item.label}
          className="rounded-2xl border border-black/10 bg-white p-5"
        >
          <p className="text-xs uppercase tracking-[0.2em] text-black/45">
            {item.label}
          </p>
          <p className="mt-3 text-3xl font-semibold">{item.value}</p>
          <p className="mt-1 text-xs text-black/55">조회수</p>
        </article>
      ))}
    </div>
  );
}

function DailyChart({
  dailyViews,
}: {
  dailyViews: AnalyticsData["dailyViews"];
}) {
  const maxCount = Math.max(...dailyViews.map((d) => d.count), 1);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold">일별 조회수</h2>
      <p className="mt-1 text-xs text-black/55">최근 30일</p>
      <div className="mt-6 flex items-end gap-[2px]" style={{ height: 160 }}>
        {dailyViews.map((day) => {
          const heightPercent = maxCount > 0 ? (day.count / maxCount) * 100 : 0;
          return (
            <div
              key={day.date}
              className="group relative flex-1"
              style={{ height: "100%" }}
            >
              <div
                className="absolute bottom-0 w-full rounded-t bg-black/80 transition-colors group-hover:bg-black"
                style={{
                  height: `${Math.max(heightPercent, day.count > 0 ? 2 : 0)}%`,
                  minHeight: day.count > 0 ? 2 : 0,
                }}
              />
              <div className="pointer-events-none absolute -top-8 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-black px-2 py-1 text-xs text-white group-hover:block">
                {formatDate(day.date)}: {day.count}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex justify-between text-xs text-black/40">
        {dailyViews.length > 0 && (
          <>
            <span>{formatDate(dailyViews[0].date)}</span>
            <span>{formatDate(dailyViews[dailyViews.length - 1].date)}</span>
          </>
        )}
      </div>
    </section>
  );
}

function PageTypeBreakdown({
  breakdown,
}: {
  breakdown: AnalyticsData["pageTypeBreakdown"];
}) {
  const total = breakdown.reduce((sum, item) => sum + item.count, 0);

  if (total === 0) {
    return (
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <h2 className="text-lg font-semibold">페이지별 분포</h2>
        <p className="mt-4 text-sm text-black/55">아직 조회 데이터가 없습니다.</p>
      </section>
    );
  }

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold">페이지별 분포</h2>
      <div className="mt-4 space-y-3">
        {breakdown.map((item) => {
          const percent = total > 0 ? (item.count / total) * 100 : 0;
          return (
            <div key={item.pageType}>
              <div className="flex items-center justify-between text-sm">
                <span>{PAGE_TYPE_LABELS[item.pageType] ?? item.pageType}</span>
                <span className="font-medium">
                  {item.count} ({percent.toFixed(1)}%)
                </span>
              </div>
              <div className="mt-1 h-2 rounded-full bg-black/5">
                <div
                  className="h-full rounded-full bg-black/70"
                  style={{ width: `${percent}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function TopReferrers({
  referrers,
}: {
  referrers: AnalyticsData["topReferrers"];
}) {
  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold">유입 경로</h2>
      {referrers.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">유입 경로 데이터가 없습니다.</p>
      ) : (
        <div className="mt-4 space-y-2">
          {referrers.map((ref) => (
            <div
              key={ref.referrer}
              className="flex items-center justify-between rounded-lg border border-black/5 bg-[#faf9f6] px-3 py-2 text-sm"
            >
              <span className="truncate text-black/80">{ref.referrer}</span>
              <span className="ml-2 shrink-0 font-medium">{ref.count}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

function RecentViews({
  views,
}: {
  views: SerializedAnalyticsData["recentViews"];
}) {
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? views : views.slice(0, 10);

  return (
    <section className="rounded-2xl border border-black/10 bg-white p-6">
      <h2 className="text-lg font-semibold">최근 방문</h2>
      {views.length === 0 ? (
        <p className="mt-4 text-sm text-black/55">아직 방문 기록이 없습니다.</p>
      ) : (
        <>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-black/10 text-left text-xs text-black/45">
                  <th className="pb-2 pr-4 font-medium">페이지</th>
                  <th className="pb-2 pr-4 font-medium">슬러그</th>
                  <th className="pb-2 pr-4 font-medium">유입 경로</th>
                  <th className="pb-2 font-medium">시간</th>
                </tr>
              </thead>
              <tbody>
                {displayed.map((view) => (
                  <tr
                    key={view.id}
                    className="border-b border-black/5 last:border-b-0"
                  >
                    <td className="py-2 pr-4">
                      {PAGE_TYPE_LABELS[view.pageType] ?? view.pageType}
                    </td>
                    <td className="py-2 pr-4 text-black/55">
                      {view.pageSlug ?? "-"}
                    </td>
                    <td className="max-w-[200px] truncate py-2 pr-4 text-black/55">
                      {view.referrer ?? "직접 방문"}
                    </td>
                    <td className="whitespace-nowrap py-2 text-black/55">
                      {formatDateTime(view.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {views.length > 10 && !showAll && (
            <button
              onClick={() => setShowAll(true)}
              className="mt-3 text-sm font-medium text-black/70 hover:text-black"
            >
              전체 {views.length}건 보기
            </button>
          )}
        </>
      )}
    </section>
  );
}

export function AnalyticsPageClient({
  analytics,
}: {
  analytics: SerializedAnalyticsData;
}) {
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <section className="rounded-2xl border border-black/10 bg-white p-6">
        <p className="text-xs uppercase tracking-[0.3em] text-black/45">
          Analytics
        </p>
        <h1 className="mt-3 text-3xl font-semibold">방문 분석</h1>
        <p className="mt-2 text-sm text-black/65">
          포트폴리오 페이지 방문 현황을 확인합니다.
        </p>
      </section>

      <SummaryCards summary={analytics.summary} />

      <DailyChart dailyViews={analytics.dailyViews} />

      <div className="grid gap-6 lg:grid-cols-2">
        <PageTypeBreakdown breakdown={analytics.pageTypeBreakdown} />
        <TopReferrers referrers={analytics.topReferrers} />
      </div>

      <RecentViews views={analytics.recentViews} />
    </div>
  );
}
