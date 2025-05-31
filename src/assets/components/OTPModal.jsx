import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import '../css/OTPVerification.css'

const OTPModal = ({ isOpen, onClose, onVerify, isLoading }) => {
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [errors, setErrors] = useState({});
  const otpInputs = useRef([]);

  const handleOtpChange = (index, value) => {
    if (/^\d?$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      if (value && index < 3) {
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

  const handleSubmit = (e) => {
    e.preventDefault();
    const otpValue = otp.join("");
    
    if (otpValue.length !== 4) {
      setErrors({ otp: "Please enter complete OTP" });
      return;
    }
    
    onVerify(otpValue); // Pass the complete OTP to parent in this case its thee EditProfile or on the case that the OTPModal is reusable 
  };

  if (!isOpen) return null;

  return createPortal(
    <div className="modal-overlay">
      <div className="otp-modal-content">
        <div className="modal-header">
          <h2>Verify OTP</h2>
          <button onClick={onClose} className="close-button">
            &times;
          </button>
        </div>
        <div className="modal-body">
          <p>Enter the 4-digit code sent to your registered number</p>
          <form onSubmit={handleSubmit}>
            <div className="otp-input-group">
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
              {isLoading ? "Verifying..." : "Verify"}
            </button>
          </form>
        </div>
      </div>
    </div>,
    document.getElementById("modal-root")
  );
};

export default OTPModal;