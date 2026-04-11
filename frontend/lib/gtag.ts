export const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;

export const pageview = (url: string) => {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;

  window.gtag("config", GA_MEASUREMENT_ID, {
    page_path: url,
  });
};

interface GTagEvent {
  action: string;
  category: string;
  label?: string;
  value?: number;
}

export const event = ({
  action,
  category,
  label,
  value,
}: GTagEvent) => {
  if (typeof window === "undefined" || !window.gtag || !GA_MEASUREMENT_ID) return;

  window.gtag("event", action, {
    event_category: category,
    event_label: label,
    value: value,
  });
};

export const trackAlertSubscription = (cityName: string) => {
  event({
    action: "subscribe_alert",
    category: "engagement",
    label: cityName.toLowerCase(),
  });
};

export const trackCheckoutStarted = (plan: "pro" | "premium", amountInr: number) => {
  event({
    action: "begin_checkout",
    category: "conversion",
    label: plan,
    value: amountInr,
  });
};

export const trackPaymentSuccess = (plan: "pro" | "premium", amountInr: number) => {
  event({
    action: "payment_success",
    category: "conversion",
    label: plan,
    value: amountInr,
  });
};

export const trackCityPageView = (citySlug: string) => {
  event({
    action: "city_page_view",
    category: "navigation",
    label: citySlug.toLowerCase(),
  });
};

export const trackChannelSelected = (channel: "email" | "telegram" | "whatsapp") => {
  event({
    action: "channel_selected",
    category: "engagement",
    label: channel,
  });
};

export const trackSchemeView = (schemeName: string, city: string) => {
  event({
    action: "scheme_viewed",
    category: "engagement",
    label: `${city.toLowerCase()}__${schemeName.toLowerCase().replace(/\s+/g, "_")}`,
  });
};

export const trackSignup = (method: "google" | "otp") => {
  event({
    action: "sign_up",
    category: "auth",
    label: method,
  });
};

export const trackLogin = (method: "google" | "otp") => {
  event({
    action: "login",
    category: "auth",
    label: method,
  });
};
