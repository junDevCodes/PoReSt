import type { BlogLintIssue, BlogLintResult } from "@/modules/blog/interface";

const LONG_SENTENCE_LIMIT = 45;
const LONG_PARAGRAPH_LIMIT = 180;
const REPEATED_BIGRAM_MIN_COUNT = 3;
const AMBIGUOUS_WORD_MIN_COUNT = 3;
const AMBIGUOUS_DENSITY_THRESHOLD = 0.05;
const CODE_BLOCK_EXPLANATION_MIN_LENGTH = 20;
const HEADING_LEVEL_STEP_LIMIT = 1;

const ASSERTIVE_WORDS = ["반드시", "무조건", "항상", "확실", "보장", "최고"];
const AMBIGUOUS_WORDS = ["같다", "느낌", "아마", "어쩌면", "일수도", "추정"];
const FORBIDDEN_WORDS = ["충격", "무조건 구매", "개쩐다", "쩔어", "역대급", "100% 보장"];
const EVIDENCE_PATTERN = /(https?:\/\/|www\.|출처|참고|인용|\[[0-9]+\])/i;
const WORD_REGEX = /[A-Za-z0-9가-힣]+/g;
const LINT_VERSION = "m4-v1";

type BlogLintRule = {
  id: string;
  run: (contentMd: string) => BlogLintIssue[];
};

function getLineNumberByIndex(text: string, index: number): number {
  return text.slice(0, index).split(/\r?\n/).length;
}

function buildIssue(ruleId: string, message: string, line: number, excerpt: string): BlogLintIssue {
  return {
    ruleId,
    severity: "WARNING",
    message,
    line,
    excerpt,
  };
}

function detectLongSentenceIssues(contentMd: string): BlogLintIssue[] {
  const issues: BlogLintIssue[] = [];
  const sentenceRegex = /[^.!?\n]+[.!?]?/g;
  let match = sentenceRegex.exec(contentMd);

  while (match) {
    const sentence = match[0].trim();
    if (sentence.length > LONG_SENTENCE_LIMIT) {
      issues.push(
        buildIssue(
          "LONG_SENTENCE",
          `문장이 ${LONG_SENTENCE_LIMIT}자를 초과합니다.`,
          getLineNumberByIndex(contentMd, match.index),
          sentence.slice(0, 120),
        ),
      );
    }

    match = sentenceRegex.exec(contentMd);
  }

  return issues;
}

function detectRepeatedExpressionIssue(contentMd: string): BlogLintIssue[] {
  const tokens = contentMd.match(WORD_REGEX) ?? [];
  if (tokens.length < 2) {
    return [];
  }

  const counts = new Map<string, number>();
  for (let index = 0; index < tokens.length - 1; index += 1) {
    const phrase = `${tokens[index]} ${tokens[index + 1]}`.toLowerCase();
    counts.set(phrase, (counts.get(phrase) ?? 0) + 1);
  }

  let targetPhrase = "";
  let targetCount = 0;
  for (const [phrase, count] of counts.entries()) {
    if (count >= REPEATED_BIGRAM_MIN_COUNT && count > targetCount) {
      targetPhrase = phrase;
      targetCount = count;
    }
  }

  if (targetCount < REPEATED_BIGRAM_MIN_COUNT) {
    return [];
  }

  const phraseIndex = contentMd.toLowerCase().indexOf(targetPhrase);
  return [
    buildIssue(
      "REPEATED_EXPRESSION",
      `반복 표현이 과도합니다. (${targetPhrase}, ${targetCount}회)`,
      phraseIndex >= 0 ? getLineNumberByIndex(contentMd, phraseIndex) : 1,
      targetPhrase,
    ),
  ];
}

function detectAmbiguousExpressionIssue(contentMd: string): BlogLintIssue[] {
  const tokens = contentMd.match(WORD_REGEX) ?? [];
  if (tokens.length === 0) {
    return [];
  }

  let ambiguousCount = 0;
  let firstMatchIndex = -1;
  for (const word of AMBIGUOUS_WORDS) {
    const regex = new RegExp(word, "g");
    const matched = contentMd.match(regex);
    if (!matched) {
      continue;
    }

    ambiguousCount += matched.length;
    if (firstMatchIndex === -1) {
      firstMatchIndex = contentMd.indexOf(word);
    }
  }

  const density = ambiguousCount / tokens.length;
  if (ambiguousCount < AMBIGUOUS_WORD_MIN_COUNT || density < AMBIGUOUS_DENSITY_THRESHOLD) {
    return [];
  }

  return [
    buildIssue(
      "AMBIGUOUS_EXPRESSION_DENSITY",
      `모호 표현 밀도가 높습니다. (비율 ${(density * 100).toFixed(1)}%)`,
      firstMatchIndex >= 0 ? getLineNumberByIndex(contentMd, firstMatchIndex) : 1,
      AMBIGUOUS_WORDS.join(", "),
    ),
  ];
}

function detectUnsupportedAssertionIssue(contentMd: string): BlogLintIssue[] {
  if (EVIDENCE_PATTERN.test(contentMd)) {
    return [];
  }

  let firstMatchWord = "";
  let firstMatchIndex = -1;
  for (const word of ASSERTIVE_WORDS) {
    const index = contentMd.indexOf(word);
    if (index >= 0 && (firstMatchIndex < 0 || index < firstMatchIndex)) {
      firstMatchWord = word;
      firstMatchIndex = index;
    }
  }

  if (firstMatchIndex < 0) {
    return [];
  }

  return [
    buildIssue(
      "UNSUPPORTED_ASSERTION",
      "근거 링크나 인용 없이 단정 표현을 사용했습니다.",
      getLineNumberByIndex(contentMd, firstMatchIndex),
      firstMatchWord,
    ),
  ];
}

function detectLongParagraphIssue(contentMd: string): BlogLintIssue[] {
  const paragraphs = contentMd.split(/\n\s*\n/);
  let scannedLength = 0;

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    const paragraphStart = contentMd.indexOf(paragraph, scannedLength);
    scannedLength = paragraphStart >= 0 ? paragraphStart + paragraph.length : scannedLength;

    if (trimmed.length > LONG_PARAGRAPH_LIMIT) {
      return [
        buildIssue(
          "LONG_PARAGRAPH",
          `문단 길이가 ${LONG_PARAGRAPH_LIMIT}자를 초과합니다.`,
          paragraphStart >= 0 ? getLineNumberByIndex(contentMd, paragraphStart) : 1,
          trimmed.slice(0, 120),
        ),
      ];
    }
  }

  return [];
}

function detectUnitNumberInconsistencyIssue(contentMd: string): BlogLintIssue[] {
  const percentSignMatches = [...contentMd.matchAll(/\b(\d+(?:\.\d+)?)\s*%/g)];
  const percentWordMatches = [...contentMd.matchAll(/(\d+(?:\.\d+)?)\s*퍼센트/g)];

  if (percentSignMatches.length === 0 || percentWordMatches.length === 0) {
    return [];
  }

  const signNumbers = new Set(percentSignMatches.map((match) => match[1]));
  const wordNumbers = new Set(percentWordMatches.map((match) => match[1]));

  let inconsistentNumber = "";
  for (const number of signNumbers) {
    if (wordNumbers.has(number)) {
      inconsistentNumber = number;
      break;
    }
  }

  if (inconsistentNumber.length === 0) {
    return [];
  }

  const firstIndex = contentMd.search(new RegExp(`\\b${inconsistentNumber}\\s*(%|퍼센트)`));
  return [
    buildIssue(
      "UNIT_NUMBER_INCONSISTENCY",
      "동일 수치의 단위 표기가 혼용되었습니다. 표기를 통일해주세요.",
      firstIndex >= 0 ? getLineNumberByIndex(contentMd, firstIndex) : 1,
      `${inconsistentNumber}% / ${inconsistentNumber} 퍼센트`,
    ),
  ];
}

function detectCodeBlockWithoutExplanationIssue(contentMd: string): BlogLintIssue[] {
  const codeBlockRegex = /```[^\n]*\n[\s\S]*?\n```/g;
  const matches = [...contentMd.matchAll(codeBlockRegex)];
  if (matches.length === 0) {
    return [];
  }

  const withoutCodeBlocks = contentMd.replace(codeBlockRegex, " ");
  const normalizedText = withoutCodeBlocks.replace(/\s+/g, " ").trim();

  if (normalizedText.length >= CODE_BLOCK_EXPLANATION_MIN_LENGTH) {
    return [];
  }

  const firstMatchIndex = matches[0].index ?? 0;
  return [
    buildIssue(
      "CODE_BLOCK_WITHOUT_EXPLANATION",
      "코드 블록 설명이 부족합니다. 코드의 의도와 동작을 함께 작성해주세요.",
      getLineNumberByIndex(contentMd, firstMatchIndex),
      "코드 블록 설명 부족",
    ),
  ];
}

function detectForbiddenWordIssue(contentMd: string): BlogLintIssue[] {
  const lowerContent = contentMd.toLowerCase();
  let matchedWord = "";
  let matchedIndex = -1;

  for (const word of FORBIDDEN_WORDS) {
    const lowerWord = word.toLowerCase();
    const index = lowerContent.indexOf(lowerWord);
    if (index >= 0 && (matchedIndex < 0 || index < matchedIndex)) {
      matchedWord = word;
      matchedIndex = index;
    }
  }

  if (matchedIndex < 0) {
    return [];
  }

  return [
    buildIssue(
      "FORBIDDEN_WORD",
      "금칙어가 포함되어 있습니다. 과장 표현 대신 근거 중심으로 작성해주세요.",
      getLineNumberByIndex(contentMd, matchedIndex),
      matchedWord,
    ),
  ];
}

function detectTitleBodyMismatchIssue(contentMd: string): BlogLintIssue[] {
  const lines = contentMd.split(/\r?\n/);
  const firstHeadingIndex = lines.findIndex((line) => /^#\s+/.test(line));
  if (firstHeadingIndex < 0) {
    return [];
  }

  const title = lines[firstHeadingIndex].replace(/^#\s+/, "").trim();
  if (title.length === 0) {
    return [];
  }

  const body = lines
    .filter((_, index) => index !== firstHeadingIndex)
    .join(" ")
    .trim();
  if (body.length === 0) {
    return [];
  }

  const titleTokens = (title.match(WORD_REGEX) ?? []).map((token) => token.toLowerCase());
  const bodyTokens = new Set((body.match(WORD_REGEX) ?? []).map((token) => token.toLowerCase()));

  if (titleTokens.length === 0 || bodyTokens.size === 0) {
    return [];
  }

  const overlap = titleTokens.filter((token) => bodyTokens.has(token)).length;
  if (overlap > 0) {
    return [];
  }

  const headingOffset = lines.slice(0, firstHeadingIndex).join("\n").length;
  const lineIndex = headingOffset === 0 ? 0 : headingOffset + 1;

  return [
    buildIssue(
      "TITLE_BODY_MISMATCH",
      "제목과 본문 주제가 어긋납니다. 제목에 맞는 핵심 내용을 본문에 포함해주세요.",
      getLineNumberByIndex(contentMd, lineIndex),
      title,
    ),
  ];
}

function detectHeadingLevelJumpIssue(contentMd: string): BlogLintIssue[] {
  const headingRegex = /^(#{1,6})\s+(.+)$/gm;
  const headings = [...contentMd.matchAll(headingRegex)];
  if (headings.length < 2) {
    return [];
  }

  let previousLevel = headings[0][1].length;
  for (let index = 1; index < headings.length; index += 1) {
    const heading = headings[index];
    const level = heading[1].length;
    const levelGap = level - previousLevel;

    if (levelGap > HEADING_LEVEL_STEP_LIMIT) {
      const headingStart = heading.index ?? 0;
      return [
        buildIssue(
          "HEADING_LEVEL_JUMP",
          "헤딩 레벨이 한 단계 이상 건너뛰었습니다. 문서 구조를 순차적으로 정리해주세요.",
          getLineNumberByIndex(contentMd, headingStart),
          heading[0],
        ),
      ];
    }

    previousLevel = level;
  }

  return [];
}

export function runBlogLint(contentMd: string): BlogLintResult {
  const rules: BlogLintRule[] = [
    { id: "LONG_SENTENCE", run: detectLongSentenceIssues },
    { id: "REPEATED_EXPRESSION", run: detectRepeatedExpressionIssue },
    { id: "AMBIGUOUS_EXPRESSION_DENSITY", run: detectAmbiguousExpressionIssue },
    { id: "UNSUPPORTED_ASSERTION", run: detectUnsupportedAssertionIssue },
    { id: "LONG_PARAGRAPH", run: detectLongParagraphIssue },
    { id: "UNIT_NUMBER_INCONSISTENCY", run: detectUnitNumberInconsistencyIssue },
    { id: "CODE_BLOCK_WITHOUT_EXPLANATION", run: detectCodeBlockWithoutExplanationIssue },
    { id: "FORBIDDEN_WORD", run: detectForbiddenWordIssue },
    { id: "TITLE_BODY_MISMATCH", run: detectTitleBodyMismatchIssue },
    { id: "HEADING_LEVEL_JUMP", run: detectHeadingLevelJumpIssue },
  ];

  const issues = rules.flatMap((rule) => rule.run(contentMd));

  return {
    version: LINT_VERSION,
    createdAt: new Date().toISOString(),
    issues,
    summary: {
      total: issues.length,
      warning: issues.length,
    },
  };
}
