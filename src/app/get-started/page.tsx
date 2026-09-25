"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

import {
  registerCustomer,
  resendOtp,
  verifyOtp,
} from "@/lib/auth.api";
import { getCustomerProfile } from "@/app/services/api/profile.api";

export default function GetStartedPage() {
  const { showToast } = useToast();
  const router = useRouter();

  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  const [resendingOtp, setResendingOtp] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "male",
    password: "",
    confirm_password: "",
  });

  const [otp, setOtp] = useState("");

  // Countdown timer for Resend OTP
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    }
    return () => clearTimeout(timer);
  }, [countdown]);

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --------------------------------
  // REGISTRATION SUBMIT
  // --------------------------------
  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (
      formData.password &&
      formData.confirm_password &&
      formData.password !== formData.confirm_password
    ) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);

    try {
      const payload = new FormData();
      payload.append("first_name", formData.first_name);
      payload.append("last_name", formData.last_name);
      payload.append("email", formData.email.trim());
      payload.append("phone", formData.phone.trim());
      payload.append("gender", formData.gender);
      payload.append("password", formData.password || "password123");
      payload.append(
        "confirm_password",
        formData.confirm_password || formData.password || "password123"
      );

      const registrationResponse = await registerCustomer(payload);

      const code = String(registrationResponse?.response_code || "");
      const isSuccess =
        code === "registration_200" ||
        code === "default_200" ||
        code.includes("200") ||
        registrationResponse?.status === "success" ||
        registrationResponse?.status === true;

      if (!isSuccess && registrationResponse?.errors?.length) {
        showToast(
          registrationResponse.errors[0]?.message || "Registration failed.",
          "error"
        );
        return;
      }

      showToast(
        registrationResponse?.message || "Registration successful!",
        "success"
      );

      // Attempt to trigger OTP if not automatically sent
      try {
        await resendOtp(formData.email.trim());
      } catch (otpErr) {
        console.log("Resend OTP trigger note:", otpErr);
      }

      // Move to OTP step & start countdown
      setStep(2);
      setCountdown(30);
    } catch (error: any) {
      console.error("Registration Error:", error);
      const msg =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        "Something went wrong. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // RESEND OTP
  // --------------------------------
  const handleResendOtp = async () => {
    if (countdown > 0 || resendingOtp) return;
    setResendingOtp(true);
    try {
      const response = await resendOtp(formData.email.trim());
      showToast(
        response?.message || "OTP resent successfully to your email!",
        "success"
      );
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

  // --------------------------------
  // OTP VERIFICATION / LOGIN
  // --------------------------------
  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!otp.trim()) {
      showToast("Please enter the OTP code.", "error");
      return;
    }

    if (otp.length < 4 || otp.length > 6) {
      showToast("Please enter a valid OTP code (4-6 digits).", "error");
      return;
    }

    setLoading(true);

    try {
      const loginResponse = await verifyOtp({
        email: formData.email.trim(),
        otp: otp.trim(),
      });

      const code = String(loginResponse?.response_code || "");
      const isSuccess =
        code === "auth_login_200" ||
        code === "default_200" ||
        code.includes("200") ||
        Boolean(loginResponse?.content?.token || loginResponse?.token);

      if (isSuccess) {
        const token = loginResponse.content?.token || loginResponse?.token;

        if (!token) {
          showToast(
            "Verification successful but token was not received.",
            "error"
          );
          return;
        }

        localStorage.setItem("token", token);
        localStorage.setItem(
          "is_active",
          String(loginResponse.content?.is_active ?? 1)
        );

        // Pre-fetch customer profile
        try {
          const profileRes = await getCustomerProfile();
          if (profileRes?.content) {
            localStorage.setItem("user", JSON.stringify(profileRes.content));
          }
        } catch (profileErr) {
          console.warn("Could not pre-fetch profile:", profileErr);
        }

        // Notify Navbar / components
        window.dispatchEvent(new Event("storage"));
        window.dispatchEvent(new CustomEvent("auth-change"));

        showToast("Successfully logged in! Welcome to MMC.", "success");
        router.push("/account");
      } else {
        showToast(loginResponse?.message || "Invalid OTP.", "error");
      }
    } catch (error: any) {
      console.error("OTP Verification Error:", error);
      const msg =
        error?.response?.data?.errors?.[0]?.message ||
        error?.response?.data?.message ||
        "Invalid OTP. Please try again.";
      showToast(msg, "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-5rem)] flex items-center justify-center p-3 sm:p-4 lg:p-6 py-8 sm:py-12">
      <div className="w-full max-w-6xl min-h-[560px] max-h-[660px] flex bg-white/5 border border-white/10 rounded-2xl lg:rounded-3xl overflow-hidden shadow-2xl">
        {/* ========================================= */}
        {/* LEFT SIDE - IMAGE */}
        {/* ========================================= */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-[#0a0800] border-r border-white/10 flex-col justify-end p-8 xl:p-10 overflow-hidden">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/95 via-black/40 to-black/10"></div>

          <Image
            src="/hero-bg.jpg"
            alt="Luxury Car"
            fill
            className="object-cover opacity-75 mix-blend-luminosity scale-x-[-1]"
            priority
          />

          <div className="relative z-20">
            <div
              className="inline-block px-3.5 py-1 rounded-full text-[11px] font-bold text-black mb-3"
              style={{
                background: "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              Join MMC
            </div>

            <h2 className="text-3xl xl:text-4xl font-bold mb-2.5 leading-tight text-white drop-shadow-lg">
              Experience automotive excellence at your fingertips.
            </h2>

            <p className="text-white/75 text-sm xl:text-base drop-shadow-md max-w-md">
              Register today to connect with certified service providers and
              manage all your vehicle needs in one place.
            </p>
          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE - FORM */}
        {/* ========================================= */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-4 sm:p-6 lg:p-8 xl:p-10 overflow-y-auto max-h-full">
          <div className="w-full max-w-md my-auto">
            {/* PROGRESS INDICATOR */}
            <div className="flex items-center justify-center mb-5">
              <div className="flex items-center gap-3">
                <div
                  className={`
                    w-7 h-7 rounded-full
                    flex items-center justify-center
                    text-xs font-bold
                    transition-colors
                    ${
                      step >= 1
                        ? "bg-[#FAD293] text-black"
                        : "bg-white/10 text-white/50"
                    }
                  `}
                >
                  1
                </div>

                <div
                  className={`
                    w-12 h-px transition-colors
                    ${step >= 2 ? "bg-[#FAD293]" : "bg-white/10"}
                  `}
                ></div>

                <div
                  className={`
                    w-7 h-7 rounded-full
                    flex items-center justify-center
                    text-xs font-bold
                    transition-colors
                    ${
                      step >= 2
                        ? "bg-[#FAD293] text-black"
                        : "bg-white/10 text-white/50"
                    }
                  `}
                >
                  2
                </div>
              </div>
            </div>

            {/* ========================================= */}
            {/* STEP 1 - REGISTRATION */}
            {/* ========================================= */}
            {step === 1 ? (
              <>
                <div className="text-center mb-5">
                  <h1 className="text-2xl lg:text-3xl font-bold mb-1">
                    Create an Account
                  </h1>
                  <p className="text-white/50 text-xs">
                    Join the UK&apos;s premium automotive marketplace.
                  </p>
                </div>

                <form
                  onSubmit={handleRegistrationSubmit}
                  className="space-y-3 text-left"
                >
                  {/* FIRST + LAST NAME */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60 mb-1 block font-medium">
                        First Name
                      </label>
                      <input
                        required
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Rahul"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/60 mb-1 block font-medium">
                        Last Name
                      </label>
                      <input
                        required
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Sharma"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors"
                      />
                    </div>
                  </div>

                  {/* EMAIL */}
                  <div>
                    <label className="text-xs text-white/60 mb-1 block font-medium">
                      Email Address
                    </label>
                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      type="email"
                      placeholder="rahul@gmail.com"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors"
                    />
                  </div>

                  {/* PHONE + GENDER */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60 mb-1 block font-medium">
                        Phone Number
                      </label>
                      <input
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        type="tel"
                        placeholder="+919876543210"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/60 mb-1 block font-medium">
                        Gender
                      </label>
                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors appearance-none"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  {/* PASSWORD + CONFIRM PASSWORD */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-white/60 mb-1 block font-medium">
                        Password
                      </label>
                      <input
                        name="password"
                        value={formData.password}
                        onChange={handleInputChange}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-white/60 mb-1 block font-medium">
                        Confirm Password
                      </label>
                      <input
                        name="confirm_password"
                        value={formData.confirm_password}
                        onChange={handleInputChange}
                        type="password"
                        placeholder="••••••••"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-3.5 py-2.5 text-sm text-white outline-none focus:border-[#FAD293]/60 transition-colors"
                      />
                    </div>
                  </div>

                  {/* CREATE ACCOUNT BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] mt-2 disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >
                    {loading ? (
                      <>
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
                      </>
                    ) : (
                      "Create Account →"
                    )}
                  </button>

                  {/* LOGIN LINK */}
                  <p className="text-center text-xs text-white/50 pt-2 border-t border-white/10">
                    Already have an account?
                    <Link
                      href="/login"
                      className="text-[#FAD293] hover:underline font-medium ml-1"
                    >
                      Sign in
                    </Link>
                  </p>
                </form>
              </>
            ) : (
              /* ========================================= */
              /* STEP 2 - OTP */
              /* ========================================= */
              <>
                <div className="text-center mb-6">
                  <div className="w-14 h-14 mx-auto bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-4 text-[#FAD293]">
                    <svg
                      className="w-7 h-7"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                  </div>

                  <h1 className="text-2xl font-bold mb-1.5">
                    Verify Your Email
                  </h1>

                  <p className="text-white/50 text-xs">
                    We&apos;ve sent a verification code to
                    <br />
                    <span className="text-white font-medium">
                      {formData.email}
                    </span>
                  </p>
                </div>

                <form
                  onSubmit={handleVerifySubmit}
                  className="space-y-4 text-center"
                >
                  {/* OTP INPUT */}
                  <div>
                    <label className="text-xs text-white/60 mb-2 block font-medium">
                      Enter Verification Code (OTP)
                    </label>

                    <input
                      required
                      value={otp}
                      onChange={(e) => {
                        const value = e.target.value
                          .replace(/\D/g, "")
                          .slice(0, 6);
                        setOtp(value);
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="e.g. 123456"
                      autoFocus
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white text-center text-2xl tracking-[0.25em] font-medium outline-none focus:border-[#FAD293]/60 transition-colors"
                    />
                  </div>

                  {/* RESEND OTP */}
                  <div className="flex justify-between items-center text-xs text-white/50 px-1">
                    <span>Didn&apos;t receive the code?</span>
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

                  {/* VERIFY BUTTON */}
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-sm text-black transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center"
                    style={{
                      background: "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >
                    {loading ? "Verifying..." : "Verify Account"}
                  </button>

                  {/* BACK */}
                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                    }}
                    className="w-full text-xs text-white/40 hover:text-white transition-colors"
                  >
                    ← Back to registration
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}