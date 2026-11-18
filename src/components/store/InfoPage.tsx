import Link from "next/link";

const pages = {
  about: {
    title: "Our story",
    intro: "Timeora is built around a simple idea: a watch should be made to last beyond the moment it is bought.",
    sections: [
      ["Considered design", "Our collection brings together automatic, quartz and complication watches selected for everyday wear and lasting style."],
      ["Made to keep", "Every Timeora watch is covered by a two-year warranty, as described with the collection."],
      ["Find your watch", "Explore the collection and compare the specifications, materials and movement listed for each watch."],
    ],
  },
  faq: {
    title: "Frequently asked questions",
    intro: "Quick answers about shopping with Timeora.",
    sections: [
      ["Which payments can I use?", "Online payment is available through Razorpay. Orders are confirmed after payment succeeds."],
      ["How much is shipping?", "Shipping is ₹99 on orders below ₹10,000 and complimentary on orders of ₹10,000 or more."],
      ["How do I find my order?", "Sign in and open My orders to see the latest order status and delivery address."],
      ["What warranty is included?", "Timeora watches are covered by a two-year warranty."],
    ],
  },
  shipping: {
    title: "Shipping information",
    intro: "Shipping charges and order totals are shown before you place your order.",
    sections: [
      ["Delivery address", "Please check your name, street address, city, state, six-digit PIN code and phone number before paying for your order."],
      ["Shipping charges", "Shipping is ₹99 for orders below ₹10,000. Orders of ₹10,000 or more ship free."],
      ["Order updates", "Your order status is available in My orders after signing in. Delivery estimates are not shown until they are confirmed for your order."],
    ],
  },
  returns: {
    title: "Returns and warranty",
    intro: "We want you to feel confident about your purchase.",
    sections: [
      ["Need help with an order?", "Send a message through our contact form and include your order number so our team can review the request."],
      ["Warranty", "Every Timeora watch is covered by a two-year warranty. Keep your order details available when asking for warranty support."],
      ["Order status", "You can review your order and its current status from the My orders page after signing in."],
    ],
  },
  privacy: {
    title: "Privacy policy",
    intro: "Timeora uses the information needed to operate your account and fulfil your orders.",
    sections: [
      ["Account information", "Your name, email and securely hashed password are used to provide sign-in and account services."],
      ["Order information", "Delivery details and purchased items are retained with your order so that it can be fulfilled and supported."],
      ["Messages and updates", "Messages submitted through the contact form and email addresses submitted for release updates are stored so Timeora can manage those requests."],
      ["Your choices", "You can update your account name, sign out, or contact us about an order using the contact form."],
    ],
  },
  terms: {
    title: "Terms and conditions",
    intro: "These terms apply when you use the Timeora storefront and place an order.",
    sections: [
      ["Availability and pricing", "Product availability and the final total are verified by the store when an order is submitted. The displayed price may change before an order is placed."],
      ["Orders and payment", "Orders are paid online through Razorpay and confirmed after successful payment verification."],
      ["Account use", "Keep your sign-in credentials private and provide accurate delivery information when ordering."],
      ["Questions", "For help with an order or these terms, use our contact form."],
    ],
  },
} as const;

export type InfoPageKey = keyof typeof pages;

export default function InfoPage({ page }: { page: InfoPageKey }) {
  const content = pages[page];
  return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <p className="text-xs uppercase tracking-[0.16em] text-gold">TIMEORA</p>
    <h1 className="mt-2 font-display text-4xl sm:text-5xl">{content.title}</h1>
    <p className="mt-5 text-lg leading-7 text-mist">{content.intro}</p>
    <div className="mt-10 divide-y divide-black/10 border-y border-black/10">
      {content.sections.map(([title, text]) => <section key={title} className="py-6">
        <h2 className="font-display text-2xl">{title}</h2>
        <p className="mt-2 leading-7 text-mist">{text}</p>
      </section>)}
    </div>
    <p className="mt-8 text-sm"><Link href={page === "returns" || page === "terms" ? "/contact" : "/shop"} className="underline underline-offset-4">{page === "returns" || page === "terms" ? "Contact us" : "Explore the collection"}</Link></p>
  </div>;
}
