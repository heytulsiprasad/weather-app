import type { Metadata } from "next";
import { Sora, Manrope, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/contexts/theme-context";
import { AuthProvider } from "@/contexts/auth-context";

const sora = Sora({
  variable: "--font-display",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
});

const manrope = Manrope({
  variable: "--font-body",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const geistMono = Geist_Mono({
  variable: "--font-mono",
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
      <body className={`${sora.variable} ${manrope.variable} ${geistMono.variable} antialiased`}>
        <AuthProvider>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}