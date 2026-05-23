import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "REEL ENGINE — Cinematic AI Reel Studio",
  description:
    "Generate cinematic, viral-quality AI reels with premium voices, ambient music, and studio-grade rendering. The future of short-form content creation.",
  keywords: [
    "AI reels",
    "cinematic video",
    "reel generator",
    "short form content",
    "viral reels",
    "AI video",
  ],
  openGraph: {
    title: "REEL ENGINE — Cinematic AI Reel Studio",
    description:
      "Generate cinematic, viral-quality AI reels with premium voices, ambient music, and studio-grade rendering.",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col grain-overlay">
        {children}
      </body>
    </html>
  );
}
