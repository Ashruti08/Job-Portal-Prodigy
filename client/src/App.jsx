import React, { useContext } from "react";
import { Route, Routes } from "react-router-dom";
import { useUser, useClerk } from '@clerk/clerk-react';
import { toast } from "react-toastify";
import Home from "./pages/Home";
import Applications from "./pages/Applications";
import ApplyJob from "./pages/ApplyJob";
import JobListing from "./pages/JobListing";
import JobCategories from "./components/JobCategories";
import JobAlert from "./pages/JobAlert";
import RecruiterLogin from "./components/RecruiterLogin";
import { AppContext } from "./context/AppContext";
import Dashboard from "./pages/Dashboard";
import AddJob from "./pages/AddJob";
import EmployerProfile from "./pages/EmployerProfile";
import ManageJobs from "./pages/ManageJobs";
import ViewApplications from "./pages/ViewApplications";
import MyProfile from "./components/MyProfile";
import AppliedJobs from "./components/AppliedJobs";
import BulkUpload from './pages/BulkUpload';
import JobAlerts from "./components/JobAlerts";
import "quill/dist/quill.snow.css";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import PublicCompanyProfile from './pages/PublicCompanyProfile';


// NEW: Demo-Friendly Protected Route Component
const DemoFriendlyRecruiterRoute = ({ children, requireAuth = false }) => {
  const { user, isLoaded } = useUser();
  const { signOut } = useClerk();
  const { companyToken } = useContext(AppContext);
  
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-500"></div>
      </div>
    );
  }
  
  const isLoggedInRecruiter = !!companyToken || (user && (
    user.publicMetadata?.role === 'recruiter' || 
    user.publicMetadata?.accountType === 'company' || 
    user.publicMetadata?.lastLoginType === 'recruiter'
  ));
  
  // If requireAuth is true and user is not authenticated, redirect
  if (requireAuth && !isLoggedInRecruiter) {
    toast.error("Please login to access this feature");
    window.location.href = '/';
    return null;
  }
  
  // For dashboard access, allow both authenticated and demo users
  return children;
};

const App = () => {
  const { showRecruiterLogin, companyToken } = useContext(AppContext);

  return (
    <div>
      {showRecruiterLogin && <RecruiterLogin />}
      <ToastContainer />
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Home />} />
        <Route path="/apply-job/:id" element={<ApplyJob />} />
        <Route path="/JobAlert" element={<JobAlert />} />
        <Route path="/recruiter-login" element={<RecruiterLogin />} />
        <Route path="/applications" element={<Applications />}>
        <Route path="my-profile" element={<MyProfile />} />
        
        <Route path="applied-jobs" element={<AppliedJobs />} />
        <Route path="job-alerts" element={<JobAlerts />} />
        </Route>
        <Route path="/JobCategories" element={<JobCategories />} />
        <Route path="/JobListing" element={<JobListing />} />
        <Route path="/company/:id" element={<PublicCompanyProfile />} />

        {/* DASHBOARD ROUTES - Allow demo access */}
        <Route 
          path="/dashboard" 
          element={
            <DemoFriendlyRecruiterRoute>
              <Dashboard />
            </DemoFriendlyRecruiterRoute>
          }
        >
          {/* Always show these routes, Dashboard component handles demo mode */}
          <Route 
            path="add-job" 
            element={
              <DemoFriendlyRecruiterRoute>
                <AddJob />
              </DemoFriendlyRecruiterRoute>
            } 
          />
          <Route 
            path="manage-job" 
            element={
              <DemoFriendlyRecruiterRoute>
                <ManageJobs />
              </DemoFriendlyRecruiterRoute>
            } 
          />
          <Route 
            path="view-applications" 
            element={
              <DemoFriendlyRecruiterRoute>
                <ViewApplications />
              </DemoFriendlyRecruiterRoute>
            } 
          />
          <Route 
            path="profile" 
            element={
              <DemoFriendlyRecruiterRoute>
                <EmployerProfile />
              </DemoFriendlyRecruiterRoute>
            } 
          />
          <Route 
            path="bulk-upload" 
            element={
              <DemoFriendlyRecruiterRoute>
                <BulkUpload />
              </DemoFriendlyRecruiterRoute>
            } 
          />
        </Route>
      </Routes>
    </div>
  );
};

export default App;