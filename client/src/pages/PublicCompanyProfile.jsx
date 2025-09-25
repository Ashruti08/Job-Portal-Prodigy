import React, { useContext, useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { AppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import JobCard from "../components/JobCard";
import { toast } from "react-toastify";
import axios from "axios";
import { motion } from "framer-motion";
import { 
  FiMapPin, 
  FiGlobe, 
  FiUsers, 
  FiMail, 
  FiPhone,
  FiBriefcase,
  FiExternalLink,
  FiUser,
  FiHome,
  FiChevronLeft,
  FiChevronRight
} from "react-icons/fi";
import { assets } from "../assets/assets";

const PublicCompanyProfile = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { backendUrl, jobs = [] } = useContext(AppContext);
  
  const [companyData, setCompanyData] = useState(null);
  const [companyJobs, setCompanyJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Slider state
  const [currentSlide, setCurrentSlide] = useState(0);
  const [jobsPerPage, setJobsPerPage] = useState(2);
  const sliderRef = useRef(null);

  // Fetch company profile data
  const fetchCompanyProfile = async () => {
    try {
      setIsLoading(true);
      
      const { data } = await axios.get(`${backendUrl}/api/company/profile/${id}`);
      
      if (data.success) {
        setCompanyData(data.data);
      } else {
        throw new Error(data.message || "Company not found");
      }
    } catch (error) {
      console.error('Error fetching company profile:', error);
      
      const companyFromJobs = findCompanyFromJobs();
      if (companyFromJobs) {
        setCompanyData(companyFromJobs);
        toast.info("Showing basic company information");
      } else {
        setError("Company not found");
        toast.error("Company profile not available");
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback: Extract company data from available jobs
  const findCompanyFromJobs = () => {
    if (!jobs || jobs.length === 0) return null;
    
    const companyJob = jobs.find(job => 
      job.companyId && 
      (job.companyId._id === id || job.companyId === id)
    );
    
    if (companyJob && companyJob.companyId) {
      const company = companyJob.companyId;
      return {
        _id: company._id || id,
        name: company.name,
        email: company.email,
        phone: company.phone,
        image: company.image,
        location: company.location || 'Location not specified',
        website: company.website || '',
        companySize: company.companySize || '',
        description: company.description || 'No description available',
        stats: {
          activeJobs: 0,
          totalApplications: 0,
          totalHired: 0
        }
      };
    }
    
    return null;
  };

  // Filter jobs by company
  const filterCompanyJobs = () => {
    if (!jobs || !companyData) return;
    
    const filtered = jobs.filter(job => {
      const jobCompanyId = job.companyId?._id || job.companyId;
      return jobCompanyId === companyData._id && job.visible !== false;
    });
    
    setCompanyJobs(filtered);
  };

  // Update jobs per page based on screen size
  const updateJobsPerPage = () => {
    const width = window.innerWidth;
    if (width >= 1280) { // xl breakpoint
      setJobsPerPage(2);
    } else if (width >= 768) { // md breakpoint
      setJobsPerPage(2);
    } else {
      setJobsPerPage(1);
    }
  };

  // Slider functions
  const totalSlides = Math.ceil(companyJobs.length / jobsPerPage);
  
  const nextSlide = () => {
    setCurrentSlide((prev) => (prev + 1) % totalSlides);
  };

  const prevSlide = () => {
    setCurrentSlide((prev) => (prev - 1 + totalSlides) % totalSlides);
  };

  const goToSlide = (slideIndex) => {
    setCurrentSlide(slideIndex);
  };

  // Auto-slide functionality (optional)
  useEffect(() => {
    if (companyJobs.length > jobsPerPage) {
      const interval = setInterval(() => {
        nextSlide();
      }, 5000); // Auto slide every 5 seconds

      return () => clearInterval(interval);
    }
  }, [companyJobs.length, jobsPerPage, totalSlides]);

  useEffect(() => {
    if (id) {
      fetchCompanyProfile();
    }
  }, [id, backendUrl]);

  useEffect(() => {
    filterCompanyJobs();
  }, [jobs, companyData]);

  useEffect(() => {
    updateJobsPerPage();
    window.addEventListener('resize', updateJobsPerPage);
    return () => window.removeEventListener('resize', updateJobsPerPage);
  }, []);

  useEffect(() => {
    // Reset slide when jobs per page changes
    setCurrentSlide(0);
  }, [jobsPerPage]);

  // Get company image URL
  const getCompanyImageUrl = (imagePath) => {
    if (!imagePath) return assets.default_company_icon || assets.placeholder;
    
    if (imagePath.startsWith('http://') || imagePath.startsWith('https://')) {
      return imagePath;
    }
    
    if (imagePath.startsWith('/')) {
      return `${backendUrl}${imagePath}`;
    } else {
      return `${backendUrl}/${imagePath}`;
    }
  };

  // Get current jobs for the slider
  const getCurrentJobs = () => {
    const start = currentSlide * jobsPerPage;
    const end = start + jobsPerPage;
    return companyJobs.slice(start, end);
  };

  if (isLoading) {
    return (
      <>
        <Navbar />
        <Loading />
        <Footer />
      </>
    );
  }

  if (error || !companyData) {
    return (
      <>
        <Navbar />
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-50 flex items-center justify-center px-4">
          <div className="text-center max-w-md mx-auto">
            <div className="mb-8">
              <FiHome className="mx-auto h-16 w-16 text-gray-400 mb-4" />
              <h1 className="text-3xl font-bold text-gray-800 mb-4">
                Company Not Found
              </h1>
              <p className="text-gray-600 mb-6">
                The company profile you're looking for doesn't exist or has been removed.
              </p>
            </div>
            <button 
              onClick={() => navigate('/joblisting')}
              className="px-8 py-3 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors shadow-lg"
            >
              Browse Jobs
            </button>
          </div>
        </div>
        <Footer />
      </>
    );
  }

  return (
    <>
      <Navbar />
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-gradient-to-br from-slate-50 via-white to-slate-50 min-h-screen"
      >
        {/* Hero Section */}
        <div className="bg-gradient-to-r from-red-500 to-red-600 text-white">
          <div className="container mx-auto px-4 py-12">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex flex-col md:flex-row items-center gap-8"
            >
              {/* Company Logo */}
              <div className="relative">
                <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl bg-white/20 backdrop-blur-sm border border-white/30 flex items-center justify-center overflow-hidden shadow-xl">
                  {companyData.image ? (
                    <img
                      className="w-full h-full object-cover rounded-2xl"
                      src={getCompanyImageUrl(companyData.image)}
                      alt={`${companyData.name} logo`}
                      onError={(e) => {
                        e.target.style.display = 'none';
                        e.target.parentElement.innerHTML = `<span class="text-3xl md:text-4xl font-bold text-white">${companyData.name?.[0] || "C"}</span>`;
                      }}
                    />
                  ) : (
                    <span className="text-3xl md:text-4xl font-bold text-white">
                      {companyData.name?.[0] || "C"}
                    </span>
                  )}
                </div>
              </div>

              {/* Company Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-3xl md:text-4xl font-bold mb-2">{companyData.name}</h1>
                <p className="text-red-100 text-lg mb-4">Company Profile</p>
                <div className="flex flex-wrap justify-center md:justify-start gap-4 text-sm">
                  {companyData.location && (
                    <div className="flex items-center gap-1">
                      <FiMapPin />
                      <span>{companyData.location}</span>
                    </div>
                  )}
                  {companyData.companySize && (
                    <div className="flex items-center gap-1">
                      <FiUsers />
                      <span>{companyData.companySize}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                    <span>Active Company</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </div>

        <div className="container mx-auto px-4 py-8 space-y-8">
          {/* Stats Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
          >
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FiBriefcase className="text-blue-600 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{companyData?.stats?.activeJobs || companyJobs.length || 0}</h3>
                <p className="text-gray-600 mt-1">Active Jobs</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FiUsers className="text-green-600 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{companyData?.stats?.totalApplications || 0}</h3>
                <p className="text-gray-600 mt-1">Applications</p>
              </div>
            </div>
            
            <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
              <div className="text-center">
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                  <FiUser className="text-purple-600 text-xl" />
                </div>
                <h3 className="text-2xl font-bold text-gray-800">{companyData?.stats?.totalHired || 0}</h3>
                <p className="text-gray-600 mt-1">Hired / accepted</p>
              </div>
            </div>
          </motion.div>

          {/* Company Details */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left Column - Company Information */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="lg:col-span-1 space-y-6"
            >
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiHome className="text-red-500" />
                  Company Information
                </h2>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Email</label>
                    <div className="flex items-center gap-2 text-gray-800">
                      <FiMail className="text-red-500 text-sm" />
                      <span className="break-all">{companyData.email}</span>
                    </div>
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Phone</label>
                    <div className="flex items-center gap-2 text-gray-800">
                      <FiPhone className="text-red-500 text-sm" />
                      <span>{companyData.phone || 'Not provided'}</span>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium text-gray-500 block mb-1">Location</label>
                    <div className="flex items-center gap-2 text-gray-800">
                      <FiMapPin className="text-red-500 text-sm" />
                      <span>{companyData.location || 'Not provided'}</span>
                    </div>
                  </div>

                  {companyData.website && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Website</label>
                      <div className="flex items-center gap-2">
                        <FiGlobe className="text-red-500 text-sm" />
                        <a 
                          href={companyData.website}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-red-500 hover:text-red-600 transition-colors flex items-center gap-1 break-all"
                        >
                          {companyData.website}
                          <FiExternalLink size={12} />
                        </a>
                      </div>
                    </div>
                  )}

                  {companyData.companySize && (
                    <div>
                      <label className="text-sm font-medium text-gray-500 block mb-1">Company Size</label>
                      <div className="flex items-center gap-2 text-gray-800">
                        <FiUsers className="text-red-500 text-sm" />
                        <span>{companyData.companySize}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>

            {/* Right Column - Description and Jobs */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="lg:col-span-2 space-y-6"
            >
              {/* Company Description */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <h2 className="text-xl font-bold text-gray-800 mb-4 flex items-center gap-2">
                  <FiUser className="text-red-500" />
                  About Company
                </h2>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {companyData.description || 'No description provided yet.'}
                  </p>
                </div>
              </div>

              {/* Open Positions with Slider */}
              <div className="bg-white rounded-xl p-6 shadow-lg border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                    <FiBriefcase className="text-red-500" />
                    Open Positions
                  </h2>
                  <span className="bg-red-100 text-red-600 px-3 py-1 rounded-full text-sm font-medium">
                    {companyJobs.length} Jobs
                  </span>
                </div>
                
                {companyJobs.length > 0 ? (
                  <div className="space-y-6">
                    {/* Job Slider */}
                    <div className="relative">
                      {/* Slider Container */}
                      <div className="overflow-hidden" ref={sliderRef}>
                        <motion.div
                          className="flex transition-transform duration-300 ease-in-out"
                          style={{
                            transform: `translateX(-${currentSlide * 100}%)`
                          }}
                        >
                          {Array.from({ length: totalSlides }, (_, slideIndex) => (
                            <div
                              key={slideIndex}
                              className="w-full flex-shrink-0"
                            >
                              <div className={`grid gap-4 ${
                                jobsPerPage === 1 
                                  ? 'grid-cols-1' 
                                  : 'grid-cols-1 md:grid-cols-2'
                              }`}>
                                {companyJobs
                                  .slice(slideIndex * jobsPerPage, (slideIndex + 1) * jobsPerPage)
                                  .map((job) => (
                                    <JobCard key={job._id} job={job} />
                                  ))}
                              </div>
                            </div>
                          ))}
                        </motion.div>
                      </div>

                      {/* Navigation Arrows */}
                      {totalSlides > 1 && (
                        <>
                          <button
                            onClick={prevSlide}
                            className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors z-10 border border-gray-200"
                            aria-label="Previous jobs"
                          >
                            <FiChevronLeft className="text-gray-600" size={20} />
                          </button>
                          <button
                            onClick={nextSlide}
                            className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 bg-white shadow-lg rounded-full p-2 hover:bg-gray-50 transition-colors z-10 border border-gray-200"
                            aria-label="Next jobs"
                          >
                            <FiChevronRight className="text-gray-600" size={20} />
                          </button>
                        </>
                      )}
                    </div>

                    {/* Slider Indicators */}
                    {totalSlides > 1 && (
                      <div className="flex justify-center gap-2 pt-4">
                        {Array.from({ length: totalSlides }, (_, index) => (
                          <button
                            key={index}
                            onClick={() => goToSlide(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${
                              currentSlide === index
                                ? 'bg-red-500'
                                : 'bg-gray-300 hover:bg-gray-400'
                            }`}
                            aria-label={`Go to slide ${index + 1}`}
                          />
                        ))}
                      </div>
                    )}

                  
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <FiBriefcase className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                    <h3 className="text-lg font-medium text-gray-500 mb-2">No open positions</h3>
                    <p className="text-gray-400 text-sm">Check back later for new opportunities</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </motion.div>
      <Footer />
    </>
  );
};

export default PublicCompanyProfile;