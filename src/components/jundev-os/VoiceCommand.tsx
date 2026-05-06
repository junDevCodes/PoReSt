"use client";

import { useRef, useState } from "react";

// V2 (jundev-os v3.0.0) — STT 음성 명령
// provider: Web Speech API (브라우저 native, ko-KR)
// scope: localhost 또는 사용자 본인 환경에서 control-plane :4173 직접 호출
// permission: default OFF, 사용자 클릭 시 브라우저 prompt

type Decision = {
  id: string;
  question?: string;
  level?: string;
};

type Props = {
  decision: Decision;
  controlPlaneUrl?: string;
};

type RecognitionResult = {
  transcript: string;
  action: "approved" | "deferred" | "rejected" | "unknown";
};

const VOCAB: Array<{ patterns: RegExp; action: RecognitionResult["action"] }> = [
  { patterns: /(승인|approve|좋아|예스|yes|진행)/i, action: "approved" },
  { patterns: /(보류|defer|나중|뒤로|미뤄|wait)/i, action: "deferred" },
  { patterns: /(거부|거절|reject|no|아니|취소)/i, action: "rejected" },
];

function matchAction(transcript: string): RecognitionResult["action"] {
  for (const { patterns, action } of VOCAB) {
    if (patterns.test(transcript)) return action;
  }
  return "unknown";
}

function isLocalhost(): boolean {
  if (typeof window === "undefined") return false;
  return window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1";
}

function getRecognitionConstructor():
  | (new () => {
      lang: string;
      continuous: boolean;
      interimResults: boolean;
      onresult: (e: { results: Array<Array<{ transcript: string }>> }) => void;
      onerror: (e: { error: string }) => void;
      onend: () => void;
      start: () => void;
      stop: () => void;
    })
  | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: new () => unknown;
    webkitSpeechRecognition?: new () => unknown;
  };
  const ctor = w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
  return ctor as ReturnType<typeof getRecognitionConstructor>;
}

export function VoiceCommand({ decision, controlPlaneUrl = "http://127.0.0.1:4173" }: Props) {
  const [unsupported, setUnsupported] = useState(false);
  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState<string>("");
  const [result, setResult] = useState<{
    action: RecognitionResult["action"];
    response?: string;
    error?: string;
  } | null>(null);
  const recognitionRef = useRef<unknown>(null);

  const startListening = () => {
    const Ctor = getRecognitionConstructor();
    if (!Ctor) {
      setUnsupported(true);
      return;
    }

    const rec = new Ctor();
    rec.lang = "ko-KR";
    rec.continuous = false;
    rec.interimResults = false;

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript;
      setTranscript(text);
      const action = matchAction(text);
      void resolveDecision(text, action);
    };
    rec.onerror = (e) => {
      setResult({ action: "unknown", error: `mic error: ${e.error}` });
      setListening(false);
    };
    rec.onend = () => setListening(false);

    setTranscript("");
    setResult(null);
    setListening(true);
    rec.start();
    recognitionRef.current = rec;
  };

  const resolveDecision = async (text: string, action: RecognitionResult["action"]) => {
    if (action === "unknown") {
      setResult({ action, error: `명령 인식 실패: "${text}"` });
      return;
    }
    if (!isLocalhost()) {
      setResult({
        action,
        error: "control-plane :4173은 localhost에서만 호출 가능 (prod 미지원)",
      });
      return;
    }
    try {
      const res = await fetch(`${controlPlaneUrl}/api/decisions/${decision.id}/resolve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ response: `${action}: ${text}` }),
      });
      if (!res.ok) {
        setResult({ action, error: `HTTP ${res.status}` });
        return;
      }
      const data = await res.json();
      setResult({ action, response: data.decision?.status ?? "ok" });
    } catch (err) {
      setResult({
        action,
        error: err instanceof Error ? err.message : "fetch failed",
      });
    }
  };

  if (unsupported) {
    return (
      <span className="text-[10px] text-black/40" title="Web Speech API 미지원 브라우저">
        🎤 미지원
      </span>
    );
  }

  return (
    <div className="flex flex-col gap-1 text-[11px]">
      <button
        type="button"
        onClick={startListening}
        disabled={listening}
        className={`inline-flex items-center gap-1 rounded-full px-2 py-1 font-medium transition ${
          listening
            ? "bg-rose-500 text-white"
            : "border border-black/15 bg-white/80 text-black/70 hover:border-black/30"
        }`}
        aria-label="음성 명령"
      >
        <span className={listening ? "animate-pulse" : ""}>🎤</span>
        {listening ? "듣는 중..." : "음성"}
      </button>
      {transcript ? (
        <span className="text-black/50 truncate max-w-[180px]" title={transcript}>
          “{transcript}”
        </span>
      ) : null}
      {result ? (
        <span
          className={`text-[10px] ${
            result.error
              ? "text-amber-600"
              : result.action === "approved"
              ? "text-emerald-600"
              : result.action === "rejected"
              ? "text-rose-600"
              : "text-black/50"
          }`}
        >
          {result.error ?? `→ ${result.action} (${result.response})`}
        </span>
      ) : null}
    </div>
  );
}
