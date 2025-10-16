import React, { useContext, useEffect, useState, useRef } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Zap, Briefcase, Menu, X } from "lucide-react";
import DEEmploymintIcon from "../assets/DEEmploymintIcon.png";
const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const location = useLocation();
  const { setShowRecruiterLogin, companyToken } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [forceHamburger, setForceHamburger] = useState(false);
  
  // Refs for measuring elements
  const navRef = useRef(null);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Check if we really need hamburger menu (only when content would overflow/cutoff)
  useEffect(() => {
    const checkForOverflow = () => {
      if (!navRef.current) return;
      
      const screenWidth = window.innerWidth;
      
      // Only use hamburger for extremely small screens where it's impossible to fit
      if (screenWidth < 300) { 
        setForceHamburger(true);
        return;
      }
      
      // For all other screens, check for actual visual overflow
      const logo = navRef.current.querySelector('.logo-section');
      const navItems = navRef.current.querySelector('.nav-items-section');
      const rightSection = navRef.current.querySelector('.right-section');
      
      if (!logo || !navItems || !rightSection) {
        setForceHamburger(screenWidth < 400);
        return;
      }
      
      // Wait a bit for layout to settle, then check
      requestAnimationFrame(() => {
        const navRect = navRef.current.getBoundingClientRect();
        const rightSectionRect = rightSection.getBoundingClientRect();
        
        // Check if right section (buttons) extends beyond the navbar container
        const rightSectionOverflow = rightSectionRect.right > navRect.right;
        
        // Check if nav items content is being clipped
        const navItemsScrollWidth = navItems.scrollWidth;
        const navItemsClientWidth = navItems.clientWidth;
        const navItemsContentClipped = navItemsScrollWidth > navItemsClientWidth + 5;
        
        // Check all buttons in right section to see if any overflow
        const buttons = rightSection.querySelectorAll('button');
        let anyButtonOverflows = false;
        buttons.forEach(button => {
          const buttonRect = button.getBoundingClientRect();
          if (buttonRect.right > navRect.right) {
            anyButtonOverflows = true;
          }
        });
        
        const needsHamburger = rightSectionOverflow || navItemsContentClipped || anyButtonOverflows;
        
        console.log('Overflow detection at', screenWidth + 'px:', {
          rightSectionOverflow,
          navItemsContentClipped,
          anyButtonOverflows,
          needsHamburger,
          navRight: Math.round(navRect.right),
          rightSectionRight: Math.round(rightSectionRect.right),
          overflow: Math.round(rightSectionRect.right - navRect.right)
        });
        
        setForceHamburger(needsHamburger);
      });
    };

    // Initial check with delay to ensure DOM is ready
    const timeoutId = setTimeout(checkForOverflow, 100);
    
    // Check on resize with debounce
    let resizeTimeout;
    const handleResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(checkForOverflow, 100);
    };

    window.addEventListener('resize', handleResize);
    
    // Also check when dependencies change
    checkForOverflow();
    
    return () => {
      window.removeEventListener('resize', handleResize);
      clearTimeout(timeoutId);
      clearTimeout(resizeTimeout);
    };
  }, [user, companyToken, scrolled]);

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

  // Close mobile menu when screen becomes large
  useEffect(() => {
    const handleResize = () => {
      // Close mobile menu if screen becomes larger and hamburger is no longer needed
      if (mobileMenuOpen) {
        // Re-check if hamburger is still needed
        setTimeout(() => {
          if (!forceHamburger) {
            setMobileMenuOpen(false);
          }
        }, 100);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [mobileMenuOpen, forceHamburger]);

  const handleRecruiterClick = () => {
    setMobileMenuOpen(false);
    if (companyToken) {
      navigate("/dashboard");
    } else {
      setShowRecruiterLogin(true);
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
          ref={navRef}
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
            className="logo-section flex items-center gap-1 sm:gap-2 cursor-pointer group flex-shrink-0"
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
                className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 object-contain"
              />
            </div>
            <span className="text-sm sm:text-lg md:text-xl lg:text-2xl font-bold whitespace-nowrap" style={{ color: "#020330" }}>
              DE Employmint
            </span>
          </div>

          {/* Show full navbar unless forced to hamburger */}
          {!forceHamburger ? (
            <>
              {/* Navigation Items - Keep original responsive design */}
              <div className="nav-items-section flex items-center flex-1 justify-center mx-2 sm:mx-4">
                <div className="flex items-center gap-0.5 sm:gap-1 md:gap-2 lg:gap-4 text-gray-700 font-medium">
                  {navItems.map((item, index) => (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-1 px-1 sm:px-1.5 md:px-2 lg:px-3 py-1.5 md:py-2 rounded-lg transition-all duration-300 relative text-xs sm:text-sm flex-shrink-0 ${
                        isActiveLink(item.path)
                          ? "text-red-600 bg-red-50 shadow-sm"
                          : "hover:text-red-600 hover:bg-red-50/50 transition-colors duration-200"
                      }`}
                    >
                      {item.icon && index === 3 && <span className="md:inline">{item.icon}</span>}
                      <span className="relative whitespace-nowrap">
                        {/* Very small screens - ultra short text */}
                        <span className="inline min-[400px]:hidden">
                          {item.path === "/" ? "H" : 
                           item.path === "/JobCategories" ? "C" :
                           item.path === "/JobListing" ? "J" : 
                           item.path === "/applications" ? "M" : "H"}
                        </span>
                        {/* Small screens - short text */}
                        <span className="hidden min-[400px]:inline sm:hidden">
                          {item.path === "/" ? "Home" : 
                           item.path === "/JobCategories" ? "Jobs" :
                           item.path === "/JobListing" ? "Latest" : 
                           item.path === "/applications" ? "My" : "Home"}
                        </span>
                        {/* Medium screens and up - full text */}
                        <span className="hidden sm:inline md:hidden">
                          {item.path === "/" ? "Home" : 
                           item.path === "/JobCategories" ? "Categories" :
                           item.path === "/JobListing" ? "Latest Jobs" : 
                           item.path === "/applications" ? "My Jobs" : item.label}
                        </span>
                        {/* Large screens - full text */}
                        <span className="hidden md:inline">{item.label}</span>
                        {isActiveLink(item.path) && (
                          <span className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-red-600 rounded-full animate-pulse"></span>
                        )}
                      </span>
                    </Link>
                  ))}
                </div>
              </div>

              {/* Right Section - Keep original design */}
              <div className="right-section flex items-center gap-1 sm:gap-2 lg:gap-4 flex-shrink-0">
                {user ? (
                  <div className="flex items-center gap-1 sm:gap-2 lg:gap-3">
                    <span className="hidden xl:block text-sm text-gray-600">
                      Hi, {user.firstName}
                    </span>
                    <UserButton
                      appearance={{
                        elements: {
                          userButtonAvatarBox: "h-6 w-6 sm:h-8 sm:w-8 lg:h-10 lg:w-10 border-2 shadow-md",
                          userButtonPopoverCard:
                            "shadow-2xl rounded-xl border border-gray-100",
                          userButtonTrigger: "focus:ring-2",
                        },
                        variables: {
                          borderRadius: "0.75rem",
                        },
                      }}
                      style={{
                        "--clerk-primary-color": "#FF0000",
                        "--clerk-focus-ring-color": "rgba(255, 0, 0, 0.3)",
                      }}
                    />
                  </div>
                ) : (
                  <>
                    <button
                      onClick={handleRecruiterClick}
                      className={`text-xs sm:text-sm font-medium transition-all duration-200 px-1 sm:px-2 lg:px-4 py-1 sm:py-1.5 lg:py-2 rounded-lg shadow-sm hover:shadow-md whitespace-nowrap ${
                        companyToken 
                          ? "bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg" 
                          : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                      }`}
                    >
                      <span className="hidden lg:inline">{companyToken ? "Recruiter Dashboard" : "Recruiter Portal"}</span>
                      <span className="hidden md:inline lg:hidden">{companyToken ? "Dashboard" : "Recruiter"}</span>
                      <span className="md:hidden">{companyToken ? "Dash" : "Rec"}</span>
                    </button>
                    <button
                      onClick={() => openSignIn()}
                      className={`text-white px-1.5 sm:px-2 md:px-3 lg:px-6 py-1 sm:py-1.5 lg:py-2.5 rounded-xl font-medium text-xs sm:text-sm shadow-md hover:shadow-lg ${
                        scrolled
                          ? "hover:shadow-red-500/30"
                          : ""
                      } transition-all duration-300 transform hover:scale-105 whitespace-nowrap`}
                      style={{ backgroundColor: "#FF0000" }}
                    >
                      <span className="hidden md:inline">Get Started</span>
                      <span className="md:hidden">Start</span>
                    </button>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Hamburger Menu Section - Only when absolutely necessary */
            <div className="flex items-center gap-2">
              {/* Minimal user info even in hamburger mode */}
              {user && (
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-8 w-8 border-2 shadow-md",
                    },
                  }}
                />
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                aria-label="Toggle mobile menu"
              >
                {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          )}
        </nav>

        {/* Mobile Menu - Only when hamburger is forced */}
        {forceHamburger && mobileMenuOpen && (
          <div className="fixed inset-x-0 top-0 z-50 mobile-menu-container">
            {/* Backdrop */}
            <div 
              className="fixed inset-0 bg-black/50 backdrop-blur-sm"
              onClick={() => setMobileMenuOpen(false)}
            ></div>
            
            {/* Menu Content */}
            <div className="relative bg-white/95 backdrop-blur-lg shadow-xl border-b border-gray-100 mx-2 mt-3 rounded-2xl overflow-hidden">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <img 
                    src={DEEmploymintIcon} 
                    alt="DEEmploymint" 
                    className="w-6 h-6 object-contain"
                  />
                  <span className="text-base font-bold" style={{ color: "#020330" }}>
                    DE Employmint
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 text-gray-600 hover:text-gray-800 transition-colors"
                  aria-label="Close mobile menu"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Navigation Links */}
              <div className="p-4 space-y-2">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 ${
                      isActiveLink(item.path)
                        ? "text-white bg-red-500"
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
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <UserButton
                        appearance={{
                          elements: {
                            userButtonAvatarBox: "h-10 w-10 border-2 shadow-md",
                            userButtonPopoverCard: "shadow-2xl rounded-xl border border-gray-100",
                          },
                        }}
                      />
                      <div>
                        <p className="font-medium text-gray-800">Hi, {user.firstName}</p>
                        <p className="text-sm text-gray-500">Job Seeker</p>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <button
                      onClick={handleRecruiterClick}
                      className={`w-full px-4 py-3 rounded-xl font-medium transition-all duration-200 ${
                        companyToken 
                          ? "bg-green-500 text-white hover:bg-green-600" 
                          : "bg-gray-100 text-gray-600 hover:bg-red-50 hover:text-red-600"
                      }`}
                    >
                      {companyToken ? "Recruiter Dashboard" : "Recruiter Portal"}
                    </button>
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        openSignIn();
                      }}
                      className="w-full px-4 py-3 rounded-xl font-medium text-white transition-all duration-300"
                      style={{ backgroundColor: "#FF0000" }}
                    >
                      Get Started
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default Navbar;