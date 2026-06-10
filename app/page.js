"use client";

import { useState } from "react";

const NICHES = [
  { k: "success", t: "روانشناسی و موفقیت" },
  { k: "food", t: "آشپزی و غذا" },
  { k: "tech", t: "فناوری و گجت" },
  { k: "travel", t: "سفر و گردشگری" },
  { k: "fitness", t: "تناسب اندام" },
  { k: "finance", t: "مالی و سرمایه‌گذاری" },
  { k: "education", t: "آموزشی" },
  { k: "lifestyle", t: "سبک زندگی" },
  { k: "gaming", t: "بازی و گیمینگ" },
  { k: "beauty", t: "زیبایی و آرایش" },
  { k: "business", t: "کسب‌وکار" },
  { k: "custom", t: "✏️ سفارشی" },
];

function CopyButton({ text, label }) {
  const [done, setDone] = useState(false);
  return (
    <button className={"copy-btn" + (done ? " done" : "")}
      onClick={async () => { try { await navigator.clipboard.writeText(text || ""); setDone(true); setTimeout(() => setDone(false), 1500); } catch (e) {} }}>
      {done ? "✓ کپی شد" : label || "کپی"}
    </button>
  );
}

function Card({ title, icon, text, className, children }) {
  return (
    <div className={"card fade " + (className || "")}>
      <h3><span><span className="ic">{icon}</span>{title}</span>{text != null && <CopyButton text={text} />}</h3>
      {children}
    </div>
  );
}

function fmt(n) { return Number(n || 0).toLocaleString("fa-IR"); }

export default function Home() {
  const [niche, setNiche] = useState("success");
  const [customNiche, setCustomNiche] = useState("");
  const [topic, setTopic] = useState("");
  const [tone, setTone] = useState("educational");
  const [length, setLength] = useState("15");
  const [model, setModel] = useState("gemini-2.5-flash");
  const [trends, setTrends] = useState([]);
  const [stats, setStats] = useState(null);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function fetchTrends() {
    setError(""); setLoadingTrends(true); setTrends([]); setStats(null);
    try {
      const res = await fetch("/api/trends", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ niche, customNiche, query: topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در گرفتن ترندها");
      setTrends(data.trends || []); setStats(data.stats || null);
    } catch (e) { setError(e.message); } finally { setLoadingTrends(false); }
  }

  async function generate(selectedTopic) {
    const t = (selectedTopic || topic).trim();
    if (!t) { setError("اول یک موضوع بنویس یا روی یکی از ترندها کلیک کن."); return; }
    setError(""); setResult(null); setLoadingGen(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ topic: t, niche, customNiche, tone, length, model, trendTitles: trends.slice(0, 8).map((x) => x.title) }),
      });
      const raw = await res.text();
      let data;
      try { data = JSON.parse(raw); }
      catch (pe) {
        if (res.status === 504 || /timeout|timed out/i.test(raw)) throw new Error("زمان پاسخ‌گویی سرور تمام شد (مدل Pro کند است). دوباره امتحان کن یا مدل را به Flash برگردان.");
        throw new Error("پاسخ نامعتبر از سرور:\n" + raw.slice(0, 300));
      }
      if (!res.ok) {
        const d = data.detail ? "\n" + (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail)) : "";
        throw new Error((data.error || "خطا در تولید محتوا") + d);
      }
      setResult(data.result);
      window.scrollTo({ top: 99999, behavior: "smooth" });
    } catch (e) { setError(e.message); } finally { setLoadingGen(false); }
  }

  function copyAll() {
    if (!result) return; const r = result;
    const txt = [
      "تایتل‌ها:\n" + (r.titles || []).join("\n"),
      "استراتژی سئو:\n" + (r.seoStrategy || ""),
      "اسکریپت:\n" + (r.script || ""),
      "توضیحات یوتیوب:\n" + (r.youtubeDescription || ""),
      "تگ‌ها:\n" + (r.tags || ""),
      "پرامپت تامبنیل:\n" + (r.thumbnailPrompt || ""),
      "تایم‌استمپ:\n" + (r.timestamps || ""),
      "اینستاگرام:\n" + (r.instagramCaption || ""),
      "شورت:\n" + (r.shortCaption || ""),
    ].join("\n\n———\n\n");
    navigator.clipboard.writeText(txt).catch(() => {});
  }

  const tagsLen = result?.tags ? result.tags.length : 0;

  return (
    <div className="wrap">
      <div className="topbar">
        <div className="brand">
          <img src="/logo.svg" alt="Get Content" width="48" height="48" />
          <div>
            <h1>Get <b>Content</b></h1>
            <div className="sub">استودیوی محتوای هوشمند برای هر نیچ</div>
          </div>
        </div>
        <div className="badge">AI</div>
      </div>

      <div className="panel">
        <label>نیچ کانال</label>
        <div className="niches">
          {NICHES.map((n) => (
            <button key={n.k} className={"chip" + (niche === n.k ? " active" : "")} onClick={() => setNiche(n.k)}>{n.t}</button>
          ))}
        </div>

        {niche === "custom" && (
          <div style={{ marginBottom: 16 }}>
            <label>نیچ سفارشی</label>
            <input type="text" value={customNiche} onChange={(e) => setCustomNiche(e.target.value)} placeholder="مثلاً: باغبانی خانگی" />
          </div>
        )}

        <label>موضوع ویدیو (اختیاری — خالی بگذار تا از ترندها پیشنهاد بدهد)</label>
        <input type="text" value={topic} onChange={(e) => setTopic(e.target.value)}
          placeholder="مثلاً: ۵ اشتباهی که پیشرفتت را متوقف می‌کند"
          onKeyDown={(e) => e.key === "Enter" && generate()} />

        <div className="controls">
          <div>
            <label>لحن</label>
            <select value={tone} onChange={(e) => setTone(e.target.value)}>
              <option value="educational">آموزشی</option>
              <option value="motivational">انگیزشی</option>
              <option value="storytelling">داستانی</option>
              <option value="professional">حرفه‌ای</option>
              <option value="casual">خودمونی</option>
              <option value="funny">طنز</option>
            </select>
          </div>
          <div>
            <label>طول ویدیو</label>
            <select value={length} onChange={(e) => setLength(e.target.value)}>
              <option value="5">~۵ دقیقه</option>
              <option value="8">~۸ دقیقه</option>
              <option value="12">~۱۲ دقیقه</option>
              <option value="15">~۱۵ دقیقه</option>
              <option value="20">~۲۰ دقیقه</option>
            </select>
          </div>
          <div>
            <label>مدل</label>
            <select value={model} onChange={(e) => setModel(e.target.value)}>
              <option value="gemini-2.5-flash">Flash (سریع)</option>
              <option value="gemini-2.5-pro">Pro (باکیفیت)</option>
            </select>
          </div>
        </div>

        <div className="row">
          <button className="btn-primary" disabled={loadingGen} onClick={() => generate()}>
            {loadingGen ? "در حال تولید..." : "✨ تولید بستهٔ کامل محتوا"}
          </button>
          <button className="btn-ghost" disabled={loadingTrends} onClick={fetchTrends}>
            {loadingTrends ? "..." : "🔍 بررسی ترندها"}
          </button>
        </div>

        {stats && (
          <div className="stats fade">
            <div className="stat"><div className="k">تعداد ویدیو</div><div className="v">{fmt(stats.count)}</div></div>
            <div className="stat"><div className="k">میانگین بازدید</div><div className="v grad">{fmt(stats.avgViews)}</div></div>
            <div className="stat"><div className="k">پربازدیدترین</div><div className="v">{fmt(stats.maxViews)}</div></div>
            <div className="stat"><div className="k">کانال غالب</div><div className="v" style={{ fontSize: 13 }}>{stats.topChannel}</div></div>
          </div>
        )}

        {trends.length > 0 && (
          <div className="trends">
            {trends.map((tr) => (
              <button key={tr.id} className="trend" onClick={() => generate(tr.title)}>
                {tr.thumbnail && <img src={tr.thumbnail} alt="" />}
                <div className="meta">
                  <div className="t-title">{tr.title}</div>
                  <div className="t-sub">{tr.channel} · {fmt(tr.views)} بازدید</div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {error && <div className="error">⚠️ {error}</div>}

      {loadingGen && (
        <div className="panel loading">
          <div className="spinner" />
          در حال نوشتن اسکریپت {length} دقیقه‌ای، استراتژی سئو و کپشن‌ها... ({model.includes("pro") ? "مدل Pro کمی کندتر است" : "نزدیکه"})
        </div>
      )}

      {result && (
        <div>
          <div className="result-head">
            <h2>بستهٔ محتوای تو</h2>
            <button className="copy-all" onClick={copyAll}>📋 کپی همه</button>
          </div>

          <Card title="تایتل‌های پیشنهادی" icon="🎬">
            {(result.titles || []).map((t, i) => (
              <div className="title-opt" key={i}><span>{t}</span><CopyButton text={t} /></div>
            ))}
          </Card>

          {result.seoStrategy && (
            <Card title="استراتژی سئو و رقابت" icon="📈" text={result.seoStrategy} className="seo">
              <div className="box">{result.seoStrategy}</div>
            </Card>
          )}

          <Card title={`اسکریپت (~${length} دقیقه)`} icon="📝" text={result.script}>
            <div className="box">{result.script}</div>
          </Card>

          {result.youtubeDescription && (
            <Card title="توضیحات یوتیوب" icon="📄" text={result.youtubeDescription}>
              <div className="box">{result.youtubeDescription}</div>
            </Card>
          )}

          <Card title="تگ‌ها" icon="🏷️" text={result.tags}>
            <div className="box">{result.tags}</div>
            <div className="count">{tagsLen} کاراکتر {tagsLen > 700 ? "(بیش از ۷۰۰ — کمی کوتاه کن)" : "(مناسب)"}</div>
          </Card>

          <Card title="پرامپت تامبنیل" icon="🖼️" text={result.thumbnailPrompt}>
            <div className="box">{result.thumbnailPrompt}</div>
          </Card>

          <Card title="تایم‌استمپ‌ها" icon="⏱️" text={result.timestamps}>
            <div className="box">{result.timestamps}</div>
          </Card>

          <Card title="کپشن اینستاگرام" icon="📸" text={result.instagramCaption}>
            <div className="box">{result.instagramCaption}</div>
          </Card>

          <Card title="کپشن شورت / ریلز" icon="⚡" text={result.shortCaption}>
            <div className="box">{result.shortCaption}</div>
          </Card>
        </div>
      )}

      <div className="footer">Get Content · استودیوی محتوای هوشمند · با هوش مصنوعی</div>
    </div>
  );
}
