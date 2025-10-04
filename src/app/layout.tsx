import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SkySnap Weather",
  description: "Quickly check current conditions and forecasts by city.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function () {
                try {
                  const root = document.documentElement;
                  const mode = localStorage.getItem('theme-mode') || 'system';
                  const accentColor = localStorage.getItem('theme-accent') || 'blue';

                  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  const resolvedMode = mode === 'system' ? (prefersDark ? 'dark' : 'light') : mode;

                  root.classList.remove('dark', 'light');
                  root.classList.add(resolvedMode === 'dark' ? 'dark' : 'light');
                  root.style.colorScheme = resolvedMode;

                  root.classList.remove('theme-blue', 'theme-green', 'theme-rose', 'theme-amber', 'theme-violet', 'theme-pink');
                  if (accentColor !== 'blue') {
                    root.classList.add('theme-' + accentColor);
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-slate-100 dark:bg-slate-950`}>
        <ThemeProvider>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
