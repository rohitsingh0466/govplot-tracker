import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    title: "Informational Service Only",
    content: "GovPlot Tracker aggregates public scheme data from official government sources and presents it in a more usable format. We do not guarantee that any authority will keep its public portal unchanged, available, or free of delays. Always verify details on the official government website before applying.",
  },
  {
    title: "No Government Affiliation",
    content: "GovPlot Tracker is an independent product and is not affiliated with, endorsed by, or operated by any housing authority, state government body, or central government department. All trademarks and authority names belong to their respective organisations.",
  },
  {
    title: "User Accounts",
    content: "You are responsible for maintaining the confidentiality of your account credentials. You must not share your account with others or use another person's account. We reserve the right to suspend accounts that violate these terms.",
  },
  {
    title: "Subscriptions & Billing",
    content: "Paid plans (Pro and Premium) are billed monthly or annually through Razorpay. Pricing, plan benefits, and billing intervals may change with 30 days' notice. Premium access is tied to the account used during purchase. No refunds are issued for partial billing periods, except where required by law.",
  },
  {
    title: "Alerts & Delivery",
    content: "We aim to deliver scheme alerts promptly, but message delivery depends on third-party providers (Telegram, email services, WhatsApp Business API) and may be delayed or temporarily unavailable. GovPlot Tracker is not liable for missed applications due to notification delays.",
  },
  {
    title: "Use Restrictions",
    content: "You may not misuse the service, scrape or auto-harvest data, submit abusive traffic, attempt unauthorised access to any part of the platform, or interfere with its scrapers or notification systems. Violation may result in immediate account termination.",
  },
  {
    title: "Limitation of Liability",
    content: "GovPlot Tracker is provided 'as is'. We are not liable for any financial loss, missed opportunity, or consequential damage arising from use of the service, reliance on scheme data, or missed alerts. Our maximum liability is limited to the subscription fee paid in the last 30 days.",
  },
];

export default function TermsPage() {
  return (
    <>
      <Head>
        <title>Terms of Use — GovPlot Tracker</title>
        <meta name="description" content="Terms of Use for GovPlot Tracker — informational use, subscriptions, alerts, and use restrictions." />
        <link rel="canonical" href="https://govplottracker.com/terms" />
      </Head>
      <Navbar />

      <div className="page-container page-top-offset pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-[--saffron-500] to-[--saffron-600] rounded-3xl p-8 sm:p-10 text-white mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-white/70">Legal</span>
            <h1 className="text-[32px] font-[Outfit] font-900 mt-2 mb-3">Terms of Use</h1>
            <p className="text-[13.5px] text-white/85 leading-relaxed">
              By using GovPlot Tracker, you agree to these terms. Official scheme terms, eligibility, and application decisions always come from the relevant government authority.
            </p>
            <p className="text-[12px] text-white/60 mt-4">Last updated: March 2026</p>
          </div>

          <div className="space-y-4">
            {SECTIONS.map(({ title, content }) => (
              <section key={title} className="card p-6">
                <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900] mb-3">{title}</h2>
                <p className="text-[13.5px] text-[--ink-700] leading-relaxed">{content}</p>
              </section>
            ))}
          </div>

          <div className="card p-6 mt-6 bg-[--saffron-100]/40 border-[--saffron-200]/50 text-center">
            <p className="text-[13.5px] text-[--ink-700]">
              Questions about these terms?{" "}
              <Link href="/contact" className="text-[--teal-600] font-semibold underline">Contact us</Link>
              {" "}or email{" "}
              <a href="mailto:support@govplottracker.com" className="text-[--teal-600] font-semibold underline">support@govplottracker.com</a>
            </p>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
