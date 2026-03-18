import { parseBullets, parseMetrics } from "@/lib/format-resume-data";

describe("parseBullets", () => {
  it("문자열 배열을 그대로 반환한다", () => {
    expect(parseBullets(["항목1", "항목2"])).toEqual(["항목1", "항목2"]);
  });

  it("숫자 요소를 문자열로 변환한다", () => {
    expect(parseBullets([1, "두번째", 3])).toEqual(["1", "두번째", "3"]);
  });

  it("null → 빈 배열", () => {
    expect(parseBullets(null)).toEqual([]);
  });

  it("undefined → 빈 배열", () => {
    expect(parseBullets(undefined)).toEqual([]);
  });

  it("숫자 → 빈 배열", () => {
    expect(parseBullets(42)).toEqual([]);
  });

  it("문자열 → 빈 배열", () => {
    expect(parseBullets("not an array")).toEqual([]);
  });

  it("중첩 객체 요소는 필터링된다", () => {
    expect(parseBullets(["유효", { nested: true }, "유효2"])).toEqual(["유효", "유효2"]);
  });

  it("빈 배열 → 빈 배열", () => {
    expect(parseBullets([])).toEqual([]);
  });
});

describe("parseMetrics", () => {
  it("객체를 key-value 배열로 변환한다", () => {
    expect(parseMetrics({ growth: "20%", users: "1000" })).toEqual([
      { key: "growth", value: "20%" },
      { key: "users", value: "1000" },
    ]);
  });

  it("숫자 값을 문자열로 변환한다", () => {
    expect(parseMetrics({ count: 42 })).toEqual([{ key: "count", value: "42" }]);
  });

  it("null → 빈 배열", () => {
    expect(parseMetrics(null)).toEqual([]);
  });

  it("undefined → 빈 배열", () => {
    expect(parseMetrics(undefined)).toEqual([]);
  });

  it("배열 → 빈 배열", () => {
    expect(parseMetrics([1, 2, 3])).toEqual([]);
  });

  it("문자열 → 빈 배열", () => {
    expect(parseMetrics("not an object")).toEqual([]);
  });

  it("null 값 항목은 필터링된다", () => {
    expect(parseMetrics({ a: "ok", b: null, c: "ok2" })).toEqual([
      { key: "a", value: "ok" },
      { key: "c", value: "ok2" },
    ]);
  });

  it("빈 객체 → 빈 배열", () => {
    expect(parseMetrics({})).toEqual([]);
  });
});
