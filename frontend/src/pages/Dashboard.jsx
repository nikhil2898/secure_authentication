import { toast } from "react-toastify";
import api from "../apiIntercepter";
import { useEffect, useState } from "react";

const Dashboard = () => {
  const [content,setContent] = useState("");

  async function fetchAdminData() {
    try{

      const {data} = await api.get(`api/auth/admin`,{withCredentials : true});
      setContent(data.message);

    } catch(err){
      toast.error(err.response.data.message);
    }
  }

  useEffect(()=>{
    fetchAdminData();
  },[])
  return(
    <>
     { content && <div>{content}</div>}
    </>
  );
};

export default Dashboard;
