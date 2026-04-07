import type { AppProps } from "next/app";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "../styles/globals.css";
import { AuthProvider } from "../lib/AuthContext";

export default function App({ Component, pageProps }: AppProps) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;

  return (
    <AuthProvider>
      {adsenseClient && (
        <Script
          id="adsense-script"
          async
          strategy="afterInteractive"
          crossOrigin="anonymous"
          src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adsenseClient}`}
        />
      )}
      <Component {...pageProps} />
      <Analytics />
    </AuthProvider>
  );
}
