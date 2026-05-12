"use client";

import { useEffect } from "react";
import { reportWebVitals } from "@/lib/analytics-performance";

export default function WebVitalsReporter() {
  useEffect(() => {
    import("web-vitals").then(({ onCLS, onFCP, onLCP, onTTFB, onINP }) => {
      onCLS(reportWebVitals);
      onFCP(reportWebVitals);
      onLCP(reportWebVitals);
      onTTFB(reportWebVitals);
      onINP(reportWebVitals);
    }).catch(() => {});
  }, []);

  return null;
}
