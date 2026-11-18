import ContactForm from "@/components/store/ContactForm";

export const metadata = { title: "Contact us" };

export default function ContactPage() {
  return <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
    <p className="text-xs uppercase tracking-[0.16em] text-gold">We’re here to help</p>
    <h1 className="mt-2 font-display text-4xl sm:text-5xl">Contact Timeora</h1>
    <p className="mt-4 leading-7 text-mist">Send a question about a watch or order. Include your order number if you have one.</p>
    <ContactForm />
  </div>;
}
