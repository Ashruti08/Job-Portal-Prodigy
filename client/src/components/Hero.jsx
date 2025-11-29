import React, { useContext, useRef, useState } from "react";
import { AppContext } from "../context/AppContext";
import bgimage from "../assets/bg-image-main.jpg";
import { motion } from "framer-motion";
import JobListing from "../pages/JobListing";
import { FiSearch, FiMapPin, FiArrowRight } from "react-icons/fi";
import { FiBriefcase, FiUsers, FiTrendingUp } from "react-icons/fi";
import backgroundImage from '../assets/backgroundimage.jpg';
// Import company logos directly
import companyLogo1 from "../assets/facebook-1-logo-svgrepo-com.svg";
import companyLogo2 from "../assets/linkedin-logo-svgrepo-com.svg";
import companyLogo3 from "../assets/slack-logo-svgrepo-com.svg";
import companyLogo4 from "../assets/instagram-logo-svgrepo-com.svg";
import companyLogo5 from "../assets/netflix-2-logo-svgrepo-com.svg";
import companyLogo6 from "../assets/google-1-1-logo-svgrepo-com.svg";
import { useNavigate } from "react-router-dom";

console.log('VITE_BACKEND_URL:', import.meta.env.VITE_BACKEND_URL);
console.log('All env vars:', import.meta.env);

const Hero = () => {
  const { setSearchFilter, setIsSearched } = useContext(AppContext);
  const titleRef = useRef(null);
  const locationRef = useRef(null);
  const [activeTag, setActiveTag] = useState(null);
const Navigate=useNavigate();
  const companyLogos = [
    'https://upload.wikimedia.org/wikipedia/commons/5/51/Facebook_f_logo_%282019%29.svg',
    'https://upload.wikimedia.org/wikipedia/commons/c/ca/LinkedIn_logo_initials.png',
    'https://upload.wikimedia.org/wikipedia/commons/d/d5/Slack_icon_2019.svg',
    'https://upload.wikimedia.org/wikipedia/commons/e/e7/Instagram_logo_2016.svg',
    'https://upload.wikimedia.org/wikipedia/commons/0/08/Netflix_2015_logo.svg',
    'https://upload.wikimedia.org/wikipedia/commons/2/2f/Google_2015_logo.svg'
  ];

  const popularTags = [
    "Developer",
    "Trader",
    "Marketing",
    "Senior Research Analyst",
    "Manager",
  ];

  const stats = [
    { icon: FiBriefcase, number: "50K+", label: "Active Jobs" },
    { icon: FiUsers, number: "1M+", label: "Job Seekers" },
    { icon: FiTrendingUp, number: "95%", label: "Success Rate" }
  ];

  const handleTagClick = (tag) => {
    setActiveTag(tag);
    titleRef.current.value = tag;
    // Optional: automatically trigger search
    // onSearch({ preventDefault: () => {} });
  };

  const onSearch = (e) => {
    e.preventDefault();
    const searchData=({
      title: titleRef.current.value,
      location: locationRef.current.value,
    });
    setIsSearched(true);
    setSearchFilter(searchData);
    Navigate('/Joblisting');
  };


  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      {/* Floating container with margin on all sides - adjusted height */}
      <section className="relative overflow-hidden mx-4 my-6 lg:mx-8 lg:my-10 rounded-3xl shadow-2xl" style={{ minHeight: '1000px' }}>
        {/* Background without effects - adjusted to show full image */}
        <div className="absolute inset-0 bg-gray-100">
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover object-center"
            style={{ minHeight: '900px' }}
          />
          {/* Removed gradient overlay and mix-blend-multiply for cleaner look */}
        </div>

        {/* Adjusted padding for better proportions */}
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          <div className="text-center">
            {/* Removed duplicate title - image already contains it */}

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-white/90 max-w-2xl mx-auto mb-10 mt-32"
            >
              Turning <span style={{ color: '#ff0000' }}>Possibilities</span> into{' '}
      Probabilities and {''}
      <span style={{ color: '#ff0000' }}>Probabilities</span> into{' '}
      <span style={{ color: '#ff0000' }}>Success</span>.
            </motion.p>

            {/* Stats bar - moved higher up */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="flex flex-wrap justify-center gap-8 mb-10"
            >
              {stats.map((stat, index) => (
                <motion.div
                  key={index}
                  className="flex items-center space-x-2 text-black/80"
                  whileHover={{ scale: 1.05, color: "#141414ff" }}
                  transition={{ type: "spring", damping: 15 }}
                >
                  <stat.icon className="text-[#fcde47] text-xl" />
                  <span className="font-bold text-xl">{stat.number}</span>
                  <span className="text-sm">{stat.label}</span>
                </motion.div>
              ))}
            </motion.div>

            {/* Enhanced search form */}
            <motion.form
              onSubmit={onSearch}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.6, duration: 0.8, type: "spring", damping: 20 }}
              className="max-w-4xl mx-auto group"
            >
              <div className="relative">
                {/* Removed glow effect */}
                
                <div className="relative bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl overflow-hidden border border-white/20">
                  <div className="flex flex-col md:flex-row">
                    <motion.div 
                      className="flex-1 flex items-center px-6 py-5 border-b md:border-b-0 md:border-r border-gray-200/50 group/input"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiSearch 
                        className="text-gray-400 text-xl mr-4 transition-colors duration-200"
                        style={{ color: "rgb(156 163 175)" }}
                        onMouseEnter={(e) => e.target.style.color = "#ff0000a1"}
                        onMouseLeave={(e) => e.target.style.color = "rgb(156 163 175)"}
                      />
                      <input
                        type="text"
                        ref={titleRef}
                        placeholder="Job title, keywords, or company"
                        className="w-full text-lg outline-none placeholder-gray-400 bg-transparent font-medium"
                        defaultValue={activeTag || ""}
                      />
                    </motion.div>
                    
                    <motion.div 
                      className="flex-1 flex items-center px-6 py-5 border-b md:border-b-0 md:border-r border-gray-200/50 group/input"
                      whileHover={{ backgroundColor: "rgba(255, 255, 255, 1)" }}
                      transition={{ duration: 0.2 }}
                    >
                      <FiMapPin 
                        className="text-gray-400 text-xl mr-4 transition-colors duration-200"
                        style={{ color: "rgb(156 163 175)" }}
                        onMouseEnter={(e) => e.target.style.color = "#FF0000"}
                        onMouseLeave={(e) => e.target.style.color = "rgb(156 163 175)"}
                      />
                      <input
                        type="text"
                        ref={locationRef}
                        placeholder="Location or remote"
                        className="w-full text-lg outline-none placeholder-gray-400 bg-transparent font-medium"
                      />
                    </motion.div>
                    
                    <motion.button
                      type="submit"
                      className="relative text-white px-8 py-5 font-bold text-lg flex items-center justify-center transition-all duration-300 overflow-hidden group/button"
                      style={{ 
                        background:" linear-gradient(to right, #FF0000)"
                      }}
                      onMouseEnter={(e) => {
                        e.target.style.background =" linear-gradient(to right, #CC0000)";
                      }}
                      onMouseLeave={(e) => {
                        e.target.style.background = "linear-gradient(to right, #FF0000)";
                      }}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0  transition-opacity duration-300"
                       
                      />
                      <span className="relative z-10">Search Jobs</span>
                      <FiArrowRight className="ml-3 relative z-10 group-hover/button:translate-x-1 transition-transform duration-200" />
                    </motion.button>
                  </div>
                </div>
              </div>
            </motion.form>

            {/* Popular tags */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.8 }}
              className="mt-8 text-white/80"
            >
              <span className="mr-4 text-lg font-medium">Popular Searches:</span>
              <div className="flex flex-wrap justify-center gap-3 mt-3">
                {popularTags.map((tag, i) => (
                  <motion.button
                    key={i}
                    onClick={() => handleTagClick(tag)}
                    className={`relative px-4 py-2 rounded-full text-sm font-medium transition-all duration-300 overflow-hidden group/tag ${
                      activeTag === tag
                        ? "bg-white/30 text-white shadow-lg"
                        : "bg-white/10 hover:bg-white/20 backdrop-blur-sm"
                    }`}
                    whileHover={{ scale: 1.05, y: -2 }}
                    whileTap={{ scale: 0.95 }}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.9 + i * 0.1 }}
                  >
                    <motion.div
                      className="absolute inset-0 opacity-0 group-hover/tag:opacity-100 transition-opacity duration-300"
                      style={{
                        background: "linear-gradient(to right, rgba(255, 0, 0, 0.3), rgba(0, 0, 0, 0.3))"
                      }}
                      initial={{ scale: 0 }}
                      whileHover={{ scale: 1 }}
                      transition={{ duration: 0.3 }}
                    />
                    <span className="relative z-10">{tag}</span>
                  </motion.button>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>
    </motion.div>
  );
};

export default Hero;