import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import KrbsacoLoader from "./KrbsacoLoader";
import KRBLogo from "../img/KRBLogo.png";
import { FaCheck, FaTimes, FaSearch, FaFilter } from "react-icons/fa";
import { authorizedFetch } from "../js/authorizedFetch";
import "../css/Gurantorship.css";

function Guarantorship() {
  const [requests, setRequests] = useState([]);
  const [filteredResults, setFilteredResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentLoanNo, setCurrentLoanNo] = useState(null);
  const [isSelfGuarantee, setIsSelfGuarantee] = useState(false);
  const [pledgedAmount, setPledgedAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const processingRequest = useRef(false);
  const needsAmount = currentAction === "approve" && !isSelfGuarantee;

  useEffect(() => {
    fetchGuarantorRequests();
  }, []);

  useEffect(() => {
    filterRequests();
  }, [searchTerm, filterStatus, requests]);

  const filterRequests = () => {
    let results = requests;
    
    if (searchTerm) {
      results = results.filter(request =>
        request.ApplicantName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.LoanApplicationNo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== "all") {
      results = results.filter(request => {
        const requestStatus = String(request.Status || "").toLowerCase();
        const filterStatusLower = filterStatus.toLowerCase();
        
        // Handle different possible status values
        if (filterStatusLower === "pending") {
          // Pending status: empty, "pending", or any value not 0 or 1
          return requestStatus === "pending" || 
                 requestStatus === "" || 
                 !requestStatus || 
                 (requestStatus !== "0" && 
                  requestStatus !== "1" && 
                  requestStatus !== "approved" && 
                  requestStatus !== "rejected");
        } else if (filterStatusLower === "approved") {
          // Approved status: "0" or "approved"
          return requestStatus === "0" || requestStatus === "approved";
        } else if (filterStatusLower === "rejected") {
          // Rejected status: "1" or "rejected"
          return requestStatus === "1" || requestStatus === "rejected";
        }
        return true;
      });
    }
    
    setFilteredResults(results);
  };

  const fetchGuarantorRequests = async ({ showLoader = true } = {}) => {
    try {
      if (showLoader) setLoading(true);
      const memberNo = sessionStorage.getItem("memberNo");
      if (!memberNo) {
        toast.error("Member number not found. Please log in again.");
        return;
      }

      const response = await authorizedFetch(
        `/api/loans-for-guarantee/?member=${memberNo}`,
        { method: "GET" }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch guarantorship requests");
      }

      const data = await response.json();
      if (data.count === 0 || !Array.isArray(data.loans)) {
        setRequests([]);
        toast.info("No guarantorship requests found");
      } else {
        const formattedRequests = data.loans.map(request => ({
          ...request,
          Status: request.Status || "pending"
        }));
        setRequests(formattedRequests);
      }
    } catch (error) {
      toast.error(error.message || "Failed to load requests");
      console.error("Fetch error:", error);
    } finally {
      if (showLoader) setLoading(false);
    }
  };

  const handleActionClick = (request, isApproved) => {
    setCurrentLoanNo(request.LoanApplicationNo);
    setIsSelfGuarantee(String(request.ApplicantNo).toUpperCase() === sessionStorage.getItem("memberNo")?.toUpperCase());
    const requestedAmount = Number(String(request.Amount ?? "").replace(/,/g, ""));
    setPledgedAmount(Number.isFinite(requestedAmount) && requestedAmount > 0
      ? requestedAmount.toFixed(2)
      : "");
    setCurrentAction(isApproved ? "approve" : "reject");
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    if (processingRequest.current) return;

    const isApproved = currentAction === "approve";
    const memberNo = sessionStorage.getItem("memberNo");
    if (!memberNo) {
      toast.error("Session expired. Please log in again.");
      return;
    }

    if (needsAmount && (!/^\d+(\.\d{1,2})?$/.test(pledgedAmount) || Number(pledgedAmount) <= 0)) {
      toast.error("Enter a positive guarantee amount with up to two decimal places.");
      return;
    }

    processingRequest.current = true;
    setIsProcessing(true);
    try {
      // 0 = Approve, 1 = Reject (as per SOAP service requirement)
      const response = await authorizedFetch(`/api/approve-guarantorship/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberNo: memberNo,
          loanNo: currentLoanNo,
          approvedStatus: isApproved ? 0 : 1,
          ...(needsAmount ? { amount: pledgedAmount } : {}),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || "Failed to process request");
      }

      if (data.success) {
        toast.success(
          data.message || `Guarantorship ${isApproved ? "approved" : "rejected"} successfully`
        );
      } else {
        toast.error(
          data.message || `Failed to ${currentAction} guarantorship request`
        );
      }
      
      await fetchGuarantorRequests({ showLoader: false });
    } catch (error) {
      toast.error(
        error.message || "An unexpected error occurred"
      );
      console.error("Action error:", error);
    } finally {
      setShowConfirmDialog(false);
      processingRequest.current = false;
      setIsProcessing(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      "0": { text: "Approved", className: "status-approved" },
      "approved": { text: "Approved", className: "status-approved" },
      "1": { text: "Rejected", className: "status-rejected" },
      "rejected": { text: "Rejected", className: "status-rejected" },
      "pending": { text: "Pending", className: "status-pending" },
      "": { text: "Pending", className: "status-pending" },
    };
    
    // Convert status to string and lowercase for comparison
    const statusStr = String(status || "").toLowerCase();
    
    // Find the matching status
    const statusInfo = statusMap[statusStr] || statusMap.pending;
    
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
  };

  // Helper function to format amount with proper number parsing
  const formatAmount = (amount) => {
    if (!amount) return "0";
    
    // Remove any commas and convert to string if needed
    const cleanAmount = String(amount).replace(/,/g, '');
    
    // Parse as float and format with commas
    const numericAmount = parseFloat(cleanAmount);
    
    // Check if it's a valid number
    if (isNaN(numericAmount)) {
      return amount; // Return original if not a number
    }
    
    return numericAmount.toLocaleString('en-US', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    });
  };

  // Helper function to check if a request can be approved/rejected
  const canPerformAction = (request) => {
    const status = String(request.Status || "").toLowerCase();
    // Can only act on pending requests
    return status === "pending" || status === "" || !status || 
           (status !== "0" && status !== "1" && 
            status !== "approved" && status !== "rejected");
  };

  if (loading) return <KrbsacoLoader />;

  return (
    <div className="guarantorship-container">
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
      />
      
      <div className="krb-profile-header">
        <div className="krb-header-branding">
          <img src={KRBLogo} alt="KRB Sacco Logo" className="krb-logo" />
          <div className="krb-header-titles">
            <h1>KRB SACCO</h1>
            <p>Guarantorship Requests</p>
          </div>
        </div>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
          <FaSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search by name or loan number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            aria-label="Search guarantorship requests"
          />
        </div>
        <div className="filter-dropdown">
          <FaFilter className="filter-icon" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="all">All Statuses</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      {filteredResults.length === 0 ? (
        <div className="no-requests">
          <img src="/img/no-requests.svg" alt="No requests" />
          <p>No guarantorship requests found</p>
          {(searchTerm || filterStatus !== "all") && (
            <button
              onClick={() => {
                setSearchTerm("");
                setFilterStatus("all");
              }}
              className="clear-search"
            >
              Clear filters
            </button>
          )}
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Applicant Name</th>
                <th>Applicant Number</th>
                <th>Loan Number</th>
                <th>Loan Type</th>
                <th>Repayment Period</th>
                <th>Guarantee Requested</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredResults.map((request) => {
                const canAct = canPerformAction(request);
                return (
                  <tr key={`${request.LoanApplicationNo}-${request.ApplicantNo}`}>
                    <td data-label="Applicant Name">{request.ApplicantName}</td>
                    <td data-label="Applicant Number">{request.ApplicantNo}</td>
                    <td data-label="Loan Number">{request.LoanApplicationNo}</td>
                    <td data-label="Loan Type">{request.LoanTypeDescription}</td>
                    <td data-label="Repayment Period">{request.LoanRepaymentPeriod}</td>                  
                    <td data-label="Guarantee Requested">
                      {request.Amount == null || request.Amount === ""
                        ? "Unavailable"
                        : `Ksh ${formatAmount(request.Amount)}`}
                    </td>
                    <td data-label="Status">{getStatusBadge(request.Status)}</td>
                    <td data-label="Actions" className="action-buttons">
                      <button
                        onClick={() => handleActionClick(request, true)}
                        disabled={!canAct}
                        className={`accept-btn ${!canAct ? "disabled" : ""}`}
                        aria-label={`Approve request from ${request.ApplicantName}`}
                        title={!canAct ? "This request has already been processed" : "Approve request"}
                      >
                        <FaCheck /> <span className="action-text">Approve</span>
                      </button>
                      <button
                        onClick={() => handleActionClick(request, false)}
                        disabled={!canAct}
                        className={`reject-btn ${!canAct ? "disabled" : ""}`}
                        aria-label={`Reject request from ${request.ApplicantName}`}
                        title={!canAct ? "This request has already been processed" : "Reject request"}
                      >
                        <FaTimes /> <span className="action-text">Reject</span>
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {showConfirmDialog && (
        <div className="confirmation-dialog-overlay">
          <div className="confirmation-dialog">
            <h3>Confirm Action</h3>
            <p>
              Are you sure you want to {currentAction} this guarantorship request?
              <br />
              <small>This action cannot be undone.</small>
            </p>
            {needsAmount && (
              <label>
                Amount to guarantee (KES)
                <input type="number" min="0.01" step="0.01" value={pledgedAmount}
                  disabled={isProcessing}
                  onChange={(event) => setPledgedAmount(event.target.value)} />
              </label>
            )}
            <div className="dialog-buttons">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="cancel-btn"
                disabled={isProcessing}
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`confirm-btn ${currentAction}`}
                disabled={isProcessing}
              >
                {isProcessing && <span className="spinner-small" aria-hidden="true" />}
                <span aria-live="polite">
                  {currentAction === "approve"
                    ? (isProcessing ? "Approving…" : "Confirm Approve")
                    : (isProcessing ? "Rejecting…" : "Confirm Reject")}
                </span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Guarantorship;
