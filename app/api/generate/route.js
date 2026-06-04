import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const maxDuration = 60;

const MODEL = process.env.GEMINI_MODEL || "gemini-2.0-flash";

function buildPrompt(topic, trendTitles) {
  const trendsBlock =
    trendTitles && trendTitles.length
      ? `\n\nبرای الهام، این تعدادی از تایتل‌های ترند و پربازدید اخیر در همین نیچ هستند:\n- ${trendTitles.join(
          "\n- "
        )}`
      : "";

  return `تو یک متخصص حرفه‌ای تولید محتوای یوتیوب فارسی در نیچ «روانشناسی و موفقیت» برای کانالی به نام «Get Success» هستی.
کانال هفته‌ای یک ویدیوی اصلی حدوداً ۱۵ دقیقه‌ای و دو شورت منتشر می‌کند. لحن کانال انگیزشی، عمیق، علمی اما ساده و قابل‌فهم برای عموم است.

موضوع ویدیوی این هفته: «${topic}»${trendsBlock}

یک بستهٔ کامل محتوا تولید کن. خروجی را فقط و فقط به صورت یک شیء JSON معتبر (بدون متن اضافه، بدون \`\`\`) با این کلیدها بده:

{
  "titles": [سه تایتل جذاب و کلیک‌خور فارسی به صورت آرایه‌ای از رشته‌ها],
  "script": "اسکریپت کامل ویدیوی ۱۵ دقیقه‌ای فارسی (حداقل ۱۸۰۰ کلمه). شامل قلاب قوی در ۱۵ ثانیه اول، مقدمه، بدنه با چند بخش مشخص و مثال‌های ملموس، و یک جمع‌بندی با دعوت به اقدام و درخواست سابسکرایب. با علامت‌گذاری بخش‌ها مثل [قلاب]، [مقدمه]، [بخش ۱] و غیره.",
  "tags": "تگ‌های یوتیوب فارسی و انگلیسی مرتبط، جدا شده با کاما، دقیقاً نزدیک به ۷۰۰ کاراکتر (نه بیشتر از ۷۰۰).",
  "thumbnailPrompt": "یک پرامپت دقیق و تصویری به زبان انگلیسی برای ساخت تامبنیل با هوش مصنوعی (Midjourney/DALL-E)، شامل ترکیب‌بندی، احساسات چهره، رنگ‌بندی پرکنتراست، و فضای متن.",
  "timestamps": "تایم‌استمپ‌های ویدیو برای توضیحات یوتیوب، هر خط به فرمت 00:00 عنوان بخش، متناسب با اسکریپت و حدود ۱۵ دقیقه.",
  "instagramCaption": "کپشن اینستاگرام فارسی جذاب با چند خط، چند ایموجی مناسب، و حدود ۱۰ هشتگ فارسی/انگلیسی مرتبط در انتها.",
  "shortCaption": "کپشن کوتاه و پرانرژی برای شورت/ریلز فارسی با ۳ تا ۵ هشتگ ترند."
}

دقت کن: کل خروجی باید JSON معتبر باشد و فیلد tags از ۷۰۰ کاراکتر بیشتر نشود.`;
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
        maxOutputTokens: 8192,
        responseMimeType: "application/json",
      },
    };

    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errText = await res.text();
      return NextResponse.json(
        { error: "خطا در ارتباط با Gemini API", detail: errText },
        { status: 502 }
      );
    }

    const data = await res.json();
    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text).join("") || "";

    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch (e) {
      // اگر مدل کد فنس گذاشت یا متن اضافه داشت، JSON را استخراج کن
      const match = text.match(/\{[\s\S]*\}/);
      if (match) {
        parsed = JSON.parse(match[0]);
      } else {
        return NextResponse.json(
          { error: "خروجی مدل قابل خواندن نبود.", raw: text },
          { status: 500 }
        );
      }
    }

    return NextResponse.json({ topic, result: parsed });
  } catch (err) {
    return NextResponse.json(
      { error: "خطای داخلی سرور", detail: String(err) },
      { status: 500 }
    );
  }
}
