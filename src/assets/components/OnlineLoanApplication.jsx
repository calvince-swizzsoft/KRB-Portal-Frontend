import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OTPModal from "./OTPModal"; 
import axios from "axios";  
import "../css/OnlineLoanApplication.css";
import KRBLogo from "../img/KRBLogo.png";
import { Navigate, useNavigate } from "react-router-dom";

function OnlineLoanApplication() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanProducts, setLoanProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [isMobile, setIsMobile] = useState(false);
  const [loanType, setLoanType] = useState("");
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [repaymentPeriod, setRepaymentPeriod] = useState("");
  const [submitStatus, setSubmitStatus] = useState({
    message: "",
    isError: false,
    isSuccess: false,
  });
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isVerifyingOTP, setIsVerifyingOTP] = useState(false);
  const [loanApplicationData, setLoanApplicationData] = useState(null);
  const navigate = useNavigate()

  const memberNo = localStorage.getItem("memberNo");

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };

    checkIfMobile();
    window.addEventListener("resize", checkIfMobile);
    return () => window.removeEventListener("resize", checkIfMobile);
  }, []);

  useEffect(() => {
    const fetchLoanProducts = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_BASE_URL}/api/loan-products/`
        );

        if (!response.ok) throw new Error("Failed to fetch loan products");

        const data = await response.json();
        setLoanProducts(data);
        setFilteredProducts(data);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanProducts();
  }, []);

  useEffect(() => {
    if (showOTPModal) {
      document.body.classList.add("modal-open");
    } else {
      document.body.classList.remove("modal-open");
    }
    return () => document.body.classList.remove("modal-open");
  }, [showOTPModal]);

  useEffect(() => {
    let results = loanProducts;

    if (searchTerm) {
      results = results.filter(
        (loan) =>
          loan.product_description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          loan.loan_code.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (filterTerm !== "all") {
      results = results.filter((loan) => {
        const desc = loan.product_description.toLowerCase();
        return desc.includes(filterTerm.toLowerCase());
      });
    }

    setFilteredProducts(results);
  }, [searchTerm, filterTerm, loanProducts]);

  const handleApplyClick = (loan) => {
    setSelectedLoan(loan);
    setLoanType(loan.loan_code);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLoan(null);
    setLoanAmount("");
    setLoanPurpose("");
    setRepaymentPeriod("");
  };

  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/,/g, ""));
  };

  const validateInputs = () => {
    if (!selectedLoan) return false;

    const minAmount = parseNumber(selectedLoan.minAmount);
    const maxAmount = parseNumber(selectedLoan.maxAmount);
    const amount = parseFloat(loanAmount);
    const period = parseInt(repaymentPeriod);

    if (isNaN(amount)) {
      toast.error("Please enter a valid loan amount");
      return false;
    }

    if (amount < minAmount || amount > maxAmount) {
      toast.error(
        `Amount must be between Ksh ${selectedLoan.minAmount} and Ksh ${selectedLoan.maxAmount}`
      );
      return false;
    }

    if (isNaN(period)) {
      toast.error("Please enter a valid repayment period");
      return false;
    }

    if (period < 1 || period > parseInt(selectedLoan.maxInstallments)) {
      toast.error(
        `Repayment period must be between 1 and ${selectedLoan.maxInstallments} months`
      );
      return false;
    }

    if (!loanPurpose.trim()) {
      toast.error("Please enter the loan purpose");
      return false;
    }

    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateInputs()) return;

    const payload = {
      bosa_no: memberNo,
      loan_type: selectedLoan.loan_code,
      loan_amount: parseFloat(loanAmount),
      loan_purpose: loanPurpose,
      repayment_period: parseInt(repaymentPeriod),
    };

    setLoanApplicationData(payload);
    
    try {
      const otpRequest = await fetch(
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
      
      if (!otpRequest.ok) {
        const errorData = await otpRequest.json();
        throw new Error(errorData.message || "Failed to send OTP");
      }
      
      setShowOTPModal(true);
      closeModal();
      toast.info("OTP sent to your registered phone number");
      
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleOTPVerify = async (otp) => {
    setIsVerifyingOTP(true);
    try {
     const otpResponse = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/confirm-otp/`,
        {
          memberNumber: memberNo,
          otpCode: otp,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const otpData = otpResponse.data;

      if (otpResponse.status !== 200) {
        throw new Error(otpData.message || "OTP verification failed");
      }

      const loanResponse = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/apply-loan/`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loanApplicationData),
        }
      );

      if (!loanResponse.ok) {
        const errorData = await loanResponse.json();
        throw new Error(errorData.message || "Failed to submit loan application");
      }
      
      toast.success("Loan application submitted successfully!");
      setShowOTPModal(false);
      setSubmitStatus({
        message: "Loan application submitted successfully!",
        isError: false,
        isSuccess: true
      });
      navigate('/Home/AppliedLoans')
      setTimeout(() => {
        closeModal();
      }, 2000);
    } catch (error) {
      toast.error(error.message);
      setSubmitStatus({
        message: error.message || "An unexpected error occurred",
        isError: true,
        isSuccess: false
      });
    } finally {
      setIsVerifyingOTP(false);
    }
  };


  return (
    <div className="onlineloanapplication-maincontainer">
      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
      <div className="maincontainer">
        <div className="header-section">
          <div className="logo-container">
            <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
            <div className="sacco-name">Kenya Road Board Sacco</div>
          </div>
          <h1 className="page-title">Online Loan Application</h1>
        </div>

        {/* Search and Filter Section */}
        <div className="search-filter-container">
          <div className="search-box">
            <input
              type="text"
              placeholder="Search by loan name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="filter-options">
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
            >
              <option value="all">All Loan Types</option>
              <option value="emergency">Emergency</option>
              <option value="quick">Quick</option>
              <option value="school">School</option>
              <option value="development">Development</option>
              <option value="normal">Normal</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <p>Loading loan products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="no-results">
            <img src="/img/no-results.svg" alt="No results" />
            <p>No loan products found matching your criteria</p>
            {(searchTerm || filterTerm !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterTerm("all");
                }}
                className="clear-filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={`loan-products-container ${
              isMobile ? "mobile-view" : "desktop-view"
            }`}
          >
            {filteredProducts.map((loan) => (
              <details key={loan.loan_code} className="loan-product">
                <summary>
                  <span className="loan-title">{loan.product_description}</span>
                  <span className="loan-code">{loan.loan_code}</span>
                </summary>
                <div className="loan-details">
                  <div className="detail-row">
                    <span className="detail-label">Amount Range:</span>
                    <span className="detail-value">
                      Ksh {loan.minAmount} - Ksh {loan.maxAmount}
                    </span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Interest Rate:</span>
                    <span className="detail-value">{loan.interestRate}%</span>
                  </div>
                  <div className="detail-row">
                    <span className="detail-label">Max Period:</span>
                    <span className="detail-value">
                      {loan.maxInstallments} months
                    </span>
                  </div>
                  <button
                    onClick={() => handleApplyClick(loan)}
                    className="apply-btn"
                  >
                    Apply Now
                  </button>
                </div>
              </details>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && selectedLoan && (
        <div className="modal-backdrop">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Apply</h2>
              <button className="modal-close" onClick={closeModal}>
                &times;
              </button>
            </div>
            <div className="modal-body">
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label>Member Number</label>
                  <input
                    type="text"
                    value={memberNo}
                    readOnly
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Loan Type</label>
                  <input
                    type="text"
                    value={`${selectedLoan.loan_code} - ${selectedLoan.product_description}`}
                    readOnly
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Loan Amount (KES) - Range: Ksh {selectedLoan.minAmount} to{" "}
                    {selectedLoan.maxAmount}
                  </label>
                  <input
                    type="number"
                    placeholder={`Enter amount between ${selectedLoan.minAmount} and ${selectedLoan.maxAmount}`}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    min={parseNumber(selectedLoan.minAmount)}
                    max={parseNumber(selectedLoan.maxAmount)}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>
                    Repayment Period (Months) - Max:{" "}
                    {selectedLoan.maxInstallments}
                  </label>
                  <input
                    type="number"
                    placeholder={`Enter months (1-${selectedLoan.maxInstallments})`}
                    value={repaymentPeriod}
                    onChange={(e) => setRepaymentPeriod(e.target.value)}
                    min="1"
                    max={selectedLoan.maxInstallments}
                    required
                    className="form-control"
                  />
                </div>

                <div className="form-group">
                  <label>Purpose of Loan</label>
                  <textarea
                    placeholder="Briefly explain why you need this loan..."
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    required
                    className="form-control"
                    rows="4"
                  ></textarea>
                </div>
                {submitStatus.message && (
                  <div
                    className={`form-message ${
                      submitStatus.isError ? "error" : "success"
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}

                <div className="form-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="btn btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <OTPModal
        isOpen={showOTPModal}
        onClose={() => setShowOTPModal(false)}
        onVerify={handleOTPVerify}
        isLoading={isVerifyingOTP}
      />
    </div>
  );
}

export default OnlineLoanApplication;
