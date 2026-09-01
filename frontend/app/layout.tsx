import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "../providers/QueryProvider";
import { ThemeProvider } from "../providers/ThemeProvider";
import { BottomNav } from "../components/layout/BottomNav";
import { SideNav } from "../components/layout/SideNav";
import { AuthGuard } from "../components/auth/AuthGuard";
import { SyncStatusBadge } from "../components/ui/SyncStatusBadge";
import { InstallPwaBanner } from "../components/ui/InstallPwaBanner";
import { InstallInstructionsModal } from "../components/ui/InstallInstructionsModal";
import { RestTimer } from "../components/workout/RestTimer";
import { ServiceWorkerRegister } from "../components/providers/ServiceWorkerRegister";

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
  manifest: "/manifest.webmanifest",
  icons: {
    icon: "/icon-192x192.png",
    apple: "/apple-touch-icon.png",
  },
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
      suppressHydrationWarning
    >
      <body className="min-h-dvh flex flex-col md:flex-row bg-background text-foreground">
        <QueryProvider>
          <ThemeProvider>
            <ServiceWorkerRegister />
            <AuthGuard>
              <SyncStatusBadge />
              <InstallPwaBanner />
              <InstallInstructionsModal />
              <SideNav />
              <main className="flex-1 flex flex-col pb-20 md:pb-0 w-full min-w-0 min-h-dvh">
                {children}
              </main>
              <RestTimer />
              <BottomNav />
            </AuthGuard>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
