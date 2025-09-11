import { createContext, useEffect, useState } from "react";
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
    const [userApplications,setUserApplications] = useState([]) // FIXED: Initialize as empty array instead of null

    // Function to Fetch Jobs data
    const fetchJobs = async () => {
      try {
        
        const {data} = await axios.get(backendUrl + '/api/jobs')

        if(data.success){
          setJobs(data.data)
          console.log(data.data);
        }
        else{
          toast.error(data.message)
        }
        
      } catch (error) {
        console.error('Error fetching jobs:', error);
        toast.error(error.message)
        setJobs([]);
      }  
      
    }

    // Function to fetch Company Data
    const fetchCompanyData = async () => {
        try {
            const response = await axios.get(backendUrl + '/api/company/company',{headers: {token: companyToken}});
            const data = response.data;
            console.log(data);

            if(data.success){
                setCompanyData(data.company);
            }
            else{
                toast.error(data.message);
            }

        } catch (error) {
            toast.error(error.message);
        }
    }

    // Function to fetch User Data
    const fetchUserData = async () => {
      try {
        
        const token = await getToken();
        if (!token) {
          console.log('No token available');
          return;
        }

        console.log('Fetching user data with token:', token.substring(0, 50) + '...');

        const {data} = await axios.get(backendUrl+"/api/users/user",
          {headers: {Authorization: `Bearer ${token}`}})
        
        console.log('User data response:', data);

        if(data.success){
          setUserData(data.user);
        }else{
          console.error('User data fetch failed:', data.message);
          toast.error(data.message)
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
        console.error('Error response:', error.response?.data);
        toast.error(error.message)
      }
    }

    // Function to fetch User's Applied data
    const fetchUserApplications = async () =>{
        try {
          
          const token = await getToken()
          if (!token) {
            console.log('No token available for applications');
            return;
          }

          console.log('Fetching user applications...');

          const {data} = await axios.get(backendUrl+"/api/users/applications",
            {headers: {Authorization: `Bearer ${token}`}}
          )

          console.log('User applications response:', data);

          if(data.success){
            setUserApplications(data.applications || []) // FIXED: Ensure it's always an array
          }
          else{
            console.error('Applications fetch failed:', data.message);
            toast.error(data.message)
          }

        } catch (error) {
          console.error('Error fetching user applications:', error);
          console.error('Error response:', error.response?.data);
          toast.error(error.message)
        }
    }

    useEffect(() => {
        fetchJobs();

        const storedCompanyToken = localStorage.getItem('companyToken');

        if (storedCompanyToken) {
          setCompanyToken(storedCompanyToken);
        }
    }, []);

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

    // FIXED: Better condition to fetch user data
    useEffect(() => {
        const fetchUserDataIfNeeded = async () => {
          // Only fetch if Clerk is loaded and user exists
          if (userLoaded && authLoaded && user) {
            console.log('User loaded, fetching data for user:', user.id);
            await fetchUserData();
            await fetchUserApplications();
          } else if (userLoaded && authLoaded && !user) {
            // Clear data if no user
            console.log('No user found, clearing data');
            setUserData(null);
            setUserApplications([]);
          }
        };

        fetchUserDataIfNeeded();
    }, [user, userLoaded, authLoaded]); // FIXED: Include loading states
  
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