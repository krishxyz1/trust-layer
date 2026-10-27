// Looks at a customer's photo of a delivered item and says whether it shows the
// item they claim about, and whether a quality problem is visible. The decision
// itself (replace, refund, or send to a person) is made by the rule in lib/sample.ts.

const MODEL = process.env.GEMINI_MODEL ?? 'gemini-3.5-flash-lite';
const URL = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

const ISSUES = {
  rot_or_mould: 'Rot or mould visible',
  bruising_or_crush: 'Bruising or crush',
  past_date_on_pack: 'Past date on pack',
  leaking_or_torn: 'Leaking or torn pack',
  looks_fine: 'Looks fine',
  unclear: 'Photo unclear',
} as const;

const SCHEMA = {
  type: 'OBJECT',
  properties: {
    matches_item: { type: 'BOOLEAN' },
    visible_issue: { type: 'STRING', enum: Object.keys(ISSUES) },
    confidence: { type: 'NUMBER' },
    note: { type: 'STRING' },
  },
  required: ['matches_item', 'visible_issue', 'confidence', 'note'],
  propertyOrdering: ['matches_item', 'visible_issue', 'confidence', 'note'],
};

const hits = new Map<string, number[]>();
const limited = (ip: string) => {
  const now = Date.now();
  const recent = (hits.get(ip) ?? []).filter((t) => now - t < 60_000);
  recent.push(now);
  hits.set(ip, recent);
  return recent.length > 6;
};

export async function POST(request: Request) {
  const key = process.env.GEMINI_API_KEY;
  if (!key) return Response.json({ error: 'Photo checks are not configured on this deployment.' }, { status: 503 });

  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'local';
  if (limited(ip)) return Response.json({ error: 'Too many photos in a minute. Wait a moment and try again.' }, { status: 429 });

  let body: { image?: string; mime?: string; item?: string; reason?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: 'Send JSON with image, mime, item and reason.' }, { status: 400 });
  }
  const { image, mime = 'image/jpeg', item = '', reason = '' } = body;
  if (!image || image.length > 2_000_000) return Response.json({ error: 'Attach one photo under about 1.5 MB.' }, { status: 400 });
  if (!/^image\/(jpeg|png|webp)$/.test(mime)) return Response.json({ error: 'Use a JPEG, PNG or WebP photo.' }, { status: 400 });

  const prompt = `A grocery customer ordered "${item}" and reports: "${reason}". Look at their photo.
- matches_item: does the photo show this item (or its pack)? A different product is false.
- visible_issue: the most serious quality problem you can actually see. Use looks_fine if the item looks acceptable and unclear if the photo is too dark, blurry or cropped to judge.
- confidence: 0 to 1, how sure you are about visible_issue.
- note: one plain sentence, under 20 words, describing what you see. No speculation about things you cannot see.`;

  const res = await fetch(URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': key },
    body: JSON.stringify({
      contents: [{ role: 'user', parts: [{ inline_data: { mime_type: mime, data: image } }, { text: prompt }] }],
      generationConfig: { temperature: 0, responseMimeType: 'application/json', responseSchema: SCHEMA },
    }),
    signal: AbortSignal.timeout(30_000),
  }).catch(() => null);

  if (!res) return Response.json({ error: 'The photo check took too long. Try again, or send without a photo.' }, { status: 504 });
  if (res.status === 429) return Response.json({ error: 'The free model quota is used up for the moment. Send without a photo, or try again in a minute.' }, { status: 503 });
  if (!res.ok) return Response.json({ error: `The photo check failed (${res.status}). Try again.` }, { status: 502 });

  const json = await res.json();
  try {
    const out = JSON.parse(json.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? '').join('') ?? '{}');
    const issue = (out.visible_issue in ISSUES ? out.visible_issue : 'unclear') as keyof typeof ISSUES;
    const problem = issue !== 'looks_fine' && issue !== 'unclear';
    return Response.json({
      match: Boolean(out.matches_item),
      problem,
      issue: ISSUES[issue],
      // A photo with no visible problem cannot justify an instant approval on its own.
      confidence: problem ? Math.max(0, Math.min(1, Number(out.confidence) || 0)) : 0,
      note: String(out.note ?? '').slice(0, 200),
      model: MODEL,
    });
  } catch {
    return Response.json({ error: 'The photo check answered in an unexpected shape. Try again.' }, { status: 502 });
  }
}
