import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Scam Shield Radar, an expert phishing & scam detection AI.
You analyze URLs, emails, phone numbers, and images to detect phishing, social engineering, scams, fake accounts, fraudulent media, and malicious intent.

Analysis criteria by type:
- URL: domain reputation, look-alike/typosquatting, suspicious TLDs, IP-based hosts, excessive subdomains, URL length, credential keywords, HTTPS usage, URL shorteners, recently registered indicators.
- EMAIL/MESSAGE: urgency tactics, generic greetings, sender/domain mismatch, suspicious links, payment/credential requests, grammar anomalies, brand impersonation, fake-account signals (new handles, mismatched display name).
- PHONE: country/region risk, premium-rate prefixes, known scam patterns (IRS/HMRC/tax, tech support, package delivery), VoIP/spoofable ranges, repeated/sequential digits, formatting anomalies.
- IMAGE: signs of morphing / face-swap / deepfake (asymmetry around eyes, ears, hairline; lighting mismatch; warped backgrounds; inconsistent shadows; blurred boundaries), screenshot scams (fake bank UI, crypto giveaways), forged documents, suspicious QR codes, brand impersonation, phishing landing-page screenshots, fake social-media profile cues.

ALWAYS populate \`category_scores\` with 0-100 numbers for these keys when relevant:
domain, content, urgency, credentials, impersonation, media_integrity, reputation.
Use 0 when a category does not apply (e.g. media_integrity for a URL).

Be decisive and educational. Score conservatively but firmly: legitimate-looking content gets low scores, clear phishing/scam/fake media gets 80+.`;

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
