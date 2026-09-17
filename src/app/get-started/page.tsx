"use client";

import { useState } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import Image from "next/image";

export default function GetStartedPage() {
  const { showToast } = useToast();
  
  // State for Step 1: Registration
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(false);
  
  const [formData, setFormData] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    confirm_password: "",
    gender: "male",
  });

  // State for Step 2: OTP Verification
  const [otp, setOtp] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleRegistrationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirm_password) {
      showToast("Passwords do not match.", "error");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("http://localhost/mmc/api/v1/customer/auth/registration-request", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || "Registration successful! Please verify your email.", "success");
        setStep(2);
      } else {
        showToast(data.message || "Registration failed. Please check your details.", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch("http://localhost/mmc/api/v1/customer/auth/registration-verify", {
        method: "POST",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          otp: otp,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        showToast(data.message || "Account verified successfully! Welcome to MMC.", "success");
        // Typically you would redirect to login or dashboard here
        setTimeout(() => {
          window.location.href = "/login";
        }, 2000);
      } else {
        showToast(data.message || "Verification failed. Invalid OTP.", "error");
      }
    } catch (error) {
      showToast("Network error. Please try again later.", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-8xl mx-auto w-full min-h-[85vh] flex py-12 px-6">
      <div className="flex w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Left side - Image (hidden on mobile) */}
        <div className="hidden lg:block lg:w-1/2 relative bg-[#0a0800] border-r border-white/10">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
          <Image 
            src="/hero-bg.jpg" 
            alt="Luxury Car" 
            fill 
            className="object-cover opacity-80 mix-blend-luminosity scale-x-[-1]"
          />
          <div className="absolute bottom-16 left-12 right-12 z-20">
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-black mb-4" style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}>
              Join MMC
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight text-white drop-shadow-lg">Experience automotive excellence at your fingertips.</h2>
            <p className="text-white/80 max-w-md text-lg drop-shadow-md">Register today to connect with certified service providers and manage all your vehicle needs in one place.</p>
          </div>
        </div>

        {/* Right side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12 relative overflow-y-auto">
          <div className="w-full max-w-md my-auto">
            {/* Progress Tracker */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center gap-4">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 1 ? "bg-[#FAD293] text-black" : "bg-white/10 text-white/50"}`}>1</div>
                <div className={`w-16 h-px transition-colors ${step >= 2 ? "bg-[#FAD293]" : "bg-white/10"}`}></div>
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${step >= 2 ? "bg-[#FAD293] text-black" : "bg-white/10 text-white/50"}`}>2</div>
              </div>
            </div>

            {step === 1 ? (
              <>
                <div className="text-center mb-8">
                  <h1 className="text-3xl font-bold mb-2">Create an Account</h1>
                  <p className="text-white/50 text-sm">Join the UK&apos;s premium automotive marketplace.</p>
                </div>

                <form onSubmit={handleRegistrationSubmit} className="space-y-4 text-left">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block font-medium">First Name</label>
                      <input required name="first_name" value={formData.first_name} onChange={handleInputChange} type="text" placeholder="John" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block font-medium">Last Name</label>
                      <input required name="last_name" value={formData.last_name} onChange={handleInputChange} type="text" placeholder="Doe" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                    </div>
                  </div>

                  <div>
                    <label className="text-sm text-white/60 mb-1.5 block font-medium">Email Address</label>
                    <input required name="email" value={formData.email} onChange={handleInputChange} type="email" placeholder="you@example.com" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block font-medium">Phone Number</label>
                      <input required name="phone" value={formData.phone} onChange={handleInputChange} type="tel" placeholder="+919876543930" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block font-medium">Gender</label>
                      <select name="gender" value={formData.gender} onChange={handleInputChange} className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors appearance-none">
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block font-medium">Password</label>
                      <input required name="password" value={formData.password} onChange={handleInputChange} type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                    </div>
                    <div>
                      <label className="text-sm text-white/60 mb-1.5 block font-medium">Confirm Password</label>
                      <input required name="confirm_password" value={formData.confirm_password} onChange={handleInputChange} type="password" placeholder="••••••••" className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                    </div>
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-3.5 rounded-xl font-bold text-black transition-all hover:scale-[1.01] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] mt-4 disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center gap-2" 
                    style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                  >
                    {loading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-2 h-5 w-5 text-black" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Processing...
                      </>
                    ) : (
                      "Create Account →"
                    )}
                  </button>
                  
                  <p className="text-center text-sm text-white/50 mt-4 pt-4 border-t border-white/10">
                    Already have an account? <Link href="/login" className="text-[#FAD293] hover:underline font-medium">Sign in</Link>
                  </p>
                </form>
              </>
            ) : (
              <>
                <div className="text-center mb-10">
                  <div className="w-16 h-16 mx-auto bg-white/5 border border-white/10 rounded-full flex items-center justify-center mb-6 text-[#FAD293]">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                  </div>
                  <h1 className="text-3xl font-bold mb-3">Verify Your Email</h1>
                  <p className="text-white/50">
                    We&apos;ve sent a verification code to <br/><span className="text-white font-medium">{formData.email}</span>
                  </p>
                </div>

                <form onSubmit={handleVerifySubmit} className="space-y-6 text-center">
                  <div>
                    <label className="text-sm text-white/60 mb-2 block font-medium">Enter OTP Code</label>
                    <input 
                      required 
                      value={otp} 
                      onChange={(e) => setOtp(e.target.value)} 
                      type="text" 
                      placeholder="e.g. 8952" 
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-4 text-white text-center text-2xl tracking-[0.2em] font-medium outline-none focus:border-[#FAD293]/50 transition-colors" 
                    />
                  </div>

                  <button 
                    type="submit" 
                    disabled={loading}
                    className="w-full py-4 rounded-xl font-bold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] disabled:opacity-70 disabled:hover:scale-100 flex justify-center items-center" 
                    style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
                  >
                    {loading ? "Verifying..." : "Verify Account"}
                  </button>
                  
                  <button 
                    type="button" 
                    onClick={() => setStep(1)}
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
