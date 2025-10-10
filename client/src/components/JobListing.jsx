import React, { useContext, useEffect, useState, useRef } from "react";
import { AppContext } from "../context/AppContext";
import { assets, Jobdesignation, JobLocations } from "../assets/assets";
import JobCard from "../components/JobCard";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom"; 
import {ChevronDown, ChevronUp} from "lucide-react";

// Job Channel Options
const JobChannels = [
  "Agency Channel",
  "Bancassurance", 
  "Direct Sales",
  "Digital/Online Sales",
  "Broker Channel",
  "Corporate / Group Channel",
  "POSP (Point of Sales Person)",
  "Worksite Marketing",
  "Alternate Channels",
  "Franchisee/Entrepreneurial",
  "Sub Borker",
  "IAF",
  "DSA"
];

// Job Category Options
const JobCategories = [
  "Equity Broking",
  "Commodity Broking", 
  "Currency Broking",
  "Fundamental Research",
  "Technical Research",
  "Data Analysis",
  "Quant Analysis",
  "Life Insurance",
  "General Insurance",
  "Asset Finance",
  "Loan Companies",
  "Microfinance",
  "MFI",
  "Housing Finance Co. (HFC)",
  "Discretionary Portfolio Management",
  "Non-Discretionary Advisory"
];

const JobListing = () => {
  const { isSearched, searchFilter, setSearchFilter, jobs } = useContext(AppContext);
  const navigate = useNavigate();
  const location = useLocation();

  const initialLoad = useRef(true);
  const [showFilter, setShowFilter] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState([]);
  const [selectedJobCategory, setSelectedJobCategory] = useState([]);
  const [showAllLocations, setShowAllLocations] = useState(false);
  const [showAllDesignations, setShowAllDesignations] = useState(false);
  const [showAllChannels, setShowAllChannels] = useState(false);
  const [showAllJobCategories, setShowAllJobCategories] = useState(false);
  const [filterJobs, setFilterJobs] = useState(jobs);
  const [fade, setFade] = useState(true);
  const [sortBy, setSortBy] = useState('recent');

  // Filter collapse states
  const [filterStates, setFilterStates] = useState({
    jobCategory: false,
    designation: false,
    channel: false,
    location: false
  });

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

  // Sorting function
  const sortJobs = (jobs, sortType) => {
    const jobsCopy = [...jobs];
    
    switch (sortType) {
      case 'recent':
        // Keep most recent first (reverse chronological)
        return jobsCopy.reverse();
        
      case 'salary-high':
        return jobsCopy.sort((a, b) => {
          const getSalaryValue = (job) => {
            // Check different possible salary field names
            const salaryStr = job.salary || job.salaryRange || job.package || '';
            if (!salaryStr) return 0;
            
            // Remove currency symbols and extract numbers
            const cleanStr = salaryStr.toString().replace(/[₹$,]/g, '');
            const numbers = cleanStr.match(/\d+(?:\.\d+)?/g);
            if (!numbers || numbers.length === 0) return 0;
            
            // Convert K/L notation to actual numbers
            let maxSalary = 0;
            numbers.forEach(num => {
              let value = parseFloat(num);
              // Check if the original string contains K or L after this number
              const numIndex = cleanStr.indexOf(num);
              const afterNum = cleanStr.substring(numIndex + num.length, numIndex + num.length + 2);
              
              if (afterNum.includes('L') || afterNum.includes('l')) {
                value = value * 100000; // Lakh
              } else if (afterNum.includes('K') || afterNum.includes('k')) {
                value = value * 1000; // Thousand
              }
              
              maxSalary = Math.max(maxSalary, value);
            });
            
            return maxSalary;
          };
          
          return getSalaryValue(b) - getSalaryValue(a);
        });
        
      case 'salary-low':
        return jobsCopy.sort((a, b) => {
          const getSalaryValue = (job) => {
            // Check different possible salary field names
            const salaryStr = job.salary || job.salaryRange || job.package || '';
            if (!salaryStr) return 0;
            
            // Remove currency symbols and extract numbers
            const cleanStr = salaryStr.toString().replace(/[₹$,]/g, '');
            const numbers = cleanStr.match(/\d+(?:\.\d+)?/g);
            if (!numbers || numbers.length === 0) return 0;
            
            // Convert K/L notation to actual numbers
            let minSalary = Infinity;
            numbers.forEach(num => {
              let value = parseFloat(num);
              // Check if the original string contains K or L after this number
              const numIndex = cleanStr.indexOf(num);
              const afterNum = cleanStr.substring(numIndex + num.length, numIndex + num.length + 2);
              
              if (afterNum.includes('L') || afterNum.includes('l')) {
                value = value * 100000; // Lakh
              } else if (afterNum.includes('K') || afterNum.includes('k')) {
                value = value * 1000; // Thousand
              }
              
              minSalary = Math.min(minSalary, value);
            });
            
            return minSalary === Infinity ? 0 : minSalary;
          };
          
          return getSalaryValue(a) - getSalaryValue(b);
        });
        
      default:
        return jobsCopy.reverse();
    }
  };

  // Toggle filter section visibility
  const toggleFilter = (filterType) => {
    setFilterStates(prev => ({
      ...prev,
      [filterType]: !prev[filterType]
    }));
  };

  // Handle category selection from JobCategories page
  useEffect(() => {
    if (location.state?.selectedCategory && location.state?.fromCategoryPage) {
      const categoryName = location.state.selectedCategory;
      
      // Check if it's a job category (matches our JobCategories array)
      if (JobCategories.includes(categoryName)) {
        setSelectedJobCategory([categoryName]);
      }
      // Check if it's a designation
      else if (Jobdesignation.includes(categoryName)) {
        setSelectedCategory([categoryName]);
      }
      // If not found in either, try both (fallback)
      else {
        // Check in actual jobs data to determine the field
        const hasJobCategory = jobs.some(job => job.jobcategory === categoryName);
        const hasDesignation = jobs.some(job => job.designation === categoryName);
        
        if (hasJobCategory) {
          setSelectedJobCategory([categoryName]);
        } else if (hasDesignation) {
          setSelectedCategory([categoryName]);
        } else {
          // Try both as fallback
          setSelectedJobCategory([categoryName]);
          setSelectedCategory([categoryName]);
        }
      }

      // Clear the location state to prevent re-triggering
      window.history.replaceState({}, document.title);
    }
  }, [location.state, jobs]);

  // Refs to track previous filter states
  const prevSelectedCategory = useRef(selectedCategory);
  const prevSelectedLocation = useRef(selectedLocation);
  const prevSelectedChannel = useRef(selectedChannel);
  const prevSelectedJobCategory = useRef(selectedJobCategory);
  const prevSearchFilter = useRef({ ...searchFilter });

  const triggerTransition = (callback, shouldScroll = true) => {
    setFade(false);
    setTimeout(() => {
      callback();
      setFade(true);
      if (shouldScroll && !initialLoad.current) {
        document.getElementById("job-list")?.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 300);
  };

  useEffect(() => {
    const filterJobs = () => {
      
      const matchesCategory = (job) =>
        selectedCategory.length === 0 || selectedCategory.includes(job.designation);

      const matchesLocation = (job) =>
        selectedLocation.length === 0 || selectedLocation.includes(job.location);

      const matchesChannel = (job) =>
        selectedChannel.length === 0 || selectedChannel.includes(job.jobchannel);

      const matchesJobCategory = (job) =>
        selectedJobCategory.length === 0 || selectedJobCategory.includes(job.jobcategory);

      const matchesTitle = (job) =>
        searchFilter.title === "" ||
        job.title.toLowerCase().includes(searchFilter.title.toLowerCase());

      const matchesSearchLocation = (job) =>
        searchFilter.location === "" ||
        job.location.toLowerCase().includes(searchFilter.location.toLowerCase());

      const filteredJobs = jobs
        .slice()
        .filter(
          (job) =>
            matchesCategory(job) &&
            matchesLocation(job) &&
            matchesChannel(job) &&
            matchesJobCategory(job) &&
            matchesTitle(job) &&
            matchesSearchLocation(job)
        );

      // Apply sorting to filtered jobs
      const sortedJobs = sortJobs(filteredJobs, sortBy);

      setFilterJobs(sortedJobs);
      setCurrentPage(1);
    };

    // Check if filters changed (excluding jobs update)
    const filtersChanged =
      prevSelectedCategory.current !== selectedCategory ||
      prevSelectedLocation.current !== selectedLocation ||
      prevSelectedChannel.current !== selectedChannel ||
      prevSelectedJobCategory.current !== selectedJobCategory ||
      JSON.stringify(prevSearchFilter.current) !== JSON.stringify(searchFilter);

    if (initialLoad.current) {
      // Initial load without scroll
      filterJobs();
      initialLoad.current = false;
    } else {
      // Trigger scroll only if filters changed
      triggerTransition(filterJobs, filtersChanged);
    }

    // Update previous filter refs
    prevSelectedCategory.current = selectedCategory;
    prevSelectedLocation.current = selectedLocation;
    prevSelectedChannel.current = selectedChannel;
    prevSelectedJobCategory.current = selectedJobCategory;
    prevSearchFilter.current = { ...searchFilter };
  }, [jobs, selectedCategory, selectedLocation, selectedChannel, selectedJobCategory, searchFilter, sortBy]);

  const handleCategoryChange = (designation) => {
    triggerTransition(() => {
      setSelectedCategory((prev) =>
        prev.includes(designation)
          ? prev.filter((c) => c !== designation)
          : [...prev, designation]
      );
    });
  };

  const handleLocationChange = (location) => {
    triggerTransition(() => {
      setSelectedLocation((prev) =>
        prev.includes(location)
          ? prev.filter((c) => c !== location)
          : [...prev, location]
      );
    });
  };

  const handleChannelChange = (channel) => {
    triggerTransition(() => {
      setSelectedChannel((prev) =>
        prev.includes(channel)
          ? prev.filter((c) => c !== channel)
          : [...prev, channel]
      );
    });
  };

  const handleJobCategoryChange = (jobCategory) => {
    triggerTransition(() => {
      setSelectedJobCategory((prev) =>
        prev.includes(jobCategory)
          ? prev.filter((c) => c !== jobCategory)
          : [...prev, jobCategory]
      );
    });
  };

  const handlePageChange = (newPage) => {
    triggerTransition(() => setCurrentPage(newPage));
  };

  const handleSortChange = (e) => {
    const newSortBy = e.target.value;
    triggerTransition(() => setSortBy(newSortBy), false);
  };

  const clearAllFilters = () => {
    triggerTransition(() => {
      setSelectedCategory([]);
      setSelectedLocation([]);
      setSelectedChannel([]);
      setSelectedJobCategory([]);
      setSearchFilter({ title: "", location: "" });
    });
  };

  // Filter Section Component
  const FilterSection = ({ title, filterType, options, selectedFilters, onChange, showAll, setShowAll }) => (
    <div className="border-b border-gray-200 pb-4 mb-6 last:border-b-0">
      <div 
        className="flex justify-between items-center cursor-pointer hover:bg-gray-50 p-2 rounded-lg transition-colors"
        onClick={() => toggleFilter(filterType)}
      >
        <h4 className="font-bold text-lg text-gray-800">{title}</h4>
        <div className="flex items-center gap-2">
          {selectedFilters.length > 0 && (
            <span className="bg-primary text-white text-xs px-2 py-1 rounded-full">
              {selectedFilters.length}
            </span>
          )}
          {filterStates[filterType] ? (
            <ChevronUp className="w-5 h-5 text-gray-600" />
          ) : (
            <ChevronDown className="w-5 h-5 text-gray-600" />
          )}
        </div>
      </div>
      
      <AnimatePresence>
        {filterStates[filterType] && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="mt-4"
          >
            <div>
              {selectedFilters.length > 0 && (
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-gray-600">
                    {selectedFilters.length} selected
                  </span>
                  <button 
                    onClick={() => onChange([])}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
              )}
              <ul className="space-y-3 max-h-48 overflow-y-auto ml-4">
                {options.slice(0, showAll ? options.length : 8).map((option, index) => (
                  <motion.li 
                    key={index} 
                    className="flex items-center"
                    whileHover={{ x: 3 }}
                  >
                    <input
                      className="h-4 w-4 text-primary rounded focus:ring-primary border-gray-300"
                      type="checkbox"
                      onChange={() => {
                        const newSelection = selectedFilters.includes(option)
                          ? selectedFilters.filter(item => item !== option)
                          : [...selectedFilters, option];
                        onChange(newSelection);
                      }}
                      checked={selectedFilters.includes(option)}
                      id={`${filterType}-${index}`}
                    />
                    <label 
                      htmlFor={`${filterType}-${index}`} 
                      className="ml-3 text-gray-700 cursor-pointer hover:text-primary transition-colors"
                    >
                      {option}
                    </label>
                  </motion.li>
                ))}
              </ul>
              {options.length > 8 && (
                <button
                  onClick={() => setShowAll(!showAll)}
                  className="mt-3 ml-4 text-sm text-primary hover:underline"
                >
                  {showAll ? 'Show less' : `Show all (${options.length})`}
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  return (
    <div className="container mx-auto flex flex-col lg:flex-row max-lg:space-y-8 pb-8 px-4 lg:px-8">
      
      {/* FILTER SIDEBAR */}
      <motion.div 
        className="w-full lg:w-1/5 lg:sticky lg:top-24 lg:h-[calc(100vh-120px)] lg:overflow-y-auto"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Mobile filter toggle */}
        <button
          onClick={() => setShowFilter(prev => !prev)}
          className="flex items-center gap-2 px-4 py-2 bg-primary text-white rounded-lg lg:hidden w-full justify-center mb-4"
        >
          {showFilter ? (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
              Hide Filters
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z" clipRule="evenodd" />
              </svg>
              Show Filters
            </>
          )}
        </button>

        {/* Spacer to align with job cards section */}
         <div className="hidden lg:block">
          <div className="h-4"></div> 
        </div> 

        {/* Main Filter Container with JobCard styling - aligned with job cards */}
        {showFilter && (
          <div className="bg-white shadow-sm border border-gray-200 p-6">
            {/* Filter Header */}
            <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-xl text-gray-800">Filters</h3>
              <button 
                onClick={clearAllFilters}
                className="text-sm text-primary hover:underline font-medium"
              >
                Clear All
              </button>
            </div>

            {/* Current Search */}
            {isSearched && (searchFilter.title !== "" || searchFilter.location !== "") && (
              <div className="mb-6 bg-gray-50 p-4 rounded-lg border border-gray-100">
                <div className="flex justify-between items-center mb-3">
                  <h4 className="font-semibold text-gray-800">Current Search</h4>
                  <button 
                    onClick={clearAllFilters}
                    className="text-sm text-primary hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {searchFilter.title && (
                    <span className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 px-3 py-1 rounded-full text-sm text-primary">
                      {searchFilter.title}
                      <button
                        onClick={() => setSearchFilter(prev => ({ ...prev, title: "" }))}
                        className="text-blue-400 hover:text-blue-600"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                  {searchFilter.location && (
                    <span className="inline-flex items-center gap-2 bg-green-50 border border-green-100 px-3 py-1 rounded-full text-sm text-green-700">
                      {searchFilter.location}
                      <button
                        onClick={() => setSearchFilter(prev => ({ ...prev, location: "" }))}
                        className="text-green-500 hover:text-green-700"
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                        </svg>
                      </button>
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Selected Category Indicator */}
            {(selectedJobCategory.length > 0 || selectedCategory.length > 0) && (
              <div className="mb-6 bg-red-50 border border-red-200 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <h4 className="font-medium text-red-800">Active Category Filter</h4>
                  <button 
                    onClick={() => {
                      setSelectedJobCategory([]);
                      setSelectedCategory([]);
                    }}
                    className="text-sm text-red-600 hover:underline"
                  >
                    Clear
                  </button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedJobCategory.map((cat, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                      {cat}
                    </span>
                  ))}
                  {selectedCategory.map((cat, index) => (
                    <span key={index} className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded">
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Filter Sections */}
            <FilterSection
              title="Category"
              filterType="jobCategory"
              options={JobCategories}
              selectedFilters={selectedJobCategory}
              onChange={(newSelection) => triggerTransition(() => setSelectedJobCategory(newSelection))}
              showAll={showAllJobCategories}
              setShowAll={setShowAllJobCategories}
            />

            <FilterSection
              title="Designation"
              filterType="designation"
              options={Jobdesignation}
              selectedFilters={selectedCategory}
              onChange={(newSelection) => triggerTransition(() => setSelectedCategory(newSelection))}
              showAll={showAllDesignations}
              setShowAll={setShowAllDesignations}
            />

            <FilterSection
              title="Channel"
              filterType="channel"
              options={JobChannels}
              selectedFilters={selectedChannel}
              onChange={(newSelection) => triggerTransition(() => setSelectedChannel(newSelection))}
              showAll={showAllChannels}
              setShowAll={setShowAllChannels}
            />

            <FilterSection
              title="Locations"
              filterType="location"
              options={JobLocations}
              selectedFilters={selectedLocation}
              onChange={(newSelection) => triggerTransition(() => setSelectedLocation(newSelection))}
              showAll={showAllLocations}
              setShowAll={setShowAllLocations}
            />
          </div>
        )}
      </motion.div>

      {/* JOB LISTING SECTION */}
      <section className="w-full lg:w-4/5 pl-0 lg:pl-8">
        <div className="mb-8">
          <h3 className="font-bold text-3xl md:text-4xl text-gray-900 mb-2" id="job-list">
            Latest Jobs
          </h3>
          <p className="text-gray-600">Find your dream job from top companies worldwide</p>
        </div>

        {/* Search bar for mobile */}
        <div className="lg:hidden mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search jobs..."
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              value={searchFilter.title}
              onChange={(e) => setSearchFilter({...searchFilter, title: e.target.value})}
            />
            <button className="absolute right-3 top-3 text-gray-400">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </div>

        {/* Job count and sorting */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
          <p className="text-gray-600 mb-2 sm:mb-0">
            Showing <span className="font-semibold text-gray-900">{filterJobs.length}</span> jobs
            {(selectedJobCategory.length > 0 || selectedCategory.length > 0 || selectedChannel.length > 0 || selectedLocation.length > 0) && (
              <span className="text-sm ml-2">
                (filtered by {[
                  selectedJobCategory.length > 0 ? `${selectedJobCategory.length} categor${selectedJobCategory.length > 1 ? 'ies' : 'y'}` : '',
                  selectedCategory.length > 0 ? `${selectedCategory.length} designation${selectedCategory.length > 1 ? 's' : ''}` : '',
                  selectedChannel.length > 0 ? `${selectedChannel.length} channel${selectedChannel.length > 1 ? 's' : ''}` : '',
                  selectedLocation.length > 0 ? `${selectedLocation.length} location${selectedLocation.length > 1 ? 's' : ''}` : ''
                ].filter(Boolean).join(', ')})
              </span>
            )}
          </p>
          <div className="flex items-center">
            <label htmlFor="sort" className="text-gray-600 mr-2 text-sm">Sort by:</label>
            <select 
              id="sort" 
              value={sortBy}
              onChange={handleSortChange}
              className="border border-gray-300 rounded-md px-3 py-1 text-sm focus:ring-primary focus:border-primary bg-white"
            >
              <option value="recent">Most Recent</option>
              <option value="salary-high">Salary: High to Low</option>
              <option value="salary-low">Salary: Low to High</option>
            </select>
          </div>
        </div>

        {/* Job listings with animations */}
        <div className="relative min-h-[400px]">
          {filterJobs.length === 0 ? (
            <motion.div 
              className="bg-gray-50 rounded-xl p-8 text-center"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <h4 className="text-xl font-medium text-gray-700 mb-2">No jobs found</h4>
              <p className="text-gray-500 mb-4">Try adjusting your search or filter criteria</p>
              <button 
                onClick={clearAllFilters}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
              >
                Clear all filters
              </button>
            </motion.div>
          ) : (
            <motion.div 
              className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6 transition-opacity duration-300 ${fade ? 'opacity-100' : 'opacity-0'}`}
              layout
            >
              <AnimatePresence>
                {filterJobs
                  .slice((currentPage - 1) * 6, currentPage * 6)
                  .map((job, index) => (
                    <motion.div
                      key={job.id || index}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      transition={{ duration: 0.3 }}
                      layout
                    >
                      <JobCard job={job} />
                    </motion.div>
                  ))}
              </AnimatePresence>
            </motion.div>
          )}
        </div>

        {/* Pagination */}
        {filterJobs.length > 0 && (
          <motion.div 
            className="flex items-center justify-center space-x-2 mt-10"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <button
              onClick={() => handlePageChange(Math.max(currentPage - 1, 1))}
              disabled={currentPage === 1}
              className={`p-2 rounded-full ${currentPage === 1 ? 'text-gray-300' : 'text-primary hover:bg-primary hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </button>
            
            {Array.from({ length: Math.ceil(filterJobs.length / 6) }).map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
                  currentPage === index + 1
                    ? "bg-primary text-white shadow-md"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
              >
                {index + 1}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(Math.min(currentPage + 1, Math.ceil(filterJobs.length / 6)))}
              disabled={currentPage === Math.ceil(filterJobs.length / 6)}
              className={`p-2 rounded-full ${currentPage === Math.ceil(filterJobs.length / 6) ? 'text-gray-300' : 'text-primary hover:bg-primary hover:text-white'}`}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
              </svg>
            </button>
          </motion.div>
        )}
      </section>
    </div>
  );
};

export default JobListing;