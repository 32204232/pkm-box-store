import type { Metadata } from "next";
import { Header } from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "PKM Box Store",
  description: "한국어판 포켓몬 카드 박스 커머스"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <body>
        <div className="shell">
          <Header />
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
