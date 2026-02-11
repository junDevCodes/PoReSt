export type ResumeItemComparisonInput = {
  experience: {
    bulletsJson: unknown;
    metricsJson: unknown;
    techTags: string[];
  };
  overrideBulletsJson: unknown | null;
  overrideMetricsJson: unknown | null;
  overrideTechTags: string[];
};

export type ResumeItemComparison = {
  original: {
    bulletsJson: unknown;
    metricsJson: unknown;
    techTags: string[];
  };
  resolved: {
    bulletsJson: unknown;
    metricsJson: unknown;
    techTags: string[];
  };
  hasOverride: {
    bullets: boolean;
    metrics: boolean;
    techTags: boolean;
  };
};

export function resolveResumeItemComparison(
  input: ResumeItemComparisonInput,
): ResumeItemComparison {
  const hasBulletsOverride = input.overrideBulletsJson !== null && input.overrideBulletsJson !== undefined;
  const hasMetricsOverride = input.overrideMetricsJson !== null && input.overrideMetricsJson !== undefined;
  const hasTechTagsOverride = input.overrideTechTags.length > 0;

  return {
    original: {
      bulletsJson: input.experience.bulletsJson,
      metricsJson: input.experience.metricsJson,
      techTags: input.experience.techTags,
    },
    resolved: {
      bulletsJson: hasBulletsOverride ? input.overrideBulletsJson : input.experience.bulletsJson,
      metricsJson: hasMetricsOverride ? input.overrideMetricsJson : input.experience.metricsJson,
      techTags: hasTechTagsOverride ? input.overrideTechTags : input.experience.techTags,
    },
    hasOverride: {
      bullets: hasBulletsOverride,
      metrics: hasMetricsOverride,
      techTags: hasTechTagsOverride,
    },
  };
}
