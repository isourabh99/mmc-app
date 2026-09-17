import Link from "next/link";
import Image from "next/image";

export default function LoginPage() {
  return (
    <div className="max-w-8xl mx-auto w-full min-h-[85vh] flex py-12 px-6">
      <div className="flex w-full bg-white/5 border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
        {/* Left side - Form */}
        <div className="w-full lg:w-1/2 flex items-center justify-center p-6 lg:p-12">
          <div className="w-full max-w-md">
            <div className="mb-10">
              <h1 className="text-4xl font-bold mb-3">Welcome Back</h1>
              <p className="text-white/50">Please enter your details to sign in.</p>
            </div>
            
            <form className="space-y-6">
              <div>
                <label className="text-sm text-white/60 mb-2 block font-medium">Email Address</label>
                <input 
                  type="email" 
                  placeholder="you@example.com" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors" 
                />
              </div>
              
              <div>
                <label className="text-sm text-white/60 mb-2 block font-medium">Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors" 
                />
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <label className="flex items-center gap-2 text-white/60 cursor-pointer">
                  <input type="checkbox" className="rounded border-white/20 bg-black/50 w-4 h-4 accent-[#FAD293]" />
                  Remember me
                </label>
                <Link href="#" className="text-[#FAD293] hover:underline font-medium">Forgot password?</Link>
              </div>
              
              <button 
                type="button" 
                className="w-full py-4 rounded-xl font-bold text-black transition-all hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(250,210,147,0.3)] mt-2" 
                style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}
              >
                Sign In
              </button>
              
              <div className="relative flex items-center py-4">
                <div className="flex-grow border-t border-white/10"></div>
                <span className="flex-shrink-0 mx-4 text-white/40 text-sm">Or continue with</span>
                <div className="flex-grow border-t border-white/10"></div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <button type="button" className="flex items-center justify-center gap-2 py-3.5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white/80 bg-black/30">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                  Google
                </button>
                <button type="button" className="flex items-center justify-center gap-2 py-3.5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors text-sm font-medium text-white/80 bg-black/30">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M14.39 12c0-1.89-1.54-3.41-3.41-3.41S7.57 10.11 7.57 12s1.54 3.42 3.41 3.42 3.42-1.53 3.42-3.42M12 22C6.48 22 2 17.52 2 12S6.48 2 12 2s10 4.48 10 10-4.48 10-10 10" /></svg>
                  Apple
                </button>
              </div>
            </form>
            
            <p className="text-center text-sm text-white/50 mt-10">
              Don&apos;t have an account? <Link href="/get-started" className="text-[#FAD293] hover:underline font-medium">Sign up</Link>
            </p>
          </div>
        </div>
        
        {/* Right side - Image (hidden on mobile) */}
        <div className="hidden lg:block lg:w-1/2 relative bg-[#0a0800] border-l border-white/10">
          <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/90 via-black/40 to-black/10"></div>
          <Image 
            src="/hero-bg.jpg" 
            alt="Luxury Car" 
            fill 
            className="object-cover opacity-80 mix-blend-luminosity"
          />
          <div className="absolute bottom-16 left-12 right-12 z-20">
            <div className="inline-block px-4 py-1.5 rounded-full text-xs font-bold text-black mb-4" style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}>
              Provider Network
            </div>
            <h2 className="text-4xl font-bold mb-4 leading-tight text-white drop-shadow-lg">Access the UK&apos;s most exclusive automotive service network.</h2>
            <p className="text-white/80 max-w-md text-lg drop-shadow-md">Join thousands of customers saving time and money on premium vehicle maintenance.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
