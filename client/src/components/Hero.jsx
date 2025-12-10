import React, { useContext, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { motion } from "framer-motion";
import backgroundImage from '../assets/backgroundimage.jpg';
import { FiSearch, FiMapPin, FiArrowRight } from "react-icons/fi";
import { useNavigate } from "react-router-dom";

const Hero = () => {
  const { setSearchFilter, setIsSearched } = useContext(AppContext);
  const titleRef = useRef(null);
  const locationRef = useRef(null);
  const navigate = useNavigate();

  const onSearch = (e) => {
    e.preventDefault();
    const searchData = {
      title: titleRef.current.value,
      location: locationRef.current.value,
    };
    setIsSearched(true);
    setSearchFilter(searchData);
    navigate('/Joblisting');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
    >
      <section 
        className="relative overflow-hidden mx-2 sm:mx-4 my-4 sm:my-6 lg:mx-8 lg:my-10 rounded-2xl sm:rounded-3xl shadow-2xl"
        style={{ minHeight: '500px' }}
      >
        {/* Background */}
        <div className="absolute inset-0">
          <img
            src={backgroundImage}
            alt="Background"
            className="w-full h-full object-cover object-center"
          />
        </div>

        {/* Content */}
        <div className="relative w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 md:py-24 lg:py-32 flex items-center justify-center">
          
          {/* Search Bar - Centered and Responsive */}
          <motion.form
            onSubmit={onSearch}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="w-full max-w-4xl"
          >
            <div className="bg-white rounded-xl sm:rounded-2xl border border-gray-200 overflow-hidden shadow-xl">
              
              {/* Desktop Layout */}
              <div className="hidden md:flex flex-row">
                {/* Job Input */}
                <div className="flex-1 flex items-center px-4 py-4 lg:px-6 lg:py-5 border-r border-gray-200">
                  <FiSearch className="text-gray-400 text-lg lg:text-xl mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    ref={titleRef}
                    placeholder="Job title, keywords, or company"
                    className="w-full text-base lg:text-lg border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Location Input */}
                <div className="flex-1 flex items-center px-4 py-4 lg:px-6 lg:py-5 border-r border-gray-200">
                  <FiMapPin className="text-gray-400 text-lg lg:text-xl mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    ref={locationRef}
                    placeholder="Location or remote"
                    className="w-full text-base lg:text-lg border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-6 lg:px-8 py-4 lg:py-5 text-base lg:text-lg border-none cursor-pointer flex items-center gap-2 hover:from-red-700 hover:to-red-800 transition-all whitespace-nowrap"
                >
                  Search Jobs <FiArrowRight />
                </button>
              </div>

              {/* Mobile/Tablet Layout */}
              <div className="md:hidden flex flex-col">
                {/* Job Input */}
                <div className="flex items-center px-4 py-3.5 border-b border-gray-200">
                  <FiSearch className="text-gray-400 text-lg mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    ref={titleRef}
                    placeholder="Job title, keywords..."
                    className="w-full text-base border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Location Input */}
                <div className="flex items-center px-4 py-3.5 border-b border-gray-200">
                  <FiMapPin className="text-gray-400 text-lg mr-3 flex-shrink-0" />
                  <input
                    type="text"
                    ref={locationRef}
                    placeholder="Location or remote"
                    className="w-full text-base border-none outline-none bg-transparent text-gray-900 placeholder-gray-400"
                  />
                </div>

                {/* Search Button */}
                <button
                  type="submit"
                  className="bg-gradient-to-r from-red-600 to-red-700 text-white font-bold px-6 py-4 text-base border-none cursor-pointer flex items-center justify-center gap-2 hover:from-red-700 hover:to-red-800 transition-all w-full"
                >
                  Search Jobs <FiArrowRight />
                </button>
              </div>
            </div>
          </motion.form>
        </div>
      </section>
    </motion.div>
  );
};

export default Hero;
