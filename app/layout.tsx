import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "PhysioTrack — Visit Scheduler",
  description:
    "Manage your daily physiotherapy home visits, track travel time, and calculate earnings — all in one place.",
  keywords: ["physiotherapy", "visit scheduler", "home visits", "appointment tracking"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
