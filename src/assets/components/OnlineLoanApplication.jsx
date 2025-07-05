import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/OnlineLoanApplication.css";
import KRBLogo from "../img/KRBLogo.png";
import KrbsacoLoader from "./KrbsacoLoader";
import { useNavigate } from "react-router-dom";
import { authorizedFetch } from "../js/authorizedFetch";

function OnlineLoanApplication() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [loanProducts, setLoanProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterTerm, setFilterTerm] = useState("all");
  const [isMobile, setIsMobile] = useState(false);
  const [loanAmount, setLoanAmount] = useState("");
  const [loanPurpose, setLoanPurpose] = useState("");
  const [repaymentPeriod, setRepaymentPeriod] = useState("");
  const [submitStatus, setSubmitStatus] = useState({
    message: "",
    isError: false,
    isSuccess: false,
  });
  const [expandedLoan, setExpandedLoan] = useState(null);
  const navigate = useNavigate();

  const memberNo = sessionStorage.getItem("memberNo");

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
        const response = await authorizedFetch(`/api/loan-products/`, {
          method: "GET",
        });

        if (!response.ok) throw new Error("Failed to fetch loan products");

        const data = await response.json();
        const processedData = data
          .map((loan) => ({
            ...loan,
            maxAmount: parseNumber(loan.max_amount),
            minAmount: 0,
            maxInstallments: parseInt(loan.term.replace("M", "")) || 60,
            interestRate: parseFloat(loan.interest_rate) || 0,
            category: getLoanTypeCategory(loan.product_description),
          }))
          .sort((a, b) =>
            a.product_description.localeCompare(b.product_description)
          );

        setLoanProducts(processedData);
        setFilteredProducts(processedData);
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchLoanProducts();
  }, []);

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
        return loan.category === filterTerm;
      });
    }

    setFilteredProducts(results);
  }, [searchTerm, filterTerm, loanProducts]);

  const parseNumber = (value) => {
    if (!value) return 0;
    return parseFloat(value.toString().replace(/,/g, ""));
  };

  const getLoanTypeCategory = (description) => {
    const desc = description.toLowerCase();
    if (desc.includes("emergency")) return "emergency";
    if (desc.includes("instant")) return "quick";
    if (desc.includes("school")) return "school";
    if (desc.includes("development")) return "development";
    if (desc.includes("flexi")) return "quick";
    if (desc.includes("investment")) return "development";
    return "normal";
  };

  const toggleLoanDetails = (loanCode) => {
    setExpandedLoan(expandedLoan === loanCode ? null : loanCode);
  };

  const handleApplyClick = (loan) => {
    setSelectedLoan(loan);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedLoan(null);
    setLoanAmount("");
    setLoanPurpose("");
    setRepaymentPeriod("");
    setSubmitStatus({ message: "", isError: false, isSuccess: false });
  };

  const validateInputs = () => {
    if (!selectedLoan) return false;

    const amount = parseFloat(loanAmount);
    const period = parseInt(repaymentPeriod);

    if (isNaN(amount)) {
      toast.error("Please enter a valid loan amount");
      return false;
    }

    if (amount < selectedLoan.minAmount || amount > selectedLoan.maxAmount) {
      toast.error(
        `Amount must be between Ksh ${selectedLoan.minAmount.toLocaleString()} and Ksh ${selectedLoan.maxAmount.toLocaleString()}`
      );
      return false;
    }

    if (isNaN(period)) {
      toast.error("Please enter a valid repayment period");
      return false;
    }

    if (period < 1 || period > selectedLoan.maxInstallments) {
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

    try {
      const loanResponse = await authorizedFetch(`/api/apply-loan/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      if (!loanResponse.ok) {
        const errorData = await loanResponse.json();
        throw new Error(
          errorData.message || "Failed to submit loan application"
        );
      }

      toast.success("Loan application submitted successfully!");
      setSubmitStatus({
        message: "Loan application submitted successfully!",
        isError: false,
        isSuccess: true,
      });
      setTimeout(() => {
        closeModal();
        navigate("/Home/AppliedLoans");
      }, 3000);
    } catch (error) {
      toast.error(error.message);
      setSubmitStatus({
        message: error.message || "An unexpected error occurred",
        isError: true,
        isSuccess: false,
      });
    }
  };

  if (loading) return <KrbsacoLoader />;

  return (
    <div className="krb-loan-application-container">
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
      <div className="krb-loan-application-content">
        <div className="krb-loan-header-section">
          <div className="krb-loan-logo-container">
            <img src={KRBLogo} alt="KRB Logo" className="krb-loan-logo" />
            <div className="krb-loan-sacco-name">Kenya Road Board Sacco</div>
          </div>
          <h1 className="krb-loan-page-title">Online Loan Application</h1>
        </div>

        <div className="krb-loan-search-filter-container">
          <div className="krb-loan-search-box">
            <input
              type="text"
              placeholder="Search by loan name or code..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              aria-label="Search loan products"
            />
          </div>
          <div className="krb-loan-filter-options">
            <select
              value={filterTerm}
              onChange={(e) => setFilterTerm(e.target.value)}
              aria-label="Filter loan products"
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
          <div className="krb-loan-loading-state">
            <div className="krb-loan-spinner"></div>
            <p>Loading loan products...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="krb-loan-no-results">
            <img src="/img/no-results.svg" alt="No results" />
            <p>No loan products found matching your criteria</p>
            {(searchTerm || filterTerm !== "all") && (
              <button
                onClick={() => {
                  setSearchTerm("");
                  setFilterTerm("all");
                }}
                className="krb-loan-clear-filters"
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <div
            className={`krb-loan-products-grid ${
              isMobile ? "krb-loan-mobile-view" : "krb-loan-desktop-view"
            }`}
          >
            {filteredProducts.map((loan) => (
              <div
                key={loan.loan_code}
                className={`krb-loan-product-card ${
                  expandedLoan === loan.loan_code ? "krb-loan-expanded" : ""
                }`}
              >
                <div
                  className="krb-loan-product-header"
                  onClick={() => toggleLoanDetails(loan.loan_code)}
                >
                  <div className="krb-loan-product-title">
                    {loan.product_description}
                  </div>
                  <div className="krb-loan-product-code">{loan.loan_code}</div>
                  <div className="krb-loan-expand-icon">
                    {expandedLoan === loan.loan_code ? "−" : "+"}
                  </div>
                </div>
                <div className="krb-loan-product-details">
                  <div className="krb-loan-detail-row">
                    <span className="krb-loan-detail-label">Amount Range:</span>
                    <span className="krb-loan-detail-value">
                      Ksh 0 - Ksh {loan.maxAmount.toLocaleString()}
                    </span>
                  </div>
                  <div className="krb-loan-detail-row">
                    <span className="krb-loan-detail-label">Interest Rate:</span>
                    <span className="krb-loan-detail-value">
                      {loan.interestRate}%
                    </span>
                  </div>
                  <div className="krb-loan-detail-row">
                    <span className="krb-loan-detail-label">Max Period:</span>
                    <span className="krb-loan-detail-value">
                      {loan.maxInstallments} months
                    </span>
                  </div>
                  <div className="krb-loan-detail-row">
                    <span className="krb-loan-detail-label">Repayment Type:</span>
                    <span className="krb-loan-detail-value">
                      {loan.repayment_type}
                    </span>
                  </div>
                  <div className="krb-loan-detail-row">
                    <span className="krb-loan-detail-label">Frequency:</span>
                    <span className="krb-loan-detail-value">
                      {loan.repayment_frequency}
                    </span>
                  </div>
                  <button
                    onClick={() => handleApplyClick(loan)}
                    className="krb-loan-apply-btn"
                  >
                    Apply Now
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {isModalOpen && selectedLoan && (
        <div className="krb-loan-modal-backdrop">
          <div className="krb-loan-modal-content">
            <div className="krb-loan-modal-header">
              <h2>Apply for {selectedLoan.product_description}</h2>
              <button
                className="krb-loan-modal-close"
                onClick={closeModal}
                aria-label="Close modal"
              >
                &times;
              </button>
            </div>
            <div className="krb-loan-modal-body">
              <form onSubmit={handleSubmit}>
                <div className="krb-loan-form-group">
                  <label>Member Number</label>
                  <input
                    type="text"
                    value={memberNo}
                    readOnly
                    className="krb-loan-form-control"
                  />
                </div>

                <div className="krb-loan-form-group">
                  <label>Loan Type</label>
                  <input
                    type="text"
                    value={`${selectedLoan.loan_code} - ${selectedLoan.product_description}`}
                    readOnly
                    className="krb-loan-form-control"
                  />
                </div>

                <div className="krb-loan-form-group">
                  <label>
                    Loan Amount (KES) - Range: Ksh 0 to{" "}
                    {selectedLoan.maxAmount.toLocaleString()}
                  </label>
                  <input
                    type="number"
                    placeholder={`Enter amount between 0 and ${selectedLoan.maxAmount.toLocaleString()}`}
                    value={loanAmount}
                    onChange={(e) => setLoanAmount(e.target.value)}
                    min="0"
                    max={selectedLoan.maxAmount}
                    required
                    className="krb-loan-form-control"
                  />
                </div>

                <div className="krb-loan-form-group">
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
                    className="krb-loan-form-control"
                  />
                </div>

                <div className="krb-loan-form-group">
                  <label>Purpose of Loan</label>
                  <textarea
                    placeholder="Briefly explain why you need this loan..."
                    value={loanPurpose}
                    onChange={(e) => setLoanPurpose(e.target.value)}
                    required
                    className="krb-loan-form-control"
                    rows="4"
                  ></textarea>
                </div>

                <div className="krb-loan-form-group">
                  <label>Interest Rate</label>
                  <input
                    type="text"
                    value={`${selectedLoan.interestRate}%`}
                    readOnly
                    className="krb-loan-form-control"
                  />
                </div>

                {submitStatus.message && (
                  <div
                    className={`krb-loan-form-message ${
                      submitStatus.isError
                        ? "krb-loan-error"
                        : "krb-loan-success"
                    }`}
                  >
                    {submitStatus.message}
                  </div>
                )}

                <div className="krb-loan-form-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    className="krb-loan-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button type="submit" className="krb-loan-btn-primary">
                    Submit Application
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnlineLoanApplication;