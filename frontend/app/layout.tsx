import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/QueryProvider";
import { BottomNav } from "../components/layout/BottomNav";
import { SideNav } from "../components/layout/SideNav";
import { AuthGuard } from "../components/auth/AuthGuard";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Gym Track",
  description: "Track your workouts, log sets, and view analytics offline.",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Gym Track",
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-dvh flex flex-col md:flex-row bg-background text-foreground justify-center">
        <QueryProvider>
          <AuthGuard>
            <SideNav />
            <main className="flex-1 flex flex-col pb-20 md:pb-0 w-full border-x border-transparent md:border-border min-h-dvh shadow-sm shadow-border/10">
              {children}
            </main>
            <BottomNav />
          </AuthGuard>
        </QueryProvider>
      </body>
    </html>
  );
}
