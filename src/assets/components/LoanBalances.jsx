import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import KRBLogo from "../img/KRBLogo.png";
import "../css/LoanBalances.css";

function LoanBalances() {
  const [loans, setLoans] = useState([]);
  const [filteredLoans, setFilteredLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    fetchLoanBalances();
  }, []);

  useEffect(() => {
    const results = loans.filter(
      (loan) =>
        loan.LoanProductType.toLowerCase().includes(searchTerm.toLowerCase()) ||
        loan.LoanNo.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredLoans(results);
  }, [searchTerm, loans]);

  const fetchLoanBalances = async () => {
    try {
      const memberNo = sessionStorage.getItem("memberNo");
      if (!memberNo) {
        throw new Error("Member number not found");
      }

      const response = await fetch(
        `${
          import.meta.env.VITE_API_BASE_URL
        }/api/member-running-loans/?member_no=${memberNo}`
      );

      const data = await response.json();

      if (data.StatusCode === "200") {
        setLoans(data.RunningLoans);
        setFilteredLoans(data.RunningLoans);
      } else {
        throw new Error(
          data.StatusDescription || "Failed to fetch loan balances"
        );
      }
    } catch (error) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="loan-balances-container">
      <div className="header-section">
        <div className="logo-container">
          <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
          <div className="sacco-name">Kenya Road Board Sacco</div>
        </div>
        <h1 className="page-title">My Loan Balances</h1>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by loan type or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <p>Loading loan balances...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="no-loans">
          <img src="/img/no-loans.svg" alt="No loans" />
          <p>No active loans found</p>
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="clear-search">
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="loan-table-wrapper">
          <table className="loan-table">
            <thead>
              <tr>
                <th>Loan Number</th>
                <th>Loan Type</th>
                <th>Status</th>
                <th>Loan Balance</th>
                <th>Requested Amount</th>
                <th>Installments</th>
                <th>Remaining Period</th>
                <th>Amount in Arrears</th>
              </tr>
            </thead>
            <tbody>
              {filteredLoans.map((loan) => (
                <tr key={loan.LoanNo}>
                  <td data-label="Loan Number">{loan.LoanNo}</td>
                  <td data-label="Loan Type">{loan.LoanProductType}</td>
                  <td data-label="Loan Status">
                    <span
                      className={`loan-status ${loan.LoanStatus.toLowerCase()}`}
                    >
                      {loan.LoanStatus}
                    </span>
                  </td>
                  <td data-label="Loan Balance">Ksh {loan.LoanBalance}</td>
                  <td data-label="Requested Amount">
                    Ksh {loan.RequestedAmount}
                  </td>
                  <td data-label="Installments">{loan.Installments} months</td>
                  <td data-label="Remaining Period">
                    {loan.RemainingPeriod} months
                  </td>
                  <td data-label="Amount in Arrears" className="arrears">
                    Ksh {loan.AmountArrears}
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

export default LoanBalances;
