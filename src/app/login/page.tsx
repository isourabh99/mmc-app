"use client";

import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  sendOtp,
  loginCustomer,
} from "@/lib/auth.api";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // OTP send hone ke baad true hoga
  const [otpSent, setOtpSent] = useState(false);

  const router = useRouter();

  // =========================================
  // SEND OTP
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

      const response = await sendOtp(email.trim());

      console.log("OTP Response:", response);

      if (response.response_code === "default_200") {
        setOtpSent(true);
        setOtp("");
        setError("");
      } else {
        setError(
          response.message || "Failed to send OTP"
        );
      }
    } catch (error: any) {
      console.error("Send OTP error:", error);

      setError(
        error?.response?.data?.errors?.[0]?.message ||
          error?.response?.data?.message ||
          "Something went wrong"
      );
    } finally {
      setLoading(false);
    }
  };

  // =========================================
  // VERIFY OTP
  // =========================================

  const handleVerifyOtp = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setError("");

    if (!otp) {
      setError("Please enter OTP");
      return;
    }

    if (otp.length !== 4) {
      setError("Please enter a valid 4-digit OTP");
      return;
    }

    try {
      setLoading(true);

      const response = await loginCustomer({
        email: email.trim(),
        otp: Number(otp),
      });

      console.log("Login Response:", response);

      if (
        response.response_code === "auth_login_200"
      ) {
        const token = response.content?.token;

        if (!token) {
          setError(
            "Login successful but token was not received."
          );
          return;
        }

        localStorage.setItem("token", token);

        localStorage.setItem(
          "is_active",
          String(response.content?.is_active ?? 0)
        );

        router.push("/");
      } else {
        setError(
          response.message || "Invalid OTP"
        );
      }
    } catch (error: any) {
      console.error("OTP verification error:", error);

      setError(
        error?.response?.data?.errors?.[0]?.message ||
          error?.response?.data?.message ||
          "Invalid OTP. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto w-full min-h-[85vh] flex py-12 px-6">
      <div className="flex w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* ========================================= */}
        {/* LEFT SIDE - FORM */}
        {/* ========================================= */}

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">

            {/* HEADER */}

            <div className="mb-10">
              <h1 className="text-4xl font-bold mb-3">
                Welcome Back
              </h1>

              <p className="text-white/50">
                {otpSent
                  ? "Enter the 4-digit OTP sent to your email."
                  : "Please enter your email to sign in."}
              </p>
            </div>

            {/* ========================================= */}
            {/* EMAIL FORM */}
            {/* ========================================= */}

            <form
              onSubmit={
                otpSent
                  ? handleVerifyOtp
                  : handleSendOtp
              }
              className="space-y-6"
            >

              {/* EMAIL */}

              <div>
                <label className="text-sm text-white/60 mb-2 block font-medium">
                  Email Address
                </label>

                <input
                  type="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) =>
                    setEmail(e.target.value)
                  }
                  disabled={otpSent}
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors disabled:opacity-50"
                />
              </div>

              {/* ========================================= */}
              {/* OTP - ONLY SHOW AFTER OTP SENT */}
              {/* ========================================= */}

              {otpSent && (
                <div>
                  <label className="text-sm text-white/60 mb-2 block font-medium">
                    Enter 4-Digit OTP
                  </label>

                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={4}
                    placeholder="••••"
                    value={otp}
                    onChange={(e) => {
                      const value = e.target.value
                        .replace(/\D/g, "")
                        .slice(0, 4);

                      setOtp(value);
                    }}
                    autoFocus
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white text-center text-2xl tracking-[0.5em] outline-none focus:border-[#FAD293]/50 transition-colors"
                  />

                  <p className="text-white/40 text-xs mt-2 text-center">
                    Enter the 4-digit OTP sent to your
                    email.
                  </p>
                </div>
              )}

              {/* ERROR */}

              {error && (
                <p className="text-red-400 text-sm">
                  {error}
                </p>
              )}

              {/* ========================================= */}
              {/* BUTTON */}
              {/* ========================================= */}

              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 rounded-xl font-bold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] mt-2 disabled:opacity-70 disabled:hover:scale-100"
                style={{
                  background:
                    "linear-gradient(135deg, #FAD293, #CEA46B)",
                }}
              >
                {loading
                  ? otpSent
                    ? "Verifying..."
                    : "Sending OTP..."
                  : otpSent
                  ? "Verify OTP"
                  : "Send OTP"}
              </button>

              {/* ========================================= */}
              {/* CHANGE EMAIL */}
              {/* ========================================= */}

              {otpSent && (
                <button
                  type="button"
                  onClick={() => {
                    setOtpSent(false);
                    setOtp("");
                    setError("");
                  }}
                  className="w-full text-sm text-white/40 hover:text-white transition-colors"
                >
                  ← Change email
                </button>
              )}

              {/* ========================================= */}
              {/* REMEMBER / FORGOT */}
              {/* ========================================= */}

              {!otpSent && (
                <div className="flex justify-between items-center text-sm">
                  <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                    <input
                      type="checkbox"
                      className="rounded border-white/20 bg-black/50 w-4 h-4 accent-[#FAD293]"
                    />
                    Remember me
                  </label>

                  <Link
                    href="#"
                    className="text-[#FAD293] hover:underline font-medium"
                  >
                    Forgot password?
                  </Link>
                </div>
              )}
            </form>

            {/* ========================================= */}
            {/* SIGN UP */}
            {/* ========================================= */}

            <p className="text-center text-sm text-white/50 mt-10">
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

        <div className="hidden lg:block lg:w-1/2 relative bg-[#0a0800] border-l border-white/10">

          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>

          <Image
            src="/hero-bg.jpg"
            alt="Luxury Car"
            fill
            className="object-cover opacity-80 mix-blend-luminosity"
          />

          <div className="absolute bottom-16 left-12 right-12 z-20">

            <div
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-black mb-4"
              style={{
                background:
                  "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              Provider Network
            </div>

            <h2 className="text-4xl font-bold mb-4 leading-tight text-white drop-shadow-lg">
              Access the UK&apos;s most exclusive
              automotive service network.
            </h2>

            <p className="text-white/80 max-w-md text-lg drop-shadow-md">
              Join thousands of customers saving
              time and money on premium vehicle
              maintenance.
            </p>

          </div>
        </div>

      </div>
    </div>
  );
}