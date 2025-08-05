import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { RecoilRoot } from 'recoil';
import { Toaster as HotToaster } from 'react-hot-toast';

// Layout components
import TopNav from "@/components/common/TopNav";
import PatientHeader from "@/components/common/PatientHeader";
import CommSidebar from "@/components/common/CommSidebar";
import AuthRoute from "@/components/auth/AuthRoute";

// Pages
import Index from "./pages/Index";
import PatientList from "./pages/PatientList";
import Dashboard from "./pages/Dashboard";
import PatientSummary from "./pages/PatientSummary";
import PatientInstructions from "./pages/PatientInstructions";

import PatientSchedule from "./pages/PatientSchedule";
import DischargeMeetingPage from "./pages/DischargeMeetingPage";
import EHRStatusPage from "./pages/EHRStatusPage";
import OutOfNetworkSchedulingPage from "./pages/OutOfNetworkSchedulingPage";
import SystemEpicIntegrationPage from "./pages/SystemEpicIntegrationPage";
import PostDischargeChatPage from "./pages/PostDischargeChatPage";
import PatientChatSimulationPage from "./pages/PatientChatSimulationPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Main layout for authenticated routes
const AppLayout = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen bg-background">
    <TopNav />
    <PatientHeader />
    <div className="container max-w-screen-2xl mx-auto px-4 py-6">
      {children}
    </div>
    <CommSidebar />
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: 'hsl(var(--card))',
          color: 'hsl(var(--card-foreground))',
          border: '1px solid hsl(var(--border))',
        },
      }}
    />
  </div>
);

const App = () => (
  <RecoilRoot>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route 
              path="/patients" 
              element={
                <AuthRoute>
                  <PatientList />
                </AuthRoute>
              } 
            />
            <Route 
              path="/patient/:id/dashboard" 
              element={
                <AuthRoute>
                  <AppLayout>
                    <Dashboard />
                  </AppLayout>
                </AuthRoute>
              } 
            />
            <Route 
              path="/patient/:id/summary" 
              element={
                <AuthRoute>
                  <AppLayout>
                    <PatientSummary />
                  </AppLayout>
                </AuthRoute>
              } 
            />
            <Route 
              path="/patient/:id/instructions" 
              element={
                <AuthRoute>
                  <AppLayout>
                    <PatientInstructions />
                  </AppLayout>
                </AuthRoute>
              } 
            />
            <Route 
              path="/patient/:patientId/post-discharge-chat"
              element={
                <AuthRoute>
                  <AppLayout>
                    <PostDischargeChatPage />
                  </AppLayout>
                </AuthRoute>
              }
            />
            <Route 
              path="/patient/:patientId/chat-simulation"
              element={
                <PatientChatSimulationPage />
              }
            />
            <Route 
              path="/system/epic-integration" 
              element={
                <AuthRoute>
                  <SystemEpicIntegrationPage />
                </AuthRoute>
              } 
            />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </QueryClientProvider>
  </RecoilRoot>
);

export default App;
