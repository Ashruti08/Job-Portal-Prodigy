import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { FiBookmark, FiMapPin, FiBriefcase, FiDollarSign, FiClock, FiLayers, FiTrello } from "react-icons/fi";

const JobCard = ({ job }) => {
  // DEBUG: Add this logging
  console.log("=== JobCard Debug ===");
  console.log("Full job object:", job);
  console.log("job.salary:", job.salary);
  console.log("job.noticeperiod:", job.noticeperiod);
  console.log("job.jobchannel:", job.jobchannel);
  console.log("job.jobcategory:", job.jobcategory);
  console.log("==================");
  
  const navigate = useNavigate();
  const [isSaved, setIsSaved] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const stripHtmlTags = (html) => {
    return html ? html.replace(/<[^>]*>?/gm, '') : 'No description provided';
  };

  const getTimePassed = (date) => {
    if (!date) return "Recently posted";
    const diff = Date.now() - new Date(date);
    const mins = Math.floor(diff / 60000);
    const hrs = Math.floor(mins / 60);
    const days = Math.floor(hrs / 24);
    if (days > 0) return `${days}d ago`;
    if (hrs > 0) return `${hrs}h ago`;
    if (mins > 0) return `${mins}m ago`;
    return "Just now";
  };

  const formatSalary = (salary) => {
    if (!salary) return "Salary not disclosed";
    if (typeof salary === "string") return salary;
    if (salary.min && salary.max) return `$${salary.min.toLocaleString()} - $${salary.max.toLocaleString()}`;
    
    // Handle number directly
    if (typeof salary === "number") {
      return `$${salary.toLocaleString()}`;
    }
    
    // Fallback for object with amount property
    if (salary.amount) {
      return `$${salary.amount.toLocaleString()}`;
    }
    
    return "Salary not disclosed";
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      viewport={{ once: true }}
    >
      <motion.div
        whileHover={{ scale: 1.02 }}
        transition={{ type: "spring", stiffness: 300 }}
        className="relative group p-1 rounded-2xl bg-gradient-to-tr from-white to-[#f9f9f9] border border-gray-200 hover:border-indigo-400 shadow-xl hover:shadow-2xl backdrop-blur-md transition-all duration-300"
      >
        <div className="bg-white rounded-2xl overflow-hidden">
          {/* Ribbon */}
          {getTimePassed(job.postedAt) === "Just now" && (
            <span className="absolute top-4 right-4 bg-indigo-500 text-white text-[10px] px-2 py-1 rounded-full font-semibold shadow-md z-10 animate-pulse">
              NEW
            </span>
          )}

          {/* Header */}
          <div className="p-6 pb-3 flex justify-between items-start">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-xl border border-gray-200 overflow-hidden bg-white shadow-sm">
                <img
                  src={job.companyId?.image || "/default-company.png"}
                  alt="logo"
                  className="w-full h-full object-contain p-1"
                />
              </div>
              <div>
                <h3 className="text-lg font-bold text-zinc-800">{job.title || "Job Title"}</h3>
                <p className="text-sm text-gray-500">{job.companyId?.name || "Company"}</p>
              </div>
            </div>
            <button
              onClick={() => setIsSaved(!isSaved)}
              className={`p-2 rounded-full text-xl ${
                isSaved ? "text-indigo-500" : "text-gray-400 hover:text-indigo-600"
              } transition`}
              title={isSaved ? "Saved" : "Save job"}
            >
              <FiBookmark />
            </button>
          </div>

          {/* Primary Tags Row */}
          <div className="px-6 pb-3 flex flex-wrap gap-2 text-xs font-medium">
            <span className="flex items-center gap-1 px-3 py-1 rounded-full" style={{backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#CC0000'}}>
              <FiMapPin className="text-sm" /> {job.location || "Remote"}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full" style={{backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#CC0000'}}>
              <FiBriefcase className="text-sm" /> {job.level || "Intermediate"}
            </span>
            <span className="flex items-center gap-1 px-3 py-1 rounded-full" style={{backgroundColor: 'rgba(255, 0, 0, 0.1)', color: '#CC0000'}}>
              <FiDollarSign className="text-sm" /> {formatSalary(job.salary)}
            </span>
            {/* Notice Period */}
            {job.noticeperiod && job.noticeperiod.toString().trim() !== "" && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full" style={{backgroundColor: 'rgba(0, 255, 0, 0.1)', color: '#00AA00'}}>
                <FiClock className="text-sm" /> {job.noticeperiod}
              </span>
            )}
          </div>

          {/* Job Channel and Category Row (Horizontal) */}
          <div className="px-6 pb-4 flex flex-wrap gap-2 text-xs font-medium">
            {/* Job Channel */}
            {job.jobchannel && job.jobchannel.toString().trim() !== "" && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full" style={{backgroundColor: 'rgba(128, 0, 128, 0.1)', color: '#800080'}}>
                <FiLayers className="text-sm" /> {job.jobchannel}
              </span>
            )}
            {/* Job Category */}
            {job.jobcategory && job.jobcategory.toString().trim() !== "" && (
              <span className="flex items-center gap-1 px-3 py-1 rounded-full" style={{backgroundColor: 'rgba(128, 0, 128, 0.1)', color: '#800080'}}>
                <FiTrello className="text-sm" /> {job.jobcategory}
              </span>
            )}
          </div>

          {/* Description */}
          <div className="px-6 pb-4">
            <p
              className={`text-sm text-gray-600 leading-relaxed ${
                isExpanded ? "" : "line-clamp-3"
              } cursor-pointer hover:text-black`}
              onClick={() => setIsExpanded(!isExpanded)}
              title="Click to expand"
            >
              {stripHtmlTags(job.description)}
            </p>
          </div>

          {/* Skills */}
          {job.skills?.length > 0 && (
            <div className="px-6 pb-4">
              <div className="flex flex-wrap gap-2">
                {job.skills.slice(0, 4).map((skill, index) => (
                  <motion.span
                    key={index}
                    whileHover={{ scale: 1.05 }}
                    className="px-3 py-1 text-xs rounded-full bg-gray-100 text-gray-700 font-medium"
                  >
                    {skill}
                  </motion.span>
                ))}
                {job.skills.length > 4 && (
                  <span className="text-xs px-3 py-1 rounded-full bg-gray-100 text-gray-500">
                    +{job.skills.length - 4} more
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 flex justify-between items-center">
            <span className="text-xs text-gray-500">Posted {getTimePassed(job.postedAt)}</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  navigate(`/apply-job/${job._id}`);
                  window.scrollTo(0, 0);
                }}
                className="px-4 py-2 text-xs font-semibold border border-red-500 rounded-md hover:bg-red-50 transition"
                style={{color: '#FF0000'}}
              >
                Learn More
              </button>
              <button
                onClick={() => {
                  navigate(`/apply-job/${job._id}`);
                  window.scrollTo(0, 0);
                }}
                className="px-4 py-2 text-xs font-semibold text-white rounded-md hover:shadow-md transition-all duration-300"
                style={{backgroundColor: '#FF0000'}}
              >
                Apply Now
              </button>
            </div>
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
};

JobCard.defaultProps = {
  job: {
    title: "",
    companyId: { name: "", image: "" },
    location: "",
    level: "",
    jobchannel: "",
    jobcategory: "",
    salary: null,
    type: "",
    description: "",
    skills: [],
    postedAt: null,
    noticeperiod: "",
    _id: "",
  },
};

export default JobCard;