import { createFileRoute } from "@tanstack/react-router";

const PLAN_DAYS: Record<string, number | null> = {
  monthly: 30,
  yearly: 365,
  lifetime: null,
};

export const Route = createFileRoute("/api/public/razorpay-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["RAZORPAY_WEBHOOK_SECRET"];
        if (!secret) return new Response("Not configured", { status: 503 });

        const signature = request.headers.get("x-razorpay-signature") ?? "";
        const body = await request.text();

        const { createHmac, timingSafeEqual } = await import("node:crypto");
        const expected = createHmac("sha256", secret).update(body).digest("hex");
        const a = Buffer.from(signature);
        const b = Buffer.from(expected);
        if (a.length !== b.length || !timingSafeEqual(a, b)) {
          return new Response("Invalid signature", { status: 401 });
        }

        let event: {
          event?: string;
          payload?: { payment?: { entity?: { order_id?: string; id?: string } } };
        };
        try {
          event = JSON.parse(body);
        } catch {
          return new Response("Bad payload", { status: 400 });
        }

        if (event.event !== "payment.captured") return new Response("ignored");

        const orderId = event.payload?.payment?.entity?.order_id;
        const paymentId = event.payload?.payment?.entity?.id;
        if (!orderId) return new Response("ignored");

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data: row } = await supabaseAdmin
          .from("subscriptions")
          .select("id, plan, status")
          .eq("razorpay_order_id", orderId)
          .maybeSingle();

        if (!row || row.status === "active") return new Response("ok");

        const days = PLAN_DAYS[row.plan] ?? 30;
        await supabaseAdmin
          .from("subscriptions")
          .update({
            status: "active",
            razorpay_payment_id: paymentId ?? null,
            expires_at: days ? new Date(Date.now() + days * 86400000).toISOString() : null,
          })
          .eq("id", row.id);

        return new Response("ok");
      },
    },
  },
});
