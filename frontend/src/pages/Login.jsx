import { useState } from "react";
import axios from "axios"
import { Link, useNavigate } from "react-router-dom";
import { server } from "../main";
import { toast } from "react-toastify";

const Login = () => {
  const [email,setEmail] = useState();
  const [password,setPassword] = useState();
  const [btnLoading,setBtnLoading] = useState(false);

  const navigate = useNavigate();
  
 async function submitHandler(e) {
    e.preventDefault();
    try{
      setBtnLoading(true);
      const { data } = await axios.post(`${server}/api/auth/login`, {
        email,
        password
      })
      toast.success(data.message);
      localStorage.setItem("email",email);
      navigate("/verifyotp")
    } catch(err) {
      toast.error(err.response.data.message);
    } finally{
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
          <form className="lg:w-2/6 md:w-1/2 bg-gray-100 rounded-lg p-8 flex flex-col md:ml-auto w-full mt-10 md:mt-0" onSubmit={submitHandler}>
            <h2 className="text-gray-900 text-lg font-medium title-font mb-5">
              Login
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
            <div className="relative mb-4">
              <label
                htmlFor="email"
                className="leading-7 text-sm text-gray-600"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                name="password"
                className="w-full bg-white rounded border border-gray-300 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 text-base outline-none text-gray-700 py-1 px-3 leading-8 transition-colors duration-200 ease-in-out"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <button className="text-white bg-indigo-500 border-0 py-2 px-8 focus:outline-none hover:bg-indigo-600 rounded text-lg" disabled={btnLoading}>
              {btnLoading ? "submitting..." : "SignIn"}
            </button>
            <Link to={"/register"} className="text-xs text-gray-500 mt-3">
              Don't have an account?
            </Link>
          </form>
        </div>
      </section>
    </div>
  );
};

export default Login;
