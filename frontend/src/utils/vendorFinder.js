// Maps each BizTransform assessment category to a starter search phrase and a
// short buying-guide tip. Deliberately does NOT list specific vendors or prices -
// those go stale and would be fabricated. Instead this builds a link to real,
// live search results.

export const VENDOR_CATEGORIES = [
  {
    label: 'Online Presence',
    query: 'website builder and Google Business Profile setup for small business',
    tip: 'Look for a builder with built-in SEO basics, and make sure your Google Business Profile listing is claimed and verified.',
  },
  {
    label: 'Digital Payments',
    query: 'digital payment processing and invoicing software for small business',
    tip: 'Compare per-transaction fees against monthly plans, and confirm payouts land on a schedule that works for your cash flow.',
  },
  {
    label: 'Marketing',
    query: 'email marketing and review management tools for small business',
    tip: 'A lightweight email tool with a free tier beats a complex one if nobody has time to maintain it.',
  },
  {
    label: 'Operations',
    query: 'shared scheduling, booking, and cloud file tools for small business',
    tip: 'Pick one shared tool your whole team can access from both phone and laptop, rather than several overlapping ones.',
  },
  {
    label: 'Data Use',
    query: 'simple business dashboard and CRM software for small business',
    tip: 'Check whether it connects directly to your existing spreadsheet or accounting data before switching tools entirely.',
  },
];

/** Builds a live Google search URL - never fabricated vendor data. */
export function buildVendorSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query)}`;
}

/** Given a roadmap action's category label, find a sensible starter query. */
export function queryForVendorCategory(categoryLabel) {
  const match = VENDOR_CATEGORIES.find((c) => c.label === categoryLabel);
  return match ? match.query : `${categoryLabel} tools for small business`;
}
