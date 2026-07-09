import type { Metadata } from "next";
import { Noto_Serif, Ma_Shan_Zheng, Inter } from "next/font/google";
import "./globals.css";
import Providers from "./providers";
import BackgroundMusic from "@/components/BackgroundMusic";

const display = Noto_Serif({
  subsets: ["latin"],
  weight: ["600", "700", "900"],
  variable: "--font-display",
});

const brush = Ma_Shan_Zheng({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-brush",
});

const body = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

export const metadata: Metadata = {
  title: "Mahjong Coin",
  description: "Tarikan mahjong, koin virtual, meriah ala meja judi Tiongkok kuno.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id">
      <body className={`${display.variable} ${brush.variable} ${body.variable} font-body bg-lacquer text-ivory`}>
        <Providers>
  <BackgroundMusic />
  {children}
</Providers>
      </body>
    </html>
  );
}
