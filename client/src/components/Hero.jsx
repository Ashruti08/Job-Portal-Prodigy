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
        className="relative overflow-hidden mx-4 my-6 lg:mx-8 lg:my-10 rounded-3xl shadow-2xl"
        style={{ minHeight: '1000px' }}
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
        <div className="relative w-full h-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32">
          {/* Center Text */}
          {/* <div className="text-center">
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.8 }}
              className="text-xl text-black font-semibold max-w-2xl mx-auto mb-10 mt-28"
            >
              Turning <span className="text-red-600">Possibilities</span> into{" "}
              Probabilities and{" "}
              <span className="text-red-600">Probabilities</span> into{" "}
              <span className="text-red-600">Success</span>.
            </motion.p>
          </div> */}

          {/* 🔥 Search Bar Position Updated */}
          <motion.form
            onSubmit={onSearch}
            initial={{ opacity: 0, y: 30, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            style={{
              position: "absolute",
              top: "600px",   // adjust if you want higher/lower
              right: "570px",     // adjust spacing from left
              width: "850px",
              maxWidth: "100%",
              zIndex: 20,
            }}
          >
            <div
              style={{
                background: "white",
                borderRadius: "16px",
                border: "1px solid #d1d5db",
                overflow: "hidden",
                boxShadow: "0 10px 30px rgba(0,0,0,0.15)",
              }}
            >
              <div style={{ display: "flex", flexDirection: "row" }}>
                
                {/* Job Input */}
                <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "18px", borderRight: "1px solid #e5e7eb" }}>
                  <FiSearch style={{ color: "#6b7280", fontSize: "20px", marginRight: "10px" }} />
                  <input
                    type="text"
                    ref={titleRef}
                    placeholder="Job title, keywords, or company"
                    style={{
                      width: "100%",
                      fontSize: "18px",
                      border: "none",
                      outline: "none",
                      background: "transparent",
                      color: "#000",
                    }}
                  />
                </div>

      {/* Location Input */}
      <div style={{ flex: 1, display: "flex", alignItems: "center", padding: "18px", borderRight: "1px solid #e5e7eb" }}>
        <FiMapPin style={{ color: "#6b7280", fontSize: "20px", marginRight: "10px" }} />
        <input
          ref={locationRef}
          placeholder="Location or remote"
          style={{
            width: "100%",
            fontSize: "18px",
            border: "none",
            outline: "none",
            background: "transparent",
            color: "#000",
          }}
        />
      </div>

      {/* Search Button */}
      <button
        type="submit"
        style={{
          background: "linear-gradient(to right, #FF0000, #CC0000)",
          color: "white",
          fontWeight: "bold",
          padding: "18px 28px",
          fontSize: "18px",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "8px",
        }}
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
