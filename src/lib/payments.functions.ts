import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

export const PLANS = {
  monthly: { label: "Monthly", amountPaise: 19900, days: 30 },
  yearly: { label: "Yearly", amountPaise: 99900, days: 365 },
  lifetime: { label: "Lifetime", amountPaise: 249900, days: null },
} as const;

export type PlanId = keyof typeof PLANS;

function creds() {
  const keyId = process.env["RAZORPAY_KEY_ID"];
  const keySecret = process.env["RAZORPAY_KEY_SECRET"];
  if (!keyId || !keySecret) throw new Error("Payments are not configured yet. Please add Razorpay keys.");
  return { keyId, keySecret };
}

export const createPaymentOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ plan: z.enum(["monthly", "yearly", "lifetime"]) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    const { keyId, keySecret } = creds();
    const plan = PLANS[data.plan];

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
      },
      body: JSON.stringify({
        amount: plan.amountPaise,
        currency: "INR",
        receipt: `gy_${Date.now()}`,
        notes: { user_id: context.userId, plan: data.plan },
      }),
    });

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new Error(`Could not start the payment (${res.status}): ${body.slice(0, 200)}`);
    }

    const order = (await res.json()) as { id: string; amount: number; currency: string };

    await context.supabase.from("subscriptions").insert({
      user_id: context.userId,
      plan: data.plan,
      status: "created",
      amount_paise: plan.amountPaise,
      razorpay_order_id: order.id,
    });

    return { orderId: order.id, amount: order.amount, currency: order.currency, keyId };
  });

export const verifyPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        razorpay_order_id: z.string().min(1),
        razorpay_payment_id: z.string().min(1),
        razorpay_signature: z.string().min(1),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const { keySecret } = creds();
    const { createHmac, timingSafeEqual } = await import("node:crypto");

    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpay_order_id}|${data.razorpay_payment_id}`)
      .digest("hex");
    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpay_signature);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new Error("Payment could not be verified.");
    }

    const { data: row } = await context.supabase
      .from("subscriptions")
      .select("id, plan")
      .eq("razorpay_order_id", data.razorpay_order_id)
      .maybeSingle();
    if (!row) throw new Error("Order not found.");

    const plan = PLANS[row.plan as PlanId] ?? PLANS.monthly;
    const expires = plan.days ? new Date(Date.now() + plan.days * 86400000).toISOString() : null;

    const { error } = await context.supabase
      .from("subscriptions")
      .update({
        status: "active",
        razorpay_payment_id: data.razorpay_payment_id,
        expires_at: expires,
      })
      .eq("id", row.id);
    if (error) throw new Error(error.message);

    return { ok: true, plan: row.plan, expires_at: expires };
  });
