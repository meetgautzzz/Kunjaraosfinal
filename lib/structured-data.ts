export function generateOrganizationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "Kunjara OS",
    url: "https://kunjaraos.com",
    logo: "https://kunjaraos.com/logo.png",
    description: "AI-powered event proposal generator for India",
    sameAs: [
      "https://twitter.com/kunjaraos",
      "https://linkedin.com/company/kunjaraos",
      "https://instagram.com/kunjaraos",
    ],
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "Customer Service",
      email: "support@kunjaraos.com",
      url: "https://kunjaraos.com/contact",
    },
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      postalCode: "400000",
      addressCountry: "IN",
    },
    areaServed: {
      "@type": "Country",
      name: "India",
    },
    priceRange: "₹0 - ₹10000+/month",
    currenciesAccepted: "INR",
    paymentAccepted: ["Credit Card", "Debit Card", "UPI"],
  };
}

export function generateSoftwareAppSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "Kunjara OS",
    applicationCategory: "BusinessApplication",
    screenshot: "https://kunjaraos.com/screenshot.png",
    description: "AI-powered event proposal generator and management OS for India",
    operatingSystem: "Web",
    offers: [
      {
        "@type": "Offer",
        name: "Free Plan",
        price: "0",
        priceCurrency: "INR",
        url: "https://kunjaraos.com/pricing#free",
      },
      {
        "@type": "Offer",
        name: "Pro Plan",
        price: "3000",
        priceCurrency: "INR",
        url: "https://kunjaraos.com/pricing#pro",
      },
    ],
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      ratingCount: "150",
      bestRating: "5",
      worstRating: "1",
    },
  };
}

export function generateFAQSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "How long does it take to create a proposal?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "With Kunjara OS AI, you can create a professional proposal in 2-5 minutes.",
        },
      },
      {
        "@type": "Question",
        name: "Is Kunjara OS free?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, we offer a free tier with 2 proposals/month. Pro plan is ₹3,000/month.",
        },
      },
      {
        "@type": "Question",
        name: "Can I export proposals as PDF?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, all proposals can be exported as PDF, PPT, or shared as client views.",
        },
      },
      {
        "@type": "Question",
        name: "Does Kunjara OS support Hindi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Yes, full Hindi language support is available in settings.",
        },
      },
    ],
  };
}

export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

export function generateLocalBusinessSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: "Kunjara OS",
    image: "https://kunjaraos.com/logo.png",
    description: "AI event proposal generator serving India",
    url: "https://kunjaraos.com",
    email: "support@kunjaraos.com",
    areaServed: [
      { "@type": "Country", name: "India" },
      { "@type": "City", name: "Mumbai" },
      { "@type": "City", name: "Delhi" },
      { "@type": "City", name: "Bangalore" },
    ],
    address: {
      "@type": "PostalAddress",
      addressLocality: "Mumbai",
      addressRegion: "Maharashtra",
      addressCountry: "IN",
    },
    geo: {
      "@type": "GeoCoordinates",
      latitude: "19.0760",
      longitude: "72.8777",
    },
  };
}
