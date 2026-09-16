/**
 * Curated links to real, well-established organizations that can help a business
 * close a specific gap. Deliberately hand-maintained rather than AI-generated:
 * an AI could hallucinate a company name or URL that doesn't exist, so these are
 * attached to the roadmap in code, after the roadmap text itself is generated,
 * regardless of whether that text came from Claude or the local fallback.
 *
 * These are widely-used, stable platforms - not an endorsement of any one being
 * "best." Businesses should compare pricing and features themselves before signing up.
 */

const CATEGORY_RESOURCES = {
  'Online Presence': [
    { name: 'Wix', url: 'https://www.wix.com' },
    { name: 'Squarespace', url: 'https://www.squarespace.com' },
    { name: 'WordPress.com', url: 'https://wordpress.com' },
    { name: 'Google Business Profile', url: 'https://www.google.com/business/' },
  ],
  'Digital Payments': [
    { name: 'Stripe', url: 'https://stripe.com' },
    { name: 'PayPal', url: 'https://www.paypal.com' },
    { name: 'Square', url: 'https://squareup.com' },
  ],
  Marketing: [
    { name: 'Mailchimp', url: 'https://mailchimp.com' },
    { name: 'Meta Ads Manager', url: 'https://www.facebook.com/business/tools/ads-manager' },
    { name: 'Google Ads', url: 'https://ads.google.com' },
  ],
  Operations: [
    { name: 'Google Workspace', url: 'https://workspace.google.com' },
    { name: 'Trello', url: 'https://trello.com' },
    { name: 'Calendly', url: 'https://calendly.com' },
  ],
  'Data Use': [
    { name: 'Google Sheets', url: 'https://www.google.com/sheets/about/' },
    { name: 'HubSpot CRM (free tier)', url: 'https://www.hubspot.com/products/crm' },
    { name: 'Google Analytics', url: 'https://analytics.google.com' },
  ],
};

/**
 * Attaches a `resources` array to each roadmap action, based on its category.
 * Safe to call on both AI-generated and local-fallback roadmaps.
 */
function attachResources(roadmap) {
  if (!roadmap || !Array.isArray(roadmap.actions)) return roadmap;

  return {
    ...roadmap,
    actions: roadmap.actions.map((action) => ({
      ...action,
      resources: CATEGORY_RESOURCES[action.category] || [],
    })),
  };
}

module.exports = { CATEGORY_RESOURCES, attachResources };
