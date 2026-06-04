import { NextResponse } from "next/server";

// ترندهای عمیق و باکیفیت فارسی در نیچ روانشناسی/موفقیت (بدون شورت)
export const dynamic = "force-dynamic";

// موضوعات عمیق هم‌سبک کانال‌های قوی فارسی (WOW Success، قدرت کلام و ...)
const DEFAULT_QUERIES = [
  "قدرت کلام",
  "قانون جذب",
  "ذهن ثروتمند",
  "ضمیر ناخودآگاه",
  "خودشناسی",
  "عزت نفس",
  "موفقیت واقعی",
  "باورهای محدودکننده",
  "روانشناسی ثروت",
  "هدف زندگی",
  "آرامش درونی",
  "تغییر سبک زندگی",
  "wow success",
  "رشد فردی عمیق",
];

const PERSIAN = /[؀-ۿ]/; // برای تشخیص محتوای فارسی

function searchUrl(query, apiKey, publishedAfter, duration) {
  return (
    `https://www.googleapis.com/youtube/v3/search?part=snippet` +
    `&q=${encodeURIComponent(query)}` +
    `&type=video&maxResults=20&order=viewCount&relevanceLanguage=fa` +
    `&videoDuration=${duration}` +
    `&publishedAfter=${publishedAfter}&key=${apiKey}`
  );
}

export async function POST(req) {
  try {
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "کلید YOUTUBE_API_KEY تنظیم نشده است. آن را در تنظیمات Vercel اضافه کنید." },
        { status: 500 }
      );
    }

    const body = await req.json().catch(() => ({}));
    const userQuery = (body.query || "").trim();
    const query =
      userQuery ||
      DEFAULT_QUERIES[Math.floor(Math.random() * DEFAULT_QUERIES.length)];

    // یک ماه اخیر (۳۰ روز)
    const publishedAfter = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    // فقط ویدیوهای متوسط (۴ تا ۲۰ دقیقه) و بلند (بالای ۲۰ دقیقه) → بدون شورت
    const durations = ["medium", "long"];
    let items = [];
    for (const d of durations) {
      const res = await fetch(searchUrl(query, apiKey, publishedAfter, d));
      if (res.ok) {
        const data = await res.json();
        items = items.concat(data.items || []);
      }
    }

    // حذف موارد تکراری بر اساس آی‌دی ویدیو
    const seen = new Set();
    items = items.filter((it) => {
      const id = it.id && it.id.videoId;
      if (!id || seen.has(id)) return false;
      seen.add(id);
      return true;
    });

    const videoIds = items.map((it) => it.id.videoId);

    // آمار بازدید
    let statsMap = {};
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const statsRes = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics` +
          `&id=${chunk.join(",")}&key=${apiKey}`
      );
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        (statsData.items || []).forEach((v) => {
          statsMap[v.id] = {
            views: Number(v.statistics?.viewCount || 0),
            likes: Number(v.statistics?.likeCount || 0),
          };
        });
      }
    }

    const trends = items
      .map((it) => {
        const id = it.id.videoId;
        const st = statsMap[id] || {};
        return {
          id,
          title: it.snippet.title,
          channel: it.snippet.channelTitle,
          publishedAt: it.snippet.publishedAt,
          thumbnail: it.snippet.thumbnails?.medium?.url || "",
          url: `https://www.youtube.com/watch?v=${id}`,
          views: st.views || 0,
          likes: st.likes || 0,
        };
      })
      // فقط محتوای فارسی واقعی و بدون شورت
      .filter((t) => {
        const text = `${t.title} ${t.channel}`;
        if (!PERSIAN.test(text)) return false;
        if (/#?shorts?\b/i.test(t.title)) return false;
        return true;
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    return NextResponse.json({ query, trends });
  } catch (err) {
    return NextResponse.json(
      { error: "خطای داخلی سرور", detail: String(err) },
      { status: 500 }
    );
  }
}
