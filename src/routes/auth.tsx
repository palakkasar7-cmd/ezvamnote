import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { sendPhoneOtp, verifyPhoneOtp } from "@/lib/phone-auth.functions";

export const Route = createFileRoute("/auth")({
  ssr: false,
  component: AuthPage,
});

const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, "Enter a valid 10-digit Indian mobile number");
const otpSchema = z.string().trim().regex(/^\d{6}$/, "Enter the 6-digit code");
const nameSchema = z.string().trim().min(2, "Enter your full name").max(80);
const emailSchema = z
  .string()
  .trim()
  .email("Enter a valid email")
  .max(255)
  .optional()
  .or(z.literal(""));

function AuthPage() {
  const navigate = useNavigate();
  const sendOtpFn = useServerFn(sendPhoneOtp);
  const verifyOtpFn = useServerFn(verifyPhoneOtp);
  const [step, setStep] = useState<"phone" | "otp" | "profile">("phone");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/" });
    });
    if (typeof window !== "undefined") {
      const saved = window.localStorage.getItem("notevault:lastPhone");
      if (saved && /^[6-9]\d{9}$/.test(saved)) setPhone(saved);
    }
  }, [navigate]);

  const sendOtp = async () => {
    const parsed = phoneSchema.safeParse(phone);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      await sendOtpFn({ data: { phone: `+91${parsed.data}` } });
      toast.success("OTP sent to your phone");
      setStep("otp");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const parsed = otpSchema.safeParse(otp);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const result = await verifyOtpFn({
        data: { phone: `+91${phone}`, code: parsed.data },
      });
      const { error } = await supabase.auth.verifyOtp({
        token_hash: result.tokenHash,
        type: "magiclink",
      });
      if (error) throw new Error(error.message);
      if (typeof window !== "undefined") {
        window.localStorage.setItem("notevault:lastPhone", phone);
      }
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name")
        .eq("id", result.userId!)
        .maybeSingle();
      if (profile?.full_name) {
        navigate({ to: "/" });
      } else {
        setStep("profile");
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Invalid code");
    } finally {
      setLoading(false);
    }
  };

  const saveProfile = async () => {
    const nameParsed = nameSchema.safeParse(fullName);
    if (!nameParsed.success) {
      toast.error(nameParsed.error.issues[0].message);
      return;
    }
    const emailParsed = emailSchema.safeParse(email);
    if (!emailParsed.success) {
      toast.error(emailParsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    const { data: userData } = await supabase.auth.getUser();
    if (!userData.user) {
      setLoading(false);
      toast.error("Session expired. Please sign in again.");
      setStep("phone");
      return;
    }
    const { error } = await supabase.from("profiles").upsert({
      id: userData.user.id,
      full_name: nameParsed.data,
      email: emailParsed.data || null,
      phone: `+91${phone}`,
    });
    setLoading(false);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Welcome to NoteVault");
    navigate({ to: "/" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 py-12">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="font-display text-4xl font-semibold tracking-tight">NoteVault</h1>
          <p className="hand mt-2 text-base text-muted-foreground">
            Topper's handwritten notes — sign in to continue
          </p>
        </div>

        <div className="border border-foreground bg-background p-8">
          {step === "phone" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                sendOtp();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="phone">Mobile number</Label>
                <div className="flex items-center border border-foreground">
                  <span className="border-r border-foreground px-3 py-2 text-sm font-medium">
                    +91
                  </span>
                  <Input
                    id="phone"
                    inputMode="numeric"
                    autoComplete="tel"
                    placeholder="98765 43210"
                    maxLength={10}
                    value={phone}
                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))}
                    className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0"
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  We'll send a 6-digit OTP via SMS.
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-none">
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === "otp" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                verifyOtp();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="otp">Enter OTP</Label>
                <Input
                  id="otp"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="6-digit code"
                  maxLength={6}
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                  className="rounded-none border-foreground text-center text-lg tracking-[0.5em]"
                />
                <p className="text-xs text-muted-foreground">
                  Sent to +91 {phone}.{" "}
                  <button
                    type="button"
                    className="underline underline-offset-2"
                    onClick={() => setStep("phone")}
                  >
                    Change
                  </button>
                </p>
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-none">
                {loading ? "Verifying..." : "Verify & continue"}
              </Button>
              <button
                type="button"
                disabled={loading}
                onClick={sendOtp}
                className="w-full text-center text-xs text-muted-foreground underline underline-offset-2"
              >
                Resend OTP
              </button>
            </form>
          )}

          {step === "profile" && (
            <form
              onSubmit={(e) => {
                e.preventDefault();
                saveProfile();
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <Label htmlFor="name">Full name</Label>
                <Input
                  id="name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  maxLength={80}
                  className="rounded-none border-foreground"
                  placeholder="Your name"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email (for order receipts)</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  maxLength={255}
                  className="rounded-none border-foreground"
                  placeholder="you@example.com"
                />
              </div>
              <Button type="submit" disabled={loading} className="w-full rounded-none">
                {loading ? "Saving..." : "Continue"}
              </Button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-xs text-muted-foreground">
          By continuing you agree to our terms. Standard SMS rates may apply.
        </p>
      </div>
    </div>
  );
}
