import { useState } from "react";
import { Home } from "lucide-react";

const Jobalert = () => {
  const handleHomeClick = () => {
    // Option 1: Simple page reload/redirect (works in any setup)
    window.location.href = '/';
    
    // Option 2: For React Router (uncomment if using React Router)
    // navigate('/');
    
    // Option 3: For Next.js (uncomment if using Next.js)
    // router.push('/');
    
    // Option 4: History API (for SPAs)
    // window.history.pushState(null, null, '/');
  };
 const [isSubmitting, setIsSubmitting] = useState(false);
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
    "Microfiance",
    "MFI",
    "Housing Finance Co. (HFC)",
    "Discretionary Portfolio Management",
    "Non-Discretionary Advisory"
  ];

  const JobDesignation = [
    "Branch Manager",
    "Sr. Branch Manager",
    "Area Manager",
    "Cluster Manager",
    "Regional Manager",
    "Zonal Manager",
    "National Head",
    "Trader",
    "Research Analyst",
    "Senior Research Analyst",
    "Operations Executive",
    "Operations Manager",
    "Head of Operations",
    "Institutional Sales",
    "Compliance Officer",
    "Executive",
    "Sr. Executive",
    "Asst. Manager",
    "Manager",
    "Sr. Manager",
    "Asst. Vice President(AVP)",
    "Vice President(VP)",
    "Chief Executive Officer(CEO)",
    "Chief Operation Officer(COO)",
    "Chief Finance Officer(CFO)",
    "Chief Technical Officer(CTO)",
    "Chief Marketing Officer(CMO)",
    "Chief Revenue Officer(CRO)",
    "Chief Human Resource Officer(CHRO)",
    "Dealer-Equity",
    "Dealer-Commodity",
    "Dealer-Currency",
    "Relationship Executive(RE)",
    "Relationship Manager(RM)",
    "Sales Manager",
    "Sr. Sales Manager",
    "Asst. Branch Manager(ABM)"
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Form submitted");
    // Add your form submission logic here
  };
  

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-red-50 py-8">
      {/* Home Button */}
      <button
        onClick={handleHomeClick}
        className="fixed top-4 left-4 z-50 flex items-center px-4 py-2 bg-white/90 backdrop-blur-sm border-2 border-red-200 text-red-700 rounded-lg hover:bg-red-50 hover:border-red-300 transition-all duration-300 shadow-lg transform hover:scale-105 active:scale-95"
      >
        <Home className="w-4 h-4 mr-2" />
        Home
      </button>
      
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-xl shadow-2xl border border-red-100 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2 flex items-center">
            <div className="w-8 h-8 bg-gradient-to-br from-red-500 to-red-600 rounded-lg flex items-center justify-center mr-3 shadow-lg">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C10.3431 2 9 3.34315 9 5V6.084C6.16263 7.16514 4 9.93319 4 13V17L2 19V20H22V19L20 17V13C20 9.93319 17.8374 7.16514 15 6.084V5C15 3.34315 13.6569 2 12 2Z" fill="white"/>
                <path d="M8.99999 20C8.99999 21.1046 9.89544 22 10.9999 22H13.0001C14.1046 22 15 21.1046 15 20H8.99999Z" fill="white"/>
              </svg>
            </div>
            <span className="bg-gradient-to-r from-red-600 to-red-700 bg-clip-text text-transparent">
              Create Job Alert
            </span>
          </h2>

          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Your email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  required
                  placeholder="Your email"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-300 transition-colors duration-200"
                />
              </div>

              <div>
                <label htmlFor="tel" className="block text-sm font-medium text-gray-700 mb-2">
                  Your phone
                </label>
                <input
                  type="tel"
                  id="tel"
                  name="phone"
                  placeholder="Your phone"
                  className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 hover:border-red-300 transition-colors duration-200"
                />
              </div>
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category
              </label>
              <select
                name="category"
                id="category"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-red-300 transition-colors duration-200"
              >
                <option value="">Select an option</option>
                {JobCategories.map((category, index) => (
                  <option key={index} value={category}>
                    {category}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-2">
                Location
              </label>
              <select
                name="location"
                id="location"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-red-300 transition-colors duration-200"
              >
                <option value="">Select an option</option>
                <option value="39">Ab e Kamari</option>
                <option value="42">Ashkasham</option>
                <option value="49">Aurora</option>
                <option value="65">Banu</option>
                <option value="70">Bellevue</option>
                <option value="71">Berkeley</option>
                <option value="74">Boston</option>
                <option value="81">Buffalo</option>
                <option value="87">California</option>
                <option value="90">Cambridge</option>
                <option value="99">Chicago</option>
                <option value="127">Evanston</option>
                <option value="128">Everett</option>
                <option value="147">Hai Chau</option>
                <option value="157">Joliet</option>
                <option value="161">Long Beach</option>
                <option value="165">Long Bien</option>
                <option value="183">Mountain View</option>
                <option value="185">New York</option>
                <option value="191">Newton</option>
                <option value="210">Rochester</option>
                <option value="214">Sacramento</option>
                <option value="217">San Diego</option>
                <option value="220">San Francisco</option>
                <option value="222">San Jose</option>
                <option value="228">Seattle</option>
                <option value="238">Syracuse</option>
                <option value="239">Tacoma</option>
                <option value="246">Thu Duc</option>
                <option value="261">Worcester</option>
                <option value="265">Yonkers</option>
              </select>
            </div>

            <div>
              <label htmlFor="experience" className="block text-sm font-medium text-gray-700 mb-2">
                Job experience
              </label>
              <select
                name="experience"
                id="experience"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-red-300 transition-colors duration-200"
              >
                <option value="">Select an option</option>
                <option value="18">1 - 2 Years</option>
                <option value="21">10+ Years</option>
                <option value="27">3 - 5 Years</option>
                <option value="35">6 - 9 Years</option>
              </select>
            </div>

            <div>
              <label htmlFor="designation" className="block text-sm font-medium text-gray-700 mb-2">
                Designation
              </label>
              <select
                name="designation"
                id="designation"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-red-300 transition-colors duration-200"
              >
                <option value="">Select an option</option>
                {JobDesignation.map((designation, index) => (
                  <option key={index} value={designation}>
                    {designation}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="type" className="block text-sm font-medium text-gray-700 mb-2">
                Job type
              </label>
              <select
                name="types"
                id="type"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-red-300 transition-colors duration-200"
              >
                <option value="">Select an option</option>
                <option value="143">Full Time</option>
                <option value="154">Internship</option>
                <option value="196">Part Time</option>
                <option value="208">Remote</option>
              </select>
            </div>

            <div>
              <label htmlFor="frequency" className="block text-sm font-medium text-gray-700 mb-2">
                Frequency
              </label>
              <select
                name="frequency"
                id="frequency"
                className="w-full px-3 py-2 border-2 border-gray-200 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-red-500 bg-white hover:border-red-300 transition-colors duration-200"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 px-4 rounded-lg transition-all duration-300 flex items-center justify-center space-x-2 shadow-lg hover:shadow-xl transform hover:scale-105 active:scale-95"
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Creating...</span>
                  </>
                ) : (
                  <>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M12 2C10.3431 2 9 3.34315 9 5V6.084C6.16263 7.16514 4 9.93319 4 13V17L2 19V20H22V19L20 17V13C20 9.93319 17.8374 7.16514 15 6.084V5C15 3.34315 13.6569 2 12 2Z" fill="#FFFFFF"/>
                      <path d="M8.99999 20C8.99999 21.1046 9.89544 22 10.9999 22H13.0001C14.1046 22 15 21.1046 15 20H8.99999Z" fill="#FFFFFF"/>
                    </svg>
                    <span>Create job alert</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Jobalert;