import "./globals.css";

export const metadata = {
  title: "ربات محتوای Get Success",
  description: "تولید خودکار محتوای یوتیوب فارسی برای کانال Get Success",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css"
          rel="stylesheet"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
