import { Link } from "react-router-dom";
import React, { useState, useEffect } from "react";
import KRBLogo from "../img/KRBLogo.png";
import LoanDetailsModal from "./LoanDetailsModal.jsx";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/AppliedLoans.css";
import { authorizedFetch } from "../js/authorizedFetch.js";
import KrbsacoLoader from "./KrbsacoLoader";
import ConfirmModal from "./ConfirmModal";

function AppliedLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [loanToDelete, setLoanToDelete] = useState(null);

  const vite_baseurl = import.meta.env.VITE_BASE_URL;
  const memberNo = sessionStorage.getItem("memberNo");

  useEffect(() => {
    const fetchLoans = async () => {
      try {
        const response = await authorizedFetch(
          `/api/applied-loans/?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );
        if (!response.ok) throw new Error("Failed to fetch");

        const data = await response.json();

        const mappedLoans = data.loans
          .filter((item) => item.LoanApplicationStatus !== "Deleted")
          .map((item) => ({
            id: item.LoanNo,
            productType: item.ProductType,
            productName: item.ProductName || "N/A",
            amount: Number(item.RequestedAmount.replace(/,/g, "")),
            interestRate: parseFloat(item.InterestRate),
            installments: parseInt(item.Installments),
            interestMethod:
              item.InterestCalculationMethod === "0"
                ? "Flat Rate"
                : "Reducing Balance",
            status: item.LoanApplicationStatus,
            applicationDate: item.ApplicationDate || "N/A",
          }));
        console.log(mappedLoans);

        setLoans(mappedLoans);
      } catch (error) {
        toast.error("Failed to load loan applications");
      } finally {
        setLoading(false);
      }
    };

    if (memberNo) {
      fetchLoans();
    } else {
      toast.error("Member number not found. Please log in again.");
      setLoading(false);
    }
  }, [vite_baseurl, memberNo]);

  const confirmDeleteLoan = (loanId) => {
    setLoanToDelete(loanId);
    setShowConfirmModal(true);
  };

  const handleDeleteConfirmed = async () => {
    try {
      const payload = {
        memberNumber: memberNo,
        loanNumber: loanToDelete,
      };

      const response = await authorizedFetch(`/api/delete-loan/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const text = await response.text();
      const errorData = text ? JSON.parse(text) : {};

      if (!response.ok) {
        console.error("Delete Loan Error:", errorData);
        throw new Error(errorData.message || "Failed to delete loan");
      }

      // Remove loan from UI
      setLoans((prev) => prev.filter((loan) => loan.id !== loanToDelete));
      toast.success(`Loan ${loanToDelete} deleted successfully`);
    } catch (err) {
      toast.error(err.message || "Error deleting loan");
    } finally {
      setShowConfirmModal(false);
      setLoanToDelete(null);
    }
  };

  const handleViewDetails = (loan) => {
    setSelectedLoan(loan);
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setSelectedLoan(null);
  };

  const getStatusBadge = (status) => {
    const statusClasses = {
      Pending: "status-pending",
      "Awaiting Approval": "status-pending",
      Approved: "status-approved",
      Rejected: "status-rejected",
    };
    return (
      <span className={`status-badge ${statusClasses[status] || ""}`}>
        {status}
      </span>
    );
  };

  // ✅ Show loading page first
  if (loading) return <KrbsacoLoader />;

  return (
    <div className="applied-loans-container">
      <ToastContainer position="top-right" autoClose={5000} />

      <div className="header-section">
        <div className="logo-container">
          <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
          <div className="sacco-name">Kenya Road Board Sacco</div>
        </div>
        <h1 className="page-title">Applied Loans</h1>
      </div>

      <div className="header-content">
        <Link to="/Home/loan-application" className="new-loan-btn">
          <i className="fas fa-plus"></i> Apply for New Loan
        </Link>
      </div>

      <div className="notification">
        <small>
          We’ve received your loan application. Please click 'View' to proceed
          with finalizing the process.
        </small>
      </div>

      <main className="loans-content">
        {loans.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-file-invoice-dollar empty-icon"></i>
            <h3>No Loan Applications Found</h3>
            <p>You haven't applied for any loans yet.</p>
            <Link
              to="/dashboard/Loans/OnlineLoanApplication"
              className="empty-state-btn"
            >
              Apply for your first loan
            </Link>
          </div>
        ) : (
          <div className="loans-table-container">
            <div className="responsive-table">
              <table className="loans-table">
                <thead>
                  <tr>
                    <th>Loan ID</th>
                    <th>Product</th>
                    <th>Amount</th>
                    <th>Interest Rate</th>
                    <th>Installments</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loans.map((loan, index) => (
                    <tr key={index}>
                      <td data-label="Loan ID">{loan.id}</td>
                      <td data-label="Product">
                        <div className="product-info">
                          <span className="product-type">
                            {loan.productType}
                          </span>
                          <span className="product-name">
                            {loan.productName}
                          </span>
                        </div>
                      </td>
                      <td data-label="Amount">
                        Ksh {loan.amount.toLocaleString()}
                      </td>
                      <td data-label="Interest Rate">{loan.interestRate}%</td>
                      <td data-label="Installments">{loan.installments}</td>
                      <td data-label="Status">{getStatusBadge(loan.status)}</td>
                      <td data-label="Actions" className="actions-cell">
                        <button
                          className="view-btn"
                          onClick={() => handleViewDetails(loan)}
                        >
                          <i className="fas fa-eye"></i> View
                        </button>
                        <button
                          className="delete-btn"
                          onClick={() => confirmDeleteLoan(loan.id)}
                        >
                          <i className="fas fa-trash"></i> Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {showModal && selectedLoan && (
        <LoanDetailsModal loan={selectedLoan} onClose={closeModal} />
      )}
      {showConfirmModal && (
        <ConfirmModal
          title="Delete Loan Application"
          message={`Are you sure you want to delete loan ${loanToDelete}?`}
          onConfirm={handleDeleteConfirmed}
          onCancel={() => {
            setShowConfirmModal(false);
            setLoanToDelete(null);
          }}
        />
      )}
    </div>
  );
}

export default AppliedLoans;
