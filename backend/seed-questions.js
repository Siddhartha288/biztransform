/**
 * Seeds the `questions` table with a tailored 15-question set (5 categories x 3
 * questions) per business sector. Run after schema.sql has created the tables
 * and seeded `categories` / `sectors`.
 *
 * Usage (from backend folder): node seed-questions.js
 */
const { pool, query } = require('./db');

const CATEGORY_KEYS = ['online_presence', 'digital_payments', 'marketing', 'operations', 'data_use'];

// Each sector has exactly one question per category slot (3 slots), matching
// CATEGORY_KEYS order within each category group below.
const SECTORS = {
  retail: {
    online_presence: [
      ['Do you have an online store or product catalog customers can browse (own site or a marketplace like Shopify/Etsy)?', 'Set up a free storefront on Shopify, Etsy, or Facebook Shop and list your 5 best-selling products this week.'],
      ['Can customers see accurate stock and availability for your products online?', "Turn on inventory tracking in your store platform so out-of-stock items don't show as available."],
      ['Do you update your online store or social channels with new products or promotions at least monthly?', 'Set a recurring monthly reminder to add one new product photo or promotion to your store or social page.'],
    ],
    digital_payments: [
      ['Can customers pay online by card or digital wallet at checkout?', "Enable card and digital wallet payments in your store platform's checkout settings - most support this natively."],
      ['Do you use a point-of-sale system that accepts tap or contactless payment in-store?', 'Switch to a POS device (Square, Zettle, or similar) that accepts tap and mobile wallet payments.'],
      ['Do you track sales and refunds digitally instead of on paper receipts?', 'Turn on the sales and refund reporting built into your POS or payment platform instead of a paper log.'],
    ],
    marketing: [
      ['Do you promote products via email, SMS, or social media at least monthly?', 'Send one product highlight or promo email/SMS to your customer list this month.'],
      ['Do you run paid social or search ads to drive traffic to your store?', 'Start a small $5-10/day ad test on Instagram or Google Shopping targeting local shoppers.'],
      ['Do you collect and showcase customer reviews for your products?', 'Add a review request link to your receipt or follow-up email, and feature your best reviews on your store page.'],
    ],
    operations: [
      ['Do you track stock levels digitally instead of by manual count?', 'Use your POS or a simple spreadsheet to log stock counts weekly instead of manual recounts.'],
      ['Do you use a digital tool for ordering or restocking from suppliers?', 'Ask your main supplier if they offer online ordering, and move your next restock order online.'],
      ['Do you use barcode or SKU scanning to speed up checkout and stocktake?', 'Add barcode labels to your top sellers and use a phone barcode scanner app for faster checkout.'],
    ],
    data_use: [
      ['Do you track which products sell best using sales data or reports?', 'Pull a best-sellers report from your POS or store platform monthly and reorder based on it.'],
      ['Do you know your repeat customer rate or track returning customers?', "Turn on customer accounts or loyalty tracking in your POS so you can see who's a repeat buyer."],
      ['Do you store customer contact info securely for marketing or order updates?', 'Collect emails at checkout (with consent) into one secure list instead of scattered notes.'],
    ],
  },
  hospitality: {
    online_presence: [
      ['Do you have a website or listing showing your menu, hours, and location?', 'Create a free Google Business Profile and a simple one-page site with your menu, hours, and address.'],
      ['Can customers find and order from you via Google Maps, Google Search, or a delivery app?', 'Claim your listing on Google Maps and at least one delivery platform so you show up in local search.'],
      ['Do you keep your menu and hours updated online when they change?', 'Set a reminder to update your online menu and hours within 24 hours of any change.'],
    ],
    digital_payments: [
      ['Can customers pay by card or tap at the table or counter?', "Get a tap-to-pay terminal (Square, Zettle) if you don't already have contactless payment."],
      ['Can customers order and pay online for pickup or delivery?', 'Set up online ordering through your website or a delivery app so customers can pay ahead.'],
      ['Do you split and track tips or service charges digitally?', "Use your POS's built-in tip tracking instead of a manual tip jar count."],
    ],
    marketing: [
      ['Do you post updates, specials, or events on social media regularly?', 'Post one photo of a dish or special to Instagram/Facebook each week.'],
      ['Do you run any promotions or loyalty offers to bring customers back?', 'Start a simple stamp-card or digital loyalty offer (buy 9 get 1 free) to encourage repeat visits.'],
      ['Do you respond to online reviews on Google, Yelp, or TripAdvisor?', 'Reply to your last 5 reviews, good or bad, this week - it boosts trust with future customers.'],
    ],
    operations: [
      ['Do you take reservations or table bookings digitally?', 'Set up a free booking tool instead of phone-only bookings.'],
      ['Do you manage staff schedules using a digital tool instead of paper rosters?', 'Move your roster into a free scheduling app so staff can check shifts online.'],
      ['Do you track inventory or ingredient stock digitally to reduce waste?', 'Log key ingredient stock weekly in a spreadsheet to catch shortages and reduce over-ordering.'],
    ],
    data_use: [
      ['Do you track which menu items sell best?', 'Check your POS sales report monthly to see your top 5 items and consider dropping slow sellers.'],
      ['Do you track daily or weekly revenue trends to plan staffing or stock?', 'Log daily takings in a spreadsheet or your POS dashboard to spot your busiest days.'],
      ['Do you collect customer contact details for offers or feedback, with permission?', 'Add a simple sign-up sheet or QR code at the counter to collect emails for a monthly offer.'],
    ],
  },
  trades: {
    online_presence: [
      ['Do you have a website or profile listing your services and service area?', 'Create a simple one-page site or a free profile (Google Business, Hipages, Airtasker) listing your services and area covered.'],
      ['Can customers find you on Google Maps or a trade directory when searching locally?', 'Claim your Google Business Profile with your service area, phone number, and photos of past jobs.'],
      ['Do you have photos of past jobs or customer testimonials online?', 'Upload 3-5 photos of recent completed jobs to your Google Business Profile or website this week.'],
    ],
    digital_payments: [
      ['Can customers pay you by card or bank transfer instead of cash only?', 'Set up a payment link or mobile card reader so customers can pay on the spot by card.'],
      ['Do you send digital quotes and invoices instead of handwritten ones?', 'Use a free invoicing tool to send professional digital quotes and invoices.'],
      ['Do you track payments received and outstanding digitally?', 'Log every invoice and payment status in a spreadsheet or your invoicing tool instead of memory or paper.'],
    ],
    marketing: [
      ['Do you ask for and post online reviews from happy customers?', 'Text or email your last 3 satisfied customers a direct link to leave a Google review.'],
      ['Do you use social media or local online groups to advertise your services?', 'Post a before/after photo of a recent job to a local Facebook community group or your own page.'],
      ['Do you follow up with past customers for repeat work or referrals?', 'Send a simple check-in message to customers from 6+ months ago asking if they need anything else done.'],
    ],
    operations: [
      ['Do you schedule jobs and appointments using a digital calendar instead of a paper diary?', 'Move your job bookings into a shared digital calendar so nothing gets double-booked.'],
      ['Do you track job materials and costs digitally per job?', 'Log materials and hours per job in a simple spreadsheet to see which jobs are actually profitable.'],
      ['Can you and your team access job details and addresses from your phone on-site?', 'Share job details via a cloud tool so the whole team can check details from their phone.'],
    ],
    data_use: [
      ['Do you track how many jobs you complete and their average value?', 'Log job count and value weekly in a spreadsheet to see trends over time.'],
      ['Do you know which services or job types are most profitable?', 'Break down your job spreadsheet by service type monthly to spot your most profitable work.'],
      ['Do you store customer contact and job history in one place instead of scattered texts or paper?', 'Move customer names, numbers, and job history into one simple spreadsheet or free CRM.'],
    ],
  },
  professional_services: {
    online_presence: [
      ['Do you have a website that clearly explains your services and expertise?', 'Build a simple one-page site listing your services, experience, and a way to contact you.'],
      ['Do you have a LinkedIn or professional profile that is up to date?', 'Update your LinkedIn with your current services and post one update about your work this month.'],
      ['Do you publish any content, such as articles or case studies, showing your expertise?', 'Write one short LinkedIn post or blog article sharing a tip from your area of expertise.'],
    ],
    digital_payments: [
      ['Can clients pay your invoices online via card, bank transfer link, or similar?', 'Add a "Pay Now" link to your invoices using a tool like Stripe, PayPal, or your accounting software.'],
      ['Do you send professional digital invoices instead of handwritten or basic ones?', 'Use invoicing software to send branded digital invoices with clear payment terms.'],
      ['Do you track outstanding or overdue invoices digitally?', 'Turn on automatic overdue-invoice reminders in your invoicing tool instead of manually chasing payments.'],
    ],
    marketing: [
      ['Do you stay in touch with past and prospective clients via email or newsletter?', 'Send a short quarterly email update to past clients sharing news or a useful tip.'],
      ['Do you ask satisfied clients for testimonials or referrals?', 'Ask your next 2 happy clients for a short written testimonial you can use on your site or LinkedIn.'],
      ['Do you use LinkedIn or another channel to generate new client inquiries?', 'Comment or post on LinkedIn once a week in your area of expertise to stay visible to potential clients.'],
    ],
    operations: [
      ['Do you book client meetings using an online scheduling tool instead of back-and-forth emails?', 'Set up a free scheduling link so clients can book time without email back-and-forth.'],
      ['Do you store client files and documents in a secure cloud system?', 'Move client documents into a secure cloud folder with proper access permissions.'],
      ['Do you use digital tools to track project or case status and deadlines?', 'Track active client work in a simple digital board or shared spreadsheet with deadlines.'],
    ],
    data_use: [
      ['Do you track billable hours or project profitability digitally?', 'Log hours per client or project in a spreadsheet or time-tracking tool to see which work is most profitable.'],
      ['Do you track where new clients come from, such as referral, LinkedIn, or website?', 'Add a simple "how did you hear about us" question to your intake process and log the answers.'],
      ['Do you store client contact and history securely and consistently in a CRM or similar?', 'Move client details out of scattered emails into one simple CRM or a well-organized spreadsheet.'],
    ],
  },
  health_wellness: {
    online_presence: [
      ['Do you have a website or profile listing your services, hours, and location?', 'Set up a simple website or Google Business Profile listing your services, hours, and location.'],
      ['Can clients find and view your availability online?', "Add an online booking page so clients can see open times without calling."],
      ['Do you post updates about your services or availability on social media?', 'Post one update a month about a service, tip, or availability change on Instagram or Facebook.'],
    ],
    digital_payments: [
      ['Can clients pay online or tap-to-pay in person?', "Add a tap-to-pay terminal or online payment option so clients aren't cash or cheque only."],
      ['Do you send digital receipts or invoices for sessions or services?', 'Turn on digital receipts in your booking or payment tool instead of handwritten ones.'],
      ['Do you offer online package or membership purchases?', 'Set up an online store or booking add-on so clients can buy packages or memberships without an in-person visit.'],
    ],
    marketing: [
      ['Do you send appointment reminders via SMS or email?', 'Turn on automatic SMS/email reminders in your booking tool to cut down no-shows.'],
      ['Do you run any promotions or referral offers to attract new clients?', 'Offer a simple "bring a friend" or first-session discount and promote it on social media.'],
      ['Do you collect and showcase client reviews or testimonials?', 'Ask your next 3 happy clients to leave a Google review, and feature the best ones on your site.'],
    ],
    operations: [
      ['Do you manage bookings and appointments with an online scheduling system?', 'Move bookings into an online scheduling tool instead of phone or paper.'],
      ['Do you keep client records and notes digitally and securely?', 'Move client notes and history into a secure digital system instead of paper files.'],
      ['Do you track staff or practitioner schedules digitally?', 'Use a shared digital roster so staff can view and swap shifts without texting you directly.'],
    ],
    data_use: [
      ['Do you track client retention or how often clients return?', "Check your booking system's repeat-client report monthly to spot who hasn't rebooked."],
      ['Do you track which services are most popular or profitable?', 'Pull a monthly report from your booking or payment tool showing your top services by revenue.'],
      ['Do you store client contact details securely for reminders and offers?', 'Keep client contact details in one secure system, not scattered notebooks, with consent for marketing.'],
    ],
  },
  other: {
    online_presence: [
      ['Do you have a mobile-friendly website that clearly explains what you offer?', 'Check your site on your own phone. If text is tiny or buttons are hard to tap, switch to a mobile-friendly template and rewrite the homepage to say what you sell in one sentence.'],
      ['Can customers find your business on Google Maps or a local directory listing?', 'Claim your Google Business Profile (free), add your address, hours, and photos, and ask 3 recent customers for a review to help it show up in local search.'],
      ['Do you update your online profiles, such as website or social, at least monthly?', 'Put a recurring 15-minute calendar reminder once a month to post one update, photo, or offer - consistency matters more than frequency.'],
    ],
    digital_payments: [
      ['Can customers pay you online via card, PayPal, Stripe, or similar?', 'Sign up for a payment link tool - most let you start accepting card payments same-day with no hardware.'],
      ['Do you send digital invoices or receipts instead of paper only?', 'Turn on digital invoicing in whatever payment tool you use, and send your next 5 invoices by email instead of paper.'],
      ['Do you reconcile payments digitally using accounting software or a spreadsheet?', 'Start with a simple shared spreadsheet logging every payment in and out weekly - a full accounting tool can come later.'],
    ],
    marketing: [
      ['Do you use email or SMS to stay in touch with customers?', 'Collect emails or phone numbers at checkout, with permission, and send one short update or offer this month to test the channel.'],
      ['Do you run any paid digital ads on Google, Meta, or similar?', 'Start with a $5-10/day test on Meta or Google ads targeting your local area - most platforms let you pause anytime.'],
      ['Do you collect customer reviews online and respond to them?', 'Ask your next 3 happy customers directly for a review, and reply to any existing reviews, good or bad, this week.'],
    ],
    operations: [
      ['Do you use shared digital tools for scheduling, bookings, or task tracking?', 'Pick one free shared tool for bookings or tasks and move everything out of texts or paper this week.'],
      ['Can your team access key business files from anywhere using cloud storage?', 'Move your most-used files into a shared cloud folder and check everyone on the team has access from their phone.'],
      ['Do you automate any routine tasks such as reminders or order confirmations?', 'Turn on automatic reminders or confirmations in whatever booking or payment tool you already use - most have this built in but switched off.'],
    ],
    data_use: [
      ['Do you track basic sales or customer metrics in a spreadsheet or dashboard?', 'Create one spreadsheet tracking weekly sales, new customers, and repeat customers - just 3 numbers is enough to start.'],
      ['Do you review performance data at least monthly to guide decisions?', "Block 20 minutes every Friday to look at last week's numbers and note one decision you will make because of them."],
      ['Do you store customer contact details securely in a digital system such as a CRM or list?', 'Move customer contacts out of a notebook or scattered texts into one simple digital list or a free CRM tool.'],
    ],
  },
};

async function main() {
  const categoryRows = await query('SELECT id, `key` FROM categories');
  const categoryIdByKey = new Map(categoryRows.map((r) => [r.key, r.id]));

  const sectorRows = await query('SELECT id, `key` FROM sectors');
  const sectorIdByKey = new Map(sectorRows.map((r) => [r.key, r.id]));

  for (const key of Object.keys(SECTORS)) {
    if (!sectorIdByKey.has(key)) throw new Error(`Unknown sector key in seed data: ${key}`);
  }
  for (const key of CATEGORY_KEYS) {
    if (!categoryIdByKey.has(key)) throw new Error(`Unknown category key: ${key}`);
  }

  await query('DELETE FROM questions');

  let inserted = 0;
  for (const [sectorKey, categories] of Object.entries(SECTORS)) {
    const sectorId = sectorIdByKey.get(sectorKey);
    for (const categoryKey of CATEGORY_KEYS) {
      const items = categories[categoryKey];
      for (let i = 0; i < items.length; i += 1) {
        const [text, tip] = items[i];
        await query(
          `INSERT INTO questions (category_id, sector_id, text, tip, sort_order)
           VALUES (:category_id, :sector_id, :text, :tip, :sort_order)`,
          {
            category_id: categoryIdByKey.get(categoryKey),
            sector_id: sectorId,
            text,
            tip,
            sort_order: i + 1,
          }
        );
        inserted += 1;
      }
    }
  }

  console.log(`Inserted ${inserted} questions — verifying...`);
  const [{ count }] = await query('SELECT COUNT(*) AS count FROM questions');
  console.log(`Questions in DB: ${count}`);
  await pool.end();
}

main().catch((err) => {
  console.error('Failed:', err.message);
  process.exit(1);
});
