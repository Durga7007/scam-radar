export type UserVerdict = "scam" | "trusted" | "ignored";

const KEY = "ssr_user_verdicts_v1";
const EVT = "ssr:verdicts-changed";

type Store = Record<string, { verdict: UserVerdict; updatedAt: number }>;

function read(): Store {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return {};
    const parsed = JSON.parse(raw);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function write(store: Store) {
  try {
    localStorage.setItem(KEY, JSON.stringify(store));
    window.dispatchEvent(new CustomEvent(EVT));
  } catch {
    /* noop */
  }
}

export const verdicts = {
  get(scanId: string): UserVerdict | null {
    return read()[scanId]?.verdict ?? null;
  },
  set(scanId: string, verdict: UserVerdict) {
    const store = read();
    store[scanId] = { verdict, updatedAt: Date.now() };
    write(store);
  },
  clear(scanId: string) {
    const store = read();
    delete store[scanId];
    write(store);
  },
  all(): Store {
    return read();
  },
  subscribe(cb: () => void) {
    const handler = () => cb();
    window.addEventListener(EVT, handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener(EVT, handler);
      window.removeEventListener("storage", handler);
    };
  },
};

export const verdictMeta: Record<UserVerdict, { label: string; classes: string }> = {
  scam: {
    label: "Reported scam",
    classes: "bg-destructive/15 text-destructive border-destructive/30",
  },
  trusted: {
    label: "Marked trusted",
    classes: "bg-success/15 text-success border-success/30",
  },
  ignored: {
    label: "Ignored",
    classes: "bg-muted text-muted-foreground border-border/60",
  },
};