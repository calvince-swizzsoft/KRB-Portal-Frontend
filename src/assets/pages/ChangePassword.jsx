import React, { useState } from "react";
import { toast, ToastContainer } from "react-toastify";
import { useNavigate } from "react-router-dom";
import "react-toastify/dist/ReactToastify.css";
import Logo from "../img/KRBLogo.png"; // Make sure to import your logo
import '../css/ChangePassword.css'

function ChangePassword() {
  const [memberNumber, setMemberNumber] = useState("");
  const [idNumber, setIdNumber] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!memberNumber || !idNumber) {
      toast.error("Please fill in all fields.");
      return;
    }

    setLoading(true);
    toast.info("Processing your request...");

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/register-member/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            member_no: memberNumber,
            id_no: idNumber,
          }),
        }
      );

      const data = await response.json();

      if (data.status === "success" && data.service_response === true) {
        sessionStorage.setItem("memberNo", memberNumber);
        sessionStorage.setItem("signedup", "true");

        toast.success("Request successful! OTP sent.", {
          autoClose: 4000,
          theme: "light",
        });

        setTimeout(() => {
          navigate("/OTPVerification");
        }, 2000);
      } else {
        toast.error(data.detail || "Invalid credentials or request failed.", {
          autoClose: 5000,
        });
      }
    } catch (error) {
      toast.error("Network error. Please try again later.");
      console.error("ChangePassword error:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="change-password-container">
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

      <div className="change-password-card">
        <div className="change-password-header">
          <div className="logo-container">
            <img src={Logo} alt="Company Logo" className="logo-image" />
          </div>
          <h2>Account Recovery</h2>
          <p>Enter your Member Number and ID Number to receive an OTP</p>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Member Number</label>
            <input
              type="text"
              value={memberNumber}
              onChange={(e) => setMemberNumber(e.target.value)}
              placeholder="Enter your Member Number"
              required
            />
          </div>

          <div className="form-group">
            <label>ID Number</label>
            <input
              type="text"
              value={idNumber}
              onChange={(e) => setIdNumber(e.target.value)}
              placeholder="Enter your ID Number"
              required
            />
          </div>

          <button 
            type="submit" 
            className="submit-btn"
            disabled={loading}
          >
            {loading ? (
              <span className="button-loading">
                <span className="spinner"></span>
                Submitting...
              </span>
            ) : (
              "Send OTP"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;