import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import { AppBackground } from "@/components/layout/AppBackground";
import { AppProviders } from "@/components/layout/AppProviders";
import { fetchAuthBootstrap } from "@/features/auth/services/auth-server";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "vietnamese"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-manrope",
  display: "swap"
});

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: "./"
  },
  title: "TOEIC Green | Master TOEIC with Smart Practice",
  description:
    "Luyện thi TOEIC online, ghi chú từ vựng hằng ngày và xem giải thích chi tiết sau mỗi bài test.",
  icons: {
    icon: [
      {
        url: "/images/logo_toeic_green.webp",
        type: "image/webp"
      }
    ],
    shortcut: ["/images/logo_toeic_green.webp"]
  }
};

export default async function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  const mediaOrigin = process.env.NEXT_PUBLIC_MEDIA_ORIGIN;
  const initialAuth = await fetchAuthBootstrap();

  return (
    <html
      lang="vi"
      className="scroll-smooth"
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        {mediaOrigin ? <link rel="preconnect" href={mediaOrigin} /> : null}
      </head>
      <body
        className={`${manrope.variable} bg-background font-sans text-on-surface antialiased`}
        suppressHydrationWarning
      >
        <AppProviders initialAuth={initialAuth}>
          <AppBackground />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
