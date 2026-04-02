import Head from "next/head";
import Link from "next/link";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

const SECTIONS = [
  {
    title: "Information We Collect",
    content: "We collect your name, email address, phone number (optional), Telegram username (if linked), subscription status, city alert preferences, and basic usage analytics. We collect only what's needed to operate the service.",
  },
  {
    title: "How We Use Your Information",
    content: "Your information is used to authenticate your account, send scheme status alerts via your chosen channel (email, Telegram, or WhatsApp), process Pro/Premium subscriptions through Razorpay, and improve the product. We do not sell your personal data.",
  },
  {
    title: "Advertising & Cookies",
    content: "GovPlot Tracker uses cookies, Google Analytics, and may display Google AdSense advertisements on scheme pages. These providers may use cookies to personalise and measure ads according to their own privacy policies. You can control cookie preferences via your browser settings.",
  },
  {
    title: "Third-Party Services",
    content: "We use Railway (backend hosting), Vercel (frontend hosting), Supabase (PostgreSQL database), Razorpay (payment processing), Telegram Bot API (alerts), and SendGrid (email delivery). Data shared with each provider is limited to what is strictly required to deliver that service.",
  },
  {
    title: "Data Retention",
    content: "Account data is retained while your account is active. If you request deletion, we remove your personal data within 30 days, subject to legal or billing obligations. Alert subscription records are anonymised after 90 days of inactivity.",
  },
  {
    title: "Your Rights",
    content: "You can unsubscribe from alerts, disconnect Telegram, or update your account details at any time from your dashboard. To request full account deletion or a data export, email support@govplottracker.com.",
  },
  {
    title: "Security",
    content: "Passwords are hashed using bcrypt and never stored in plain text. All data is transmitted over HTTPS. JWTs used for authentication expire after 7 days. We conduct periodic security reviews of our infrastructure.",
  },
];

export default function PrivacyPage() {
  return (
    <>
      <Head>
        <title>Privacy Policy — GovPlot Tracker</title>
        <meta name="description" content="GovPlot Tracker Privacy Policy — how we collect, use, and protect your data." />
        <link rel="canonical" href="https://govplottracker.com/privacy" />
      </Head>
      <Navbar />

      <div className="page-container page-top-offset pb-20">
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="bg-gradient-to-br from-[--ink-900] to-[--teal-900] rounded-3xl p-8 sm:p-10 text-white mb-10">
            <span className="text-[11px] font-bold uppercase tracking-widest text-[--teal-400]">Legal</span>
            <h1 className="text-[32px] font-[Outfit] font-900 mt-2 mb-3">Privacy Policy</h1>
            <p className="text-[13.5px] text-[--teal-300]/90 leading-relaxed">
              GovPlot Tracker collects only the information needed to provide scheme tracking, alerts, subscriptions, and notifications. We don't sell your data.
            </p>
            <p className="text-[12px] text-[--teal-400]/70 mt-4">Last updated: March 2026</p>
          </div>

          {/* Sections */}
          <div className="space-y-4">
            {SECTIONS.map(({ title, content }) => (
              <section key={title} className="card p-6">
                <h2 className="text-[16px] font-[Outfit] font-700 text-[--ink-900] mb-3">{title}</h2>
                <p className="text-[13.5px] text-[--ink-700] leading-relaxed">{content}</p>
              </section>
            ))}
          </div>

          {/* Contact */}
          <div className="card p-6 mt-6 bg-[--teal-100]/30 border-[--teal-200]/60 text-center">
            <p className="text-[13.5px] text-[--ink-700]">
              Questions about this policy?{" "}
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
