import "https://deno.land/x/xhr@0.1.0/mod.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are Scam Shield Radar, an expert phishing & scam detection AI.
You analyze URLs, emails, and message content to detect phishing, social engineering, scams, and malicious intent.

Analysis criteria:
- URLs: domain reputation, look-alike/typosquatting, suspicious TLDs, IP-based hosts, excessive subdomains, URL length, presence of credential keywords, HTTPS usage, URL shorteners, recently registered indicators.
- Emails/messages: urgency tactics, generic greetings, sender/domain mismatch, suspicious links, payment/credential requests, grammar anomalies, brand impersonation.

Always be decisive and educational. Score conservatively but firmly: legitimate-looking content gets low scores, clear phishing gets 80+.`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { input, type } = await req.json();
    if (!input || typeof input !== "string") {
      return new Response(JSON.stringify({ error: "Missing input" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY not configured");

    const userPrompt = type === "url"
      ? `Analyze this URL for phishing or scam risk:\n\n${input.slice(0, 2000)}`
      : `Analyze this email/message content for phishing or scam risk:\n\n${input.slice(0, 8000)}`;

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
                  },
                  required: ["label", "severity", "detail"],
                  additionalProperties: false,
                },
              },
              recommendation: { type: "string", description: "What the user should do next." },
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
          { role: "user", content: userPrompt },
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
