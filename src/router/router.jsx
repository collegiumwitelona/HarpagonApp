import { createBrowserRouter, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import LoginPage from "../pages/LoginPage";
import RegisterPage from "../pages/RegisterPage";
import ForgotPasswordPage from "../pages/ForgotPasswordPage";
import ResetPasswordPage from "../pages/ResetPasswordPage";
import DashboardEntryPage from "../pages/DashboardEntryPage";
import SettingsPage from "../pages/SettingsPage";
import ConfirmEmailPage from "../pages/ConfirmEmailPage"; 
import ProtectedRoute from "../components/ProtectedRoute";
import PublicOnlyRoute from "../components/PublicOnlyRoute";
import UserSetupPage from "../pages/UserSetupPage"; 
import TransactionPage from "../pages/TransactionPage";
import AnalysisPage from "../pages/AnalysisPage";
import AdminPage from "../pages/AdminPage";
import AboutPage from "../pages/About";

export const router = createBrowserRouter([
    
    { path: "/confirm-email", element: <ConfirmEmailPage /> }, 
    { path: "/reset-password", element: <ResetPasswordPage /> },
    { path: "/about", element: <AboutPage /> },
    {
        element: <PublicOnlyRoute />,
        children: [
            { path: "/", element: <LandingPage /> },
            { path: "/landing", element: <LandingPage /> },
            { path: "/login", element: <LoginPage /> },
            { path: "/forgot-password", element: <ForgotPasswordPage /> },
            { path: "/register", element: <RegisterPage /> },
        ]
    },

    
    {
        element: <ProtectedRoute />,
        children: [
            { path: "/dashboard", element: <DashboardEntryPage /> },
            { path: "/admin", element: <AdminPage /> },
            { path: "/history", element: <TransactionPage /> },
            { path: "/analysis", element: <AnalysisPage /> },
            { path: "/settings", element: <SettingsPage /> },
            { path: "/setup", element: <UserSetupPage /> }, 
            
        ]
    },

    
    { path: "*", element: <Navigate to="/" replace /> }
]);