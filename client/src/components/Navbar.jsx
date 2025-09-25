import React, { useContext, useEffect, useState } from "react";
import { useClerk, UserButton, useUser } from "@clerk/clerk-react";
import { Link, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { Zap, Briefcase } from "lucide-react";
import DEEmploymintIcon from "../assets/DEEmploymint.png";
// import JobListing from '/JobListing';

const Navbar = () => {
  const { openSignIn } = useClerk();
  const { user } = useUser();
  const navigate = useNavigate();
  const { setShowRecruiterLogin, companyToken } = useContext(AppContext);
  const [scrolled, setScrolled] = useState(false);

  // Handle scroll event
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleRecruiterClick = () => {
    if (companyToken) {
      // If company is logged in, go directly to dashboard
      navigate("/dashboard");
    } else {
      // If not logged in, show recruiter login modal
      setShowRecruiterLogin(true);
    }
  };

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
              ? "mx-4 my-3 max-w-6xl md:mx-auto bg-white/95 backdrop-blur-lg rounded-2xl shadow-lg border border-gray-100/50 py-4 px-6"
              : " mx-8 rounded-xl bg-white shadow-sm border-b border-gray-100 py-6 px-8"
          } flex justify-between items-center`}
        >
          {/* Logo */}
          <div
            onClick={() => navigate("/")}
            className="flex items-center gap-2 cursor-pointer group"
          >
            <div
              className={`p-2 rounded-lg ${
                scrolled ? "shadow-lg" : ""
              } group-hover:shadow-red-500/30 transition-all duration-300`}
           
            >
              <img 
                src={DEEmploymintIcon} 
                alt="DEEmploymint" 
                className="w-10 h-10 object-contain"
              />
            </div>
            <span className="text-2xl font-bold" style={{ color: "#020330" }}>
              DE Employmint
            </span>
          </div>

          {/* Links section - Updated for proper alignment */}
          <div className="flex items-center justify-between flex-1 ml-10">
            {/* Navigation options - Now properly distributed */}
            <div className="flex items-center justify-between w-full text-gray-700 font-medium">
              <Link to="/" className="hover:text-red-600 transition-colors duration-200">
                Home
              </Link>
              <Link to="/JobCategories" className="hover:text-red-600 transition-colors duration-200">
                Job Categories
              </Link>
              
              <Link to="/JobListing" className="hover:text-red-600 transition-colors duration-200">
                Latest Jobs
              </Link>
              <Link to="/Jobalert" className="hover:text-red-600 transition-colors duration-200">
                Job Alert
              </Link>
              <Link to="/applications" className="flex items-center gap-2 hover:text-red-600 transition-colors duration-200">
                <Briefcase size={16} />
                My Jobs
              </Link>
            </div>
          </div>

          {/* Right section (Login / Post Job / Recruiter / User) */}
          <div className="flex items-center gap-4 ml-6">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="hidden md:block text-sm text-gray-600">
                  Hi, {user.firstName}
                </span>
                <UserButton
                  appearance={{
                    elements: {
                      userButtonAvatarBox: "h-10 w-10 border-2 shadow-md",
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
                  className={`hidden md:block text-sm font-medium transition-all duration-200 px-4 py-2 rounded-lg ${
                    companyToken 
                      ? "bg-green-500 text-white hover:bg-green-600 shadow-md hover:shadow-lg" 
                      : "text-gray-600 hover:text-red-600 hover:bg-red-50"
                  }`}
                >
                  {companyToken ? "Recruiter Dashboard" : "Recruiter Portal"}
                </button>
                <button
                  onClick={() => openSignIn()}
                  className={`text-white px-6 py-2.5 rounded-xl font-medium text-sm ${
                    scrolled
                      ? "shadow-lg hover:shadow-red-500/30"
                      : "hover:shadow-md"
                  } transition-all duration-300`}
                  style={{ backgroundColor: "#FF0000" }}
                >
                  Get Started
                </button>
              </>
            )}
          </div>
        </nav>
      </div>
    </>
  );
};

export default Navbar;