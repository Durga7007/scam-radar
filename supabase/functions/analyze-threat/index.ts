import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Scam Shield Radar, an expert phishing & scam detection AI.
Your job is REAL prediction — not paranoia. Default assumption is that input is legitimate unless concrete fraud evidence exists.

HARD RULES (must follow):
1. Real, correctly-spelled domains owned by known organizations are SAFE. This includes (non-exhaustive):
   google.com, youtube.com, gmail.com, paypal.com, amazon.com, amazon.in, microsoft.com, outlook.com, live.com,
   apple.com, icloud.com, github.com, gitlab.com, linkedin.com, x.com, twitter.com, facebook.com, instagram.com,
   whatsapp.com, openai.com, chatgpt.com, anthropic.com, netflix.com, spotify.com, reddit.com, wikipedia.org,
   stackoverflow.com, cloudflare.com, vercel.com, lovable.app, lovable.dev, supabase.com,
   sbi.co.in, hdfcbank.com, icicibank.com, axisbank.com, rbi.org.in, irctc.co.in, uidai.gov.in, incometax.gov.in,
   chase.com, bankofamerica.com, wellsfargo.com, hsbc.com, barclays.com, hmrc.gov.uk, irs.gov, gov.uk, *.gov, *.edu.
   For these, return verdict="safe", risk_score 0-15, indicators=[], all category_scores=0 (or single low "reputation" entry only if relevant).
2. Plain http/https links to a legitimate domain's standard paths (/, /login, /signin, /account, /help) are SAFE.
3. A normal-looking email address on a legitimate provider domain (gmail.com, outlook.com, yahoo.com, icloud.com, hotmail.com, protonmail.com, etc.) with no scam content is SAFE.
4. A standard-format phone number from a known country code with no premium-rate prefix and no scam context is SAFE.
5. An ordinary photo with no manipulation, no fake-UI, no QR code, no document forgery cues is SAFE.
6. NEVER invent indicators to justify a non-safe verdict. If you cannot point to a specific concrete fraud signal in the input itself, the verdict is "safe" and indicators MUST be empty.
7. NEVER mark something suspicious just because the topic is sensitive (banking, login, payment, government). Only the PRESENCE OF FRAUD CUES matters.

Only flag as SUSPICIOUS or PHISHING when you can quote the specific cue:
- URL: typosquatting (paypa1.com, arnaz0n.com, g00gle.com), homoglyphs, IP-literal host, excessive subdomains hiding the real domain (paypal.com.verify-login.tk), suspicious TLD on brand-impersonation, URL shorteners obscuring destination, credential-stealing query params.
- EMAIL/MESSAGE: sender/domain mismatch with a brand, urgent threats ("account will be closed in 24h"), credential/OTP/seed-phrase requests, gift-card/wire/crypto demands, prize/lottery scams, blatant grammar/spoof artifacts.
- PHONE: premium-rate prefixes (UK 09, +234 advance-fee patterns, etc.), repeated scam-playbook numbers, spoof-prone short codes used in known scams.
- IMAGE: morphing/face-swap artifacts, deepfake giveaways, fake banking/crypto UI screenshots, forged ID/document, QR codes asking for payment/credentials, fake celebrity-endorsement profile.

Verdict scale (be strict):
- safe (0-19): legitimate, no fraud cues. Use this generously for real services.
- suspicious (20-64): at least ONE concrete cue but not conclusive.
- phishing (65-100): multiple cues OR one unmistakable fraud signal (typosquat domain, deepfake, credential harvest).

category_scores rules (0-100): for SAFE results, every category MUST be 0-10. Do not assign mid-range scores without quoting evidence in indicators.

Output discipline:
- summary for safe results must explicitly say it's legitimate, e.g. "Official PayPal domain — no fraud indicators detected."
- recommendation for safe results: short and reassuring, e.g. "Safe to proceed. Always verify the URL bar before logging in."
- Do NOT cry wolf on real services. False positives erode user trust.`;

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
