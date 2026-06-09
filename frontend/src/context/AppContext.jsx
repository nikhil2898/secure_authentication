import { createContext, useContext, useEffect, useState } from "react";
import api from "../apiIntercepter";
import { toast } from "react-toastify";


const AppContext = createContext(null);

export const AppProvider = ({children}) => {
    const [user,setUser] = useState(null);
    const [loading,setLoading] = useState(true);
    const [isAuth,setIsAuth] = useState(false);


    async function logoutUser(navigate) {
        try{
          const { data } = await api.post('/api/auth/logout');
          toast.success(data.message);
          setIsAuth(false);
          setUser(null);
          navigate("/login")
        } catch(err){
           toast.error(err.response.data.message);
        }
    }

    async function fetchUser() {
        setLoading(true);
        try{
            const {data} = await api.get(`/api/auth/me`);

            setUser(data.user);
            setIsAuth(true);

        } catch(err) {
            console.log(err);
            setUser(null);
            setIsAuth(false);
        } finally {
            setLoading(false);
        }
    }


    useEffect(()=>{
      fetchUser()
    },[])

    return <AppContext.Provider value={{setIsAuth,isAuth,user,setUser,loading,setLoading,logoutUser}}>{children}</AppContext.Provider>
}


export const AppData = () => {
    const context = useContext(AppContext);

    if(!context) throw new Error("Appdata must be use within an AppProvider");

    return context;
}

