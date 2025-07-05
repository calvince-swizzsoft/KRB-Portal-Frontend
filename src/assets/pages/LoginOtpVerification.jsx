import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/OTPVerification.css";
import Logo from "../img/KRBLogo.png";
import { useNavigate } from "react-router-dom";
import { authorizedFetch } from "../js/authorizedFetch";

const LoginOtpVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const otpInputs = useRef([]);
  const navigate = useNavigate();
  const memberNo = sessionStorage.getItem("memberNo");

  useEffect(() => {
    if (otpInputs.current[0]) otpInputs.current[0].focus();
  }, []);

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      setErrors({});

      if (value && index < 3) {
        otpInputs.current[index + 1].focus();
      }
    } else {
      toast.error("Only digits (0–9) are allowed in OTP.");
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (/^\d{4}$/.test(pasteData)) {
      const newOtp = pasteData.split("").slice(0, 4);
      setOtp(newOtp);
      otpInputs.current[3].focus();
    } else {
      toast.error("Please paste only a 4-digit numeric OTP.");
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const validateForm = () => {
    const joinedOtp = otp.join("");
    if (!/^\d{4}$/.test(joinedOtp)) {
      setErrors({ otp: "OTP must be 4 digits only." });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!memberNo) {
      toast.error("Session expired. Please log in again.");
      return navigate("/");
    }

    if (!validateForm()) return;

    setIsLoading(true);

    try {
      const response = await authorizedFetch(`/api/confirm-otp/`, {
        method: "POST",
        body: JSON.stringify({
          memberNumber: memberNo,
          otpCode: otp.join(""),
        }),
        headers: {
          "Content-Type": "application/json",
        },
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.message || "Invalid OTP. Try again.");
      }

      toast.success(result.message || "OTP verified successfully!");
      sessionStorage.setItem("loginOtpVerified", "OTPVERIFICATIONCOMPLETE");
      setTimeout(() => navigate("/Home"), 1500);
    } catch (error) {
      toast.error(error.message || "OTP verification failed.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="otp-verification-container">
      <ToastContainer position="top-center" theme="colored" />

      <div className="otp-card">
        <div className="otp-header">
          <div className="otp-icon">
            <img src={Logo} alt="KRB Logo" className="logo-image" />
          </div>
          <h2>Verify OTP</h2>
          <p>Enter the 4-digit code sent to your phone</p>
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
                className={errors.otp ? "otp-error" : ""}
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
