import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { server } from "../main";
import axios from "axios";
import { AppData } from "../context/AppContext";

const VerifyOtp = () => {

  const [otp,setOtp] = useState("");
  const [btnLoading,setBtnLoading] = useState(false);
  const navigate = useNavigate();
  const { setIsAuth , setUser } = AppData();

  const email = localStorage.getItem("email");

  async function submitHandler(e) {
     e.preventDefault();
     try{
      setBtnLoading(true);
      const { data } = await axios.post(`${server}/api/auth/verify-otp`,{email,otp},{
        withCredentials : true
      }); 
      toast.success(data.message);
      setIsAuth(true);
      setUser(data.user);
      localStorage.clear("email");
      navigate("/")
      
     } catch(err) {
      toast.error(err.response.data.message);
     } finally {
      setBtnLoading(false);
     }
  }
  return (
    <div>
      <section className="text-gray-600 body-font">
        <div className="container px-5 py-24 mx-auto flex flex-wrap items-center">
          <div className="lg:w-3/5 md:w-1/2 md:pr-16 lg:pr-0 pr-0">
            <h1 className="title-font font-medium text-3xl text-gray-900">
              Slow-carb next level shoindcgoitch ethical authentic, poko
              scenester
            </h1>
            <p className="leading-relaxed mt-4">
              Poke slow-carb mixtape knausgaard, typewriter street art gentrify
              hammock starladder roathse. Craies vegan tousled etsy austin.
            </p>
          </div>
          <form
            className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0"
            onSubmit={submitHandler}
          >
            <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
              Verify using OTP
            </h2>
            <div className="relative mb-4">
              <label
                htmlFor="otp"
                className="leading-7 text-sm text-gray-600"
              >
                OTP
              </label>
              <input
                type="text"
                id="otp"
                name="otp"
                className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                required
              />
            </div>
            <button
              className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
              disabled={btnLoading}
            >
              {btnLoading ? "verifying..." : "Verify"}
            </button>
            <Link to={"/login"} className="text-xs text-gray-500 mt-3">
              Go to login
            </Link>
          </form>
        </div>
      </section>
    </div>
  );
};

export default VerifyOtp;
