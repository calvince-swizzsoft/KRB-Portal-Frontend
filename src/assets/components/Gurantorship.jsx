import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import KRBLogo from "../img/KRBLogo.png";
import "../css/Gurantorship.css";

function Guarantorship() {
  const [requests, setRequests] = useState([]);
  const [filteredRequests, setFilteredRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchGuarantorRequests();
  }, []);

  useEffect(() => {
    const results = requests.filter(
      (request) =>
        request.ApplicantName.toLowerCase().includes(
          searchTerm.toLowerCase()
        ) ||
        request.LoanApplicationNo.toLowerCase().includes(
          searchTerm.toLowerCase()
        )
    );
    setFilteredRequests(results);
  }, [searchTerm, requests]);

  const fetchGuarantorRequests = async () => {
    try {
      const memberNo = localStorage.getItem("memberNo");
      if (!memberNo) {
        throw new Error("Member number not found");
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/loans-for-guarantee/?member=${memberNo}`
      );

      const data = await response.json();

      if (data.StatusCode === "400" && data.StatusDescription === "NoLoans") {
        setRequests([]);
        setFilteredRequests([]);
        toast.info("No pending guarantorship requests found");
      } else if (data.StatusCode === "200") {
        setRequests(data.OnlineRequests);
        setFilteredRequests(data.OnlineRequests);
      } else {
        throw new Error(data.StatusDescription || "Failed to fetch requests");
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleGuarantorshipResponse = async (loanNo, isApproved) => {
    try {
      const memberNo = localStorage.getItem("memberNo");
      if (!memberNo) {
        throw new Error("Member number not found");
      }

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/approve-guarantorship/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberNo: memberNo,
            loanNo: loanNo,
            approvedStatus: isApproved ? 0 : 1, // 0 for approve, 1 for reject
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to process request");
      }

      toast.success(
        `Request ${isApproved ? "approved" : "rejected"} successfully`
      );
      fetchGuarantorRequests(); // Refresh the list
    } catch (error) {
      toast.error(error.message);
    }
  };

  return (
    <div className="guarantorship-container">
      <div className="header-section">
        <div className="logo-container">
          <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
          <div className="sacco-name">Kenya Road Board Sacco</div>
        </div>
        <h1 className="page-title">Guarantorship Requests</h1>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by name or loan number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-options">
          <select>
            <option value="all">All Requests</option>
            <option value="pending">Pending</option>
            <option value="recent">Recent</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading requests...</p>
        </div>
      ) : filteredRequests.length === 0 ? (
        <div className="no-requests">
          <img src="/img/no-requests.svg" alt="No requests" />
          <p>No guarantorship requests found</p>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="clear-search">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="requests-table-container">
          <table className="requests-table">
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Applicant Name</th>
                <th>Amount</th>
                <th>Applicant No</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredRequests.map((request) => (
                <tr key={request.EntryNo} className="request-row">
                  <td>{request.LoanApplicationNo}</td>
                  <td>{request.ApplicantName}</td>
                  <td>Ksh {request.Amount}</td>
                  <td>{request.ApplicantNo}</td>
                  <td>
                    <span className="status-pending">Pending</span>
                  </td>
                  <td className="action-buttons">
                    <button
                      onClick={() =>
                        handleGuarantorshipResponse(
                          request.LoanApplicationNo,
                          true
                        )
                      }
                      className="accept-btn"
                    >
                      <i className="icon-check"></i> Approve
                    </button>
                    <button
                      onClick={() =>
                        handleGuarantorshipResponse(
                          request.LoanApplicationNo,
                          false
                        )
                      }
                      className="reject-btn"
                    >
                      <i className="icon-cancel"></i> Reject
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default Guarantorship;
