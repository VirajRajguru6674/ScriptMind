import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { NotesProvider } from "@/context/NotesContext";
import Index from "@/pages/Index";
import Settings from "@/pages/Settings";
import PlaylistDownloader from "@/pages/PlaylistDownloader";
import ForgotPassword from "@/pages/ForgotPassword";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Pricing from "@/pages/Pricing";
import Checkout from "@/pages/Checkout";
import NotFound from "@/pages/NotFound";
import Notifications from "@/pages/Notifications";
import { GoogleOAuthProvider } from '@react-oauth/google';

import Admin from "@/pages/Admin";
import Organization from "@/pages/Organization";

const queryClient = new QueryClient();

// Load from env variable for security and configuration on Vercel
const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "509177086998-6k4n22s2igdufn27blepvki8j62srnp8.apps.googleusercontent.com";

const App = () => (
  <HelmetProvider>
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <ThemeProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <AuthProvider>
                <NotesProvider>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/playlist" element={<PlaylistDownloader />} />
                    <Route path="/forgot-password" element={<ForgotPassword />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/register" element={<Register />} />
                    <Route path="/pricing" element={<Pricing />} />
                    <Route path="/checkout" element={<Checkout />} />
                    <Route path="/admin" element={<Admin />} />
                    <Route path="/notifications" element={<Notifications />} />
                    <Route path="/organization" element={<Organization />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </NotesProvider>
              </AuthProvider>
            </BrowserRouter>
          </ThemeProvider>
        </TooltipProvider>
      </QueryClientProvider>
    </GoogleOAuthProvider>
  </HelmetProvider>
);

export default App;

