import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

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
Phone numbers cannot be verified as legitimate from the number alone. There is NO whitelist for phone numbers.
- DEFAULT verdict for any unsolicited / unknown phone number is "suspicious" (risk_score 35-55), NOT safe.
- Mark "phishing" (risk_score 70-95) when ANY of these apply:
  * Premium-rate prefix (UK 09, +1-900, +234 advance-fee region patterns, +22x/+23x West-Africa scam patterns,
    Indian premium codes, fake "1-800" variants used in tech-support scams).
  * Number matches known IRS/SSA/customs/courier/bank-impersonation scam playbooks.
  * Repeated 0s, sequential digits, or obvious spoof patterns (e.g. +1 202 555 0143 — 555-01xx is a US fictional/test range
    commonly reused in scam demos and robocalls).
  * Test/fictional ranges: US 555-0100..555-0199, UK 0113 496 0xxx, Indian 9876543210-style placeholders.
  * Caller-ID spoofing patterns (number too short, too long, or impossible country code).
- Mark "safe" (risk_score 0-15) ONLY when the number is clearly an official published helpline of a known organization
  (e.g. official RBI 14440, official bank toll-free numbers verifiable from their domain). If unsure, do NOT mark safe.
- For phone, "summary" must explicitly say the number cannot be independently verified and the user should treat unsolicited
  calls/SMS with caution.

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
    const userText = promptByType[type];
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
