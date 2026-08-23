import { serve } from "https://deno.land/std@0.192.0/http/server.ts";

declare const Deno: {
  env: {
    get(key: string): string | undefined;
  };
};

serve(async (req) => {
  // ✅ CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "*",
      },
    });
  }

  try {
    const body = await req.json();
    const { type, data } = body;

    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    const NOTIFY_EMAIL = "daddeesshelf.web@gmail.com";

    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not set");
    }

    let subject = "";
    let html = "";

    if (type === "new_order") {
      const { ref_number, tiktok_handle, total_price, items, payment_ref, status } = data;
      subject = `📦 New Order Received — ${ref_number}`;
      html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FBF5EC; padding: 32px; border-radius: 12px; border: 1px solid #D8C4A8;">
          <h1 style="color: #3A2214; font-size: 22px; margin-bottom: 4px;">New Order Received</h1>
          <p style="color: #7B6454; font-size: 13px; margin-top: 0;">Daddee's Shelf — Order Notification</p>
          <hr style="border: none; border-top: 1px solid #D8C4A8; margin: 16px 0;" />
          <table style="width: 100%; font-size: 13px; color: #3A2214; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #7B6454; width: 160px;">Order Reference</td><td style="font-weight: bold;">${ref_number}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">TikTok Handle</td><td>${tiktok_handle}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">Total Amount</td><td style="font-weight: bold; color: #8B6A20;">₱${Number(total_price).toLocaleString()}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">GCash Reference</td><td>${payment_ref || "—"}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">Status</td><td>${status}</td></tr>
          </table>
          <hr style="border: none; border-top: 1px solid #D8C4A8; margin: 16px 0;" />
          <p style="font-size: 13px; color: #7B6454; margin-bottom: 6px;"><strong style="color: #3A2214;">Items Ordered:</strong></p>
          <ul style="font-size: 13px; color: #3A2214; padding-left: 18px; margin: 0;">
            ${(items || []).map((item: { title: string; qty: number; price: number }) =>
              `<li style="margin-bottom: 4px;">${item.title} × ${item.qty} — ₱${Number(item.price).toLocaleString()}</li>`
            ).join("")}
          </ul>
          <hr style="border: none; border-top: 1px solid #D8C4A8; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9E8E7E; text-align: center;">Daddee's Shelf · Automated Order Notification</p>
        </div>
      `;
    } else if (type === "new_title_request") {
      const { ref_number, customer_name, tiktok_handle, requested_title, requested_author, notes } = data;
      subject = `📚 New Title Request — ${requested_title}`;
      html = `
        <div style="font-family: Georgia, serif; max-width: 600px; margin: 0 auto; background: #FBF5EC; padding: 32px; border-radius: 12px; border: 1px solid #D8C4A8;">
          <h1 style="color: #3A2214; font-size: 22px; margin-bottom: 4px;">New Title Request</h1>
          <p style="color: #7B6454; font-size: 13px; margin-top: 0;">Daddee's Shelf — Title Request Notification</p>
          <hr style="border: none; border-top: 1px solid #D8C4A8; margin: 16px 0;" />
          <table style="width: 100%; font-size: 13px; color: #3A2214; border-collapse: collapse;">
            <tr><td style="padding: 6px 0; color: #7B6454; width: 160px;">Request Reference</td><td style="font-weight: bold;">${ref_number}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">Customer Name</td><td>${customer_name}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">TikTok Handle</td><td>${tiktok_handle}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">Requested Title</td><td style="font-weight: bold;">${requested_title}</td></tr>
            <tr><td style="padding: 6px 0; color: #7B6454;">Author</td><td>${requested_author || "—"}</td></tr>
            ${notes ? `<tr><td style="padding: 6px 0; color: #7B6454;">Notes</td><td>${notes}</td></tr>` : ""}
          </table>
          <hr style="border: none; border-top: 1px solid #D8C4A8; margin: 20px 0;" />
          <p style="font-size: 12px; color: #9E8E7E; text-align: center;">Daddee's Shelf · Automated Title Request Notification</p>
        </div>
      `;
    } else {
      throw new Error(`Unknown notification type: ${type}`);
    }

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: [NOTIFY_EMAIL],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      throw new Error(result.message || "Failed to send email");
    }

    return new Response(JSON.stringify({ success: true, id: result.id }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
    });
  }
});
