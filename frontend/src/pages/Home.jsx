import { Link, useNavigate } from "react-router-dom";
import { AppData } from "../context/AppContext";

const Home = () => {
  const { logoutUser, user } = AppData();
  const navigate = useNavigate();
  return(
    <>
    <div className="flex w-[100px] m-auto mt-40 gap-2">
      <button className="bg-red-500 text-white rounded-md p-2 hover:bg-red-600 cursor-pointer" onClick={()=>logoutUser(navigate)}>Logout</button>

      {
        user && user.role === "admin" && (
          <Link to="/dashboard" className="bg-purple-500 text-white p-2 rounded-md">Dashboard</Link>
        )
      }
    </div>
    </>
  )
};

export default Home;
