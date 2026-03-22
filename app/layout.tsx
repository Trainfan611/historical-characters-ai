import type { Metadata, Viewport } from "next";
import "./globals.css";
import { Providers } from "./providers";

const siteUrl = process.env.NEXTAUTH_URL || "https://history-character.up.railway.app";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "Портреты времён — Генерация изображений исторических личностей",
  description: "Создавайте реалистичные изображения исторических личностей с помощью AI",
  keywords: [
    "Портреты времён",
    "исторические личности",
    "генерация изображений",
    "AI портреты",
    "нейросеть",
  ],
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  alternates: {
    canonical: "/",
  },
  openGraph: {
    title: "Портреты времён — Генерация изображений исторических личностей",
    description: "Создавайте реалистичные изображения исторических личностей с помощью AI",
    url: "/",
    siteName: "Портреты времён",
    type: "website",
    locale: "ru_RU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Портреты времён — Генерация изображений исторических личностей",
    description: "Создавайте реалистичные изображения исторических личностей с помощью AI",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
