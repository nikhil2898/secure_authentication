import axios from "axios";
import { useState } from "react";
import { toast } from "react-toastify";
import { server } from "../main";
import { useNavigate } from "react-router-dom";

const ForgotPassword = () => {

  const [email,setEmail] = useState("");
  const [btnLoading,setBtnLoading] = useState(false);
  
  const navigate = useNavigate();

  async function submitHandler(e){
    e.preventDefault();
    try{
      setBtnLoading(true);
      const {data} = await axios.post(`${server}/api/auth/forgot`,{email},{withCredentials : true});
      toast.success(data.message);
      navigate("/login");
    } catch(err){
      toast.error(err.response.data.message);
    } finally {
      setBtnLoading(false);
    }
  }
  
  return (
    <div>
      <section className="text-gray-600 body-font">
        <div className="flex items-center justify-center px-5 py-24 mx-auto">
          <form
            className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0"
            onSubmit={submitHandler}
          >
            <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
              Forgot Password
            </h2>
            <div className="relative mb-4">
              <label
                htmlFor="full-name"
                className="leading-7 text-sm text-gray-600"
              >
                Email
              </label>
              <input
                type="text"
                id="email"
                name="email"
                className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <button
              className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg"
              disabled={btnLoading}
            >
              {btnLoading ? "submitting..." : "Submit"}
            </button>
            
          </form>
        </div>
      </section>
    </div>
  );
}

export default ForgotPassword