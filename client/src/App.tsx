import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/public/PublicLayout";
import { LoadingBlock } from "./components/ui/Spinner";

const Home = lazy(() => import("./pages/Home"));
const GlowLang = lazy(() => import("./pages/GlowLang"));
const Technology = lazy(() => import("./pages/Technology"));
const About = lazy(() => import("./pages/About"));
const Roadmap = lazy(() => import("./pages/Roadmap"));
const Contact = lazy(() => import("./pages/Contact"));
const Pricing = lazy(() => import("./pages/Pricing"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Terms = lazy(() => import("./pages/Terms"));
const PaymentSuccess = lazy(() => import("./pages/payment/Success"));
const PaymentCancel = lazy(() => import("./pages/payment/Cancel"));
const NotFound = lazy(() => import("./pages/NotFound"));

const AccountApp = lazy(() => import("./account/AccountApp"));
const AdminApp = lazy(() => import("./admin/AdminApp"));

function PageFallback() {
  return (
    <div className="container-x py-24">
      <LoadingBlock />
    </div>
  );
}

export default function App() {
  return (
    <Suspense fallback={<PageFallback />}>
      <Routes>
        <Route element={<PublicLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/glowlang" element={<GlowLang />} />
          <Route path="/technology" element={<Technology />} />
          <Route path="/about" element={<About />} />
          <Route path="/roadmap" element={<Roadmap />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/pricing" element={<Pricing />} />
          <Route path="/privacy" element={<Privacy />} />
          <Route path="/terms" element={<Terms />} />
          <Route path="/payment/success" element={<PaymentSuccess />} />
          <Route path="/payment/cancel" element={<PaymentCancel />} />
          <Route path="/account/*" element={<AccountApp />} />
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route path="/admin" element={<AdminApp />} />
        <Route path="/admin/*" element={<AdminApp />} />
        <Route path="/dashboard" element={<Navigate to="/admin" replace />} />
      </Routes>
    </Suspense>
  );
}
