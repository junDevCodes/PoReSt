import { resolveRequestIdFromHeaders, writeStructuredLog } from "@/lib/observability";

type MonitoringExtra = Record<string, unknown>;

export type ReportServerErrorInput = {
  request: Request;
  scope: string;
  userId?: string | null;
  extra?: MonitoringExtra;
};

export type ReportServerErrorResult = {
  requestId: string;
  sentryEnabled: boolean;
  sentryDelivered: boolean;
  opsAlertEnabled: boolean;
  opsAlertDelivered: boolean;
};

type ParsedSentryDsn = {
  envelopeUrl: string;
  dsn: string;
};

function parseSentryDsn(rawDsn: string): ParsedSentryDsn | null {
  try {
    const dsnUrl = new URL(rawDsn);
    if (!dsnUrl.username) {
      return null;
    }

    const pathSegments = dsnUrl.pathname.split("/").filter((segment) => segment.length > 0);
    if (pathSegments.length === 0) {
      return null;
    }

    const projectId = pathSegments[pathSegments.length - 1];
    if (!projectId) {
      return null;
    }

    const basePathSegments = pathSegments.slice(0, -1);
    const basePath = basePathSegments.length > 0 ? `/${basePathSegments.join("/")}` : "";
    const envelopeUrl = `${dsnUrl.protocol}//${dsnUrl.host}${basePath}/api/${projectId}/envelope/`;

    return {
      envelopeUrl,
      dsn: dsnUrl.toString(),
    };
  } catch {
    return null;
  }
}

function readErrorPayload(error: unknown): { name: string; message: string; stack: string | null } {
  if (error instanceof Error) {
    return {
      name: error.name || "Error",
      message: error.message || "Unknown error",
      stack: error.stack ?? null,
    };
  }

  return {
    name: "UnknownError",
    message: String(error),
    stack: null,
  };
}

function createSentryEnvelope(args: {
  parsedDsn: ParsedSentryDsn;
  requestId: string;
  scope: string;
  userId?: string | null;
  errorPayload: { name: string; message: string; stack: string | null };
  extra?: MonitoringExtra;
}) {
  const eventId = crypto.randomUUID().replace(/-/g, "");
  const sentAt = new Date().toISOString();
  const environment = process.env.SENTRY_ENVIRONMENT ?? process.env.NODE_ENV ?? "development";
  const release = process.env.SENTRY_RELEASE ?? "local";

  const envelopeHeader = JSON.stringify({
    event_id: eventId,
    sent_at: sentAt,
    dsn: args.parsedDsn.dsn,
  });
  const itemHeader = JSON.stringify({ type: "event" });
  const eventPayload = JSON.stringify({
    event_id: eventId,
    timestamp: sentAt,
    level: "error",
    platform: "javascript",
    logger: "porest-server",
    environment,
    release,
    tags: {
      scope: args.scope,
      requestId: args.requestId,
    },
    user: args.userId ? { id: args.userId } : undefined,
    exception: {
      values: [
        {
          type: args.errorPayload.name,
          value: args.errorPayload.message,
          stacktrace: args.errorPayload.stack ?? undefined,
        },
      ],
    },
    extra: {
      ...args.extra,
    },
  });

  return `${envelopeHeader}\n${itemHeader}\n${eventPayload}`;
}

async function deliverToSentry(args: {
  parsedDsn: ParsedSentryDsn;
  envelope: string;
}): Promise<boolean> {
  try {
    const response = await fetch(args.parsedDsn.envelopeUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-sentry-envelope",
      },
      body: args.envelope,
    });
    return response.ok;
  } catch {
    return false;
  }
}

async function deliverOpsAlert(args: {
  webhookUrl: string;
  requestId: string;
  scope: string;
  errorPayload: { name: string; message: string };
  extra?: MonitoringExtra;
}): Promise<boolean> {
  try {
    const response = await fetch(args.webhookUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: `[PoReSt][${args.scope}] ${args.errorPayload.name}: ${args.errorPayload.message} (requestId=${args.requestId})`,
        requestId: args.requestId,
        scope: args.scope,
        extra: args.extra ?? {},
      }),
    });
    return response.ok;
  } catch {
    return false;
  }
}

export async function reportServerError(input: ReportServerErrorInput, error: unknown): Promise<ReportServerErrorResult> {
  const requestId = resolveRequestIdFromHeaders(input.request.headers);
  const errorPayload = readErrorPayload(error);

  writeStructuredLog("error", "server.error", {
    requestId,
    scope: input.scope,
    userId: input.userId ?? null,
    errorName: errorPayload.name,
    errorMessage: errorPayload.message,
    ...(input.extra ?? {}),
  });

  const parsedSentryDsn = parseSentryDsn(process.env.SENTRY_DSN?.trim() ?? "");
  const sentryEnabled = parsedSentryDsn !== null;
  let sentryDelivered = false;

  if (parsedSentryDsn) {
    const envelope = createSentryEnvelope({
      parsedDsn: parsedSentryDsn,
      requestId,
      scope: input.scope,
      userId: input.userId,
      errorPayload,
      extra: input.extra,
    });
    sentryDelivered = await deliverToSentry({ parsedDsn: parsedSentryDsn, envelope });
  }

  if (sentryEnabled && !sentryDelivered) {
    writeStructuredLog("warn", "sentry.delivery.failed", {
      requestId,
      scope: input.scope,
    });
  }

  const opsAlertWebhookUrl = process.env.OPS_ALERT_WEBHOOK_URL?.trim() ?? "";
  const opsAlertEnabled = opsAlertWebhookUrl.length > 0;
  let opsAlertDelivered = false;

  if (opsAlertEnabled && (!sentryEnabled || !sentryDelivered)) {
    opsAlertDelivered = await deliverOpsAlert({
      webhookUrl: opsAlertWebhookUrl,
      requestId,
      scope: input.scope,
      errorPayload,
      extra: input.extra,
    });
  }

  if (opsAlertEnabled && (!sentryEnabled || !sentryDelivered) && !opsAlertDelivered) {
    writeStructuredLog("warn", "ops.alert.failed", {
      requestId,
      scope: input.scope,
    });
  }

  return {
    requestId,
    sentryEnabled,
    sentryDelivered,
    opsAlertEnabled,
    opsAlertDelivered,
  };
}

