import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { AtmosphericBackground } from "@/components/AtmosphericBackground";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({
  subsets: ["latin", "vietnamese"],
  variable: "--font-jakarta",
  display: "swap"
});

export const metadata: Metadata = {
  title: "TOEIC Green | Master TOEIC with Smart Practice",
  description:
    "Luyện thi TOEIC online, ghi chú từ vựng hằng ngày và xem giải thích chi tiết sau mỗi bài test."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi" className="scroll-smooth">
      <body
        className={`${jakarta.variable} bg-background font-sans text-on-surface antialiased`}
      >
        <AtmosphericBackground />
        {children}
      </body>
    </html>
  );
}
