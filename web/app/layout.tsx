import { Suspense } from "react";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Sidebar } from "@/components/sidebar/Sidebar";
import { ToastProvider } from "@/components/ui/Toast";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

export const metadata: Metadata = {
  title: "DefoLoop",
  description: "Human-in-the-loop visual quality inspection",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body className="flex h-full overflow-hidden">
        <ToastProvider>
          {/* Everything here is client-rendered from browser or API data. */}
          <Suspense fallback={<aside className="w-56 shrink-0 border-r border-border-strong bg-sidebar" />}>
            <Sidebar />
          </Suspense>
          <main className="flex min-w-0 flex-1 flex-col overflow-y-auto">
            <Suspense>{children}</Suspense>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
