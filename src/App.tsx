import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/Layout'
import { HomePage } from './pages/Home'
import { PricingPage } from './pages/Pricing'
import { DateRoomPage } from './pages/DateRoom'
import { RestaurantDatePage } from './pages/RestaurantDate'
import { MovieNightPage } from './pages/MovieNight'
import { FreeDateNightPage } from './pages/FreeDateNight'
import { AboutPage } from './pages/About'
import { FaqPage } from './pages/FAQ'
import { ContactPage } from './pages/Contact'
import { PrivacyPage } from './pages/Privacy'
import { TermsPage } from './pages/Terms'
import { SignInPage } from './pages/SignIn'
import { GetStartedPage } from './pages/GetStarted'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<HomePage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/date-room" element={<DateRoomPage />} />
          <Route path="/dateroom" element={<Navigate to="/date-room" replace />} />
          <Route path="/restaurant" element={<RestaurantDatePage />} />
          <Route path="/movie-night" element={<MovieNightPage />} />
          <Route path="/date-night" element={<FreeDateNightPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/privacy" element={<PrivacyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          <Route path="/signin" element={<SignInPage />} />
          <Route path="/get-started" element={<GetStartedPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
