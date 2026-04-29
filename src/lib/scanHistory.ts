export type ScanType = "url" | "email" | "phone" | "image";
export type Verdict = "safe" | "suspicious" | "phishing";
export type Severity = "info" | "low" | "medium" | "high";

export type Indicator = {
  label: string;
  severity: Severity;
  detail: string;
  category?: string;
};

export type ScanResult = {
  risk_score: number;
  verdict: Verdict;
  summary: string;
  indicators: Indicator[];
  recommendation: string;
  category_scores?: Record<string, number>;
};

export type ScanRecord = {
  id: string;
  type: ScanType;
  input: string;
  preview: string;
  timestamp: number;
  result: ScanResult;
};

const KEY = "ssr_scan_history_v1";
const MAX = 50;

function read(): ScanRecord[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function write(items: ScanRecord[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items.slice(0, MAX)));
    window.dispatchEvent(new CustomEvent("ssr:history-changed"));
  } catch {
    /* noop */
  }
}

export const history = {
  list(): ScanRecord[] {
    return read().sort((a, b) => b.timestamp - a.timestamp);
  },
  add(record: Omit<ScanRecord, "id" | "timestamp"> & { timestamp?: number }): ScanRecord {
    const item: ScanRecord = {
      id: crypto.randomUUID(),
      timestamp: record.timestamp ?? Date.now(),
      ...record,
    };
    const next = [item, ...read()].slice(0, MAX);
    write(next);
    return item;
  },
  remove(id: string) {
    write(read().filter((r) => r.id !== id));
  },
  clear() {
    write([]);
  },
  subscribe(cb: () => void) {
    const handler = () => cb();
    window.addEventListener("ssr:history-changed", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("ssr:history-changed", handler);
      window.removeEventListener("storage", handler);
    };
  },
};

export function previewOf(type: ScanType, input: string): string {
  if (type === "image") return "Uploaded image";
  const trimmed = input.trim().replace(/\s+/g, " ");
  return trimmed.length > 80 ? trimmed.slice(0, 80) + "…" : trimmed;
}