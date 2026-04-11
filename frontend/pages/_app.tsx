import type { AppProps } from "next/app";
import { useEffect } from "react";
import Router from "next/router";
import Script from "next/script";
import { Analytics } from "@vercel/analytics/react";
import "../styles/globals.css";
import { AuthProvider } from "../lib/AuthContext";
import * as gtag from "../lib/gtag";

export default function App({ Component, pageProps }: AppProps) {
  const adsenseClient = process.env.NEXT_PUBLIC_ADSENSE_CLIENT;
  const gaMeasurementId = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

  useEffect(() => {
    if (!gaMeasurementId) return;

    const handleRouteChange = (url: string) => {
      gtag.pageview(url);
    };

    Router.events.on("routeChangeComplete", handleRouteChange);
    return () => {
      Router.events.off("routeChangeComplete", handleRouteChange);
    };
  }, [gaMeasurementId]);

  return (
    <AuthProvider>
      {gaMeasurementId && (
        <>
          <Script
            strategy="afterInteractive"
            src={`https://www.googletagmanager.com/gtag/js?id=${gaMeasurementId}`}
          />
          <Script
            id="google-analytics"
            strategy="afterInteractive"
            dangerouslySetInnerHTML={{
              __html: `
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${gaMeasurementId}', {
                  page_path: window.location.pathname,
                });
              `,
            }}
          />
        </>
      )}
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
