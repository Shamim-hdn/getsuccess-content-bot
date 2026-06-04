import { NextResponse } from "next/server";

// این روت ویدیوهای ترند و پربازدید فارسی را در نیچ کانال پیدا می‌کند
export const dynamic = "force-dynamic";

// کلمات کلیدی پیش‌فرض نیچ کانال Get Success (روانشناسی + موفقیت)
const DEFAULT_QUERIES = [
  "موفقیت",
  "انگیزشی",
  "روانشناسی موفقیت",
  "اعتماد به نفس",
  "هدف گذاری",
  "عادت های موفقیت",
  "ثروت ذهنی",
  "رشد فردی",
];

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

    // ویدیوهای فارسی، مرتب بر اساس بازدید، یک ماه اخیر (۳۰ روز)
    const publishedAfter = new Date(
      Date.now() - 30 * 24 * 60 * 60 * 1000
    ).toISOString();

    const searchUrl =
      `https://www.googleapis.com/youtube/v3/search?part=snippet` +
      `&q=${encodeURIComponent(query)}` +
      `&type=video&maxResults=15&order=viewCount&relevanceLanguage=fa` +
      `&publishedAfter=${publishedAfter}&key=${apiKey}`;

    const searchRes = await fetch(searchUrl);
    if (!searchRes.ok) {
      const errText = await searchRes.text();
      return NextResponse.json(
        { error: "خطا در ارتباط با YouTube API", detail: errText },
        { status: 502 }
      );
    }
    const searchData = await searchRes.json();
    const items = searchData.items || [];
    const videoIds = items.map((it) => it.id && it.id.videoId).filter(Boolean);

    let statsMap = {};
    if (videoIds.length) {
      const statsUrl =
        `https://www.googleapis.com/youtube/v3/videos?part=statistics,snippet` +
        `&id=${videoIds.join(",")}&key=${apiKey}`;
      const statsRes = await fetch(statsUrl);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        (statsData.items || []).forEach((v) => {
          statsMap[v.id] = {
            views: Number(v.statistics?.viewCount || 0),
            likes: Number(v.statistics?.likeCount || 0),
            channel: v.snippet?.channelTitle || "",
          };
        });
      }
    }

    const trends = items
      .filter((it) => it.id && it.id.videoId)
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
      .sort((a, b) => b.views - a.views);

    return NextResponse.json({ query, trends });
  } catch (err) {
    return NextResponse.json(
      { error: "خطای داخلی سرور", detail: String(err) },
      { status: 500 }
    );
  }
}
