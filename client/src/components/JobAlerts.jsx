import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, Home } from "lucide-react";

const JobAlerts = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();
  const { backendUrl, userData } = useContext(AppContext);

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-1000" style={{ backgroundColor: 'rgba(2, 3, 48, 0.1)' }}></div>
      

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-12 text-center"
        >
          
          <p className="text-gray-600 text-lg">Stay updated with personalized job opportunities</p>
        </motion.div>

        {/* Job Alert Section - EXACT SAME as Applications component */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ y: -2 }}
          className="group relative"
        >
          <div 
            className="absolute inset-0 rounded-xl blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"
            style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.1), rgba(2, 3, 48, 0.1))' }}
          ></div>
          <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl overflow-hidden shadow-lg">
            <div 
              className="absolute top-0 left-0 w-full h-px"
              style={{ background: 'linear-gradient(to right, transparent, #FF0000, transparent)' }}
            ></div>
            
            <div className="p-6">
              <div className="flex items-center mb-6">
                <div 
                  className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 shadow-lg"
                  style={{ background: "#FF0000" }}
                >
                  <Bell className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>Job Alert</h3>
                  <p className="text-600" style={{color:'#FF0000'}}>Stay updated with personalized job opportunities !</p>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-gray-700 leading-relaxed mb-2">
                  Never miss your dream job! Set up personalized job alerts based on your preferences and get notified instantly when matching opportunities are posted.
                </p>
                <p className="text-gray-600 text-sm">
                  Configure alerts by location, experience level, category, and designation to receive the most relevant job notifications.
                </p>
              </div>

              <motion.button
                onClick={() => navigate('/JobAlert')}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center px-6 py-3 text-white font-medium rounded-lg transition-all duration-200 shadow-lg"
                style={{ 
                  background: "#FF0000",
                  boxShadow: '0 0 20px rgba(255, 0, 0, 0.25)'
                }}
              >
                <Bell className="w-4 h-4 mr-2" />
                Create Job Alert
              </motion.button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default JobAlerts;