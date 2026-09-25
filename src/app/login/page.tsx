"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  sendLoginOtp,
  verifyLoginOtp,
} from "@/lib/auth.api";
import { getCustomerProfile } from "@/app/services/api/profile.api";
import { useToast } from "@/components/ToastProvider";
import { getFCMToken } from "@/lib/firebase";

export default function LoginPage() {
  const { showToast } = useToast();
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  // OTP send hone ke baad true hoga
  const [otpSent, setOtpSent] = useState(false);

  const router = useRouter();

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  // =========================================
  // SEND OTP (POST /customer/auth/otp-login)
  // =========================================
  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Please enter your email");
      return;
    }

    try {
      setLoading(true);

      const response = await sendLoginOtp(email.trim());

      const code = String(response?.response_code || "");
      const isSuccess =
        code === "default_200" ||
        code.includes("200") ||
        response?.status === "success" ||
        response?.status === true;

      if (isSuccess || response?.message) {
        setOtpSent(true);
        setOtp("");
        setError("");
        setCountdown(30);
        showToast(response?.message || "OTP sent successfully to your email!", "success");
      } else {
        const msg = response?.message || "Failed to send OTP";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);
      const msg =
        error?.response?.data?.errors?.[0]?.message ||
        (error?.response?.data?.message === "Resource not found"
          ? "No account found with this email. Please sign up."
          : error?.response?.data?.message) ||
        "Something went wrong while sending OTP.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // RESEND OTP (POST /customer/auth/otp-login)
  // =========================================
  const handleResendOtp = async () => {
    if (countdown > 0 || resendingOtp) return;
    setResendingOtp(true);
    try {
      const response = await sendLoginOtp(email.trim());
      showToast(response?.message || "OTP resent successfully to your email!", "success");
      setCountdown(30);
    } catch (error: any) {
      const msg =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        "Failed to resend OTP";
      showToast(msg, "error");
    } finally {
      setResendingOtp(false);
    }
  };

  // =========================================
  // VERIFY OTP (POST /customer/auth/otp-login)
  // =========================================
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!otp.trim()) {
      setError("Please enter OTP");
      return;
    }

    if (otp.length < 4 || otp.length > 6) {
      setError("Please enter a valid OTP code (4-6 digits)");
      return;
    }

    try {
      setLoading(true);

      const response = await verifyLoginOtp({
        email: email.trim(),
        otp: otp.trim(),
      });

      const code = String(response?.response_code || "");
      const isSuccess =
        code === "auth_login_200" ||
        code === "default_200" ||
        code.includes("200") ||
        Boolean(response?.content?.token || response?.token);

      if (isSuccess) {
        const token = response.content?.token || response?.token;

        if (!token) {
          setError("Login successful but token was not received.");
          showToast("Login token missing", "error");
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem(
          "is_active",
          String(response.content?.is_active ?? 1)
        );

        // Fetch and cache user profile immediately
        try {
          const profileRes = await getCustomerProfile();
          if (profileRes?.content) {
            localStorage.setItem("user", JSON.stringify(profileRes.content));
          }
        } catch (profileErr) {
          console.warn("Could not pre-fetch profile on login:", profileErr);
        }

        // Notify Navbar and other components of auth state change
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("auth-change"));

        showToast("Logged in successfully! Welcome back.", "success");
        router.push("/account");
      } else {
        const msg = response?.message || "Invalid OTP";
        setError(msg);
        showToast(msg, "error");
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);
      const msg =
        error?.response?.data?.errors?.[0]?.message ||
        (error?.response?.data?.message === "Resource not found"
          ? "Invalid or expired OTP. Please try again."
          : error?.response?.data?.message) ||
        "Invalid OTP. Please try again.";
      setError(msg);
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-3 sm:p-4 lg:p-6 py-8 sm:py-12">
      <div className="w-full max-w-5xl min-h-[500px] max-h-[580px] flex bg-white/5 border border-white/10 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">

        {/* ========================================= */}
        {/* LEFT SIDE - FORM */}
        {/* ========================================= */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-5 sm:p-8 lg:p-10 overflow-y-auto max-h-full">
          <div className="w-full max-w-sm my-auto">

            {/* HEADER */}
            <div className="mb-6">
              <h1 className="text-3xl font-bold mb-1.5">
                Welcome Back
              </h1>

              <p className="text-white/50 text-xs sm:text-sm">
                {otpSent
                  ? `Enter the OTP code sent to ${email}`
                  : "Please enter your email to sign in."}
              </p>
            </div>

            {/* ========================================= */}
            {/* FORM */}
            {/* ========================================= */}
            <form
              onSubmit={otpSent ? handleVerifyOtp : handleSendOtp}
              className="space-y-4"
            >
              {/* EMAIL */}
              <div>
                <label className="text-xs text-white/60 mb-1.5 block font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={otpSent}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors disabled:opacity-50"
                />
              </div>

              {/* ========================================= */}
              {/* OTP - ONLY SHOW AFTER OTP SENT */}
              {/* ========================================= */}
              {otpSent && (
                <div>
                  <label className="text-xs text-white/60 mb-1.5 block font-medium">
                    Enter Verification Code (OTP)
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    placeholder="••••••"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 6);
                      setOtp(value);
                    }}
                    autoFocus
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.35em] outline-none focus:border-[#FAD293]/60 transition-colors font-medium"
                  />

                  {/* RESEND OTP */}
                  <div className="flex justify-between items-center text-xs text-white/50 mt-2.5 px-1">
                    <span>Didn&apos;t receive code?</span>
                    <button
                      type="button"
                      disabled={countdown > 0 || resendingOtp}
                      onClick={handleResendOtp}
                      className="text-[#FAD293] hover:underline font-medium disabled:opacity-40 disabled:no-underline"
                    >
                      {resendingOtp
                        ? "Resending..."
                        : countdown > 0
                        ? `Resend in ${countdown}s`
                        : "Resend OTP"}
                    </button>
                  </div>
                </div>
              )}

              {/* ERROR */}
              {error && (
                <p className="text-red-400 text-xs">
                  {error}
                </p>
              )}

              {/* BUTTON */}
              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] mt-2 disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center"
                style={{
                  background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                }}
              >
                {loading ? (
                  <span className="flex items-center gap-2">
                    <svg
                      className="animate-spin h-4 w-4 text-black"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      />
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      />
                    </svg>
                    Processing...
                  </span>
                ) : otpSent ? (
                  "Verify & Sign In"
                ) : (
                  "Send OTP →"
                )}
              </button>

              {/* CHANGE EMAIL */}
              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-xs text-white/40 hover:text-white transition-colors text-center block pt-1"
                >
                  ← Change email
                </button>
              )}
            </form>

            {/* SIGN UP */}
            <p className="text-center text-xs text-white/50 mt-6 pt-4 border-t border-white/10">
              Don&apos;t have an account?{" "}
              <Link
                href="/get-started"
                className="text-[#FAD293] hover:underline font-medium"
              >
                Sign up
              </Link>
            </p>

          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE - IMAGE */}
        {/* ========================================= */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0800] border-l border-white/10 flex-col justify-end p-8 xl:p-10 overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/40 to-black/10"></div>

          <Image
            src="/hero-bg.jpg"
            alt="Luxury Car"
            fill
            className="object-cover opacity-75 mix-blend-luminosity"
            priority
          />

          <div className="relative z-20">
            <div
              className="inline-block px-3.5 py-1 rounded-full text-[11px] font-bold text-black mb-3"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              Provider Network
            </div>

            <h2 className="text-3xl font-bold mb-2.5 leading-tight text-white drop-shadow-lg">
              Access the UK&apos;s most exclusive automotive network.
            </h2>

            <p className="text-white/75 text-sm drop-shadow-md max-w-md">
              Join thousands of customers saving time and money on premium vehicle maintenance.
            </p>
          </div>
        </div>

      </div>
    </div>
  );
}