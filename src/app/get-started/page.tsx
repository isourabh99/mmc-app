"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

import {
  registerCustomer,
  sendOtp,
  loginCustomer,
} from "@/app/services/api/auth.api";

export default function GetStartedPage() {
  const { showToast } = useToast();
  const router = useRouter();

  // --------------------------------
  // STEP
  // --------------------------------

  const [step, setStep] = useState<1 | 2>(1);

  const [loading, setLoading] = useState(false);

  // --------------------------------
  // REGISTRATION FORM
  // --------------------------------

  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    gender: "male",
    date_of_birth: "",
  });

  // --------------------------------
  // OTP
  // --------------------------------

  const [otp, setOtp] = useState("");

  // --------------------------------
  // HANDLE INPUT
  // --------------------------------

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  // --------------------------------
  // REGISTRATION
  // --------------------------------

  const handleRegistrationSubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    setLoading(true);

    try {
      // 1. Register customer
      const registrationResponse =
        await registerCustomer(formData);

      console.log(
        "Registration Response:",
        registrationResponse
      );

      // Check registration response
      if (
        registrationResponse.response_code !==
        "registration_200"
      ) {
        showToast(
          registrationResponse.message ||
            "Registration failed.",
          "error"
        );

        return;
      }

      // Registration successful
      showToast(
        "Registration successful!",
        "success"
      );

      // --------------------------------
      // 2. Send OTP
      // --------------------------------

      const otpResponse = await sendOtp(
        formData.email
      );

      console.log(
        "OTP Response:",
        otpResponse
      );

      if (
        otpResponse.response_code !==
        "default_200"
      ) {
        showToast(
          otpResponse.message ||
            "Failed to send OTP.",
          "error"
        );

        return;
      }

      // OTP sent successfully
      showToast(
        "OTP sent successfully!",
        "success"
      );

      // Move to OTP step
      setStep(2);

    } catch (error: any) {
      console.error("Registration Error:", error);
  console.log("STATUS:", error?.response?.status);
  console.log("RESPONSE DATA:", error?.response?.data);
  console.log("SENT DATA:", formData);

  showToast(
  error?.response?.data?.errors?.[0]?.message ||
    "Something went wrong. Please try again.",
  "error"
);
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // OTP VERIFICATION / LOGIN
  // --------------------------------

  const handleVerifySubmit = async (
    e: React.FormEvent
  ) => {
    e.preventDefault();

    if (!otp) {
      showToast(
        "Please enter OTP.",
        "error"
      );

      return;
    }

    if (otp.length !== 4) {
      showToast(
        "Please enter a valid 4-digit OTP.",
        "error"
      );

      return;
    }

    setLoading(true);

    try {
      // Convert OTP string to number
      const otpNumber = Number(otp);

      // Login API
      const loginResponse =
        await loginCustomer({
          email: formData.email,
          otp: otpNumber,
        });

      console.log(
        "Login Response:",
        loginResponse
      );

     

      if (
        loginResponse.response_code ===
        "auth_login_200"
      ) {
        const token =
          loginResponse.content?.token;

        if (!token) {
          showToast(
            "Login successful but token was not received.",
            "error"
          );

          return;
        }

       
        localStorage.setItem(
          "token",
          token
        );

       
        localStorage.setItem(
          "is_active",
          String(
            loginResponse.content?.is_active ?? 0
          )
        );

        showToast(
          "Successfully logged in!",
          "success"
        );

        // Redirect
        router.push("/dashboard");

      } else {
        showToast(
          loginResponse.message ||
            "Invalid OTP.",
          "error"
        );
      }

    } catch (error: any) {
      console.error(
        "OTP Verification Error:",
        error
      );

      showToast(
        error?.response?.data?.message ||
          "Invalid OTP. Please try again.",
        "error"
      );
    } finally {
      setLoading(false);
    }
  };

  // --------------------------------
  // UI
  // --------------------------------

  return (
    <div className="max-w-8xl mx-auto w-full min-h-[85vh] flex py-12 px-6">

      <div className="flex w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">

        {/* ========================================= */}
        {/* LEFT SIDE - IMAGE */}
        {/* ========================================= */}

        <div className="hidden lg:block lg:w-1/2 relative bg-[#0a0800] border-r border-white/10">

          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>

          <Image
            src="/hero-bg.jpg"
            alt="Luxury Car"
            fill
            className="object-cover opacity-80 mix-blend-luminosity scale-x-[-1]"
          />

          <div className="absolute bottom-16 left-12 right-12 z-20">

            <div
              className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-black mb-4"
              style={{
                background:
                  "linear-gradient(135deg, #FAD293, #CEA46B)",
              }}
            >
              Join MMC
            </div>

            <h2 className="text-4xl font-bold mb-4 leading-tight text-white drop-shadow-lg">
              Experience automotive excellence at
              your fingertips.
            </h2>

            <p className="text-white/80 max-w-md text-lg drop-shadow-md">
              Register today to connect with
              certified service providers and
              manage all your vehicle needs in
              one place.
            </p>

          </div>
        </div>

        {/* ========================================= */}
        {/* RIGHT SIDE */}
        {/* ========================================= */}

        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">

          <div className="w-full max-w-md my-auto">

            {/* ========================================= */}
            {/* PROGRESS */}
            {/* ========================================= */}

            <div className="flex items-center justify-center mb-8">

              <div className="flex items-center gap-4">

                <div
                  className={`
                    w-8 h-8 rounded-full
                    flex items-center justify-center
                    text-sm font-bold
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
                    w-16 h-px transition-colors
                    ${
                      step >= 2
                        ? "bg-[#FAD293]"
                        : "bg-white/10"
                    }
                  `}
                ></div>

                <div
                  className={`
                    w-8 h-8 rounded-full
                    flex items-center justify-center
                    text-sm font-bold
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
                <div className="text-center mb-8">

                  <h1 className="text-3xl font-bold mb-2">
                    Create an Account
                  </h1>

                  <p className="text-white/50 text-sm">
                    Join the UK&apos;s premium
                    automotive marketplace.
                  </p>

                </div>

                <form
                  onSubmit={handleRegistrationSubmit}
                  className="space-y-4 text-left"
                >

                  {/* FIRST + LAST NAME */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                      <label className="text-sm text-white/60 mb-1.5 block font-medium">
                        First Name
                      </label>

                      <input
                        required
                        name="first_name"
                        value={formData.first_name}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="John"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors"
                      />

                    </div>

                    <div>

                      <label className="text-sm text-white/60 mb-1.5 block font-medium">
                        Last Name
                      </label>

                      <input
                        required
                        name="last_name"
                        value={formData.last_name}
                        onChange={handleInputChange}
                        type="text"
                        placeholder="Doe"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors"
                      />

                    </div>

                  </div>

                  {/* EMAIL */}

                  <div>

                    <label className="text-sm text-white/60 mb-1.5 block font-medium">
                      Email Address
                    </label>

                    <input
                      required
                      name="email"
                      value={formData.email}
                      onChange={handleInputChange}
                      type="email"
                      placeholder="you@example.com"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors"
                    />

                  </div>

                  {/* PHONE + GENDER */}

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

                    <div>

                      <label className="text-sm text-white/60 mb-1.5 block font-medium">
                        Phone Number
                      </label>

                      <input
                        required
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        type="tel"
                        placeholder="+919876543930"
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors"
                      />

                    </div>

                    <div>

                      <label className="text-sm text-white/60 mb-1.5 block font-medium">
                        Gender
                      </label>

                      <select
                        name="gender"
                        value={formData.gender}
                        onChange={handleInputChange}
                        className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors appearance-none"
                      >
                        <option value="male">
                          Male
                        </option>

                        <option value="female">
                          Female
                        </option>

                        <option value="other">
                          Other
                        </option>
                      </select>

                    </div>

                  </div>

                  {/* DATE OF BIRTH */}

                  <div>

                    <label className="text-sm text-white/60 mb-1.5 block font-medium">
                      Date of Birth
                    </label>

                    <input
                      required
                      name="date_of_birth"
                      value={formData.date_of_birth}
                      onChange={handleInputChange}
                      type="date"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors"
                    />

                  </div>

                  {/* CREATE ACCOUNT */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-black transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] mt-4 disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2"
                    style={{
                      background:
                        "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >

                    {loading ? (
                      <>
                        <svg
                          className="animate-spin h-5 w-5 text-black"
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

                  <p className="text-center text-sm text-white/50 mt-4 pt-4 border-t border-white/10">

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

                <div className="text-center mb-10">

                  <div className="w-16 h-16 mx-auto bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 text-[#FAD293]">

                    <svg
                      className="w-8 h-8"
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

                  <h1 className="text-3xl font-bold mb-3">
                    Verify Your Email
                  </h1>

                  <p className="text-white/50">

                    We&apos;ve sent a verification
                    code to

                    <br />

                    <span className="text-white font-medium">
                      {formData.email}
                    </span>

                  </p>

                </div>

                <form
                  onSubmit={handleVerifySubmit}
                  className="space-y-6 text-center"
                >

                  {/* OTP INPUT */}

                  <div>

                    <label className="text-sm text-white/60 mb-2 block font-medium">
                      Enter OTP Code
                    </label>

                    <input
                      required
                      value={otp}
                      onChange={(e) => {
                        const value =
                          e.target.value
                            .replace(/\D/g, "")
                            .slice(0, 4);

                        setOtp(value);
                      }}
                      type="text"
                      inputMode="numeric"
                      maxLength={4}
                      placeholder="e.g. 8952"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.2em] font-medium outline-none focus:border-[#FAD293]/50 transition-colors"
                    />

                  </div>

                  {/* VERIFY BUTTON */}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center"
                    style={{
                      background:
                        "linear-gradient(135deg, #FAD293, #CEA46B)",
                    }}
                  >

                    {loading
                      ? "Verifying..."
                      : "Verify Account"}

                  </button>

                  {/* BACK */}

                  <button
                    type="button"
                    onClick={() => {
                      setStep(1);
                      setOtp("");
                    }}
                    className="w-full text-sm text-white/40 hover:text-white transition-colors"
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