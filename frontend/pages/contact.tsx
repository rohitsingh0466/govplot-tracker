import Head from "next/head";
import Link from "next/link";
import { useState } from "react";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";

export default function ContactPage() {
  const [sent, setSent]       = useState(false);
  const [name, setName]       = useState("");
  const [email, setEmail]     = useState("");
  const [subject, setSubject] = useState("General Support");
  const [message, setMessage] = useState("");

  function handleSubmit() {
    if (!name || !email || !message) return;
    // In production, POST to /api/v1/contact
    setSent(true);
  }

  return (
    <>
      <Head>
        <title>Contact — GovPlot Tracker</title>
        <meta name="description" content="Contact GovPlot Tracker for support, subscription help, partnerships, or data corrections." />
        <link rel="canonical" href="https://govplottracker.com/contact" />
      </Head>
      <Navbar />

      <div className="page-container pt-12 pb-20">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-10">
            <span className="section-label">Get in Touch</span>
            <h1 className="text-[36px] font-[Outfit] font-900 text-[--ink-900] mt-1 mb-3">Contact Us</h1>
            <p className="text-[15px] text-[--ink-600] max-w-xl">
              Questions about your subscription, scheme data accuracy, partnership opportunities, or just want to say hi — we're here.
            </p>
          </div>

          <div className="grid lg:grid-cols-[1fr_380px] gap-8">
            {/* Form */}
            <div className="card p-7">
              {sent ? (
                <div className="text-center py-12">
                  <div className="text-5xl mb-4">✅</div>
                  <h3 className="text-[22px] font-[Outfit] font-800 text-[--ink-900] mb-2">Message sent!</h3>
                  <p className="text-[14px] text-[--ink-600] mb-6">We typically respond within 24 hours on business days.</p>
                  <button onClick={() => setSent(false)} className="btn-secondary text-[13px]">Send another</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <h2 className="text-[18px] font-[Outfit] font-700 text-[--ink-900] mb-5">Send us a message</h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Your Name *</label>
                      <input className="input-field" placeholder="Rahul Sharma" value={name} onChange={e => setName(e.target.value)} />
                    </div>
                    <div>
                      <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Email *</label>
                      <input type="email" className="input-field" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Subject</label>
                    <select className="input-field" value={subject} onChange={e => setSubject(e.target.value)}>
                      <option>General Support</option>
                      <option>Subscription / Billing</option>
                      <option>Wrong Scheme Data</option>
                      <option>Partnership / B2B</option>
                      <option>Telegram / Alert Issue</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[11.5px] font-bold text-[--ink-600] mb-1.5 uppercase tracking-wider">Message *</label>
                    <textarea
                      className="input-field"
                      rows={5}
                      placeholder="Describe your question or issue…"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      style={{ resize: "vertical" }}
                    />
                  </div>
                  <button onClick={handleSubmit} disabled={!name || !email || !message} className="btn-primary w-full justify-center text-[14px] py-3" style={{ fontFamily: "var(--font-display)" }}>
                    Send Message →
                  </button>
                </div>
              )}
            </div>

            {/* Sidebar */}
            <div className="flex flex-col gap-4">
              {[
                { icon: "📧", title: "General Support",    email: "support@govplottracker.com",  desc: "Account, alerts, billing, data corrections" },
                { icon: "🤝", title: "Partnerships & B2B", email: "partners@govplottracker.com", desc: "API access, affiliates, advertising" },
              ].map(({ icon, title, email: e, desc }) => (
                <div key={title} className="card p-5">
                  <div className="flex items-center gap-3 mb-2">
                    <span className="text-xl">{icon}</span>
                    <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900]">{title}</h3>
                  </div>
                  <a href={`mailto:${e}`} className="text-[13px] font-semibold text-[--teal-600] hover:underline block mb-1">{e}</a>
                  <p className="text-[12px] text-[--ink-500]">{desc}</p>
                </div>
              ))}

              <div className="card p-5 bg-[--teal-100]/40 border-[--teal-200]/60">
                <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-2">⚡ Response time</h3>
                <p className="text-[13px] text-[--ink-600] leading-relaxed">
                  We respond within <strong>24 hours</strong> on weekdays. For urgent billing issues, mention "URGENT" in your subject line.
                </p>
              </div>

              <div className="card p-5">
                <h3 className="text-[14px] font-[Outfit] font-700 text-[--ink-900] mb-3">Telegram Community</h3>
                <p className="text-[12.5px] text-[--ink-600] mb-3">Join our Telegram channel for real-time scheme alerts and updates.</p>
                <a
                  href="https://t.me/govplottracker"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-secondary w-full justify-center text-[13px] py-2"
                >
                  ✈️ Join Telegram →
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </>
  );
}
