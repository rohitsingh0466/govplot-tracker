import type { GetServerSideProps } from "next";

type Scheme = {
  scheme_id: string;
};

export default function SitemapXml() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://govplottracker.com";
  const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

  const staticUrls = [
    "",
    "/about",
    "/cities",
    "/privacy",
    "/terms",
    "/contact",
  ];

  let schemes: Scheme[] = [];
  try {
    const response = await fetch(`${apiBase}/api/v1/schemes/?limit=200`);
    if (response.ok) {
      schemes = await response.json();
    }
  } catch {
    schemes = [];
  }

  const urls = [
    ...staticUrls.map((path) => `${siteUrl}${path}`),
    ...schemes.map((scheme) => `${siteUrl}/schemes/${scheme.scheme_id}`),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (url) => `  <url>
    <loc>${url}</loc>
  </url>`
  )
  .join("\n")}
</urlset>`;

  res.setHeader("Content-Type", "application/xml");
  res.write(xml);
  res.end();

  return { props: {} };
};
