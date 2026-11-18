"use client";

import Link from "next/link";
import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { browserApi, BrowserApiError } from "@/lib/browser-api";
import type { SellerApplication } from "@/types/seller";
import type { User } from "@/types/user";

type ApplicationState = {
  hasApplication: boolean;
  application: SellerApplication | null;
};

export default function BecomeSellerPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [appState, setAppState] = useState<ApplicationState | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [isReapplying, setIsReapplying] = useState(false);

  // Form Fields
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [description, setDescription] = useState("");

  const [line1, setLine1] = useState("");
  const [line2, setLine2] = useState("");
  const [city, setCity] = useState("");
  const [stateName, setStateName] = useState("");
  const [pincode, setPincode] = useState("");

  const [pan, setPan] = useState("");
  const [gstin, setGstin] = useState("");

  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [confirmAccountNumber, setConfirmAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");
  const [bankName, setBankName] = useState("");

  useEffect(() => {
    let active = true;

    async function load() {
      try {
        const currentUser = await browserApi<User>("/auth/me");
        if (!active) return;
        setUser(currentUser);
        setOwnerName(currentUser.name);
        setEmail(currentUser.email);
        setPhone(currentUser.phone ?? "");
        setAccountHolderName(currentUser.name);

        const applicationData = await browserApi<ApplicationState>("/seller-applications/mine");
        if (!active) return;
        setAppState(applicationData);
      } catch (err) {
        if (!active) return;
        if (err instanceof BrowserApiError && err.status === 401) {
          router.replace("/login?next=/account/become-seller");
          return;
        }
        setError(err instanceof Error ? err.message : "Could not load application data");
      } finally {
        if (active) setLoading(false);
      }
    }

    void load();
    return () => {
      active = false;
    };
  }, [router]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (accountNumber !== confirmAccountNumber) {
      setError("Bank account numbers do not match.");
      return;
    }

    const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
    if (!panRegex.test(pan.trim().toUpperCase())) {
      setError("Please enter a valid 10-character PAN number (e.g. ABCDE1234F).");
      return;
    }

    const ifscRegex = /^[A-Z]{4}0[A-Z0-9]{6}$/;
    if (!ifscRegex.test(ifscCode.trim().toUpperCase())) {
      setError("Please enter a valid 11-character IFSC code (e.g. HDFC0001234).");
      return;
    }

    setSubmitting(true);
    try {
      const created = await browserApi<SellerApplication>("/seller-applications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeName,
          ownerName,
          email,
          phone,
          description,
          businessAddress: {
            line1,
            line2,
            city,
            state: stateName,
            pincode,
          },
          kyc: {
            pan: pan.trim().toUpperCase(),
            gstin: gstin ? gstin.trim().toUpperCase() : undefined,
          },
          bankDetails: {
            accountHolderName,
            accountNumber,
            ifscCode: ifscCode.trim().toUpperCase(),
            bankName,
          },
        }),
      });

      setAppState({ hasApplication: true, application: created });
      setIsReapplying(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit application.");
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    "mt-1 w-full border border-black/20 bg-white px-3 py-2.5 text-sm outline-none transition-colors focus:border-gold";
  const labelClass = "block text-sm font-medium";

  if (loading) {
    return <div className="mx-auto max-w-4xl px-4 py-20 text-sm text-mist">Loading seller application status…</div>;
  }

  // Case 1: Already an approved seller
  if (user?.role === "seller") {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <span className="inline-block bg-gold/10 px-3 py-1 text-xs uppercase tracking-wider text-charcoal border border-gold/30">
          Partner Verified
        </span>
        <h1 className="mt-4 font-display text-4xl">You are an approved Timeora Seller</h1>
        <p className="mt-3 text-sm text-mist max-w-lg mx-auto">
          Your seller account is active. You can list watches, process customer orders, and track payouts through your dedicated seller dashboard.
        </p>
        <div className="mt-8">
          <Link href="/seller" className="bg-black px-6 py-3 text-sm text-white inline-block hover:opacity-90">
            Open Seller Dashboard &rarr;
          </Link>
        </div>
      </div>
    );
  }

  // Case 2: Has a Pending Application
  if (appState?.hasApplication && appState.application?.status === "pending" && !isReapplying) {
    const app = appState.application;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="border border-black/10 bg-white p-8 sm:p-10">
          <div className="flex items-center justify-between">
            <span className="bg-amber-100 text-amber-800 border border-amber-200 px-3 py-1 text-xs font-medium uppercase tracking-wider">
              Application Under Review
            </span>
            <span className="text-xs text-mist">
              Submitted on {new Date(app.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
            </span>
          </div>

          <h1 className="mt-5 font-display text-3xl">Application Received: {app.storeName}</h1>
          <p className="mt-3 text-sm text-mist leading-relaxed">
            Thank you for applying to become a watch vendor on Timeora. Our marketplace compliance team is currently reviewing your business information, PAN, and banking details. You will receive seller portal access once your application is approved.
          </p>

          <div className="mt-8 border-t border-black/10 pt-6">
            <h2 className="font-display text-lg mb-4">Application Summary</h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div>
                <dt className="text-xs text-mist">Store Name</dt>
                <dd className="font-medium mt-0.5">{app.storeName}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist">Owner Name</dt>
                <dd className="font-medium mt-0.5">{app.ownerName}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist">Email</dt>
                <dd className="font-medium mt-0.5">{app.email}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist">Phone</dt>
                <dd className="font-medium mt-0.5">{app.phone}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist">PAN Number</dt>
                <dd className="font-medium mt-0.5">{app.kyc.pan}</dd>
              </div>
              <div>
                <dt className="text-xs text-mist">Payout Bank Account</dt>
                <dd className="font-medium mt-0.5">{app.bankDetails.bankName} (Ending in {app.bankDetails.accountNumberLast4})</dd>
              </div>
              <div className="sm:col-span-2">
                <dt className="text-xs text-mist">Registered Business Address</dt>
                <dd className="font-medium mt-0.5">
                  {app.businessAddress.line1}{app.businessAddress.line2 ? `, ${app.businessAddress.line2}` : ""}, {app.businessAddress.city}, {app.businessAddress.state} - {app.businessAddress.pincode}
                </dd>
              </div>
            </dl>
          </div>

          <div className="mt-8 flex gap-4">
            <Link href="/account" className="bg-stone border border-black/20 px-5 py-2.5 text-xs uppercase tracking-wider text-black">
              Return to Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 3: Application was Rejected
  if (appState?.hasApplication && appState.application?.status === "rejected" && !isReapplying) {
    const app = appState.application;
    return (
      <div className="mx-auto max-w-3xl px-4 py-16">
        <div className="border border-red-200 bg-red-50/50 p-8 sm:p-10">
          <span className="bg-red-100 text-red-800 border border-red-200 px-3 py-1 text-xs font-medium uppercase tracking-wider">
            Application Needs Revision
          </span>
          <h1 className="mt-4 font-display text-3xl text-red-950">Application Not Approved</h1>
          <p className="mt-2 text-sm text-red-900 leading-relaxed">
            Your recent application for <strong>{app.storeName}</strong> could not be approved due to the following reason:
          </p>
          <div className="mt-4 border-l-2 border-red-600 bg-white p-4 text-sm text-charcoal">
            {app.rejectionReason || "Information provided did not meet seller verification standards."}
          </div>

          <div className="mt-8 flex gap-4">
            <button
              onClick={() => {
                setStoreName(app.storeName);
                setOwnerName(app.ownerName);
                setEmail(app.email);
                setPhone(app.phone);
                setDescription(app.description ?? "");
                setLine1(app.businessAddress.line1);
                setLine2(app.businessAddress.line2 ?? "");
                setCity(app.businessAddress.city);
                setStateName(app.businessAddress.state);
                setPincode(app.businessAddress.pincode);
                setPan(app.kyc.pan);
                setGstin(app.kyc.gstin ?? "");
                setAccountHolderName(app.bankDetails.accountHolderName);
                setIfscCode(app.bankDetails.ifscCode);
                setBankName(app.bankDetails.bankName);
                setIsReapplying(true);
              }}
              className="bg-black px-6 py-2.5 text-xs uppercase tracking-wider text-white"
            >
              Update & Resubmit Application &rarr;
            </button>
            <Link href="/account" className="bg-white border border-black/20 px-5 py-2.5 text-xs uppercase tracking-wider text-black">
              Back to Account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Case 4: Application Form
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <div className="border-b border-black/10 pb-6">
        <p className="text-xs uppercase tracking-widest text-gold font-medium">Timeora Vendor Program</p>
        <h1 className="mt-1 font-display text-4xl">Apply to become a seller</h1>
        <p className="mt-2 text-sm text-mist max-w-2xl leading-relaxed">
          Showcase and sell your timepieces to thousands of watch collectors. Complete your business and banking verification below. Once approved by our administration, you will unlock full access to the seller portal.
        </p>
      </div>

      <form onSubmit={submit} className="mt-8 space-y-10">
        {/* Section 1: Store & Owner */}
        <div className="space-y-4">
          <h2 className="font-display text-xl pb-2 border-b border-black/10">1. Store & Contact Details</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Store / Brand Name *
                <input
                  required
                  value={storeName}
                  onChange={(e) => setStoreName(e.target.value)}
                  placeholder="e.g. Vintage Horology"
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Owner Full Name *
                <input
                  required
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Contact Email *
                <input
                  required
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Contact Mobile *
                <input
                  required
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Store Description & Watch Specialties (Optional)
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Describe your watch collection, heritage, or brands you specialize in."
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 2: Business Address */}
        <div className="space-y-4">
          <h2 className="font-display text-xl pb-2 border-b border-black/10">2. Registered Business Address</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Address Line 1 *
                <input
                  required
                  value={line1}
                  onChange={(e) => setLine1(e.target.value)}
                  placeholder="Building, street, or commercial unit"
                  className={inputClass}
                />
              </label>
            </div>
            <div className="sm:col-span-2">
              <label className={labelClass}>
                Address Line 2 (Optional)
                <input
                  value={line2}
                  onChange={(e) => setLine2(e.target.value)}
                  placeholder="Apartment, suite, landmark"
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                City *
                <input
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                State *
                <input
                  required
                  value={stateName}
                  onChange={(e) => setStateName(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                PIN Code *
                <input
                  required
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value)}
                  placeholder="400001"
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Section 3: Business KYC */}
        <div className="space-y-4">
          <h2 className="font-display text-xl pb-2 border-b border-black/10">3. Business Verification & Tax Info</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Business PAN Number *
                <input
                  required
                  maxLength={10}
                  value={pan}
                  onChange={(e) => setPan(e.target.value.toUpperCase())}
                  placeholder="ABCDE1234F"
                  className={inputClass}
                />
              </label>
              <span className="text-xs text-mist mt-1 block">Required for statutory e-commerce tax compliance.</span>
            </div>
            <div>
              <label className={labelClass}>
                GSTIN Number (Optional)
                <input
                  maxLength={15}
                  value={gstin}
                  onChange={(e) => setGstin(e.target.value.toUpperCase())}
                  placeholder="27ABCDE1234F1Z5"
                  className={inputClass}
                />
              </label>
              <span className="text-xs text-mist mt-1 block">Provide if you are registered under GST.</span>
            </div>
          </div>
        </div>

        {/* Section 4: Bank Details */}
        <div className="space-y-4">
          <h2 className="font-display text-xl pb-2 border-b border-black/10">4. Payout Bank Information</h2>
          <p className="text-xs text-mist">
            Your earnings from watch sales will be remitted to this bank account. All account numbers are encrypted at rest with AES-256-GCM.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className={labelClass}>
                Account Holder Name *
                <input
                  required
                  value={accountHolderName}
                  onChange={(e) => setAccountHolderName(e.target.value)}
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Bank Name *
                <input
                  required
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. HDFC Bank, ICICI Bank"
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Bank Account Number *
                <input
                  required
                  type="password"
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  placeholder="9 to 18 digits"
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                Confirm Account Number *
                <input
                  required
                  type="text"
                  value={confirmAccountNumber}
                  onChange={(e) => setConfirmAccountNumber(e.target.value)}
                  placeholder="Re-enter account number"
                  className={inputClass}
                />
              </label>
            </div>
            <div>
              <label className={labelClass}>
                IFSC Code *
                <input
                  required
                  maxLength={11}
                  value={ifscCode}
                  onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                  placeholder="e.g. HDFC0001234"
                  className={inputClass}
                />
              </label>
            </div>
          </div>
        </div>

        {error && <p role="alert" className="border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</p>}

        <div className="border-t border-black/10 pt-6 flex items-center justify-between">
          <Link href="/account" className="text-sm underline text-mist hover:text-black">
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="bg-black px-8 py-3 text-sm text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {submitting ? "Submitting Application…" : "Submit Seller Application"}
          </button>
        </div>
      </form>
    </div>
  );
}

