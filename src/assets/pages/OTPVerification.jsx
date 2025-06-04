import React, { useState, useRef, useEffect } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";
import "../css/OTPVerification.css";
import Logo from "../img/KRBLogo.png";
import { useNavigate } from "react-router-dom";

const OTPVerification = () => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);
  const otpInputs = useRef([]);
  const navigate = useNavigate();

  const handleOtpChange = (index, value) => {
    if (/^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 5) {
        otpInputs.current[index + 1].focus();
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text/plain").trim();
    if (/^\d{4}$/.test(pasteData)) {
      const newOtp = pasteData.split("").slice(0, 4);
      setOtp(newOtp);
      otpInputs.current[3].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpInputs.current[index - 1].focus();
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (otp.join("").length !== 4) {
      newErrors.otp = "Please enter complete OTP";
    }

    if (password.length < 8) {
      newErrors.password = "Password must be at least 8 characters";
    } else if (!/[A-Z]/.test(password)) {
      newErrors.password =
        "Password must contain at least one uppercase letter";
    } else if (!/[0-9]/.test(password)) {
      newErrors.password = "Password must contain at least one number";
    }

    if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const member_no = sessionStorage.getItem("memberNo");

      const payload = {
        member_no: member_no,
        current_pass: otp.join(""),
        new_pass: password,
      };

      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/change-password/`,
        payload,
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      if (response.status === 200) {
        toast.success(response.data.message || "Verification successful!");
        sessionStorage.clear()

        sessionStorage.setItem('signedup', 'true');
        navigate("/");
      }
    } catch (error) {
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

          <div className="form-group">
        <label>New Password</label>
        <input
          type={showNewPassword ? "text" : "password"}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={errors.password ? "error" : ""}
          placeholder="Enter your new password"
        />
        <label style={{ display: "flex", marginTop: "5px",width: "100%",fontSize: "16px"}}>
          <input
            type="checkbox"
            style={{height: "15px",width: "30px"}}
            onClick={() => setShowNewPassword((prev) => !prev)}
          />{" "}
          Show Password
        </label>
        {errors.password && (
          <p className="error-message">{errors.password}</p>
        )}
      </div>

      <div className="form-group">
        <label>Confirm Password</label>
        <input
          type={showConfirmPassword ? "text" : "password"}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className={errors.confirmPassword ? "error" : ""}
          placeholder="Re-enter your password"
        />
        <label style={{ display: "flex", marginTop: "5px",width: "100%",fontSize: "16px" }}>
          <input
            type="checkbox"
            style={{height: "15px",width: "30px"}}
            onClick={() => setShowConfirmPassword((prev) => !prev)}
          />{" "}
          Show Password
        </label>
        {errors.confirmPassword && (
          <p className="error-message">{errors.confirmPassword}</p>
        )}
      </div>

          <button type="submit" className="submit-btn" disabled={isLoading}>
            {isLoading ? "Verifying..." : "Verify & Continue"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default OTPVerification;
