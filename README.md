# 🤖 ربات محتوای Get Success

ربات اختصاصی تولید محتوای یوتیوب برای کانال **Get Success** (نیچ روانشناسی و موفقیت، زبان فارسی).

با یک کلیک:
- 🔍 ترندهای یوتیوب فارسی نیچ تو را بررسی می‌کند
- 🎬 سه تایتل کلیک‌خور می‌دهد
- 📝 اسکریپت کامل ویدیوی ۱۵ دقیقه‌ای می‌نویسد
- 🏷️ تگ نزدیک به ۷۰۰ کاراکتر می‌سازد
- 🖼️ پرامپت تامبنیل (انگلیسی، آمادهٔ Midjourney/DALL·E)
- ⏱️ تایم‌استمپ
- 📸 کپشن اینستاگرام
- ⚡ کپشن شورت/ریلز

همه‌چیز رایگان است (Gemini + YouTube API روی پلن رایگان، هاست روی Vercel رایگان).

---

## 🔑 مرحلهٔ ۱: گرفتن دو کلید رایگان

### الف) کلید Gemini (برای تولید متن)
۱. برو به: https://aistudio.google.com/app/apikey
۲. با اکانت گوگل لاگین کن.
۳. روی **Create API key** بزن.
۴. کلید را کپی کن — این می‌شود مقدار `GEMINI_API_KEY`.

### ب) کلید YouTube Data API (برای ترندها)
۱. برو به: https://console.cloud.google.com/
۲. یک پروژهٔ جدید بساز (یا موجود را انتخاب کن).
۳. از منو: **APIs & Services → Library** → جستجو کن **YouTube Data API v3** → **Enable**.
۴. بعد: **APIs & Services → Credentials → Create Credentials → API key**.
۵. کلید را کپی کن — این می‌شود مقدار `YOUTUBE_API_KEY`.

> این کلیدها را جایی امن نگه دار و **هرگز** داخل کد یا گیت‌هاب قرار نده. فقط در تنظیمات Vercel وارد می‌شوند.

---

## 🚀 مرحلهٔ ۲: دیپلوی روی Vercel

۱. پروژه را روی گیت‌هاب پوش کن (یا بگذار من برایت انجام دهم).
۲. برو به https://vercel.com → با گیت‌هاب لاگین کن → **Add New → Project**.
۳. ریپازیتوری `GetSuccess-Content-Bot` را انتخاب و **Import** کن.
۴. در بخش **Environment Variables** این دو را اضافه کن:
   - `GEMINI_API_KEY` = کلید Gemini
   - `YOUTUBE_API_KEY` = کلید یوتیوب
۵. روی **Deploy** بزن. بعد از چند دقیقه یک لینک می‌گیری مثل `https://getsuccess-content-bot.vercel.app` — این ربات توست!

---

## 🖥️ اجرای محلی (اختیاری)

```bash
npm install
cp .env.example .env.local   # کلیدها را داخل .env.local بگذار
npm run dev
```
سپس باز کن: http://localhost:3000

---

## ⚙️ تنظیمات

- مدل Gemini به‌صورت پیش‌فرض `gemini-2.0-flash` است. برای تغییر، متغیر `GEMINI_MODEL` را در Vercel اضافه کن.
- کلمات کلیدی پیش‌فرض نیچ در فایل `app/api/trends/route.js` قابل ویرایش‌اند.

## 🌍 کانال انگلیسی
ساختار همین پروژه برای کانال انگلیسی هم قابل استفاده است؛ فقط متن پرامپت در `app/api/generate/route.js` و کلمات کلیدی نیچ را به انگلیسی تغییر بده.
