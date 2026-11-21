import type { Metadata, Viewport } from "next";
import { Cormorant_Garamond, Jost } from "next/font/google";
import "./globals.css";

const jost = Jost({ variable: "--font-jost", subsets: ["latin"], weight: ["300", "400", "500", "600"] });
const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
});

const title = "ESSENCE NYE 2026/27 · Pré-reserva de pulseiras";

export const metadata: Metadata = {
  title: "Pateira Essence",
  description: "Faz a tua pré-reserva de pulseiras para a ESSENCE NYE 2026/27, 31 de dezembro na Pateira de Fermentelos.",
  openGraph: {
    title,
    description: "31 de dezembro · Pateira de Fermentelos. Pré-reserva aberta — sujeita a confirmação.",
    type: "website",
  },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = { themeColor: "#140f0d" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-PT" data-scroll-behavior="smooth"className={`${jost.variable} ${cormorant.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
