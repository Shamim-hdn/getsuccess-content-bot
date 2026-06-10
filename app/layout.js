import "./globals.css";

export const metadata = {
  title: "Get Content — استودیوی محتوای هوشمند",
  description: "تولید خودکار محتوای یوتیوب برای هر نیچ، با هوش مصنوعی",
};

export default function RootLayout({ children }) {
  return (
    <html lang="fa" dir="rtl">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link href="https://cdn.jsdelivr.net/gh/rastikerdar/vazirmatn@v33.003/Vazirmatn-font-face.css" rel="stylesheet" />
      </head>
      <body>{children}</body>
    </html>
  );
}
