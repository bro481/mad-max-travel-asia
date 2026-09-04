import type { Metadata } from "next";
import { DM_Sans, Cormorant_Garamond } from "next/font/google";
import "./globals.css";
import "./services/managed.css";

export const preferredRegion = "sin1";

const sans = DM_Sans({ variable: "--font-sans", subsets: ["latin"] });
const serif = Cormorant_Garamond({
  variable: "--font-serif",
  subsets: ["latin"],
  weight: ["500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://www.madmaxtravel.asia"),
  title: "MAD MAX | Malaysia Stay",
  description:
    "Comfortable stays and private local travel services in Kuala Lumpur, Kota Kinabalu and Semporna.",
  icons: { icon: "/favicon.svg", shortcut: "/favicon.svg" },
  openGraph: {
    title: "MAD MAX | Malaysia Stay",
    description: "Stay comfortably, travel easily across Malaysia.",
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "MAD MAX | Malaysia Stay",
    description: "Stay comfortably, travel easily across Malaysia.",
    images: ["/og.png"],
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className={`${sans.variable} ${serif.variable}`}>{children}</body>
    </html>
  );
}
