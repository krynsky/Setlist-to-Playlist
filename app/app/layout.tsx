import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const goatCounterUrl = process.env.DEMO_GOATCOUNTER_URL;
const siteUrl = "https://setlist-to-playlist.krynsky.com";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Setlist to Playlist | Turn Concert Setlists into Spotify Playlists",
    template: "%s | Setlist to Playlist",
  },
  description:
    "Search Setlist.fm by artist, city, and year, then turn any concert setlist into a Spotify playlist in the order the songs were played.",
  applicationName: "Setlist to Playlist",
  authors: [{ name: "Mark Krynsky", url: "https://krynsky.com/" }],
  creator: "Mark Krynsky",
  publisher: "Mark Krynsky",
  category: "Music",
  keywords: [
    "setlist to playlist",
    "Setlist.fm",
    "Spotify playlist",
    "concert setlist",
    "live music",
  ],
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "Setlist to Playlist",
    title: "Setlist to Playlist | Turn Concert Setlists into Spotify Playlists",
    description:
      "Search a show on Setlist.fm and create a Spotify playlist in the order it was played.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Setlist to Playlist concert setlist and Spotify playlist builder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Setlist to Playlist",
    description:
      "Turn a concert setlist into a Spotify playlist, in the order the songs were played.",
    images: ["/opengraph-image"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#111a3a",
  colorScheme: "dark",
};

const structuredData = {
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name: "Setlist to Playlist",
  url: siteUrl,
  description:
    "Search Setlist.fm by artist, city, and year, then turn any concert setlist into a Spotify playlist in the order the songs were played.",
  applicationCategory: "MusicApplication",
  operatingSystem: "Web",
  author: {
    "@type": "Person",
    name: "Mark Krynsky",
    url: "https://krynsky.com/",
  },
  sameAs: ["https://github.com/krynsky/Setlist-to-Playlist"],
  isAccessibleForFree: true,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        {children}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
        />
        {goatCounterUrl && (
          <Script
            data-goatcounter={goatCounterUrl}
            async
            src="//gc.zgo.at/count.js"
            strategy="afterInteractive"
          />
        )}
      </body>
    </html>
  );
}
