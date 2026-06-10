import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Login from "./pages/Login";
import { ToastContainer } from 'react-toastify';
import VerifyOtp from "./pages/VerifyOtp";
import Verify from "./pages/Verify";
import Register from "./pages/Register";
import { AppData } from "./context/AppContext";
import Loading from "./loading";
import Dashboard from "./pages/Dashboard";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

const App = () => {

  const {isAuth,loading} = AppData();
  return (
    <>
      {loading ? (
        <Loading />
      ) : (
        <BrowserRouter>
          <Routes>
            <Route path="/" element={isAuth ? <Home /> : <Login />} />
            <Route path="/login" element={isAuth ? <Home /> : <Login />} />
            <Route path="/register" element={isAuth ? <Home /> : <Register />} />
            <Route
              path="/verifyotp"
              element={isAuth ? <Home /> : <VerifyOtp />}
            />
            <Route path="/token/:token" element={isAuth ? <Home /> : <Verify />} />

            <Route path='/dashboard' element={isAuth ? <Dashboard /> : <Login />} />

            <Route path="/forgot" element={isAuth ? <Home /> : <ForgotPassword />} />

            <Route path="/reset/:token" element={isAuth ? <Home /> : <ResetPassword />} />
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      )}
    </>
  );
}

export default App