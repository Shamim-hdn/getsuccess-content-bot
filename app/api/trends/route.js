import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// کلمات کلیدی هر نیچ برای پیدا کردن ترندها
const NICHE_KEYWORDS = {
  success: ["موفقیت", "انگیزشی", "اعتماد به نفس", "هدف گذاری", "رشد فردی", "روانشناسی موفقیت"],
  food: ["آشپزی", "دستور پخت", "غذای خانگی", "شیرینی پزی", "آشپزی آسان", "فینگرفود"],
  tech: ["بررسی گوشی", "فناوری", "هوش مصنوعی", "ترفند موبایل", "گجت", "آموزش کامپیوتر"],
  travel: ["سفر", "گردشگری", "ایرانگردی", "راهنمای سفر", "طبیعت گردی", "وی لاگ سفر"],
  fitness: ["تمرین بدنسازی", "کاهش وزن", "تناسب اندام", "تغذیه سالم", "یوگا", "حرکات اصلاحی"],
  finance: ["سرمایه گذاری", "بورس", "ارز دیجیتال", "پس انداز", "درآمد دلاری", "مدیریت مالی"],
  education: ["آموزش", "یادگیری", "مطالعه موثر", "زبان انگلیسی", "مهارت آموزی", "کنکور"],
  lifestyle: ["سبک زندگی", "مینیمالیسم", "عادت های روزانه", "خودمراقبتی", "نظم زندگی"],
  gaming: ["گیم پلی", "بازی موبایل", "ترفند بازی", "معرفی بازی", "استریم بازی"],
  beauty: ["میکاپ", "مراقبت پوست", "آرایش", "اسکین کر", "مدل مو"],
  business: ["کسب و کار", "بازاریابی", "استارتاپ", "فروش", "کارآفرینی"],
};

const PERSIAN = /[؀-ۿ]/;

function searchUrl(query, apiKey, publishedAfter, duration) {
  return (
    `https://www.googleapis.com/youtube/v3/search?part=snippet` +
    `&q=${encodeURIComponent(query)}` +
    `&type=video&maxResults=20&order=viewCount&relevanceLanguage=fa` +
    `&videoDuration=${duration}` +
    `&publishedAfter=${publishedAfter}&key=${apiKey}`
  );
}

function median(nums) {
  if (!nums.length) return 0;
  const s = [...nums].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : Math.round((s[m - 1] + s[m]) / 2);
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
    const niche = body.niche || "success";
    const customNiche = (body.customNiche || "").trim();
    const userQuery = (body.query || "").trim();

    let query = userQuery;
    if (!query) {
      if (niche === "custom" && customNiche) {
        query = customNiche;
      } else {
        const list = NICHE_KEYWORDS[niche] || NICHE_KEYWORDS.success;
        query = list[Math.floor(Math.random() * list.length)];
      }
    }

    const publishedAfter = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const durations = ["medium", "long"];
    let items = [];
    for (const d of durations) {
      const res = await fetch(searchUrl(query, apiKey, publishedAfter, d));
      if (res.ok) { const data = await res.json(); items = items.concat(data.items || []); }
    }

    const seen = new Set();
    items = items.filter((it) => {
      const id = it.id && it.id.videoId;
      if (!id || seen.has(id)) return false;
      seen.add(id); return true;
    });

    const videoIds = items.map((it) => it.id.videoId);
    let statsMap = {};
    for (let i = 0; i < videoIds.length; i += 50) {
      const chunk = videoIds.slice(i, i + 50);
      const r = await fetch(
        `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${chunk.join(",")}&key=${apiKey}`
      );
      if (r.ok) {
        const d = await r.json();
        (d.items || []).forEach((v) => {
          statsMap[v.id] = { views: Number(v.statistics?.viewCount || 0), likes: Number(v.statistics?.likeCount || 0) };
        });
      }
    }

    const trends = items
      .map((it) => {
        const id = it.id.videoId; const st = statsMap[id] || {};
        return {
          id, title: it.snippet.title, channel: it.snippet.channelTitle,
          publishedAt: it.snippet.publishedAt,
          thumbnail: it.snippet.thumbnails?.medium?.url || "",
          url: `https://www.youtube.com/watch?v=${id}`,
          views: st.views || 0, likes: st.likes || 0,
        };
      })
      .filter((t) => {
        if (/#?shorts?\b/i.test(t.title)) return false;
        if (!PERSIAN.test(`${t.title} ${t.channel}`)) return false;
        return true;
      })
      .sort((a, b) => b.views - a.views)
      .slice(0, 15);

    const views = trends.map((t) => t.views);
    const channelCount = {};
    trends.forEach((t) => (channelCount[t.channel] = (channelCount[t.channel] || 0) + 1));
    const topChannel = Object.entries(channelCount).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

    const stats = {
      count: trends.length,
      avgViews: views.length ? Math.round(views.reduce((a, b) => a + b, 0) / views.length) : 0,
      medianViews: median(views),
      maxViews: views.length ? Math.max(...views) : 0,
      topChannel,
    };

    return NextResponse.json({ query, trends, stats });
  } catch (err) {
    return NextResponse.json({ error: "خطای داخلی سرور", detail: String(err) }, { status: 500 });
  }
}
