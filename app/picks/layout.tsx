import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "马来西亚好物｜MAD MAX",
  description: "当地挑选 · 旅行可取 · 也可以寄回家",
  alternates: { canonical: "/picks" },
  openGraph: {
    title: "马来西亚好物｜MAD MAX",
    description: "当地挑选 · 旅行可取 · 也可以寄回家",
    url: "/picks",
    images: [{ url: "/malaysia-picks-hero-lifestyle-v2.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: "马来西亚好物｜MAD MAX",
    description: "当地挑选 · 旅行可取 · 也可以寄回家",
    images: ["/malaysia-picks-hero-lifestyle-v2.png"],
  },
};

export default function PicksLayout({ children }: { children: React.ReactNode }) {
  return children;
}
