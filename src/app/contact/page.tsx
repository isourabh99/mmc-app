export default function ContactPage() {
  return (
    <div className="py-24 px-6 max-w-8xl mx-auto">
      <div className="text-center mb-16">
        <h1 className="text-5xl font-bold mb-6">Get in Touch</h1>
        <p className="text-white/60 max-w-2xl mx-auto text-lg">
          Whether you&apos;re a customer looking for assistance or a service provider wanting to join our network, our dedicated team is here to help you 24/7.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#FAD293]/40 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.05))", color: "#FAD293" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Email Support</h3>
            <p className="text-white/50 text-sm mb-4">Our team typically responds within 2 hours.</p>
            <a href="mailto:support@mmc.club" className="text-[#FAD293] font-medium hover:underline">support@mmc.club</a>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#FAD293]/40 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.05))", color: "#FAD293" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Phone</h3>
            <p className="text-white/50 text-sm mb-4">Available Mon-Fri, 9am - 6pm (GMT).</p>
            <a href="tel:08001234567" className="text-[#FAD293] font-medium hover:underline">0800 123 4567</a>
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 hover:border-[#FAD293]/40 transition-colors duration-300">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-6" style={{ background: "linear-gradient(135deg, rgba(250,210,147,0.15), rgba(206,164,107,0.05))", color: "#FAD293" }}>
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
            </div>
            <h3 className="text-xl font-bold mb-2">Headquarters</h3>
            <p className="text-white/50 text-sm mb-4">123 Automotive Way<br />London, SW1A 1AA<br />United Kingdom</p>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-3xl p-10 h-full">
            <h3 className="text-2xl font-bold mb-8">Send us a message</h3>
            <form className="space-y-6 text-left">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="text-sm text-white/50 mb-2 block font-medium">First Name</label>
                  <input type="text" placeholder="John" className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                </div>
                <div>
                  <label className="text-sm text-white/50 mb-2 block font-medium">Last Name</label>
                  <input type="text" placeholder="Doe" className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
                </div>
              </div>
              
              <div>
                <label className="text-sm text-white/50 mb-2 block font-medium">Email Address</label>
                <input type="email" placeholder="john@example.com" className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors" />
              </div>
              
              <div>
                <label className="text-sm text-white/50 mb-2 block font-medium">Subject</label>
                <select className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors appearance-none">
                  <option className="bg-black">General Inquiry</option>
                  <option className="bg-black">Customer Support</option>
                  <option className="bg-black">Provider Partnership</option>
                  <option className="bg-black">Billing Issue</option>
                </select>
              </div>

              <div>
                <label className="text-sm text-white/50 mb-2 block font-medium">Message</label>
                <textarea rows={5} placeholder="How can we help you?" className="w-full bg-black/50 border border-white/10 rounded-xl px-5 py-4 text-white outline-none focus:border-[#FAD293]/50 transition-colors resize-none"></textarea>
              </div>
              
              <button type="button" className="w-full md:w-auto px-10 py-4 rounded-xl font-bold text-black transition-all hover:scale-105 hover:shadow-[0_0_30px_rgba(250,210,147,0.3)]" style={{ background: "linear-gradient(135deg, #FAD293, #CEA46B)" }}>
                Send Message
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
