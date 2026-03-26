import type { GetServerSideProps } from "next";

export default function RobotsTxt() {
  return null;
}

export const getServerSideProps: GetServerSideProps = async ({ res }) => {
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://govplot-tracker.vercel.app";

  res.setHeader("Content-Type", "text/plain");
  res.write(`User-agent: *\nAllow: /\n\nSitemap: ${siteUrl}/sitemap.xml\n`);
  res.end();

  return { props: {} };
};
