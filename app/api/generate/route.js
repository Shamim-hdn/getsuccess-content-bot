import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

const ALLOWED_MODELS = ["gemini-2.5-flash", "gemini-2.5-pro"];

const NICHE_LABEL = {
  success: "روانشناسی و موفقیت",
  food: "آشپزی و غذا",
  tech: "فناوری و گجت",
  travel: "سفر و گردشگری",
  fitness: "تناسب اندام و سلامتی",
  finance: "مالی و سرمایه‌گذاری",
  education: "آموزشی",
  lifestyle: "سبک زندگی",
  gaming: "بازی و گیمینگ",
  beauty: "زیبایی و آرایش",
  business: "کسب‌وکار و کارآفرینی",
  custom: "سفارشی",
};

const TONES = {
  educational: "آموزشی، شفاف، کاربردی و علمی",
  motivational: "پرانرژی، انگیزشی و الهام‌بخش",
  storytelling: "داستانی و روایی، با کشش و تعلیق",
  professional: "حرفه‌ای، جدی و معتبر",
  casual: "خودمونی، صمیمی و ساده",
  funny: "بامزه، طنزآمیز و سرگرم‌کننده",
};

const LENGTHS = {
  "5": { words: "650-850", tokens: 8000 },
  "8": { words: "1000-1300", tokens: 11000 },
  "12": { words: "1600-2000", tokens: 15000 },
  "15": { words: "2000-2400", tokens: 18000 },
  "20": { words: "2700-3200", tokens: 26000 },
};

function buildPrompt({ topic, niche, customNiche, tone, length, trendTitles }) {
  const nicheLabel = niche === "custom" && customNiche ? customNiche : (NICHE_LABEL[niche] || "عمومی");
  const toneDesc = TONES[tone] || TONES.educational;
  const len = LENGTHS[length] || LENGTHS["15"];
  const trendsBlock = trendTitles && trendTitles.length
    ? `\n\nبرای الهام و پیدا کردن شکاف محتوایی، چند تایتل پربازدید اخیر در همین نیچ (کپی نکن، بهتر از این‌ها بساز):\n- ${trendTitles.join("\n- ")}`
    : "";

  return `تو یک استراتژیست حرفه‌ای محتوای یوتیوب فارسی هستی که برای نیچ‌های مختلف محتوای درجه‌یک می‌سازی.

نیچ این ویدیو: «${nicheLabel}»
موضوع ویدیو: «${topic}»
لحن و سبک: ${toneDesc}
طول هدف: حدود ${length} دقیقه (اسکریپتی حدود ${len.words} کلمه).${trendsBlock}

قوانین نگارش اسکریپت (دقیق رعایت کن):
۱. با یک صحنه یا موقعیت ملموس و یک سؤال بی‌جواب شروع کن، نه با یک جمله‌ی کلی و انتزاعی.
۲. در همان قلاب اول یک «حلقه‌ی باز» مشخص و شماره‌دار بکار (مثل «اشتباه سوم همه‌چیز را عوض کرد») و فقط در پایان جوابش را بده.
۳. هر بخش را با یک جمله‌ی تیزر به بخش بعد تمام کن.
۴. هرگز از این عبارت‌های کلیشه‌ای استفاده نکن: «تو این ویدیو می‌خوایم»، «بدون مقدمه بریم سراغ»، «همه‌چیز رو جمع‌بندی کنیم»، «با ما همراه باشید تا».
۵. طول جمله‌ها را عمداً متنوع کن؛ جمله‌های کوتاه و کوبنده کنار جمله‌های بلندتر. جمله‌های ناقص هم مجاز است.
۶. دعوت به اقدام (CTA) باید یک سؤال خودارزیابی از بیننده باشد به‌علاوه‌ی یک کلیف‌هنگر مشخص برای ویدیوی بعدی؛ نه «نظرتون رو کامنت کنید».

خروجی را فقط و فقط به صورت یک شیء JSON معتبر با این کلیدها بده:
- titles: آرایه‌ای از ۵ تایتل فارسی جذاب و کلیک‌خور با زاویه‌های متفاوت
- script: اسکریپت کامل و کلمه‌به‌کلمه (حدود ${len.words} کلمه) با رعایت کامل قوانین بالا و بخش‌بندی با [قلاب]، [مقدمه]، [بخش ۱] و غیره
- tags: تگ‌های فارسی و انگلیسی مرتبط جدا شده با کاما، نزدیک به ۷۰۰ کاراکتر (نه بیشتر)
- thumbnailPrompt: پرامپت تصویری دقیق به انگلیسی برای ساخت تامبنیل با هوش مصنوعی، متناسب با نیچ
- timestamps: تایم‌استمپ‌ها برای توضیحات، هر خط «00:00 عنوان بخش»، متناسب با طول ویدیو
- youtubeDescription: توضیحات سئوشده‌ی یوتیوب (۲ تا ۳ پاراگراف) با کلمات کلیدی، دعوت به سابسکرایب، جای لینک‌ها و چند هشتگ
- instagramCaption: کپشن اینستاگرام فارسی جذاب با چند ایموجی و حدود ۱۰ هشتگ
- shortCaption: کپشن کوتاه و پرانرژی برای شورت با ۳ تا ۵ هشتگ
- seoStrategy: یک بلوک استراتژی کوتاه ولی دقیق (رشته) شامل: ۵ تا ۸ کلمه‌کلیدی هدف، بهترین زاویه‌ی تمایز نسبت به رقبا، و یک دلیل که چرا این ویدیو می‌تواند بهتر دیده شود`;
}

export async function POST(req) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "کلید GEMINI_API_KEY تنظیم نشده است. آن را در تنظیمات Vercel اضافه کنید." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const topic = (body.topic || "").trim();
    const niche = body.niche || "success";
    const customNiche = (body.customNiche || "").trim();
    const tone = body.tone || "educational";
    const length = String(body.length || "15");
    const trendTitles = Array.isArray(body.trendTitles) ? body.trendTitles.slice(0, 8) : [];

    let model = body.model && ALLOWED_MODELS.includes(body.model) ? body.model : null;
    if (!model) model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    if (!topic) {
      return NextResponse.json({ error: "موضوع ویدیو را وارد کنید." }, { status: 400 });
    }

    const len = LENGTHS[length] || LENGTHS["15"];
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: buildPrompt({ topic, niche, customNiche, tone, length, trendTitles }) }] }],
      generationConfig: { temperature: 0.92, maxOutputTokens: Math.min(len.tokens + 6000, 32768), responseMimeType: "application/json" },
    };

    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    if (!res.ok) {
      return NextResponse.json({ error: "خطا در ارتباط با Gemini API", detail: await res.text() }, { status: 502 });
    }

    const data = await res.json();
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason || "";
    const text = cand?.content?.parts?.map((p) => p.text).join("") || "";
    if (!text) {
      return NextResponse.json({ error: "مدل خروجی خالی برگرداند.", detail: `finishReason: ${finish}` }, { status: 500 });
    }

    let parsed;
    try { parsed = JSON.parse(text); }
    catch (e) { const m = text.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} } }

    if (!parsed) {
      const hint = finish === "MAX_TOKENS" ? "خروجی به‌خاطر طولانی بودن قطع شد. طول کوتاه‌تری انتخاب کن یا دوباره امتحان کن." : `finishReason: ${finish}`;
      return NextResponse.json({ error: "خروجی مدل قابل خواندن نبود.", detail: hint }, { status: 500 });
    }

    return NextResponse.json({ topic, model, result: parsed });
  } catch (err) {
    return NextResponse.json({ error: "خطای داخلی سرور", detail: String(err) }, { status: 500 });
  }
}
