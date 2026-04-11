declare global {
  interface Window {
    gtag?: (
      command: "config" | "event" | "js" | "set",
      targetId: string | Date,
      config?: {
        page_path?: string;
        event_category?: string;
        event_label?: string;
        value?: number;
        send_to?: string;
        [key: string]: unknown;
      }
    ) => void;
    dataLayer?: unknown[];
  }
}

export {};
