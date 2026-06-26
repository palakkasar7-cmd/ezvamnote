import { createServerFn } from "@tanstack/react-start";
import { createHash } from "crypto";

const phoneRegex = /^\+\d{8,15}$/;
const codeRegex = /^\d{6}$/;

function hashCode(phone: string, code: string) {
  return createHash("sha256").update(`${phone}:${code}`).digest("hex");
}

async function sendTwilioSms(to: string, body: string) {
  const lovableKey = process.env.LOVABLE_API_KEY;
  const twilioKey = process.env.TWILIO_API_KEY;
  const from = process.env.TWILIO_PHONE_NUMBER;
  if (!lovableKey || !twilioKey) throw new Error("Twilio is not configured");
  if (!from) throw new Error("TWILIO_PHONE_NUMBER is not configured");

  const res = await fetch("https://connector-gateway.lovable.dev/twilio/Messages.json", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${lovableKey}`,
      "X-Connection-Api-Key": twilioKey,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ To: to, From: from, Body: body }),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg = (data as { message?: string })?.message ?? `Twilio error ${res.status}`;
    throw new Error(msg);
  }
}

export const sendPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string }) => {
    if (!phoneRegex.test(input.phone)) throw new Error("Invalid phone number");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const phone = data.phone;

    // Rate limit: max 5 OTPs per phone per hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { count } = await supabaseAdmin
      .from("phone_otps")
      .select("id", { count: "exact", head: true })
      .eq("phone", phone)
      .gte("created_at", oneHourAgo);
    if ((count ?? 0) >= 5) {
      throw new Error("Too many OTP requests. Please try again later.");
    }

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();
    const { error } = await supabaseAdmin.from("phone_otps").insert({
      phone,
      code_hash: hashCode(phone, code),
      expires_at: expiresAt,
    });
    if (error) throw new Error(error.message);

    await sendTwilioSms(phone, `Your NoteVault verification code is ${code}. It expires in 5 minutes.`);
    return { ok: true };
  });

export const verifyPhoneOtp = createServerFn({ method: "POST" })
  .inputValidator((input: { phone: string; code: string }) => {
    if (!phoneRegex.test(input.phone)) throw new Error("Invalid phone number");
    if (!codeRegex.test(input.code)) throw new Error("Invalid code");
    return input;
  })
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { phone, code } = data;

    const { data: row, error } = await supabaseAdmin
      .from("phone_otps")
      .select("id, code_hash, expires_at, attempts, consumed_at")
      .eq("phone", phone)
      .is("consumed_at", null)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) throw new Error("No active code. Request a new one.");
    if (new Date(row.expires_at).getTime() < Date.now()) {
      throw new Error("Code expired. Request a new one.");
    }
    if (row.attempts >= 5) throw new Error("Too many attempts. Request a new code.");

    if (row.code_hash !== hashCode(phone, code)) {
      await supabaseAdmin
        .from("phone_otps")
        .update({ attempts: row.attempts + 1 })
        .eq("id", row.id);
      throw new Error("Incorrect code");
    }

    await supabaseAdmin
      .from("phone_otps")
      .update({ consumed_at: new Date().toISOString() })
      .eq("id", row.id);

    // Find or create user keyed by a synthetic email derived from phone.
    const syntheticEmail = `${phone.replace(/\D/g, "")}@phone.notevault.local`;

    let userId: string | null = null;
    const { data: list } = await supabaseAdmin.auth.admin.listUsers({
      page: 1,
      perPage: 200,
    });
    const existing = list?.users.find(
      (u) => u.phone === phone.replace(/^\+/, "") || u.email === syntheticEmail,
    );
    if (existing) {
      userId = existing.id;
    } else {
      const { data: created, error: createErr } = await supabaseAdmin.auth.admin.createUser({
        email: syntheticEmail,
        phone: phone.replace(/^\+/, ""),
        email_confirm: true,
        phone_confirm: true,
        user_metadata: { phone },
      });
      if (createErr || !created.user) throw new Error(createErr?.message ?? "Failed to create user");
      userId = created.user.id;
    }

    // Generate a magiclink and return the token_hash; client exchanges it for a session.
    const { data: linkData, error: linkErr } = await supabaseAdmin.auth.admin.generateLink({
      type: "magiclink",
      email: syntheticEmail,
    });
    if (linkErr || !linkData.properties?.hashed_token) {
      throw new Error(linkErr?.message ?? "Failed to issue session");
    }

    return {
      email: syntheticEmail,
      tokenHash: linkData.properties.hashed_token,
      userId,
    };
  });
