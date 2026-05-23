import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Studio — REEL ENGINE",
  description: "Create cinematic AI reels with the REEL ENGINE studio dashboard.",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
