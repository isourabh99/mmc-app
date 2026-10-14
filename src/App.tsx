import React, { Suspense, lazy } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

// Global Layout Components
import LocationPermission from "@/components/LocationPermission";
import { ToastProvider } from "@/components/ToastProvider";
import FirebaseNotificationListener from "@/components/FirebaseNotificationListener";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Page Components
import HomePage from "./app/page";
import AboutPage from "./app/about/page";
import AccountPage from "./app/account/page";
import BookingSuccessPage from "./app/booking-success/page";
import CancellationPolicyPage from "./app/cancellation-policy/page";
import CarHirePage from "./app/car-hire/page";
import CarDetailPage from "./app/car-hire/[id]/page";
import CarBookingPage from "./app/car-hire/[id]/book/page";
import ContactPage from "./app/contact/page";
import EmergencyAssistancePage from "./app/emergency-assistance/page";
import EstimatePage from "./app/estimate/page";
import EstimateDetailPage from "./app/estimate/[token]/page";
import EstimatesListPage from "./app/estimates/page";
import FaqsPage from "./app/faqs/page";
import GetStartedPage from "./app/get-started/page";
import HowItWorksPage from "./app/how-it-works/page";
import LoginPage from "./app/login/page";
import NotificationsPage from "./app/notifications/page";
import PrivacyPolicyPage from "./app/privacy-policy/page";
import ProfilePage from "./app/profile/page";
import ProviderEstimatesPage from "./app/provider-estimates/page";
import ProviderEstimatesDetailPage from "./app/provider-estimates/details/page";
import ProviderEstimatesDetailTokenPage from "./app/provider-estimates/details/[token]/page";
import ProviderEstimatesIdPage from "./app/provider-estimates/[id]/page";
import RefundPolicyPage from "./app/refund-policy/page";
import ServicesPage from "./app/services/page";
import AlloyWheelPage from "./app/services/alloy-wheel/page";
import AlloyRefurbPage from "./app/services/Alloy Refurbishment/page";
import BodyworkPage from "./app/services/bodywork/page";
import ServicesCarHirePage from "./app/services/car-hire/page";
import ChauffeurPage from "./app/services/Chauffeur/page";
import ChauffeurDetailPage from "./app/services/Chauffeur/[id]/page";
import MechanicalPage from "./app/services/mechanical/page";
import ModificationPage from "./app/services/modification/page";
import ModificationsAltPage from "./app/services/Modifications/page";
import TyreFittingsServicesPage from "./app/services/tyre-fittings/page";
import TyreFittingsDirectPage from "./app/tyre-fittings/page";
import ValetWashPage from "./app/services/valet-wash/page";
import ValetWashProvidersPage from "./app/services/valet-wash/providers/page";
import ServiceCategorySlugPage from "./app/services/[slug]/page";
import TermsAndConditionsPage from "./app/terms-and-conditions/page";
import NotFoundPage from "./app/not-found";

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="bg-black text-white flex flex-col min-h-screen font-sans selection:bg-[#e7bd78] selection:text-black">
      <LocationPermission />
      <ToastProvider>
        <FirebaseNotificationListener />
        <Navbar />
        <main className="flex-grow pt-16 sm:pt-[72px]">{children}</main>
        <Footer />
      </ToastProvider>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Layout>
        <Suspense
          fallback={
            <div className="min-h-[60vh] flex items-center justify-center text-[#FAD293]">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#FAD293]" />
            </div>
          }
        >
          <Routes>
            {/* Core Pages */}
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/booking-success" element={<BookingSuccessPage />} />
            <Route path="/cancellation-policy" element={<CancellationPolicyPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="/emergency-assistance" element={<EmergencyAssistancePage />} />
            <Route path="/faqs" element={<FaqsPage />} />
            <Route path="/get-started" element={<GetStartedPage />} />
            <Route path="/how-it-works" element={<HowItWorksPage />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/notifications" element={<NotificationsPage />} />
            <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/refund-policy" element={<RefundPolicyPage />} />
            <Route path="/terms-and-conditions" element={<TermsAndConditionsPage />} />

            {/* Estimates */}
            <Route path="/estimate" element={<EstimatePage />} />
            <Route path="/estimates" element={<EstimatesListPage />} />
            <Route path="/estimate/:token" element={<EstimateDetailPage />} />

            {/* Provider Estimates */}
            <Route path="/provider-estimates" element={<ProviderEstimatesPage />} />
            <Route path="/provider-estimates/details" element={<ProviderEstimatesDetailPage />} />
            <Route path="/provider-estimates/details/:token" element={<ProviderEstimatesDetailTokenPage />} />
            <Route path="/provider-estimates/:id" element={<ProviderEstimatesIdPage />} />

            {/* Car Hire */}
            <Route path="/car-hire" element={<CarHirePage />} />
            <Route path="/car-hire/:id" element={<CarDetailPage />} />
            <Route path="/car-hire/:id/book" element={<CarBookingPage />} />

            {/* Services */}
            <Route path="/services" element={<ServicesPage />} />
            <Route path="/services/alloy-wheel" element={<AlloyWheelPage />} />
            <Route path="/services/Alloy Refurbishment" element={<AlloyRefurbPage />} />
            <Route path="/services/bodywork" element={<BodyworkPage />} />
            <Route path="/services/car-hire" element={<ServicesCarHirePage />} />
            <Route path="/services/Chauffeur" element={<ChauffeurPage />} />
            <Route path="/services/chauffeur" element={<Navigate to="/services/Chauffeur" replace />} />
            <Route path="/services/Chauffeur/:id" element={<ChauffeurDetailPage />} />
            <Route path="/services/mechanical" element={<MechanicalPage />} />
            <Route path="/services/modification" element={<ModificationPage />} />
            <Route path="/services/Modifications" element={<ModificationsAltPage />} />
            <Route path="/services/tyre-fittings" element={<TyreFittingsServicesPage />} />
            <Route path="/tyre-fittings" element={<TyreFittingsDirectPage />} />
            <Route path="/services/valet-wash" element={<ValetWashPage />} />
            <Route path="/services/valet-wash/providers" element={<ValetWashProvidersPage />} />
            <Route path="/services/:slug" element={<ServiceCategorySlugPage />} />

            {/* 404 Fallback */}
            <Route path="*" element={<NotFoundPage />} />
          </Routes>
        </Suspense>
      </Layout>
    </BrowserRouter>
  );
}
