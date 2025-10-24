import React, { useContext, useState } from "react";
import { useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import moment from "moment";
import { AppContext } from "../context/AppContext";
import { useAuth, useUser } from "@clerk/clerk-react";
import { toast } from "react-toastify";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, File, Edit, Download, Briefcase, TrendingUp, Calendar, MapPin, Clock, Eye, CheckCircle, XCircle, AlertCircle, User, BarChart3, Home, Bell } from "lucide-react";

const AppliedJobs = () => {
  const { user } = useUser();
  const { getToken } = useAuth();
  const navigate = useNavigate();

  const [isEdit, setIsEdit] = useState(false);
  const [resume, setResume] = useState(null);
  const [selectedStatus, setSelectedStatus] = useState('all');

  const context = useContext(AppContext);
  const { backendUrl, userData, userApplications, fetchUserData } = context;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2
      }
    }
  };

  const cardVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const updateResume = async () => {
    try {
      if (!resume) {
        toast.error("Please select a resume file.");
        return;
      }

      const formData = new FormData();
      formData.append("resume", resume);

      const token = await getToken();

      const response = await fetch(`${backendUrl}/api/users/update-resume`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData
      });
      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        await fetchUserData();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Failed to update resume. Please try again.");
    }

    setIsEdit(false);
    setResume(null);
  };

  const getStatusConfig = (status) => {
    switch(status) {
      case "Accepted":
        return { 
          bg: "bg-emerald-500/10", 
          text: "text-emerald-400", 
          border: "border-emerald-500/20",
          icon: CheckCircle,
          glow: "shadow-emerald-500/20"
        };
      case "Rejected":
        return { 
          bg: "bg-red-500/10", 
          text: "text-red-400", 
          border: "border-red-500/20",
          icon: XCircle,
          glow: "shadow-red-500/20"
        };
      default:
        return { 
          bg: "bg-amber-500/10", 
          text: "text-amber-400", 
          border: "border-amber-500/20",
          icon: AlertCircle,
          glow: "shadow-amber-500/20"
        };
    }
  };

  const getStatusStats = () => {
    const stats = {
      total: userApplications?.length || 0,
      accepted: userApplications?.filter(app => app.status === 'Accepted').length || 0,
      pending: userApplications?.filter(app => !app.status || app.status === 'Pending' || (app.status !== 'Accepted' && app.status !== 'Rejected')).length || 0,
      rejected: userApplications?.filter(app => app.status === 'Rejected').length || 0
    };
    return stats;
  };

  const stats = getStatusStats();
  const filteredApplications = selectedStatus === 'all' 
    ? userApplications 
    : userApplications?.filter(app => {
        if (selectedStatus === 'pending') {
          return !app.status || app.status === 'Pending' || (app.status !== 'Accepted' && app.status !== 'Rejected');
        }
        return app.status?.toLowerCase() === selectedStatus.toLowerCase();
      }) || [];

  return (
    <div className="min-h-screen bg-white relative overflow-hidden">
      {/* Animated background grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#f1f5f9_1px,transparent_1px),linear-gradient(to_bottom,#f1f5f9_1px,transparent_1px)] bg-[size:4rem_4rem] opacity-20"></div>
      
      {/* Floating orbs */}
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse" style={{ backgroundColor: 'rgba(255, 0, 0, 0.1)' }}></div>
      <div className="absolute bottom-0 right-1/4 w-72 h-72 rounded-full blur-3xl animate-pulse delay-1000" style={{ backgroundColor: 'rgba(2, 3, 48, 0.1)' }}></div>
      
      
      <motion.div 
        className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        <motion.div 
          variants={cardVariants}
          className="mb-12 text-center"
        >
          
          <p className="text-gray-600 text-lg">Track your career journey with precision</p>
        </motion.div>

        {/* Stats Grid */}
        <motion.div 
          variants={cardVariants}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8"
        >
          {[
            { label: "Total Applications", value: stats.total, icon: Briefcase, color: "from-gray-600 to-gray-700" },
            { label: "Accepted", value: stats.accepted, icon: CheckCircle, color: "from-emerald-600 to-emerald-700" },
            { label: "Pending", value: stats.pending, icon: Clock, color: "from-amber-600 to-amber-700" }
          ].map((stat, index) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: index * 0.1 + 0.3, type: "spring", stiffness: 100 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="group relative"
            >
              <div 
                className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-xl blur-xl"
                style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.2), rgba(2, 3, 48, 0.2))' }}
              ></div>
              <div className="relative bg-white/80 backdrop-blur-sm border border-gray-200 rounded-xl p-6 hover:border-gray-300 transition-all duration-300 shadow-lg">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1" style={{ color: '#020330' }}>{stat.value}</p>
                  </div>
                  <div className={`w-12 h-12 bg-gradient-to-br ${stat.color} rounded-lg flex items-center justify-center shadow-lg`}>
                    <stat.icon className="w-6 h-6 text-white" />
                  </div>
                </div>
                
                {/* Animated progress bar */}
                <div className="mt-4 w-full bg-gray-200 rounded-full h-1.5">
                  <motion.div 
                    className="h-1.5 rounded-full"
                    style={{ 
                      background: "#FF0000"
                    }}
                    initial={{ width: 0 }}
                    animate={{ width: `${Math.min((stat.value / Math.max(stats.total, 1)) * 100, 100)}%` }}
                    transition={{ delay: index * 0.1 + 0.8, duration: 1.2, ease: "easeOut" }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* Applications Section */}
        <motion.div
          variants={cardVariants}
          className="mb-8 group relative"
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
              <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-6">
                <div className="flex items-center mb-4 lg:mb-0">
                  <div 
                    className="w-10 h-10 rounded-lg flex items-center justify-center mr-4 shadow-lg"
                    style={{ background: ' #FF0000' }}
                  >
                    <BarChart3 className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold" style={{ color: '#020330' }}>Application Tracker</h3>
                    <p className="text-gray-600">Monitor your progress</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  {['all', 'accepted', 'pending', 'rejected'].map((status) => (
                    <motion.button
                      key={status}
                      onClick={() => setSelectedStatus(status)}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                        selectedStatus === status
                          ? 'text-white shadow-lg'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                      }`}
                      style={selectedStatus === status ? {
                        background: ' #FF0000',
                        boxShadow: '0 0 20px rgba(255, 0, 0, 0.25)'
                      } : {}}
                    >
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </motion.button>
                  ))}
                </div>
              </div>

              <AnimatePresence mode="wait">
                {filteredApplications?.length > 0 ? (
                  <motion.div
                    key="applications"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="space-y-3"
                  >
                    {filteredApplications.map((job, index) => {
                      const statusConfig = getStatusConfig(job.status);
                      const StatusIcon = statusConfig.icon;
                      
                      return (
                        <motion.div
                          key={job.id || index}
                          initial={{ opacity: 0, y: 20, scale: 0.95 }}
                          animate={{ opacity: 1, y: 0, scale: 1 }}
                          transition={{ delay: index * 0.05 }}
                          whileHover={{ y: -2, scale: 1.01 }}
                          className="group relative"
                        >
                          <div 
                            className="absolute inset-0 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-sm"
                            style={{ background: 'linear-gradient(to right, rgba(255, 0, 0, 0.05), rgba(2, 3, 48, 0.05))' }}
                          ></div>
                          
                          <div className="relative flex items-center justify-between p-4 bg-gray-50/50 border border-gray-200 rounded-lg hover:bg-white/80 hover:border-gray-300 transition-all duration-300 shadow-sm hover:shadow-md">
                            <div className="flex items-center space-x-4 flex-1 min-w-0">
                              <div className="flex-shrink-0">
                                <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-red-500 to-red-600 flex items-center justify-center overflow-hidden border border-gray-200">
                                  {job.companyId?.image ? (
                                    <img
                                      className="w-full h-full object-cover bg-white"
                                      src={job.companyId.image}
                                      alt={`${job.companyId?.name || "Company"} Logo`}
                                      onError={(e) => {
                                        e.target.style.display = 'none';
                                        e.target.parentElement.innerHTML = `<span class="text-white text-lg font-bold">${(job.companyId?.name || "C").charAt(0).toUpperCase()}</span>`;
                                      }}
                                    />
                                  ) : (
                                    <span className="text-white text-lg font-bold">
                                      {(job.companyId?.name || "C").charAt(0).toUpperCase()}
                                    </span>
                                  )}
                                </div>
                              </div>
                              
                              <div className="flex-1 min-w-0">
                                <p className="font-medium truncate" style={{ color: '#020330' }}>
                                  {job.jobId?.title || "N/A"}
                                </p>
                                <p className="text-gray-600 text-sm">
                                  {job.companyId?.name || "Unknown Company"}
                                </p>
                                <div className="flex items-center text-xs text-gray-500 mt-1 space-x-4">
                                  <div className="flex items-center">
                                    <MapPin className="w-3 h-3 mr-1" />
                                    {job.jobId?.location || "N/A"}
                                  </div>
                                  <div className="flex items-center">
                                    <Calendar className="w-3 h-3 mr-1" />
                                    {moment(job.date).format("MMM DD, YYYY")}
                                  </div>
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex-shrink-0">
                              <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-medium ${statusConfig.bg} ${statusConfig.text} ${statusConfig.border} border backdrop-blur-sm`}>
                                <StatusIcon className="w-3 h-3 mr-1.5" />
                                {job.status || "Pending"}
                              </span>
                            </div>
                          </div>
                        </motion.div>
                      );
                    })}
                  </motion.div>
                ) : (
                  <motion.div
                    key="empty"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="text-center py-16"
                  >
                    <motion.div
                      animate={{ 
                        y: [0, -10, 0],
                        rotateY: [0, 180, 360]
                      }}
                      transition={{ 
                        duration: 4,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-16 h-16 rounded-xl flex items-center justify-center mx-auto mb-6 shadow-xl"
                      style={{ background: ' #FF0000' }}
                    >
                      <Briefcase className="w-8 h-8 text-white" />
                    </motion.div>
                    
                    <h3 className="text-xl font-semibold mb-2" style={{ color: '#020330' }}>
                      {selectedStatus === 'all' ? 'No applications yet' : `No ${selectedStatus} applications`}
                    </h3>
                    <p className="text-gray-600 mb-8 max-w-md mx-auto">
                      {selectedStatus === 'all' 
                        ? 'Start your journey by applying to exciting opportunities'
                        : `You don't have any ${selectedStatus} applications at the moment`
                      }
                    </p>
                    
                    <motion.button 
                      whileHover={{ scale: 1.05, y: -2 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => navigate('/joblisting')}
                      className="px-6 py-3 text-white font-medium rounded-lg transition-all duration-300 shadow-lg"
                      style={{ 
                        background: ' #FF0000',
                        boxShadow: '0 0 20px rgba(255, 0, 0, 0.25)'
                      }}
                    >
                      Explore Opportunities
                    </motion.button>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AppliedJobs;