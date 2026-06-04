import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

// پیش‌فرض: Gemini 2.5 Pro برای کیفیت بهتر نوشتن
const MODEL = process.env.GEMINI_MODEL || "gemini-2.5-pro";

function buildPrompt(topic, trendTitles) {
  const trendsBlock =
    trendTitles && trendTitles.length
      ? `\n\nبرای الهام، چند تایتل ترند اخیر در همین نیچ:\n- ${trendTitles.join("\n- ")}`
      : "";

  return `تو یک متخصص حرفه‌ای تولید محتوای یوتیوب فارسی در نیچ «روانشناسی و موفقیت» برای کانالی به نام «Get Success» هستی.
کانال هفته‌ای یک ویدیوی اصلی حدوداً ۱۵ دقیقه‌ای منتشر می‌کند. لحن: عمیق، علمی اما ساده، انگیزشی، انسانی و قابل‌فهم برای عموم. از کلیشه‌های تکراری پرهیز کن و نوشته را روان و گیرا بنویس.

موضوع ویدیوی این هفته: «${topic}»${trendsBlock}

یک بستهٔ کامل محتوا تولید کن. خروجی را فقط و فقط به صورت JSON معتبر با این کلیدها بده:
- titles: آرایه‌ای از سه تایتل جذاب و کلیک‌خور فارسی
- script: اسکریپت کامل ویدیوی ۱۵ دقیقه‌ای فارسی (حدود ۱۸۰۰ تا ۲۲۰۰ کلمه) شامل قلاب قوی در ۱۵ ثانیه اول، مقدمه، چند بخش با مثال‌های ملموس و داستان، و جمع‌بندی با دعوت به اقدام و سابسکرایب. بخش‌ها را با [قلاب]، [مقدمه]، [بخش ۱] و غیره مشخص کن.
- tags: تگ‌های فارسی و انگلیسی مرتبط جدا شده با کاما، نزدیک به ۷۰۰ کاراکتر (نه بیشتر از ۷۰۰)
- thumbnailPrompt: پرامپت تصویری دقیق به انگلیسی برای ساخت تامبنیل با هوش مصنوعی
- timestamps: تایم‌استمپ‌های ویدیو برای توضیحات، هر خط به فرمت 00:00 عنوان بخش، متناسب با ۱۵ دقیقه
- instagramCaption: کپشن اینستاگرام فارسی جذاب با چند ایموجی و حدود ۱۰ هشتگ
- shortCaption: کپشن کوتاه و پرانرژی برای شورت با ۳ تا ۵ هشتگ`;
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
    const trendTitles = Array.isArray(body.trendTitles) ? body.trendTitles.slice(0, 8) : [];
    if (!topic) {
      return NextResponse.json({ error: "موضوع ویدیو را وارد کنید." }, { status: 400 });
    }

    const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${apiKey}`;

    const payload = {
      contents: [{ parts: [{ text: buildPrompt(topic, trendTitles) }] }],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 32768,
        responseMimeType: "application/json",
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      return NextResponse.json(
        { error: "خطا در ارتباط با Gemini API", detail: await res.text() },
        { status: 502 }
      );
    }

    const data = await res.json();
    const cand = data?.candidates?.[0];
    const finish = cand?.finishReason || "";
    const text = cand?.content?.parts?.map((p) => p.text).join("") || "";

    if (!text) {
      return NextResponse.json(
        { error: "مدل خروجی خالی برگرداند.", detail: `finishReason: ${finish}` },
        { status: 500 }
      );
    }

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        try {
          parsed = JSON.parse(match[0]);
        } catch (e2) {}
      }
    }

    if (!parsed) {
      const hint =
        finish === "MAX_TOKENS"
          ? "خروجی به‌خاطر طولانی بودن قطع شد. یک بار دیگر امتحان کن."
          : `finishReason: ${finish}`;
      return NextResponse.json(
        { error: "خروجی مدل قابل خواندن نبود.", detail: hint },
        { status: 500 }
      );
    }

    return NextResponse.json({ topic, result: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: "خطای داخلی سرور", detail: String(err) },
      { status: 500 }
    );
  }
}
