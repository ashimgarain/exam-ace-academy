import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { toast } from "sonner";
import { Check, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { createPaymentOrder, verifyPayment } from "@/lib/payments.functions";
import { getProfile } from "@/lib/learn.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/_authenticated/pricing")({
  head: () => ({
    meta: [
      { title: "Unlock the full syllabus — GyaanPath" },
      { name: "description", content: "Affordable monthly, yearly and lifetime plans for serious aspirants." },
      { property: "og:title", content: "Unlock the full syllabus — GyaanPath" },
      { property: "og:description", content: "Every subject, listen mode, translations and the revision engine." },
    ],
  }),
  component: Pricing,
});

type RazorpayResponse = {
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

const PLAN_CARDS = [
  {
    id: "monthly" as const,
    name: "Monthly",
    price: "₹199",
    note: "per month",
    perks: ["Full syllabus, all exams", "Listen mode", "All languages", "Revision engine"],
  },
  {
    id: "yearly" as const,
    name: "Yearly",
    price: "₹999",
    note: "per year — best value",
    perks: ["Everything in monthly", "Costs less than one coaching handout", "Priority new content"],
    featured: true,
  },
  {
    id: "lifetime" as const,
    name: "Lifetime",
    price: "₹2,499",
    note: "one time",
    perks: ["Everything, forever", "All future subjects", "No renewals"],
  },
];

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function Pricing() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const createOrder = useServerFn(createPaymentOrder);
  const verify = useServerFn(verifyPayment);
  const { data: me } = useQuery({ queryKey: ["profile"], queryFn: () => getProfile() });
  const [busy, setBusy] = useState<string | null>(null);

  async function buy(plan: "monthly" | "yearly" | "lifetime") {
    setBusy(plan);
    try {
      const ready = await loadRazorpay();
      if (!ready) throw new Error("Could not reach the payment window. Check your connection.");

      const order = await createOrder({ data: { plan } });

      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: order.currency,
        order_id: order.orderId,
        name: "GyaanPath",
        description: `${plan} plan`,
        theme: { color: "#d98324" },
        handler: async (response: RazorpayResponse) => {
          try {
            await verify({ data: response });
            await queryClient.invalidateQueries();
            toast.success("Unlocked. Every chapter is open now.");
            navigate({ to: "/learn" });
          } catch (err) {
            toast.error(err instanceof Error ? err.message : "Payment could not be confirmed");
          }
        },
        modal: { ondismiss: () => setBusy(null) },
      });
      rzp.open();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not start the payment");
    } finally {
      setBusy(null);
    }
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-4xl">
        <h1 className="text-center font-display text-3xl font-bold text-foreground sm:text-4xl">
          Unlock the whole syllabus
        </h1>
        <p className="mx-auto mt-3 max-w-xl text-center text-sm text-muted-foreground">
          The first chapters of every subject stay free forever. Upgrade when you are ready to go deep —
          priced for a student, not a coaching institute.
        </p>

        {me?.entitled && (
          <p className="mx-auto mt-6 max-w-md rounded-xl border border-success/40 bg-success/10 p-4 text-center text-sm text-foreground">
            Your plan is active. Everything is unlocked.
          </p>
        )}

        <div className="mt-8 grid gap-4 md:grid-cols-3">
          {PLAN_CARDS.map((plan) => (
            <div
              key={plan.id}
              className={cn(
                "flex flex-col rounded-2xl border bg-card p-6",
                plan.featured ? "border-primary shadow-lg" : "border-border",
              )}
            >
              {plan.featured && (
                <span className="mb-3 self-start rounded-full bg-primary px-3 py-1 text-[11px] font-bold uppercase tracking-wide text-primary-foreground">
                  Most popular
                </span>
              )}
              <h2 className="font-display text-lg font-bold text-foreground">{plan.name}</h2>
              <p className="mt-2 font-display text-3xl font-bold text-foreground">{plan.price}</p>
              <p className="text-xs text-muted-foreground">{plan.note}</p>
              <ul className="mt-5 flex-1 space-y-2">
                {plan.perks.map((perk) => (
                  <li key={perk} className="flex gap-2 text-sm text-muted-foreground">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    {perk}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => buy(plan.id)}
                disabled={busy !== null || me?.entitled}
                className={cn(
                  "mt-6 rounded-xl px-4 py-3 text-sm font-semibold disabled:opacity-60",
                  plan.featured
                    ? "bg-primary text-primary-foreground"
                    : "border border-border text-foreground",
                )}
              >
                {me?.entitled ? "Already active" : busy === plan.id ? "Opening…" : `Get ${plan.name}`}
              </button>
            </div>
          ))}
        </div>

        <p className="mt-8 flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="size-4" /> Payments are handled by Razorpay. We never see your card details.
        </p>
      </div>
    </AppShell>
  );
}
