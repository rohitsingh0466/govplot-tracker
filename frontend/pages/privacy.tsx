import Head from "next/head";
import { useState } from "react";
import AlertModal from "../components/AlertModal";
import Navbar from "../components/Navbar";

export default function PrivacyPage() {
  const [alertOpen, setAlertOpen] = useState(false);

  return (
    <>
      <Head>
        <title>Privacy Policy — GovPlot Tracker</title>
        <meta name="description" content="Privacy Policy for GovPlot Tracker, including data collection, alert preferences, cookies, analytics, and advertising disclosures." />
      </Head>
      <Navbar onAlertClick={() => setAlertOpen(true)} />

      <main className="mx-auto max-w-4xl px-4 py-12">
        <div className="mb-10 rounded-[2rem] bg-gradient-to-br from-slate-950 via-blue-950 to-blue-700 p-8 text-white shadow-2xl">
          <p className="mb-3 text-sm font-semibold uppercase tracking-[0.24em] text-blue-100">Legal</p>
          <h1 className="text-4xl font-black">Privacy Policy</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-blue-100">
            GovPlot Tracker collects only the information needed to provide scheme tracking, account access, subscriptions, and notifications.
          </p>
        </div>

        <div className="space-y-6 text-sm leading-7 text-slate-700">
          <PolicyCard title="Information We Collect" body="We may collect your name, email address, phone number, Telegram username, subscription status, alert preferences, and basic usage data needed to operate the service." />
          <PolicyCard title="How We Use Information" body="We use your information to authenticate your account, deliver email and Telegram alerts, process Pro subscriptions through Razorpay, improve the product, and support customer requests." />
          <PolicyCard title="Advertising and Cookies" body="GovPlot Tracker may use cookies, analytics, and Google AdSense or similar advertising tools. These providers may use cookies to personalize and measure ads according to their own policies." />
          <PolicyCard title="Third-Party Services" body="We use third-party providers such as Railway, Vercel, Supabase, Razorpay, Telegram, and SendGrid to operate the platform. Data shared with them is limited to what is required to deliver each service." />
          <PolicyCard title="Your Choices" body="You can unsubscribe from alerts, disconnect Telegram, or request account support through the contact page. If you no longer want to use the service, you can stop using the platform at any time." />
        </div>
      </main>

      <AlertModal open={alertOpen} onClose={() => setAlertOpen(false)} />
    </>
  );
}

function PolicyCard({ title, body }: { title: string; body: string }) {
  return (
    <section className="rounded-[1.75rem] border border-slate-200 bg-white p-6 shadow-sm">
      <h2 className="mb-3 text-xl font-bold text-slate-950">{title}</h2>
      <p>{body}</p>
    </section>
  );
}
