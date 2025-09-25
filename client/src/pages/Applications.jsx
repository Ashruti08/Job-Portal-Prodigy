// Candidate Dashboard Component - EXACT same structure as Company Dashboard
import React, { useContext, useEffect, useState } from "react";
import { NavLink, Outlet, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import logo from "../assets/DEEmploymint.png";
import { motion, AnimatePresence } from "framer-motion";
import { FiUser, FiBriefcase, FiBell,FiHome } from "react-icons/fi";
import { useClerk } from "@clerk/clerk-react";
const Applications = () => {
  const {signOut}=useClerk();
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [activeTab, setActiveTab] = useState("");
  const { userData, setUserData, userToken, setUserToken } = useContext(AppContext);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const path = location.pathname.split("/").pop();
    setActiveTab(path);
  }, [location]);

  useEffect(() => {
    if (userData) navigate("/applications/my-profile");
  }, [userData]);

  useEffect(() => {
    const handleResize = () => setIsSidebarOpen(window.innerWidth >= 1024);
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const formatTime = date => date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
  const getGreeting = () => {
    const hour = currentTime.getHours();
    return hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";
  };
  
    const logout = () => {
    signOut().then(() => {
      setUserToken(null);
      localStorage.removeItem("userToken");
      setUserData(null);
      navigate("/");
    }).catch((error) => {
      console.error("Sign out error:", error);
      navigate("/");
    });
  };

  const handleProfileClick = () => {
    navigate("/applications/my-profile");
  };

  // Candidate Dashboard Navigation Items
  const navItems = [
    { path: "my-profile", label: "My Profile", icon: <FiUser /> },
    { path: "applied-jobs", label: "Applied Jobs", icon: <FiBriefcase /> },
    { path: "job-alerts", label: "Job Alerts", icon: <FiBell /> },
  ];

  return (
    <div className="flex h-screen bg-gradient-to-tr from-[#f5f7fa] via-[#ebedfb] to-[#dce3ff] font-[Poppins]">
      {/* Sidebar */}
      <AnimatePresence>
        {isSidebarOpen && (
          <motion.aside
            initial={{ x: -250, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -250, opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            className="fixed lg:static left-0 top-0 w-72 h-full bg-white/60 backdrop-blur-md z-50 flex flex-col justify-between border-r border-white/30"
          >
            <div className="p-6">
              <img src={logo} alt="Logo" className="h-16 mb-8 cursor-pointer" onClick={() => navigate("/")} />
              <div className="space-y-3">
                  {/* Home Button - Above Add Job */}
                              <motion.button
                                onClick={() => navigate('/')}
                                whileHover={{ scale: 1.02 }}
                                whileTap={{ scale: 0.95 }}
                                className=" flex items-center px-4 py-1.5 gap-3 bg-gray-200 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800  transition-all duration-200 shadow-lg hover:scale-[1.02]"
                                  style={{ 
               
                 marginBottom:"20px"
                
                }} >
                                <FiHome className="text-lg  " />
                                <span>Home</span>
                              </motion.button>
                {navItems.map(({ path, label, icon }, i) => (
                  <NavLink
                    key={i}
                    to={`/applications/${path}`}
                    className={({ isActive }) =>
                      `flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 text-sm font-medium hover:scale-[1.02] ${
                        isActive
                          ? "text-white"
                          : "text-gray-800 hover:bg-white/20"
                      }`
                    }
                    style={({ isActive }) => ({
                      backgroundColor: isActive ? "#ff0000" : "transparent"
                    })}
                  >
                    <span className="text-lg">{icon}</span>
                    <span>{label}</span>
                  </NavLink>
                ))}
                   {/* Logout button stays red */}
              {/* <button
                onClick={logout}
                  whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className=" flex items-center   px-6 py-1.5  font-medium  bg-gray-200 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-200 hover:border-gray-400 hover:text-gray-800  transition-all duration-200 shadow-lg hover:scale-[1.02]"
              style={{ 
               
                
               
                  marginLeft:"15px",
                  marginTop:"33px"
                }} >
                Logout
              </button> */}
              </div>
             
            </div>
            
            <div className="bg-white/50 backdrop-blur-sm p-5 rounded-bl-3xl">
              <div 
                className="flex items-center gap-4 cursor-pointer hover:bg-white/20 p-2 rounded-lg transition-all duration-200"
                onClick={handleProfileClick}
              >
                {/* Circle with lighter red background */}
                <div
                  className="w-11 h-11 rounded-full flex items-center justify-center text-white text-lg font-bold shadow-md"
                  style={{ backgroundColor: '#ff6666' }}
                >
                  {userData?.name?.[0] || "U"}
                </div>

                {/* Text with custom red shades */}
                <div>
                  <p className="text-sm font-semibold" style={{ color: '#022030' }}>
                    {userData?.name}
                  </p>
                   <p className="text-xs" style={{ color: '#022030' }}>
                    Candidate Mode
                  </p> 
                </div>
              </div>

              {/* Logout button stays red */}
              <button
                onClick={logout}
                className="mt-4 text-sm text-red-500 hover:underline w-full text-left"
              >
                Sign out
              </button>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <motion.header
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="bg-white/70 backdrop-blur-md shadow px-8 py-5 flex justify-between items-center border-b border-white/20"
        >
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              {activeTab.replace(/-/g, " ").replace(/\b\w/g, l => l.toUpperCase()) || "Dashboard"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">{currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
          </div>
          <div className="text-right">
            <p className="text-sm text-gray-600 font-semibold">{getGreeting()},</p>
            <p className="text-xs text-gray-500">{userData?.name}</p>
            <p className="text-sm text-gray-400">{formatTime(currentTime)}</p>
          </div>
        </motion.header>

        <main className="flex-1 overflow-y-auto px-8 py-6">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white/70 backdrop-blur-md border border-white/20 rounded-3xl shadow-xl p-6 min-h-[500px]"
          >
            <Outlet />
          </motion.div>
        </main>
      </div>
    </div>
  );
};

export default Applications;