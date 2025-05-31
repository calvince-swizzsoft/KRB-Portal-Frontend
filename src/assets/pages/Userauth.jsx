import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../img/KRBLogo.png";
import "../css/Userauth.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const UserAuth = () => {
  const [isRightPanelActive, setIsRightPanelActive] = useState(false);
  const [isMobileMode, setIsMobileMode] = useState(false);
  const [memberNo, setMemberNo] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobileMode(window.innerWidth <= 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const togglePanel = () => setIsRightPanelActive(!isRightPanelActive);

  const handleLogin = async (e) => {
    e.preventDefault();
    const memberNo = e.target.elements.signInMemberNo.value;
    const password = e.target.elements.Password.value;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/login-member/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            username: memberNo,
            password: password,
          }),
        }
      );

      const data = await response.json();
      console.log(data);

      if (response.ok) {
        localStorage.setItem("memberNo", memberNo);
        localStorage.setItem("token", data.token || "dummy-token");

        // if the response is ok send the login otp to the logged in user 
        const sendotp = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/send-otp/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              memberNumber: memberNo,
            }),
          }
        );

        if (sendotp.ok) {
          setTimeout(() => {
            toast.success(
              "Login OTP Sent enter it to have acces to your account"
            );
          }, 500);
        }
        toast.success("Login successful!");
        setTimeout(() => {
          navigate("/login-otp-verification");
        }, 2000);
      } else {
        toast.error(
          data.detail || "Login failed. Please check your credentials."
        );
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };
  const handleSignup = async (e) => {
    e.preventDefault();
    const memberNo = e.target.elements.signUpMemberNo.value;
    const idNo = e.target.elements.IdNumber.value;

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/register-member/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            member_no: memberNo,
            id_no: idNo,
          }),
        }
      );

      const data = await response.json();
      const signedup = false;

      if (data.status === "success" && data.service_response === true) {
        sessionStorage.setItem("memberNo", memberNo);
        sessionStorage.setItem("signedup", !signedup);

        setTimeout(() => {
          toast.success("Registration successful!", {
            position: "top-right",
            autoClose: 5000,
            theme: "light",
          });
        }, 2000);

        navigate("/OTPVerification");
      } else if (data.status === "fail") {
        toast.error(data.detail || "Invalid Credentials", {
          position: "top-right",
          autoClose: 5000,
          theme: "light",
        });
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.", {
        position: "top-right",
        autoClose: 5000,
        theme: "light",
      });
    }
  };

  return (
    <div
      className={`container ${isRightPanelActive ? "right-panel-active" : ""} ${
        isMobileMode ? "mobile-mode" : ""
      }`}
    >
      <ToastContainer
        position="top-right"
        toastStyle={{
          backgroundColor: "white",
          color: "red",
        }}
      />
      <div className="form-container sign-in-container">
        <form onSubmit={handleLogin} className="userauthform">
          <h1>Sign in</h1>
          <span>or use your account</span>
          <div className="input-group">
            <label htmlFor="signInMemberNo">Member Number</label>
            <input
              type="text"
              id="signInMemberNo"
              value={memberNo}
              onChange={(e) => setMemberNo(e.target.value)}
              placeholder="Enter Member Number"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="Password">Password</label>
            <input
              type="password"
              id="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter Password"
              required
            />
          </div>
          {isMobileMode && (
            <div className="mobile-toggle">
              <button onClick={togglePanel}>
                {isRightPanelActive
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}
          <a href="#">Forgot your password?</a>
          <button type="submit">Sign In</button>
        </form>
      </div>

      <div className="form-container sign-up-container">
        <form onSubmit={handleSignup} className="userauthform">
          <h1>Create Account</h1>
          <div className="input-group">
            <label htmlFor="signUpMemberNo">Member Number</label>
            <input
              type="text"
              id="signUpMemberNo"
              name="MemberNo"
              placeholder="Enter Member Number"
              required
            />
          </div>
          <div className="input-group">
            <label htmlFor="IdNumber">ID Number</label>
            <input
              type="text"
              id="IdNumber"
              name="IdNumber"
              placeholder="Enter ID Number"
              required
            />
          </div>
          {isMobileMode && (
            <div className="mobile-toggle">
              <button onClick={togglePanel}>
                {isRightPanelActive
                  ? "Already have an account? Sign In"
                  : "Don't have an account? Sign Up"}
              </button>
            </div>
          )}
          <button type="submit">Sign Up</button>
        </form>
      </div>

      <div className="overlay-container">
        <div className="overlay">
          <div
            className="overlay-panel overlay-left"
            style={{ backgroundImage: `url(${Logo})` }}
          >
            <div className="overlay-content">
              <h1>Welcome Back!</h1>
              <p>
                To keep connected with us please login with your personal info
              </p>
              <button className="ghost" onClick={togglePanel}>
                Sign In
              </button>
            </div>
          </div>

          <div
            className="overlay-panel overlay-right"
            style={{ backgroundImage: `url(${Logo})` }}
          >
            <div className="overlay-content">
              <h1>Hello, don't have an Account?</h1>
              <p>Enter your personal details and start journey with us</p>
              <button className="ghost" onClick={togglePanel}>
                Sign Up
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
