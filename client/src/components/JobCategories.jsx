import React, { useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  TrendingUp, 
  BarChart3, 
  DollarSign, 
  Search, 
  LineChart, 
  Database,
  Calculator,
  Shield,
  Car,
  Home,
  Building2,
  PieChart,
  Target,
  Briefcase
} from 'lucide-react';
import { AppContext } from '../context/AppContext';
import Navbar from './Navbar';
import Footer from './Footer'; 

const JobCategories = () => {
  const { jobs, setSearchFilter } = useContext(AppContext);
  const navigate = useNavigate();

  // Predefined categories
  const predefinedJobCategories = [
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

  const categories = [
    { id: 1, name: "Equity Broking", icon: TrendingUp, designation: "Equity Broking" },
    { id: 2, name: "Commodity Broking", icon: BarChart3, designation: "Commodity Broking" },
    { id: 3, name: "Currency Broking", icon: DollarSign, designation: "Currency Broking" },
    { id: 4, name: "Fundamental Research", icon: Search, designation: "Fundamental Research" },
    { id: 5, name: "Technical Research", icon: LineChart, designation: "Technical Research" },
    { id: 6, name: "Data Analysis", icon: Database, designation: "Data Analysis" },
    { id: 7, name: "Quant Analysis", icon: Calculator, designation: "Quant Analysis" },
    { id: 8, name: "Life Insurance", icon: Shield, designation: "Life Insurance" },
    { id: 9, name: "General Insurance", icon: Car, designation: "General Insurance" },
    { id: 10, name: "Asset Finance", icon: Building2, designation: "Asset Finance" },
    { id: 11, name: "Loan Companies", icon: DollarSign, designation: "Loan Companies" },
    { id: 12, name: "Microfinance MFI", icon: Home, designation: "Microfinance" },
    { id: 13, name: "Housing Finance Co. (HFC)", icon: Home, designation: "Housing Finance Co. (HFC)" },
    { id: 14, name: "Discretionary Portfolio Management", icon: PieChart, designation: "Discretionary Portfolio Management" },
    { id: 15, name: "Non-Discretionary Advisory", icon: Target, designation: "Non-Discretionary Advisory" },
    { id: 16, name: "Other Categories", icon: Briefcase, designation: "Other", isOther: true }
  ];

  // Function to check if a job is "Other" (not in predefined categories)
  const isOtherJob = (job) => {
    return !predefinedJobCategories.includes(job.jobcategory) && 
           !predefinedJobCategories.includes(job.designation);
  };

  // Function to get job count for a specific category
  const getJobCount = (designation, isOther = false) => {
    if (isOther) {
      // Count all jobs that don't match the predefined categories
      const count = jobs.filter(job => isOtherJob(job)).length;
      return count > 0 ? `${count} job${count !== 1 ? 's' : ''}` : 'No jobs';
    }
    
    // Check both designation and jobcategory fields
    const count = jobs.filter(job => 
      job.designation === designation || job.jobcategory === designation
    ).length;
    return count > 0 ? `${count} job${count !== 1 ? 's' : ''}` : 'No jobs';
  };

  // Function to handle category click
  const handleCategoryClick = (designation, isOther = false) => {
    // Clear search filters first
    setSearchFilter({ title: "", location: "" });
    
    if (isOther) {
      // For "Other", navigate with "Other" selection
      navigate('/JobListing', { 
        state: { 
          selectedCategory: "Other",
          fromCategoryPage: true 
        } 
      });
    } else {
      // Navigate to JobListing with the selected category
      navigate('/JobListing', { 
        state: { 
          selectedCategory: designation,
          fromCategoryPage: true 
        } 
      });
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header Section */}
      <Navbar/>
      <div className="bg-white py-16 px-8">
        <div className="max-w-6xl mx-auto text-center">
          <p className="text-sm font-medium tracking-wider mb-4 text-red-600">
            JOB CATEGORIES
          </p>
          <h1 className="text-4xl md:text-5xl font-bold mb-6" style={{ color: "#022030" }}>
            Find Jobs by Categories
          </h1>
        </div>
      </div>

      {/* Categories Grid */}
      <div className="py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {categories.map((category) => {
              const IconComponent = category.icon;
              const jobCount = getJobCount(category.designation, category.isOther);
              
              return (
                <div
                  key={category.id}
                  className={`bg-white border border-gray-200 rounded-2xl p-6 cursor-pointer transition-all duration-300 hover:shadow-md hover:-translate-y-1 group ${
                    category.isOther ? 'border-blue-300 bg-blue-50' : ''
                  }`}
                  onClick={() => handleCategoryClick(category.designation, category.isOther)}
                >
                  {/* Icon */}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center mb-4 group-hover:scale-105 transition-transform duration-300 ${
                    category.isOther ? 'bg-blue-500' : 'bg-[#FF0000]'
                  }`}>
                    <IconComponent className="w-6 h-6 text-white" />
                  </div>
                  
                  {/* Category Name */}
                  <h3 className="text-lg font-semibold mb-2" style={{ color: "#022030" }}>
                    {category.name}
                  </h3>
                  
                  {/* Dynamic Job Count */}
                  <p className={`text-sm font-medium mb-2 ${jobCount === 'No jobs' ? 'text-gray-400' : 'text-gray-600'}`}>
                    {jobCount}
                  </p>
                  
                  {/* Hover Arrow */}
                  <div className="mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <div className="inline-flex items-center text-sm font-medium text-gray-600 group-hover:text-gray-800">
                      {jobCount === 'No jobs' ? (
                        'No Jobs Available'
                      ) : (
                        'View Jobs'
                      )}
                      {jobCount !== 'No jobs' && (
                        <svg className="ml-1 w-4 h-4 group-hover:translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Footer Component */}
      <Footer />
    </div>
  );
};

export default JobCategories;