import React from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import HeroImage from "../assets/image-gall.jpg";
import {
  FiSearch,
  FiDollarSign,
  FiBarChart2,
  FiArrowRight,
} from "react-icons/fi";

const AppDownload = () => {
  return (
    <section className="relative bg-white overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-full opacity-10">
        <div className="absolute top-20 left-20 w-40 h-40 bg-red-300 rounded-full mix-blend-multiply filter blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-60 h-60 bg-red-200 rounded-full mix-blend-multiply filter blur-xl"></div>
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 pb-12 sm:pt-12 sm:pb-16 lg:pt-16 lg:pb-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          viewport={{ once: true }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center"
        >
          {/* Content */}
          <div className="relative z-10">
            <motion.span
              className="inline-block px-3 py-1 text-sm font-medium text-red-700 bg-red-100 rounded-full mb-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              Find faster
            </motion.span>

            <motion.h1
              className="text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-bold leading-tight mb-4 sm:mb-6"
              style={{ color: "#020330" }}
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Discover Your <span style={{ color: "#FF0000" }}>Dream Job</span>{" "}
              Today
            </motion.h1>

            <motion.p
              className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Join millions of professionals and explore thousands of career
              opportunities. Get personalized matches, salary insights, and
              company reviews - all in one place.
            </motion.p>

            {/* Features */}
            <motion.div
              className="space-y-3 sm:space-y-4 mb-8 sm:mb-10"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex items-start">
                <div className="flex-shrink-0 bg-red-100 p-2 rounded-lg text-red-600">
                  <FiSearch className="w-5 h-5" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Smart Job Matching
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    AI-powered recommendations based on your skills and
                    preferences
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-red-100 p-2 rounded-lg text-red-600">
                  <FiDollarSign className="w-5 h-5" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Salary Insights
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    See personalized salary estimates for every position
                  </p>
                </div>
              </div>

              <div className="flex items-start">
                <div className="flex-shrink-0 bg-red-100 p-2 rounded-lg text-red-600">
                  <FiBarChart2 className="w-5 h-5" />
                </div>
                <div className="ml-3 sm:ml-4">
                  <h3 className="text-base sm:text-lg font-medium text-gray-900">
                    Company Analytics
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Detailed reviews and ratings for 600,000+ companies
                  </p>
                </div>
              </div>
            </motion.div>

            {/* CTA Buttons */}
            <motion.div
              className="flex flex-col sm:flex-row gap-3 sm:gap-4"
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              transition={{ delay: 0.6 }}
            >
              <Link
                to="/joblisting"
                className="px-6 sm:px-8 py-3 sm:py-4 text-white font-medium rounded-lg shadow-md transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 text-center"
                style={{ backgroundColor: "#FF0000" }}
                onMouseEnter={(e) => e.target.style.backgroundColor = "#CC0000"}
                onMouseLeave={(e) => e.target.style.backgroundColor = "#FF0000"}
              >
                Browse Jobs
              </Link>

              <Link
                to="/dashboard/manage-job"
                className="px-6 sm:px-8 py-3 sm:py-4 bg-white hover:bg-gray-50 font-medium rounded-lg shadow-sm border border-gray-300 transition-all duration-300 flex items-center justify-center gap-2"
                style={{ color: "#FF0000" }}
              >
                Recruiter Dashboard
                <FiArrowRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </div>

          {/* Image */}
          <motion.div
            className="relative mt-8 lg:mt-0"
            initial={{ opacity: 0, x: 20 }}
            whileInView={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl">
              <img
                src={HeroImage}
                alt="Diverse professionals collaborating in modern office"
                className="w-full h-auto object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-gray-900/30 to-transparent"></div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default AppDownload;