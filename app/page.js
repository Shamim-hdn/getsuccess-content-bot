"use client";

import { useState } from "react";

function CopyButton({ text }) {
  const [done, setDone] = useState(false);
  return (
    <button
      className={"copy-btn" + (done ? " done" : "")}
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(text || "");
          setDone(true);
          setTimeout(() => setDone(false), 1500);
        } catch (e) {}
      }}
    >
      {done ? "✓ کپی شد" : "کپی"}
    </button>
  );
}

function Card({ title, icon, text, children }) {
  return (
    <div className="result-card">
      <h3>
        <span>
          <span className="icon">{icon}</span> {title}
        </span>
        {text != null && <CopyButton text={text} />}
      </h3>
      {children}
    </div>
  );
}

export default function Home() {
  const [topic, setTopic] = useState("");
  const [trends, setTrends] = useState([]);
  const [loadingTrends, setLoadingTrends] = useState(false);
  const [loadingGen, setLoadingGen] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  async function fetchTrends() {
    setError("");
    setLoadingTrends(true);
    setTrends([]);
    try {
      const res = await fetch("/api/trends", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: topic }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "خطا در گرفتن ترندها");
      setTrends(data.trends || []);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingTrends(false);
    }
  }

  async function generate(selectedTopic) {
    const t = (selectedTopic || topic).trim();
    if (!t) {
      setError("اول یک موضوع بنویس یا روی یکی از ترندها کلیک کن.");
      return;
    }
    setError("");
    setResult(null);
    setLoadingGen(true);
    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          topic: t,
          trendTitles: trends.slice(0, 8).map((x) => x.title),
        }),
      });

      const raw = await res.text();
      let data;
      try {
        data = JSON.parse(raw);
      } catch (parseErr) {
        if (res.status === 504 || /timeout|timed out/i.test(raw)) {
          throw new Error(
            "زمان پاسخ‌گویی سرور تمام شد (مدل Pro کند است). یک بار دیگر امتحان کن. اگر تکرار شد، در Vercel قابلیت Fluid Compute را روشن کن یا مدل را موقتاً به gemini-2.5-flash برگردان."
          );
        }
        throw new Error("پاسخ نامعتبر از سرور:\n" + raw.slice(0, 300));
      }

      if (!res.ok) {
        const d = data.detail
          ? "\n" + (typeof data.detail === "string" ? data.detail : JSON.stringify(data.detail))
          : "";
        throw new Error((data.error || "خطا در تولید محتوا") + d);
      }
      setResult(data.result);
      window.scrollTo({ top: 99999, behavior: "smooth" });
    } catch (e) {
      setError(e.message);
    } finally {
      setLoadingGen(false);
    }
  }

  const tagsLen = result?.tags ? result.tags.length : 0;

  return (
    <div className="wrap">
      <div className="header">
        <h1>
          ربات محتوای <span className="brand">Get Success</span>
        </h1>
        <p>تولید خودکار تایتل، اسکریپت، تگ، تامبنیل و کپشن — مخصوص نیچ روانشناسی و موفقیت</p>
      </div>

      <div className="panel">
        <label>موضوع ویدیو (اختیاری — خالی بگذار تا از ترندها پیشنهاد بدهد)</label>
        <input
          type="text"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="مثلاً: راز انضباط شخصی افراد موفق"
          onKeyDown={(e) => e.key === "Enter" && generate()}
        />
        <div className="row" style={{ marginTop: 12 }}>
          <button className="btn-primary" disabled={loadingGen} onClick={() => generate()}>
            {loadingGen ? "در حال تولید..." : "✨ تولید بستهٔ کامل محتوا"}
          </button>
          <button className="btn-ghost" disabled={loadingTrends} onClick={fetchTrends}>
            {loadingTrends ? "..." : "🔍 بررسی ترندهای یوتیوب فارسی"}
          </button>
        </div>

        {trends.length > 0 && (
          <div className="trends">
            {trends.map((tr) => (
              <button key={tr.id} className="trend" onClick={() => generate(tr.title)}>
                {tr.thumbnail && <img src={tr.thumbnail} alt="" />}
                <div className="meta">
                  <div className="t-title">{tr.title}</div>
                  <div className="t-sub">
                    {tr.channel} · {Number(tr.views).toLocaleString("fa-IR")} بازدید
                  </div>
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
          در حال نوشتن اسکریپت ۱۵ دقیقه‌ای و بقیهٔ محتوا... (مدل Pro کمی کندتر است، تا ۱ دقیقه صبر کن)
        </div>
      )}

      {result && (
        <div>
          <Card title="تایتل‌های پیشنهادی" icon="🎬">
            {(result.titles || []).map((t, i) => (
              <div className="title-option" key={i}>
                <span>{t}</span>
                <CopyButton text={t} />
              </div>
            ))}
          </Card>

          <Card title="اسکریپت ویدیو (۱۵ دقیقه)" icon="📝" text={result.script}>
            <div className="content-box">{result.script}</div>
          </Card>

          <Card title="تگ‌ها" icon="🏷️" text={result.tags}>
            <div className="content-box">{result.tags}</div>
            <div className="char-count">
              {tagsLen} کاراکتر {tagsLen > 700 ? "(بیش از ۷۰۰ — کمی کوتاه کن)" : "(مناسب)"}
            </div>
          </Card>

          <Card title="پرامپت تامبنیل" icon="🖼️" text={result.thumbnailPrompt}>
            <div className="content-box">{result.thumbnailPrompt}</div>
          </Card>

          <Card title="تایم‌استمپ‌ها" icon="⏱️" text={result.timestamps}>
            <div className="content-box">{result.timestamps}</div>
          </Card>

          <Card title="کپشن اینستاگرام" icon="📸" text={result.instagramCaption}>
            <div className="content-box">{result.instagramCaption}</div>
          </Card>

          <Card title="کپشن شورت / ریلز" icon="⚡" text={result.shortCaption}>
            <div className="content-box">{result.shortCaption}</div>
          </Card>
        </div>
      )}

      <div className="footer">ساخته‌شده برای کانال Get Success · با ❤️ و هوش مصنوعی</div>
    </div>
  );
}
