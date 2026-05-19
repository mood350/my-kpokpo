import type { Metadata } from "next";
import { Fraunces, DM_Sans } from "next/font/google";
import { ThemeProvider } from "next-themes";
import "./globals.css";

/* ── Fraunces — serif display (titres, valeurs KPI)
   axes: opsz (taille optique), SOFT (arrondi), WONK (asymétrie) */
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
});

/* ── DM Sans — géométrique (corps, UI)
   axes: opsz (taille optique) */
const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  axes: ["opsz"],
});

export const metadata: Metadata = {
  title: {
    default: "MyKpokpo",
    template: "%s — MyKpokpo",
  },
  description:
    "Plateforme de gestion de maintenance automobile pour garages africains",
  robots: { index: false, follow: false },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    /*
     * suppressHydrationWarning est requis :
     * next-themes injecte la classe "dark" sur <html> côté client après le SSR,
     * ce qui provoquerait une erreur d'hydratation sans cet attribut.
     */
    <html
      lang="fr"
      className={`${fraunces.variable} ${dmSans.variable}`}
      suppressHydrationWarning
    >
      <body className="h-full antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem={false}
          disableTransitionOnChange
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
