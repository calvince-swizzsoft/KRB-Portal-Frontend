import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "../css/OTPVerification.css";
import Logo from "../img/KRBLogo.png";
import { useNavigate } from "react-router-dom";

const LoginOtpVerification = () => {
  // State management
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const otpInputs = useRef([]);
  const navigate = useNavigate();

  // Handle OTP input changes
  const handleOtpChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 4) {
        otpInputs.current[index + 1].focus();
      }
    }
  };

  // Handle paste from clipboard
  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").trim();
    if (/^\d{4}$/.test(pasteData)) {
      const newOtp = pasteData.split("").slice(0, 4);
      setOtp(newOtp);
      otpInputs.current[3].focus();
    }
  };

  // Handle backspace
  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  // Form validation
  const validateForm = () => {
    const newErrors = {};

    if (otp.join("").length !== 4) {
      newErrors.otp = "Please enter complete OTP";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e) => {
  e.preventDefault();
  const member_no = localStorage.getItem("memberNo");
  console.log(member_no);

  if (!validateForm()) return;

  setIsLoading(true);
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_API_BASE_URL}/api/confirm-otp/`,
      {
        memberNumber: member_no,
        otpCode: otp.join(""),
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    toast.success(response.data.message || "Verification successful!");
    sessionStorage.setItem("loginOtpVerified","OTPVERIFICATIONCOMPLETE")
    navigate("/Home/Dashboard");
  } catch (error) {
    console.error(error.response?.data);
    toast.error(
      error.response?.data?.message ||
        "Verification failed. Please try again."
    );
  } finally {
    setIsLoading(false);
  }
};


  return (
    <div className="otp-verification-container">
      <ToastContainer
        position="top-center"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />

      <div className="otp-card">
        <div className="otp-header">
          <div className="otp-icon">
            <img src={Logo} alt="Company Logo" className="logo-image" />
          </div>
          <h2>Verify OTP</h2>
          <p>Enter the 4-digit code sent to your registered number</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="otp-input-group" style={{ gap: "8px" }}>
            {otp.map((digit, index) => (
              <input
                key={index}
                type="text"
                maxLength="1"
                value={digit}
                onChange={(e) => handleOtpChange(index, e.target.value)}
                onPaste={handlePaste}
                onKeyDown={(e) => handleKeyDown(index, e)}
                ref={(el) => (otpInputs.current[index] = el)}
                className={errors.otp ? "error" : ""}
              />
            ))}
          </div>
          {errors.otp && <p className="error-message">{errors.otp}</p>}

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginOtpVerification;
