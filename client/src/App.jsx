/**
 * StayFinder — Main Application Component
 * Routes, providers, and layout
 */
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import HomePage from './pages/HomePage';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import ListingDetailPage from './pages/ListingDetailPage';
import TripsPage from './pages/TripsPage';
import BookingConfirmationPage from './pages/BookingConfirmationPage';
import DashboardPage from './pages/DashboardPage';
import CreateListingPage from './pages/CreateListingPage';
import EditListingPage from './pages/EditListingPage';
import ProfilePage from './pages/ProfilePage';
import AdminPage from './pages/AdminPage';
import NotFoundPage from './pages/NotFoundPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30000,
    },
  },
});

function AppLayout() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/reset-password" element={<ResetPasswordPage />} />
          <Route path="/listings/new" element={<CreateListingPage />} />
          <Route path="/listings/:id/edit" element={<EditListingPage />} />
          <Route path="/listings/:id" element={<ListingDetailPage />} />
          <Route path="/trips" element={<TripsPage />} />
          <Route path="/bookings/:id" element={<BookingConfirmationPage />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/admin" element={<AdminPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </main>
      <Footer />
    </>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <AppLayout />
        </BrowserRouter>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 3000,
            style: {
              borderRadius: '12px',
              background: '#222222',
              color: '#fff',
              fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500,
              padding: '12px 20px',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
