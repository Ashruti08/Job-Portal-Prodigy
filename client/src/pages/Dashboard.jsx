// Updated Dashboard with Responsive Design - Always open sidebar on entry
import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import logo from "../assets/DEEmploymint.png";
import { motion, AnimatePresence } from "framer-motion";
import { FiPlusCircle, FiFolder, FiMail, FiUser, FiHome, FiAlertCircle, FiMenu, FiX } from "react-icons/fi";
import { toast } from "react-toastify";

const Dashboard = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("");
  const [showNotification, setShowNotification] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const { companyData, setCompanyData, setCompanyToken, companyToken, setShowRecruiterLogin } = useContext(AppContext);

  // Check if user is logged in as recruiter
  const isLoggedIn = !!companyToken && !!companyData;

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    setActiveTab(path);
  }, [location]);

  // Updated redirect logic - redirect to manage-job for both logged in and demo users
  useEffect(() => {
    if (location.pathname === '/dashboard') {
      navigate("/dashboard/manage-job");
    }
  }, [location.pathname, navigate]);

  // Responsive handling - Always open sidebar on mobile when entering dashboard
  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 1024;
      setIsMobile(mobile);
      
      if (mobile) {
        // Always open sidebar when user enters dashboard on mobile
        // This shows them all available features immediately
        setIsSidebarOpen(true);
      } else {
        // Always open on desktop
        setIsSidebarOpen(true);
      }
    };
    
    // Initial check
    handleResize();
    
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && isSidebarOpen && !event.target.closest('.sidebar-container') && !event.target.closest('.sidebar-toggle')) {
        setIsSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, isSidebarOpen]);

  const formatTime = date => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const getGreeting = () => {
    const hour = currentTime.getHours();
    return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  };

  // Updated logout function to open recruiter login when not logged in
  const logout = () => {
    if (!isLoggedIn) {
      // Open recruiter login modal instead of showing toast
      setShowRecruiterLogin(true);
      return;
    }
    setCompanyToken(null);
    localStorage.removeItem("companyToken");
    setCompanyData(null);
    navigate("/");
  };

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      showLoginNotification();
      return;
    }
    navigate("/dashboard/profile");
    if (isMobile) setIsSidebarOpen(false);
  };

  const showLoginNotification = () => {
    setShowNotification(true);
    setTimeout(() => setShowNotification(false), 3000);
  };

  const handleProtectedAction = (e, action) => {
    if (!isLoggedIn) {
      e.preventDefault();
      showLoginNotification();
      return;
    }
    // Allow the action to proceed if logged in
  };

  const toggleSidebar = () => {
    setIsSidebarOpen(!isSidebarOpen);
  };

  const navItems = [
    { path: "profile", label: "Company Profile", icon: <FiUser /> },
    { path: "manage-job", label: "Manage Jobs", icon: <FiFolder /> },
    { path: "view-applications", label: "Applications", icon: <FiMail /> },
    { path: "add-job", label: "Post New Job", icon: <FiPlusCircle /> },
    { path: "bulk-upload", label: "Bulk Upload", icon: <FiUpload /> },
    { path: "manage-package", label: "Manage Package", icon: <FiPackage /> },

    
  ];

  return (
    <div className="flex h-screen bg-gradient-to-tr from-[#f5f7fa] via-[#ebedfb] to-[#dce3ff] font-[Poppins] relative">
      {/* Login Notification */}
      
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, x: "-50%" }}
            animate={{ opacity: 1, y: 20 }}
            exit={{ opacity: 0, y: -50 }}
            className="fixed top-0 left-1/2 transform -translate-x-1/2 z-[100] bg-red-500 text-white px-4 sm:px-6 py-3 rounded-lg shadow-lg flex items-center gap-2"
          >
            <FiAlertCircle className="text-lg flex-shrink-0" />
            <span className="text-sm">Please login as recruiter first!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Backdrop */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -280, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -280, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className={`sidebar-container ${
              isMobile 
                ? "fixed left-0 top-0 z-50" 
                : "relative"
            } w-64 sm:w-72 h-full bg-white/60 backdrop-blur-md flex flex-col justify-between border-r border-white/30`}
          >
            {/* Mobile Close Button */}
            {isMobile && (
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="absolute top-4 right-4 p-2 text-gray-600 hover:text-gray-800 lg:hidden z-10"
              >
                <FiX size={20} />
              </button>
            )}

            <div className="p-4 sm:p-6">
              <img 
                src={logo} 
                alt="Logo" 
                className="h-12 sm:h-16 mb-6 sm:mb-8 cursor-pointer" 
                onClick={() => navigate("/")} 
              />
              
              {/* Home Button - Above Add Job */}
              <motion.button
                onClick={() => {
                  navigate('/');
                  if (isMobile) setIsSidebarOpen(false);
                }}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.95 }}
                className="w-full flex items-center px-3 sm:px-4 py-2 sm:py-2.5 gap-3 bg-gray-200 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800 transition-all duration-200 shadow-lg hover:scale-[1.02]"
                style={{ marginBottom: "16px" }}
              >
                <FiHome className="text-base sm:text-lg flex-shrink-0" />
                <span className="text-sm sm:text-base">Home</span>
              </motion.button>

              <div className="space-y-2 sm:space-y-3">
                {navItems.map(({ path, label, icon }, i) => (
                  <NavLink
                    key={i}
                    to={`/dashboard/${path}`}
                    onClick={(e) => {
                      // Close mobile sidebar when navigating
                      if (isMobile) setIsSidebarOpen(false);
                      
                      // Don't prevent navigation, just show notification if not logged in
                      if (!isLoggedIn) {
                        // Let the navigation happen, but show notification after a small delay
                        setTimeout(() => showLoginNotification(), 100);
                      }
                    }}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl transition-all duration-200 text-sm font-medium hover:scale-[1.02] ${
                        isActive
                          ? "text-white"
                          : "text-gray-800 hover:bg-white/20"
                      } ${!isLoggedIn ? 'opacity-70' : ''}`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#ff0000" : "transparent"
                    })}
                  >
                    <span className="text-base sm:text-lg flex-shrink-0">{icon}</span>
                    <span className="text-sm sm:text-base">{label}</span>
                  </NavLink>
                ))}
              </div>
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm p-4 sm:p-5 rounded-bl-3xl">
              <div 
                className="flex items-center gap-3 sm:gap-4 cursor-pointer hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                onClick={handleProfileClick}
              >
                {/* Circle with lighter red background */}
                <div
                  className="w-9 h-9 sm:w-11 sm:h-11 rounded-full flex items-center justify-center text-white text-sm sm:text-lg font-bold shadow-md flex-shrink-0"
                  style={{ backgroundColor: '#ff6666' }}
                >
                  {isLoggedIn ? (companyData?.name?.[0] || "C") : "D"}
                </div>

                {/* Text with custom red shades */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold truncate" style={{ color: '#022030' }}>
                    {isLoggedIn ? companyData?.name : "Demo Company"}
                  </p>
                   
                  <p className="text-xs" style={{ color: '#022030' }}>
                    {isLoggedIn ? "Recruiter Mode" : "Demo Mode"}
                  </p>
                </div>
              </div>

              {/* Updated logout button to open login modal when not logged in */}
              <button
                onClick={logout}
                className="mt-3 sm:mt-4 text-sm text-red-500 hover:underline w-full text-left"
              >
                {isLoggedIn ? "Sign out" : "Login Required"}
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/70 backdrop-blur-md shadow px-4 sm:px-6 lg:px-8 py-4 sm:py-5 flex justify-between items-center border-b border-white/20"
        >
          {/* Left side - Menu button and title */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {/* Mobile Menu Toggle */}
            <button
              onClick={toggleSidebar}
              className="sidebar-toggle p-2 text-gray-600 hover:text-gray-800 lg:hidden flex-shrink-0"
            >
              <FiMenu size={20} />
            </button>
            
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-800 truncate">
                  {activeTab.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Dashboard"}
                </h1>
                {!isLoggedIn && (
                  <span className="text-xs bg-yellow-200 text-yellow-800 px-2 py-1 rounded flex-shrink-0">
                    Demo Mode
                  </span>
                )}
              </div>
              <p className="text-xs sm:text-sm text-gray-500 mt-1">
                {currentTime.toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>

          {/* Right side - Greeting */}
          <div className="text-right flex-shrink-0 hidden sm:block">
            <p className="text-sm text-gray-600 font-semibold">{getGreeting()},</p>
            <p className="text-xs text-gray-500">{isLoggedIn ? companyData?.name : "Demo User"}</p>
            <p className="text-sm text-gray-400">{formatTime(currentTime)}</p>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md border border-white/20 rounded-2xl sm:rounded-3xl shadow-xl p-4 sm:p-6 min-h-[500px] relative"
          >
            {/* Pass isLoggedIn as context to child components */}
            <Outlet context={{ isLoggedIn, showLoginNotification, setShowRecruiterLogin }} />
            
            {/* Overlay for demo mode interactions */}
            {!isLoggedIn && (
              <div 
                className="absolute inset-0 bg-transparent pointer-events-auto cursor-pointer rounded-2xl sm:rounded-3xl"
                onClick={showLoginNotification}
                style={{ zIndex: 1 }}
              />
            )}
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;