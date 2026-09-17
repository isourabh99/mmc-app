import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import LocationPermission from "@/components/LocationPermission";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const metadata: Metadata = {
  title: "MMC — Motor Market Connect Club | Premium Automotive Marketplace",
  description:
    "Connect with certified automotive service providers across Smart Repair, Denting & Painting, Modifications, Tyres, Car Wash, Chauffeur, and Car Rental. Get instant quotes from trusted professionals.",
  keywords:
    "automotive services, car repair, smart repair, denting painting, tyres, car wash, chauffeur, car rental, vehicle modifications",
  openGraph: {
    title: "MMC — Motor Market Connect Club",
    description:
      "Premium automotive marketplace connecting you with certified service providers.",
    type: "website",
  },
};

import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { ToastProvider } from "@/components/ToastProvider";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${outfit.variable}`}>
      <body
        className="bg-black text-white flex flex-col min-h-screen"
        suppressHydrationWarning
      >

         <LocationPermission />
        <ToastProvider>
          <Navbar />
          <main className="flex-grow pt-20">{children}</main>
          <Footer />
        </ToastProvider>
      </body>
    </html>
  );
}
