import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Logo from "../img/KRBLogo.png";
import "../css/Userauth.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  FaUser,
  FaLock,
  FaSignInAlt,
  FaUserPlus,
  FaEye,
  FaEyeSlash,
} from "react-icons/fa";
import { FiHelpCircle, FiX } from "react-icons/fi";
import { FaWhatsapp, FaPhone, FaEnvelope, FaQuestionCircle } from "react-icons/fa";


const UserAuth = () => {
  const [isLoginView, setIsLoginView] = useState(true);
  const [memberNo, setMemberNo] = useState("");
  const [password, setPassword] = useState("");
  const [idNo, setIdNo] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const navigate = useNavigate();

  const togglePasswordVisibility = () => setShowPassword(!showPassword);

  const handleLogin = async (e) => {
    e.preventDefault();
    toast.info("Authenticating credentials...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/login-member/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: memberNo, password }),
        }
      );

      const data = await response.json();
      if (response.ok) {
        toast.success("Login successful. Sending OTP...");
        sessionStorage.setItem("memberNo", memberNo);
        sessionStorage.setItem("token", data.access);
        sessionStorage.setItem("refresh", data.refresh);

        const sendotp = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/send-otp/`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ memberNumber: memberNo }),
          }
        );

        if (sendotp.ok) {
          toast.success("Login OTP Sent. Enter it to access your account.");
        }
        setTimeout(() => navigate("/login-otp-verification"), 2000);
      } else {
        toast.error(data.detail || "Login failed. Please check credentials.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  const handleSignup = async (e) => {
    e.preventDefault();
    toast.info("Processing your registration...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/register-member/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ member_no: memberNo, id_no: idNo }),
        }
      );
      const data = await response.json();

      if (data.status === "success" && data.service_response === true) {
        sessionStorage.setItem("memberNo", memberNo);
        sessionStorage.setItem("signedup", "true");
        toast.success("Registration successful!");
        setTimeout(() => navigate("/OTPVerification"), 2000);
      } else {
        toast.error(data.detail || "Registration failed.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again.");
    }
  };

  return (
    <div className="auth-container">
      <ToastContainer position="top-right" />

      <div className="auth-card">
        <div className="auth-header">
          <div className="logo-placeholder">
            <img src={Logo} alt="KRB Logo" />
          </div>
          <div className="logotextholder">
            <h2>{isLoginView ? "WELCOME BACK" : "REGISTER NOW"}</h2>
            <h3>{isLoginView ? "SIGN IN" : "SIGN UP"}</h3>
          </div>
        </div>

        <form
          onSubmit={isLoginView ? handleLogin : handleSignup}
          className="auth-form"
        >
          <div className="input-group">
            <FaUser className="input-icon" />
            <input
              type="text"
              name="memberNo"
              value={memberNo}
              onChange={(e) => setMemberNo(e.target.value)}
              placeholder="ENTER MEMBER NUMBER"
              required
            />
          </div>

          {isLoginView ? (
            <div className="input-group">
              <FaLock className="input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="ENTER PASSWORD"
                required
              />
              <span className="toggle-icon" onClick={togglePasswordVisibility}>
                {showPassword ? <FaEye /> : <FaEyeSlash />}
              </span>
            </div>
          ) : (
            <div className="input-group">
              <FaUser className="input-icon" />
              <input
                type="text"
                name="idNo"
                value={idNo}
                onChange={(e) => setIdNo(e.target.value)}
                placeholder="ENTER NATIONAL ID NUMBER"
                required
              />
            </div>
          )}

          {isLoginView && (
            <p className="help-text">
              <FiHelpCircle />
              <span>Forgotten your password?<span className="resetbutton" onClick={() => navigate("/change-password")}> Reset Password</span></span>
            </p>
          )}

          <button type="submit" className="auth-button">
            {isLoginView ? (
              <>
                <FaSignInAlt /> LOGIN
              </>
            ) : (
              <>
                <FaUserPlus /> SIGN UP
              </>
            )}
          </button>
        </form>

        <div className="auth-switch">
          <button onClick={() => setIsLoginView(!isLoginView)}>
            {isLoginView
              ? "Need an account? Register now"
              : "Already have an account? Sign in"}
          </button>
        </div>
      </div>

      <div className="support-container">
        <div className={`support-drawer ${isDrawerOpen ? "open" : ""}`}>
          <a
            href="https://wa.me/254706126213"
            target="_blank"
            rel="noopener noreferrer"
            className="support-icon whatsapp"
          >
            <FaWhatsapp />
          </a>
          <a href="tel:+254706126213" className="support-icon phone">
            <FaPhone />
          </a>
          <a
            href="mailto:support@krbsacco.co.ke"
            className="support-icon email"
          >
            <FaEnvelope />
          </a>
        </div>

        <div
          className="support-button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
        >
          <FaQuestionCircle />
          <span className="tooltip">Technical Support</span>
        </div>
      </div>
    </div>
  );
};

export default UserAuth;
