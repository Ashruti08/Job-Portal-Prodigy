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

    // Function to Fetch Jobs data
    const fetchJobs = async () => {
      try {
        const {data} = await axios.get(backendUrl + '/api/jobs')

        if(data.success){
          setJobs(data.data)
          console.log("Jobs fetched:", data.data?.length || 0);
        }
        else{
          toast.error(data.message)
        }
        
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error("Failed to fetch jobs")
        setJobs([]);
      }  
    }

    // Function to fetch Company Data
    const fetchCompanyData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/company/company',{
                headers: {token: companyToken}
            });
            const data = response.data;
            console.log("Company data:", data);

            if(data.success){
                setCompanyData(data.company);
            }
            else{
                toast.error(data.message);
            }

        } catch (error) {
            console.error('Error fetching company data:', error);
            toast.error("Failed to fetch company data");
        }
    }

    // FIXED: Function to fetch User Data with proper error handling
    const fetchUserData = useCallback(async () => {
      try {
        console.log("=== fetchUserData Debug ===");
        console.log("User loaded:", userLoaded);
        console.log("Auth loaded:", authLoaded);
        console.log("User exists:", !!user);
        
        if (!userLoaded || !authLoaded || !user) {
          console.log('Prerequisites not met for fetching user data');
          return;
        }

        const token = await getToken();
        if (!token) {
          console.log('No token available');
          setUserData(null);
          setUserApplications([]);
          return;
        }

        console.log('Making request to fetch user data...');
        console.log('Token length:', token.length);

        const {data} = await axios.get(backendUrl + "/api/users/user", {
          headers: {Authorization: `Bearer ${token}`}
        });
        
        console.log('User data response:', data);

        if(data.success){
          setUserData(data.user); // FIXED: Now matches backend response
          console.log('User data set successfully:', data.user);
        } else {
          console.error('User data fetch failed:', data.message);
          toast.error(data.message);
          // Don't clear user data on fetch failure, might be temporary
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.error('Error response:', error.response?.data);
        
        if (error.response?.status === 401) {
          console.log('Unauthorized - clearing user data');
          setUserData(null);
          setUserApplications([]);
          toast.error("Please login again");
        } else if (error.response?.status === 500) {
          console.log('Server error fetching user data');
          toast.error("Server error. Please try again later.");
        } else {
          toast.error("Failed to fetch user data");
        }
      }
    }, [backendUrl, getToken, user, userLoaded, authLoaded]);

    // FIXED: Function to fetch User's Applied data with proper error handling
    const fetchUserApplications = useCallback(async () =>{
        try {
          console.log("=== fetchUserApplications Debug ===");
          
          if (!userLoaded || !authLoaded || !user) {
            console.log('Prerequisites not met for fetching applications');
            return;
          }

          const token = await getToken()
          if (!token) {
            console.log('No token available for applications');
            setUserApplications([]);
            return;
          }

          console.log('Fetching user applications...');

          const {data} = await axios.get(backendUrl + "/api/users/applications", {
            headers: {Authorization: `Bearer ${token}`}
          });

          console.log('User applications response:', data);

          if(data.success){
            setUserApplications(data.applications || [])
            console.log('Applications set successfully:', data.applications?.length || 0);
          }
          else{
            console.error('Applications fetch failed:', data.message);
            toast.error(data.message);
          }

        } catch (error) {
          console.error('Error fetching user applications:', error);
          console.error('Error response:', error.response?.data);
          
          if (error.response?.status === 401) {
            console.log('Unauthorized - clearing applications');
            setUserApplications([]);
          } else {
            toast.error("Failed to fetch applications");
          }
        }
    }, [backendUrl, getToken, user, userLoaded, authLoaded]);

    // Initial jobs fetch
    useEffect(() => {
        fetchJobs();

        const storedCompanyToken = localStorage.getItem('companyToken');
        if (storedCompanyToken) {
          setCompanyToken(storedCompanyToken);
        }
    }, []);

    // Company data management
    useEffect(() => {
        if (companyToken) {
          fetchCompanyData();
        }
    }, [companyToken]);

    useEffect(() => {
        if (companyData) {
          const storedCompanyData = JSON.stringify(companyData);
          localStorage.setItem('companyData', storedCompanyData);
        }
    }, [companyData]);

    useEffect(() => {
        const storedCompanyData = localStorage.getItem('companyData');
        if (storedCompanyData) {
          setCompanyData(JSON.parse(storedCompanyData));
        }
    }, []);

    // FIXED: User data management with better dependency handling
    useEffect(() => {
        const handleUserDataFetch = async () => {
          if (userLoaded && authLoaded) {
            if (user) {
              console.log('User authenticated, fetching data...');
              await fetchUserData();
              await fetchUserApplications();
            } else {
              console.log('No user found, clearing data...');
              setUserData(null);
              setUserApplications([]);
            }
          }
        };

        // Add a small delay to ensure Clerk is fully initialized
        const timer = setTimeout(handleUserDataFetch, 100);
        return () => clearTimeout(timer);
    }, [user, userLoaded, authLoaded, fetchUserData, fetchUserApplications]);

    // Debug logging
    useEffect(() => {
        console.log('=== AppContext State Debug ===');
        console.log('userLoaded:', userLoaded);
        console.log('authLoaded:', authLoaded);
        console.log('user:', user);
        console.log('userData:', userData);
        console.log('userApplications:', userApplications?.length || 0);
    }, [userLoaded, authLoaded, user, userData, userApplications]);
  
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
    fetchUserApplications
}

    return (
        <AppContext.Provider value={value}>
            {props.children}
        </AppContext.Provider>
    )
}