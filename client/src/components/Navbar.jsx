import React, { useContext, useEffect, useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Zap, Briefcase, Menu, X, User } from "lucide-react";
import DEEmploymintIcon from "../assets/DEEmploymintIcon.png";

const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { setShowRecruiterLogin, companyToken } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on outside click
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (mobileMenuOpen && !event.target.closest('.mobile-menu-container')) {
        setMobileMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [mobileMenuOpen]);

  const handleRecruiterClick = () => {
    setMobileMenuOpen(false);
    if (companyToken) {
      navigate("/dashboard");
    } else {
      setShowRecruiterLogin?.(true);
    }
  };

  // Helper function to check if a path is active
  const isActiveLink = (path) => {
    return location.pathname === path;
  };

  // Navigation items with their paths
  const navItems = [
    { path: "/", label: "Home" },
    { path: "/JobCategories", label: "Job Categories" },
    { path: "/JobListing", label: "Latest Jobs" },
    { path: "/applications", label: "My Jobs", icon: <Briefcase size={16} /> },
  ];

  return (
    <>
      {/* Spacer div to prevent content jump when navbar becomes fixed */}
      <div className="h-2"></div>

      <div
        className={`${
          scrolled ? "fixed animate-slideDown" : "relative"
        } top-0 left-0 right-0 z-20 w-full transition-all duration-300`}
      >
        <nav
          className={`transition-all duration-500 ${
            scrolled
              ? "mx-2 sm:mx-4 my-3 max-w-6xl md:mx-auto bg-white/95 backdrop-blur-lg rounded-2xl shadow-xl border border-gray-100/50 py-3 sm:py-4 px-4 sm:px-6"
              : "mx-4 sm:mx-8 rounded-xl bg-white shadow-lg border-b border-gray-100 py-4 sm:py-6 px-4 sm:px-8"
          } flex justify-between items-center min-h-[60px]`}
          style={{
            boxShadow: scrolled 
              ? "0 25px 50px -12px rgba(0, 0, 0, 0.15), 0 10px 20px -5px rgba(0, 0, 0, 0.1)" 
              : "0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 4px 10px -2px rgba(0, 0, 0, 0.05)"
          }}
        >
          {/* Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer group flex-shrink-0"
            onClick={() => navigate("/")}
          >
            <div
              className={`p-1.5 sm:p-2 rounded-lg ${
                scrolled ? "shadow-lg" : ""
              } group-hover:shadow-red-500/30 transition-all duration-300`}
            >
              <img 
                src={DEEmploymintIcon} 
                alt="DEEmploymint" 
                className="w-8 h-8 sm:w-10 sm:h-10 object-contain"
              />
            </div>
            <span className="text-lg sm:text-xl lg:text-2xl font-bold whitespace-nowrap" style={{ color: "#020330" }}>
              DE Employmint
            </span>
          </div>

          {/* Desktop Navigation - Hidden on mobile/tablet (< 1024px) */}
          <div className="hidden lg:flex items-center flex-1 justify-center mx-4">
            <div className="flex items-center gap-1 xl:gap-4 text-gray-700 font-medium">
              {navItems.map((item, index) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center gap-2 px-3 xl:px-4 py-2 rounded-lg transition-all duration-300 relative ${
                    isActiveLink(item.path)
                      ? "text-red-600 bg-red-50 shadow-sm"
                      : "hover:text-red-600 hover:bg-red-50/50"
                  }`}
                >
                  {item.icon && <span>{item.icon}</span>}
                  <span className="relative whitespace-nowrap text-sm xl:text-base">
                    {item.label}
                    {isActiveLink(item.path) && (
                      <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full animate-pulse"></span>
                    )}
                  </span>
                </Link>
              ))}
            </div>
          </div>

          {/* Desktop Right Section - Hidden on mobile/tablet */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-4 flex-shrink-0">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden xl:block text-sm text-gray-600">
                  Hi, {user.firstName}
                </span>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-10 w-10 border-2 shadow-md",
                      userButtonPopoverCard: "shadow-2xl rounded-xl border border-gray-100",
                      userButtonTrigger: "focus:ring-2",
                      userButtonPopoverActionButton: "hover:bg-red-50",
                      userButtonPopoverActionButtonIcon: "text-gray-600",
                      userButtonPopoverActionButtonText: "text-gray-700 font-medium"
                    },
                    variables: {
                      borderRadius: "0.75rem",
                    },
                  }}
                >
                  <UserButton.MenuItems>
                    <UserButton.Action
                      label="Your Profile"
                      labelIcon={<User size={16} />}
                      onClick={() => navigate('/applications')}
                    />
                    <UserButton.Action label="manageAccount" />
                  </UserButton.MenuItems>
                </UserButton>
              </div>
            ) : (
              <>
                <button
                  onClick={handleRecruiterClick}
                  className={`text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg shadow-sm hover:shadow-md whitespace-nowrap ${
                    companyToken 
                      ? "bg-green-500 text-white hover:bg-green-600" 
                      : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                  }`}
                >
                  {companyToken ? "Recruiter Dashboard" : "Post Job for Free"}
                </button>
                <button
                  onClick={() => openSignIn()}
                  className="text-white px-6 py-2.5 rounded-xl font-medium text-sm shadow-md hover:shadow-lg transition-all duration-300 transform hover:scale-105"
                  style={{ backgroundColor: "#FF0000" }}
                >
                  Job Seeker
                </button>
              </>
            )}
          </div>

          {/* Mobile/Tablet Hamburger Menu - Visible below 1024px */}
          <div className="flex lg:hidden items-center gap-2">
            {user && (
              <UserButton
                appearance={{
                  elements: {
                    userButtonAvatarBox: "h-9 w-9 border-2 shadow-md",
                    userButtonPopoverCard: "shadow-2xl rounded-xl border border-gray-100",
                    userButtonPopoverActionButton: "hover:bg-red-50",
                    userButtonPopoverActionButtonIcon: "text-gray-600",
                    userButtonPopoverActionButtonText: "text-gray-700 font-medium"
                  },
                }}
              >
                <UserButton.MenuItems>
                  <UserButton.Action
                    label="Your Profile"
                    labelIcon={<User size={16} />}
                    onClick={() => navigate('/applications')}
                  />
                  <UserButton.Action label="manageAccount" />
                </UserButton.MenuItems>
              </UserButton>
            )}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
              aria-label="Toggle mobile menu"
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </nav>

        {/* Mobile Menu Overlay */}
        {mobileMenuOpen && (
          <div className="fixed inset-x-0 top-0 z-50 mobile-menu-container lg:hidden">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Menu Content */}
            <div className="relative bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-100 mx-2 sm:mx-4 mt-3 rounded-2xl overflow-hidden max-w-md mx-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img 
                    src={DEEmploymintIcon} 
                    alt="DEEmploymint" 
                    className="w-8 h-8 object-contain"
                  />
                  <span className="text-lg font-bold" style={{ color: "#020330" }}>
                    DE Employmint
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
                  aria-label="Close mobile menu"
                >
                  <X size={20} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActiveLink(item.path)
                        ? "text-white bg-red-500 shadow-md"
                        : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                    }`}
                  >
                    {item.icon && item.icon}
                    <span className="font-medium">{item.label}</span>
                  </Link>
                ))}
              </div>

              {/* User Section */}
              <div className="border-t border-gray-100 p-4">
                {user ? (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <UserButton
                          appearance={{
                            elements: {
                              userButtonAvatarBox: "h-12 w-12 border-2 shadow-md",
                              userButtonPopoverCard: "shadow-2xl rounded-xl border border-gray-100",
                            },
                          }}
                        >
                          <UserButton.MenuItems>
                            <UserButton.Action
                              label="Your Profile"
                              labelIcon={<User size={16} />}
                              onClick={() => {
                                setMobileMenuOpen(false);
                                navigate('/applications');
                              }}
                            />
                            <UserButton.Action label="manageAccount" />
                          </UserButton.MenuItems>
                        </UserButton>
                        <div>
                          <p className="font-medium text-gray-800">Hi, {user.firstName}!</p>
                          <p className="text-sm text-gray-500">Job Seeker</p>
                        </div>
                      </div>
                    </div>
                    
                    {/* Quick Profile Link Button */}
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        navigate('/applications');
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-500 to-red-600 text-white rounded-xl font-medium shadow-md hover:shadow-lg transition-all duration-300"
                    >
                      <User size={18} />
                      Go to Your Profile
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleRecruiterClick}
                      className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        companyToken 
                          ? "bg-green-500 text-white hover:bg-green-600 shadow-md" 
                          : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                      }`}
                    >
                      {companyToken ? "Recruiter Dashboard" : "Post Job for Free"}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openSignIn();
                      }}
                      className="w-full px-4 py-3 rounded-xl font-medium text-white transition-all duration-300 shadow-md hover:shadow-lg"
                      style={{ backgroundColor: "#FF0000" }}
                    >
                      Job Seeker
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      <style jsx>{`
        @keyframes slideDown {
          from {
            transform: translateY(-100%);
            opacity: 0;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
        .animate-slideDown {
          animation: slideDown 0.3s ease-out;
        }
      `}</style>
    </>
  );
};

export default Navbar;