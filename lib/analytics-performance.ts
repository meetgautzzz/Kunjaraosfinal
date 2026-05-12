export type WebVitalMetric = {
  name: string;
  value: number;
  rating?: "good" | "needs-improvement" | "poor";
};

export function reportWebVitals(metric: WebVitalMetric) {
  const { name, value } = metric;
  switch (name) {
    case "LCP":
      console.log(`LCP: ${value.toFixed(0)}ms — ${value < 2500 ? "✓ Good" : value < 4000 ? "⚠ Needs improvement" : "✗ Poor"}`);
      break;
    case "CLS":
      console.log(`CLS: ${value.toFixed(3)} — ${value < 0.1 ? "✓ Good" : value < 0.25 ? "⚠ Needs improvement" : "✗ Poor"}`);
      break;
    case "FCP":
      console.log(`FCP: ${value.toFixed(0)}ms — ${value < 1800 ? "✓ Good" : "⚠ Needs improvement"}`);
      break;
    case "TTFB":
      console.log(`TTFB: ${value.toFixed(0)}ms — ${value < 800 ? "✓ Good" : "⚠ Needs improvement"}`);
      break;
    case "INP":
      console.log(`INP: ${value.toFixed(0)}ms — ${value < 200 ? "✓ Good" : "⚠ Needs improvement"}`);
      break;
  }
}
