import Head from "next/head";
import Link from "next/link";

export default function BlogSlugPlaceholder() {
  return (
    <>
      <Head>
        <title>Blog Post — GovPlot Tracker</title>
        <meta
          name="description"
          content="Placeholder blog detail page. This file is ready for manual blog route implementation."
        />
      </Head>

      <main className="min-h-screen bg-[--bg-page] px-4 py-12">
        <div className="max-w-3xl mx-auto card p-8">
          <Link
            href="/blog"
            className="inline-flex text-[13px] font-semibold text-[--teal-600] hover:text-[--teal-800] mb-6"
          >
            Back to blog
          </Link>

          <h1 className="text-[32px] font-[Outfit] font-900 text-[--ink-900] mb-4">
            Blog detail placeholder
          </h1>
          <p className="text-[15px] leading-relaxed text-[--ink-600]">
            Dummy content for the dynamic blog slug page. Replace this file with the final manual implementation.
          </p>
        </div>
      </main>
    </>
  );
}
