import React from "react";
import { motion } from "framer-motion";

const WhatsAppContact = ({ 
  phoneNumber = "+919157808887", 
  message = "Hello! I'm interested in your services.",
  className = ""
}) => {
  const handleWhatsAppClick = () => {
    const formattedNumber = phoneNumber.replace(/\D/g, ''); // Remove non-digit characters
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.div 
      className={`fixed bottom-6 right-6 z-50 ${className}`}
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ opacity: 1, scale: 1, rotate: 0 }}
      transition={{ 
        type: "spring",
        stiffness: 200,
        damping: 20,
        delay: 1 
      }}
    >
      <motion.button
        onClick={handleWhatsAppClick}
        whileHover={{ 
          scale: 1.15,
          y: -8,
          rotate: 5
        }}
        whileTap={{ scale: 0.9 }}
        className="group relative overflow-hidden"
        style={{
          filter: 'drop-shadow(0 10px 20px rgba(37, 211, 102, 0.3))'
        }}
      >
        {/* Animated background glow */}
        <motion.div 
          className="absolute inset-0 rounded-full"
          style={{ background: 'linear-gradient(45deg, #25D366, #128C7E)' }}
          animate={{
            boxShadow: [
              '0 0 0 0 rgba(37, 211, 102, 0.4)',
              '0 0 0 20px rgba(37, 211, 102, 0)',
              '0 0 0 0 rgba(37, 211, 102, 0.4)'
            ]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        ></motion.div>
        
        {/* Main button */}
        <div className="relative w-16 h-16 bg-gradient-to-br from-green-500 via-green-600 to-green-700 rounded-full flex items-center justify-center shadow-2xl">
          {/* Inner pulse ring */}
          <div className="absolute inset-2 rounded-full bg-green-400/20 animate-ping"></div>
          
          {/* WhatsApp Icon SVG */}
          <motion.div
            animate={{ rotate: [0, -10, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg 
              className="w-8 h-8 text-white relative z-10" 
              fill="currentColor" 
              viewBox="0 0 24 24"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
            </svg>
          </motion.div>
          
          {/* Notification badge */}
          <motion.div 
            className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center border-2 border-white"
            animate={{ 
              scale: [1, 1.2, 1],
              rotate: [0, 10, -10, 0]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            <motion.div 
              className="w-2 h-2 bg-white rounded-full"
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1, repeat: Infinity }}
            />
          </motion.div>
        </div>
        
        {/* Hover tooltip */}
        <motion.div
          initial={{ opacity: 0, x: 20, scale: 0.8 }}
          whileHover={{ opacity: 1, x: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 300, damping: 25 }}
          className="absolute right-full top-1/2 transform -translate-y-1/2 mr-4 pointer-events-none"
        >
          <div className="bg-gray-900/90 backdrop-blur-sm text-white px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap shadow-xl border border-gray-700">
            💬 Chat with us on WhatsApp
            <div className="absolute left-full top-1/2 transform -translate-y-1/2 w-0 h-0 border-l-6 border-l-gray-900/90 border-y-6 border-y-transparent"></div>
          </div>
        </motion.div>
        
        {/* Floating particles effect */}
        {[...Array(3)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-green-300 rounded-full opacity-60"
            style={{
              top: `${20 + i * 15}%`,
              right: `${20 + i * 10}%`,
            }}
            animate={{
              y: [-20, -40, -20],
              x: [0, 10, 0],
              opacity: [0, 1, 0],
              scale: [0, 1, 0]
            }}
            transition={{
              duration: 3,
              repeat: Infinity,
              delay: i * 0.5,
              ease: "easeInOut"
            }}
          />
        ))}
      </motion.button>
    </motion.div>
  );
};

// Alternative inline version for use within other components (like your existing style)
export const WhatsAppInline = ({ 
  phoneNumber = "+919157808887",
  message = "Hello! I'm interested in your services.",
  text = "Join WhatsApp for New Updates",
  className = ""
}) => {
  const handleWhatsAppClick = () => {
    const formattedNumber = phoneNumber.replace(/\D/g, '');
    const encodedMessage = encodeURIComponent(message);
    const whatsappUrl = `https://wa.me/${formattedNumber}?text=${encodedMessage}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <motion.button
      onClick={handleWhatsAppClick}
      whileHover={{ scale: 1.02, y: -2 }}
      whileTap={{ scale: 0.98 }}
      className={`group relative overflow-hidden ${className}`}
    >
      <div 
        className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm"
        style={{ background: 'linear-gradient(45deg, rgba(37, 211, 102, 0.2), rgba(18, 140, 126, 0.2))' }}
      ></div>
      
      <div className="relative flex items-center justify-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium rounded-lg shadow-lg hover:shadow-green-500/25 transition-all duration-300">
        <svg 
          className="w-5 h-5 mr-3" 
          fill="currentColor" 
          viewBox="0 0 24 24"
        >
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.890-5.335 11.893-11.893A11.821 11.821 0 0020.465 3.516"/>
        </svg>
        {text}
        
        {/* Animated shine effect */}
        <div className="absolute inset-0 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transform translate-x-full group-hover:translate-x-[-200%] transition-transform duration-700"></div>
      </div>
    </motion.button>
  );
};

export default WhatsAppContact;