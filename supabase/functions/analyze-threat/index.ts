import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// ============================
// Curated official helplines lookup
// ============================
// Each entry: normalized digits-only key -> metadata.
// Keep this list conservative — only include numbers that are publicly published
// by the organisation on its official domain / government gazette.
type Helpline = {
  name: string;
  org: string;
  country: string;
  category: "emergency" | "cybercrime" | "government" | "bank" | "telecom" | "health" | "child_safety" | "women_safety";
};

const OFFICIAL_HELPLINES: Record<string, Helpline> = {
  // ---------- India ----------
  "112":   { name: "All-in-one emergency", org: "Government of India", country: "IN", category: "emergency" },
  "100":   { name: "Police", org: "Government of India", country: "IN", category: "emergency" },
  "101":   { name: "Fire", org: "Government of India", country: "IN", category: "emergency" },
  "102":   { name: "Ambulance", org: "Government of India", country: "IN", category: "emergency" },
  "108":   { name: "Emergency response", org: "Government of India", country: "IN", category: "emergency" },
  "1091":  { name: "Women helpline", org: "Government of India", country: "IN", category: "women_safety" },
  "1098":  { name: "Childline", org: "Ministry of Women & Child Development", country: "IN", category: "child_safety" },
  "1930":  { name: "Cyber-crime helpline", org: "I4C, MHA India", country: "IN", category: "cybercrime" },
  "14440": { name: "RBI awareness (DAKSH)", org: "Reserve Bank of India", country: "IN", category: "government" },
  "155260":{ name: "Cyber-financial fraud (legacy)", org: "MHA India", country: "IN", category: "cybercrime" },
  "18001801551": { name: "Kisan Call Centre", org: "Govt of India", country: "IN", category: "government" },
  "18004253800": { name: "SBI customer care", org: "State Bank of India", country: "IN", category: "bank" },
  "18001234":   { name: "SBI customer care", org: "State Bank of India", country: "IN", category: "bank" },
  "18002586161":{ name: "HDFC Bank", org: "HDFC Bank", country: "IN", category: "bank" },
  "18601201212":{ name: "ICICI Bank", org: "ICICI Bank", country: "IN", category: "bank" },
  "18604195555":{ name: "Axis Bank", org: "Axis Bank", country: "IN", category: "bank" },
  "1800111139": { name: "TRAI DND", org: "TRAI", country: "IN", category: "telecom" },
  "1947":  { name: "Aadhaar / UIDAI helpline", org: "UIDAI", country: "IN", category: "government" },

  // ---------- United States ----------
  "911":   { name: "Emergency", org: "US emergency services", country: "US", category: "emergency" },
  "988":   { name: "Suicide & Crisis Lifeline", org: "SAMHSA", country: "US", category: "health" },
  "211":   { name: "Community services", org: "United Way", country: "US", category: "government" },
  "311":   { name: "Non-emergency municipal", org: "US municipalities", country: "US", category: "government" },
  "18008291040": { name: "IRS individual taxpayer line", org: "IRS", country: "US", category: "government" },
  "18007726270": { name: "Social Security Admin", org: "SSA", country: "US", category: "government" },

  // ---------- United Kingdom ----------
  "999":   { name: "Emergency", org: "UK emergency services", country: "GB", category: "emergency" },
  "112_gb":{ name: "Emergency (EU)", org: "UK emergency services", country: "GB", category: "emergency" }, // dedup with IN 112
  "101_gb":{ name: "Police non-emergency", org: "UK Police", country: "GB", category: "emergency" },
  "111_gb":{ name: "NHS non-emergency", org: "NHS", country: "GB", category: "health" },
  "105":   { name: "Power-cut helpline", org: "ENA", country: "GB", category: "government" },
  "159":   { name: "Stop Scams safe-call", org: "Stop Scams UK / banks", country: "GB", category: "bank" },

  // ---------- EU general ----------
  "116111":{ name: "Child helpline (EU)", org: "Child Helpline International", country: "EU", category: "child_safety" },
  "116000":{ name: "Missing children (EU)", org: "Missing Children Europe", country: "EU", category: "child_safety" },

  // ---------- Australia ----------
  "000":   { name: "Emergency", org: "Australian emergency services", country: "AU", category: "emergency" },
  "131444":{ name: "Police assistance line", org: "AU Police", country: "AU", category: "emergency" },

  // ---------- Canada ----------
  "18882228477": { name: "Anti-Fraud Centre", org: "Canadian Anti-Fraud Centre", country: "CA", category: "cybercrime" },
};

function normalizePhone(raw: string): string {
  return (raw || "").replace(/[^\d]/g, "");
}

function lookupHelpline(raw: string): Helpline | null {
  const digits = normalizePhone(raw);
  if (!digits) return null;
  // direct
  if (OFFICIAL_HELPLINES[digits]) return OFFICIAL_HELPLINES[digits];
  // strip common country codes (1, 44, 91, 61) once
  for (const cc of ["1", "44", "91", "61"]) {
    if (digits.startsWith(cc) && OFFICIAL_HELPLINES[digits.slice(cc.length)]) {
      return OFFICIAL_HELPLINES[digits.slice(cc.length)];
    }
  }
  return null;
}

const SYSTEM_PROMPT = `You are Scam Shield Radar, an expert phishing & scam detection AI.
Your job is REAL prediction. Be strict — false negatives (missed scams) are MORE dangerous than false positives.

============================
TYPE-SPECIFIC RULES
============================

URL rules:
- SAFE only if the host is an exact, correctly-spelled match of a well-known legitimate domain
  (google.com, youtube.com, gmail.com, paypal.com, amazon.com/.in, microsoft.com, outlook.com, apple.com, icloud.com,
  github.com, linkedin.com, x.com, twitter.com, facebook.com, instagram.com, whatsapp.com, openai.com, chatgpt.com,
  netflix.com, spotify.com, reddit.com, wikipedia.org, stackoverflow.com, cloudflare.com, vercel.com,
  lovable.app, lovable.dev, supabase.com,
  sbi.co.in, hdfcbank.com, icicibank.com, axisbank.com, rbi.org.in, irctc.co.in, uidai.gov.in, incometax.gov.in,
  chase.com, bankofamerica.com, wellsfargo.com, hsbc.com, barclays.com, hmrc.gov.uk, irs.gov, *.gov, *.gov.in, *.edu).
- Flag SUSPICIOUS / PHISHING for: typosquatting, homoglyphs, IP-literal hosts, brand name in subdomain with different root domain
  (paypal.com.verify-login.tk), shorteners, suspicious TLDs (.tk .top .xyz .click .zip with brand names), credential harvest paths.

EMAIL / MESSAGE rules:
- SAFE only if sender domain is legitimate AND content has no scam cues.
- Flag SUSPICIOUS / PHISHING for: sender/brand mismatch, urgency, OTP/password/seed-phrase requests, gift-card / wire / crypto demands,
  prize/lottery, KYC threats, refund scams, job-offer scams.

PHONE rules — IMPORTANT, READ CAREFULLY:
You MUST distinguish between (a) clearly fraudulent / impossible numbers, (b) ordinary-looking unknown numbers, and
(c) verifiable official helplines. Do NOT mark every phone number as suspicious — that destroys signal value.

Tier A — "phishing" (risk_score 70-95). Use when ANY of these apply:
  * Premium-rate / scam-prone prefixes: +1-900, UK 09, West-Africa advance-fee patterns (+234, +22x, +23x with unusual length),
    fake "1-800" tech-support variants, Indian premium SMS shortcodes used in lottery scams.
  * Known impersonation playbook numbers (IRS, SSA, customs, courier, RBI/bank impersonation).
  * Test / fictional ranges that real scammers reuse: US 555-0100..555-0199, UK 0113 496 0xxx, obvious placeholders
    like 9876543210 / 1234567890 / 0000000000 / 1111111111.
  * Structurally impossible: too short, too long, invalid country code, all-zero or all-same digits, monotonic sequences.
  * Caller-ID spoof patterns (e.g. mismatched country/area code combinations that cannot exist).

Tier B — "suspicious" (risk_score 25-55). Use when the number is plausible but unverifiable AND there is at least one
mild red flag (unusual length for the claimed country, premium-looking prefix that isn't conclusively scam, repeated
digit cluster, recently-spoofed range). Summary must say it cannot be independently verified.

Tier C — "safe" (risk_score 0-19). Use when EITHER:
  * The number is a well-known official helpline of a recognised organisation (e.g. India RBI 14440, Indian cyber-crime
    1930, US emergency 911, UK 999/101/111, bank toll-free numbers verifiable from the bank's official domain), OR
  * The number is a structurally valid ordinary mobile/landline with NO scam indicators (normal length for its country,
    no premium prefix, no placeholder pattern, no impersonation context). In this case summary must say
    "no fraud indicators detected, but caller identity cannot be verified from the number alone — verify the caller
    if they request money, OTP, or personal data".

If the user prompt contains a "[CURATED HELPLINE MATCH]" block, treat the number as a verified official helpline:
use verdict "safe" with risk_score between 0 and 10, mention the organisation by name in the summary, and add an
indicator with category "reputation" / severity "info" stating it matches the curated official helpline registry.
Still remind the user that scammers can spoof caller-ID, so they should call the number themselves rather than trust
an inbound caller claiming to be from that organisation.

Never claim a phone number is "verified legitimate". Safe means "no red flags found".

IMAGE rules:
- Flag morphing/deepfake artifacts, fake banking/crypto UI screenshots, forged IDs/documents, payment QR codes from unknown sources,
  fake celebrity-endorsement screenshots.

============================
VERDICT SCALE
============================
- safe (0-19): clearly legitimate, no fraud cues, AND verifiable (URL/email/image only — phone almost never qualifies).
- suspicious (20-64): unverifiable OR at least one concrete cue but not conclusive. This is the DEFAULT for unknown phone numbers.
- phishing (65-100): multiple cues OR one unmistakable fraud signal.

============================
OUTPUT DISCIPLINE
============================
- Never invent indicators, but for non-safe verdicts you MUST list at least one concrete indicator quoting the cue.
- For phone: indicators should mention "unverified caller", "premium-rate / scam-prone prefix", "matches known scam pattern", etc.
- Never claim a phone number is "legitimate" — at best say "no obvious red flags, but unverifiable".
- Missed scams hurt users far more than over-cautious warnings. When in doubt on a phone number, choose suspicious.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input, type, image } = await req.json();
    const validTypes = ["url", "email", "phone", "image"];
    if (!validTypes.includes(type)) {
      return new Response(JSON.stringify({ error: "Invalid scan type" }), {
        status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    if (type === "image") {
      if (!image || typeof image !== "string" || !image.startsWith("data:image/")) {
        return new Response(JSON.stringify({ error: "Missing or invalid image data" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    } else {
      if (!input || typeof input !== "string") {
        return new Response(JSON.stringify({ error: "Missing input" }), {
          status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const promptByType: Record<string, string> = {
      url: `Analyze this URL for phishing or scam risk:\n\n${(input ?? "").slice(0, 2000)}`,
      email: `Analyze this email/message for phishing, scam, or fake-account risk:\n\n${(input ?? "").slice(0, 8000)}`,
      phone: `Analyze this phone number for scam / fraud / robocall risk. Consider region, prefix patterns, premium-rate indicators, and known scam playbooks:\n\n${(input ?? "").slice(0, 64)}`,
      image: `Analyze the attached image for signs of phishing, scam, deepfake / morphing, forged document, fake social profile, or brand impersonation. Be specific about visual indicators you observe.`,
    };
    let userText = promptByType[type];

    // Deterministic curated helpline lookup for phone scans.
    let curatedMatch: Helpline | null = null;
    if (type === "phone") {
      curatedMatch = lookupHelpline(input ?? "");
      if (curatedMatch) {
        userText += `\n\n[CURATED HELPLINE MATCH]\n` +
          `name: ${curatedMatch.name}\n` +
          `organisation: ${curatedMatch.org}\n` +
          `country: ${curatedMatch.country}\n` +
          `category: ${curatedMatch.category}\n` +
          `Treat as verified official helpline per system rules.`;
      }
    }

    const userContent: any = type === "image"
      ? [
          { type: "text", text: userText },
          { type: "image_url", image_url: { url: image } },
        ]
      : userText;

    const tools = [
      {
        type: "function",
        function: {
          name: "report_threat",
          description: "Return a structured phishing/scam analysis.",
          parameters: {
            type: "object",
            properties: {
              risk_score: { type: "number", description: "Risk score 0-100 (0 safe, 100 confirmed phishing)" },
              verdict: { type: "string", enum: ["safe", "suspicious", "phishing"] },
              summary: { type: "string", description: "One-sentence verdict explanation." },
              indicators: {
                type: "array",
                description: "Specific signals detected.",
                items: {
                  type: "object",
                  properties: {
                    label: { type: "string" },
                    severity: { type: "string", enum: ["info", "low", "medium", "high"] },
                    detail: { type: "string" },
                    category: { type: "string", description: "One of: domain, content, urgency, credentials, impersonation, media_integrity, reputation" },
                  },
                  required: ["label", "severity", "detail"],
                  additionalProperties: false,
                },
              },
              recommendation: { type: "string", description: "What the user should do next." },
              category_scores: {
                type: "object",
                description: "Risk breakdown per category, 0-100.",
                properties: {
                  domain: { type: "number" },
                  content: { type: "number" },
                  urgency: { type: "number" },
                  credentials: { type: "number" },
                  impersonation: { type: "number" },
                  media_integrity: { type: "number" },
                  reputation: { type: "number" },
                },
                additionalProperties: false,
              },
            },
            required: ["risk_score", "verdict", "summary", "indicators", "recommendation"],
            additionalProperties: false,
          },
        },
      },
    ];

    const resp = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userContent },
        ],
        tools,
        tool_choice: { type: "function", function: { name: "report_threat" } },
      }),
    });

    if (!resp.ok) {
      if (resp.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Try again shortly." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (resp.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Add credits in Lovable workspace settings." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await resp.text();
      console.error("AI gateway error", resp.status, t);
      return new Response(JSON.stringify({ error: "AI gateway error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const data = await resp.json();
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (!toolCall) {
      return new Response(JSON.stringify({ error: "No analysis returned" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const result = JSON.parse(toolCall.function.arguments);

    // Hard-guarantee: if we matched a curated helpline, force the verdict to safe
    // even if the model drifted. This is the whole point of the curated list.
    if (type === "phone") {
      const match = lookupHelpline(input ?? "");
      if (match) {
        result.verdict = "safe";
        result.risk_score = Math.min(typeof result.risk_score === "number" ? result.risk_score : 5, 10);
        const note = `Matches curated official helpline registry: ${match.name} — ${match.org} (${match.country}).`;
        if (!Array.isArray(result.indicators)) result.indicators = [];
        result.indicators.unshift({
          label: "Official helpline match",
          severity: "info",
          detail: note,
          category: "reputation",
        });
        if (!result.summary || !/helpline|official/i.test(result.summary)) {
          result.summary = `${note} No fraud indicators in the number itself — but caller-ID can be spoofed, so always dial the number yourself rather than trust inbound calls.`;
        }
      }
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("analyze-threat error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
