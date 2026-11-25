import { useEffect } from 'react'
import { HashRouter, Routes, Route, useLocation } from 'react-router-dom'
import { AuthProvider } from './lib/session.jsx'
import Nav from './components/Nav.jsx'
import Footer from './components/Footer.jsx'
import Landing from './pages/Landing.jsx'
import FindBlood from './pages/FindBlood.jsx'
import RegisterDonor from './pages/RegisterDonor.jsx'
import Login from './pages/Login.jsx'
import VerifyEmail from './pages/VerifyEmail.jsx'
import DonorDashboard from './pages/DonorDashboard.jsx'
import Emergency from './pages/Emergency.jsx'
import Contact from './pages/Contact.jsx'
import ForgotPassword from './pages/ForgotPassword.jsx'
import { DonationDisclaimer, Privacy, Terms } from './pages/Legal.jsx'
import NotFound from './pages/NotFound.jsx'

const TITLES = {
  '/': 'Donor Koi | Find blood donors near you in minutes',
  '/find': 'Find a blood donor | Donor Koi',
  '/register': 'Become a blood or plasma donor | Donor Koi',
  '/login': 'Donor sign in | Donor Koi',
  '/verify-email': 'Verify your email | Donor Koi',
  '/donor': 'Your donor page | Donor Koi',
  '/emergency': 'Emergency blood board | Donor Koi',
  '/contact': 'Contact & feedback | Donor Koi',
  '/forgot-password': 'Reset your password | Donor Koi',
  '/privacy': 'Privacy policy | Donor Koi',
  '/terms': 'Terms & Conditions | Donor Koi',
  '/donation-disclaimer': 'Donation disclaimer | Donor Koi',
}

function ScrollToTop() {
  const { pathname } = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [pathname])

  useEffect(() => {
    document.title = TITLES[pathname] || 'Page not found | Donor Koi'
  }, [pathname])

  return null
}

export default function App() {
  return (
    <AuthProvider>
      <HashRouter>
        <ScrollToTop />
        <a href="#main" className="skip-link">
          Skip to content
        </a>
        <Nav />
        <main id="main">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/find" element={<FindBlood />} />
            <Route path="/register" element={<RegisterDonor />} />
            <Route path="/login" element={<Login />} />
            <Route path="/verify-email" element={<VerifyEmail />} />
            <Route path="/donor" element={<DonorDashboard />} />
            <Route path="/emergency" element={<Emergency />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/donation-disclaimer" element={<DonationDisclaimer />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </main>
        <Footer />
      </HashRouter>
    </AuthProvider>
  )
}
