import React, { useState, useEffect } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import KrbsacoLoader from "./KrbsacoLoader";
import KRBLogo from "../img/KRBLogo.png";
import { FaCheck, FaTimes, FaSearch, FaFilter } from "react-icons/fa";
import { authorizedFetch } from "../js/authorizedFetch";
import "../css/Gurantorship.css";

function Guarantorship() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [currentAction, setCurrentAction] = useState(null);
  const [currentLoanNo, setCurrentLoanNo] = useState(null);

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
        request.ApplicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        request.LoanApplicationNo.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    if (filterStatus !== "all") {
      results = results.filter(request =>
        request.Status.toLowerCase() === filterStatus.toLowerCase()
      );
    }
    
    setFilteredRequests(results);
  };

  const fetchGuarantorRequests = async () => {
    try {
      setLoading(true);
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
      setLoading(false);
    }
  };

  const handleActionClick = (loanNo, isApproved) => {
    setCurrentLoanNo(loanNo);
    setCurrentAction(isApproved ? "approve" : "reject");
    setShowConfirmDialog(true);
  };

  const handleConfirmAction = async () => {
    try {
      const isApproved = currentAction === "approve";
      const memberNo = sessionStorage.getItem("memberNo");
      if (!memberNo) {
        toast.error("Session expired. Please log in again.");
        return;
      }

      const response = await authorizedFetch(`/api/approve-guarantorship/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          memberNo: memberNo,
          loanNo: currentLoanNo,
          approvedStatus: isApproved ? 0 : 1, 
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process request");
      }

      toast.success(
        `Guarantorship ${isApproved ? "approved" : "rejected"} successfully`
      );
      
      await fetchGuarantorRequests();
    } catch (error) {
      toast.error(
        `Failed to ${currentAction} request: ${error.message || "An unexpected error occurred"}`
      );
      console.error("Action error:", error);
    } finally {
      setShowConfirmDialog(false);
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      approved: { text: "Approved", className: "status-approved" },
      rejected: { text: "Rejected", className: "status-rejected" },
      pending: { text: "Pending", className: "status-pending" }
    };
    
    const statusInfo = statusMap[status.toLowerCase()] || statusMap.pending;
    return (
      <span className={`status-badge ${statusInfo.className}`}>
        {statusInfo.text}
      </span>
    );
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
            <p>Member Profile</p>
          </div>
        </div>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
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

      {filteredRequests.length === 0 ? (
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
                <th>Amount</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={`${request.LoanApplicationNo}-${request.ApplicantNo}`}>
                  <td data-label="Applicant Name">{request.ApplicantName}</td>
                  <td data-label="Applicant Number">{request.ApplicantNo}</td>
                  <td data-label="Loan Number">{request.LoanApplicationNo}</td>
                  <td data-label="Loan Type">{request.LoanTypeDescription}</td>
                  <td data-label="Repayment Period">{request.LoanRepaymentPeriod}</td>                  
                  <td data-label="Amount">Ksh {request.LoanRequestedAmount}</td>
                  <td data-label="Status">{getStatusBadge(request.Status)}</td>
                  <td data-label="Actions" className="action-buttons">
                    <button
                      onClick={() => handleActionClick(request.LoanApplicationNo, true)}
                      disabled={request.Status.toLowerCase() === "approved"}
                      className={`accept-btn ${request.Status.toLowerCase() === "approved" ? "disabled" : ""}`}
                      aria-label={`Approve request from ${request.ApplicantName}`}
                    >
                      <FaCheck /> <span className="action-text">Approve</span>
                    </button>
                    <button
                      onClick={() => handleActionClick(request.LoanApplicationNo, false)}
                      disabled={request.Status.toLowerCase() !== "pending"}
                      className={`reject-btn ${request.Status.toLowerCase() !== "pending" ? "disabled" : ""}`}
                      aria-label={`Reject request from ${request.ApplicantName}`}
                    >
                      <FaTimes /> <span className="action-text">Reject</span>
                    </button>
                  </td>
                </tr>
              ))}
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
            </p>
            <div className="dialog-buttons">
              <button
                onClick={() => setShowConfirmDialog(false)}
                className="cancel-btn"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmAction}
                className={`confirm-btn ${currentAction}`}
              >
                {currentAction === "approve" ? "Confirm Approve" : "Confirm Reject"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default Guarantorship;