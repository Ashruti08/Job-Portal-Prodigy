import { createContext, useEffect, useState, useCallback } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { useAuth, useUser } from "@clerk/clerk-react";

export const AppContext = createContext();

export const AppContextProvider = (props) => {

    const backendUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000';

    const {user, isLoaded: userLoaded} = useUser()
    const {getToken, isLoaded: authLoaded} = useAuth()

    const [searchFilter, setSearchFilter] = useState({
        title: '',
        location: ''
    });

    const [isSearched, setIsSearched] = useState(false);
    const [jobs , setJobs] = useState([]);
    const [showRecruiterLogin,setShowRecruiterLogin] = useState(false);
    const [companyToken, setCompanyToken] = useState(null)
    const [companyData, setCompanyData] = useState(null)
    const [userData,setUserData] = useState(null)
    const [userApplications,setUserApplications] = useState([])
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);

    // Function to Fetch Jobs data
    const fetchJobs = async () => {
      try {
        const {data} = await axios.get(backendUrl + '/api/jobs')

        if(data.success){
          setJobs(data.data)
        }
        else{
          toast.error(data.message)
        }
        
      } catch (error) {
        toast.error("Failed to fetch jobs")
        setJobs([]);
      }  
    }

    // ✅ UPDATED: Function to fetch Company Data - preserve isSubUser flag
    const fetchCompanyData = async () => {
        if (!companyToken) return;
        
        try {
            // Fetch basic company info
            const companyResponse = await axios.get(backendUrl + '/api/company/company', {
                headers: { token: companyToken }
            });

            if (!companyResponse.data.success) {
                toast.error("Failed to fetch company data");
                return;
            }

            const basicCompanyData = companyResponse.data.company;

            // ✅ CRITICAL: Check if this is a sub-user
            console.log('=== FETCH COMPANY DATA ===');
            console.log('Basic data:', basicCompanyData);
            console.log('isSubUser:', basicCompanyData.isSubUser);
            console.log('roleType:', basicCompanyData.roleType);

            let mergedData = { ...basicCompanyData };

            // ✅ ONLY fetch profile if NOT a sub-user
            // Sub-users don't need profile data, they just assess
            if (!basicCompanyData.isSubUser) {
                try {
                    const profileResponse = await axios.get(`${backendUrl}/api/employer/profile`, {
                        headers: { token: companyToken }
                    });

                    if (profileResponse.data.success) {
                        // Merge profile data but preserve isSubUser flags
                        mergedData = { 
                            ...mergedData, 
                            ...profileResponse.data.data,
                            // ✅ Ensure these are never overwritten
                            isSubUser: basicCompanyData.isSubUser || false,
                            roleType: basicCompanyData.roleType || null
                        };
                    }
                } catch (profileError) {
                    console.log('Profile fetch skipped or failed (ok for sub-users)');
                }
            }

            console.log('=== FINAL MERGED DATA ===');
            console.log('isSubUser:', mergedData.isSubUser);
            console.log('roleType:', mergedData.roleType);

            setCompanyData(mergedData);
            localStorage.setItem('companyData', JSON.stringify(mergedData));

        } catch (error) {
            if (error.response?.status === 401) {
                setCompanyToken(null);
                setCompanyData(null);
                localStorage.removeItem('companyToken');
                localStorage.removeItem('companyData');
                toast.error('Session expired. Please login again.');
            } else {
                console.error('Fetch company data error:', error);
                toast.error("Failed to fetch company data");
            }
        }
    }

    const fetchUserData = useCallback(async () => {
      try {
        if (!userLoaded || !authLoaded || !user) {
          return;
        }

        const token = await getToken();
        if (!token) {
          setUserData(null);
          setUserApplications([]);
          return;
        }

        const {data} = await axios.get(backendUrl + "/api/users/user", {
          headers: {Authorization: `Bearer ${token}`}
        });

        if(data.success){
          setUserData(data.user);
        } else {
          toast.error(data.message);
        }
      } catch (error) {
        if (error.response?.status === 401) {
          setUserData(null);
          setUserApplications([]);
          toast.error("Please login again");
        } else if (error.response?.status === 500) {
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to fetch user data");
        }
      }
    }, [backendUrl, getToken, user, userLoaded, authLoaded]);

    const fetchUserApplications = useCallback(async () =>{
        try {
          if (!userLoaded || !authLoaded || !user) {
            return;
          }

          const token = await getToken()
          if (!token) {
            setUserApplications([]);
            return;
          }

          const {data} = await axios.get(backendUrl + "/api/users/applications", {
            headers: {Authorization: `Bearer ${token}`}
          });

          if(data.success){
            setUserApplications(data.applications || [])
          }
          else{
            toast.error(data.message);
          }

        } catch (error) {
          if (error.response?.status === 401) {
            setUserApplications([]);
          } else {
            toast.error("Failed to fetch applications");
          }
        }
    }, [backendUrl, getToken, user, userLoaded, authLoaded]);

    // ✅ UPDATED: Initial setup - load from localStorage with sub-user data
    useEffect(() => {
        fetchJobs();
        
        const storedCompanyToken = localStorage.getItem('companyToken');
        const storedCompanyData = localStorage.getItem('companyData');
        
        if (storedCompanyToken) {
            setCompanyToken(storedCompanyToken);
            
            // ✅ Load stored company data immediately (includes isSubUser)
            if (storedCompanyData) {
                try {
                    const parsed = JSON.parse(storedCompanyData);
                    console.log('=== LOADED FROM LOCALSTORAGE ===');
                    console.log('isSubUser:', parsed.isSubUser);
                    console.log('roleType:', parsed.roleType);
                    setCompanyData(parsed);
                } catch (e) {
                    console.error('Failed to parse stored company data:', e);
                }
            }
        }
    }, []);

    // Company token management - always fetch fresh data when token is available
    useEffect(() => {
        if (companyToken) {
            fetchCompanyData();
        } else {
            setCompanyData(null);
            localStorage.removeItem('companyData');
        }
    }, [companyToken]);

    // User data management
    useEffect(() => {
        const handleUserDataFetch = async () => {
          if (userLoaded && authLoaded) {
            if (user) {
              await fetchUserData();
              await fetchUserApplications();
            } else {
              setUserData(null);
              setUserApplications([]);
            }
          }
        };

        const timer = setTimeout(handleUserDataFetch, 100);
        return () => clearTimeout(timer);
    }, [user, userLoaded, authLoaded, fetchUserData, fetchUserApplications]);
  
    const updateEmployerProfile = async (profileData) => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.put(`${backendUrl}/api/employer/profile`, profileData, {
                headers: { token: companyToken }
            });

            const data = response.data;
            if (data.success) {
                // ✅ Preserve isSubUser when updating profile
                const updatedData = {
                    ...data.data,
                    isSubUser: companyData?.isSubUser || false,
                    roleType: companyData?.roleType || null
                };
                setCompanyData(updatedData);
                localStorage.setItem('companyData', JSON.stringify(updatedData));
                toast.success('Profile updated successfully');
                return { success: true, data: updatedData };
            } else {
                setError(data.message);
                toast.error(data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error updating profile';
            
            if (error.response?.status === 401) {
                setCompanyToken(null);
                setCompanyData(null);
                localStorage.removeItem('companyToken');
                localStorage.removeItem('companyData');
                toast.error('Session expired. Please login again.');
            } else {
                setError(errorMessage);
                toast.error(errorMessage);
            }
            
            return { success: false, message: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const getEmployerProfile = async () => {
        try {
            setIsLoading(true);
            setError(null);

            const response = await axios.get(`${backendUrl}/api/employer/profile`, {
                headers: { token: companyToken }
            });

            const data = response.data;
            if (data.success) {
                // ✅ Preserve isSubUser when getting profile
                const profileData = {
                    ...data.data,
                    isSubUser: companyData?.isSubUser || false,
                    roleType: companyData?.roleType || null
                };
                setCompanyData(profileData);
                localStorage.setItem('companyData', JSON.stringify(profileData));
                return { success: true, data: profileData };
            } else {
                setError(data.message);
                toast.error(data.message);
                return { success: false, message: data.message };
            }
        } catch (error) {
            const errorMessage = error.response?.data?.message || 'Error fetching profile';
            
            if (error.response?.status === 401) {
                setCompanyToken(null);
                setCompanyData(null);
                localStorage.removeItem('companyToken');
                localStorage.removeItem('companyData');
                toast.error('Session expired. Please login again.');
            } else {
                setError(errorMessage);
                toast.error(errorMessage);
            }
            
            return { success: false, message: errorMessage };
        } finally {
            setIsLoading(false);
        }
    };

    const logoutEmployer = () => {
        setCompanyToken(null);
        setCompanyData(null);
        localStorage.removeItem('companyToken');
        localStorage.removeItem('companyData');
        toast.success('Logged out successfully');
    };

   const value = {
    searchFilter, setSearchFilter,
    setIsSearched, isSearched,
    jobs, setJobs,
    setShowRecruiterLogin, showRecruiterLogin,
    companyToken, setCompanyToken,
    companyData, setCompanyData,
    backendUrl, 
    userData, setUserData,
    userApplications, setUserApplications,
    fetchUserData,
    fetchUserApplications,
    isLoading,
    error,
    updateEmployerProfile,
    getEmployerProfile,
    fetchCompanyData,
    logoutEmployer
}

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}