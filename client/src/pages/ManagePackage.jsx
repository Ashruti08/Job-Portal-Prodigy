import React from "react";
import { motion } from "framer-motion";
import { Package, Sparkles, Rocket, Zap } from "lucide-react";

const ManagePackage = () => {
  const floatingIcons = [
    { Icon: Package, delay: 0, duration: 3 },
    { Icon: Sparkles, delay: 0.5, duration: 3.5 },
    { Icon: Rocket, delay: 1, duration: 4 },
    { Icon: Zap, delay: 1.5, duration: 3.2 },
  ];

  return (
    <div className="bg-white min-h-screen py-8">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <h1 
            className="text-2xl md:text-3xl font-bold mb-2"
            style={{ color: '#020330' }}
          >
            Manage Packages
          </h1>
          <p className="text-gray-500">Configure and customize your subscription packages</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden"
        >
          <div className="relative min-h-[60vh] flex items-center justify-center p-8 overflow-hidden">
            {/* Animated background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-purple-50 to-blue-50 opacity-50"></div>
            
            {/* Floating icons */}
            <div className="absolute inset-0">
              {floatingIcons.map(({ Icon, delay, duration }, index) => (
                <motion.div
                  key={index}
                  className="absolute text-gray-200"
                  style={{
                    left: `${20 + index * 20}%`,
                    top: `${30 + (index % 2) * 30}%`,
                  }}
                  animate={{
                    y: [0, -30, 0],
                    rotate: [0, 10, -10, 0],
                    scale: [1, 1.2, 1],
                  }}
                  transition={{
                    duration,
                    delay,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                >
                  <Icon size={48} strokeWidth={1.5} />
                </motion.div>
              ))}
            </div>

            {/* Main content */}
            <div className="relative z-10 text-center max-w-2xl mx-auto">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ 
                  duration: 0.5, 
                  delay: 0.4,
                  type: "spring",
                  stiffness: 200 
                }}
                className="mb-8 inline-block"
              >
                <div 
                  className="w-24 h-24 rounded-full flex items-center justify-center mx-auto"
                  style={{ backgroundColor: '#FFF0F0' }}
                >
                  <Package 
                    size={48} 
                    style={{ color: '#FF0000' }}
                    strokeWidth={2}
                  />
                </div>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
              >
                <h2 
                  className="text-3xl md:text-4xl font-bold mb-4"
                  style={{ color: '#020330' }}
                >
                  Coming Soon
                </h2>
                
                <motion.p 
                  className="text-gray-600 text-lg mb-8 max-w-md mx-auto"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 0.8 }}
                >
                  We're working hard to bring you an amazing package management experience. Stay tuned!
                </motion.p>

                {/* Animated dots */}
                <motion.div 
                  className="flex items-center justify-center gap-2"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.6, delay: 1 }}
                >
                  {[0, 1, 2].map((index) => (
                    <motion.div
                      key={index}
                      className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: '#FF0000' }}
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5],
                      }}
                      transition={{
                        duration: 1.5,
                        delay: index * 0.2,
                        repeat: Infinity,
                        ease: "easeInOut",
                      }}
                    />
                  ))}
                </motion.div>
              </motion.div>

              {/* Feature cards preview */}
              <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 1.2 }}
                className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-12"
              >
                {[
                  { icon: Sparkles, text: "Custom Plans" },
                  { icon: Rocket, text: "Fast Setup" },
                  { icon: Zap, text: "Instant Updates" },
                ].map(({ icon: Icon, text }, index) => (
                  <motion.div
                    key={index}
                    className="bg-white/80 backdrop-blur-sm rounded-lg p-4 border border-gray-100 shadow-sm"
                    whileHover={{ 
                      scale: 1.05,
                      boxShadow: "0 10px 25px -5px rgba(255, 0, 0, 0.1)"
                    }}
                    transition={{ duration: 0.2 }}
                  >
                    <Icon 
                      size={24} 
                      className="mx-auto mb-2"
                      style={{ color: '#FF0000' }}
                    />
                    <p 
                      className="text-sm font-medium"
                      style={{ color: '#020330' }}
                    >
                      {text}
                    </p>
                  </motion.div>
                ))}
              </motion.div>
            </div>

            {/* Animated corner decorations */}
            <motion.div
              className="absolute top-0 right-0 w-32 h-32 rounded-bl-full opacity-20"
              style={{ backgroundColor: '#FF0000' }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-32 h-32 rounded-tr-full opacity-20"
              style={{ backgroundColor: '#FF0000' }}
              animate={{
                scale: [1, 1.2, 1],
              }}
              transition={{
                duration: 4,
                delay: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default ManagePackage;