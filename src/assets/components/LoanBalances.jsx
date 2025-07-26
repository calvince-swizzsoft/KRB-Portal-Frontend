import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import KRBLogo from "../img/KRBLogo.png";
import "../css/LoanBalances.css";
import KrbsacoLoader from "./KrbsacoLoader"; // ✅ Make sure it's imported
import { authorizedFetch } from "../js/authorizedFetch";

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

      const response = await authorizedFetch(
        `/api/member-running-loans/?member_no=${memberNo}`,
        {
          method: "GET",
        }
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

  if (loading) return <KrbsacoLoader />;

  return (
    <div className="loan-balances-container">
      <div className="krb-loan-header-section">
        <div className="krb-loan-logo-container">
          <img src={KRBLogo} alt="KRB Logo" className="krb-loan-logo" />
          <div className="krb-loan-sacco-name">Kenya Road Board Sacco</div>
        </div>
        <h1 className="krb-loan-page-title">Loan Balance</h1>
      </div>

      <div className="search-filter-container">
        <div className="search-box">
          <input
            type="text"
            placeholder="Search by loan type or number..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="modern-input"
          />
        </div>
      </div>

      {loading ? (
        <div className="loader-container">
          <p className="loading-text">Loading your loan balances...</p>
        </div>
      ) : filteredLoans.length === 0 ? (
        <div className="no-loans">
          <img
            src="/img/no-loans.svg"
            alt="No loans"
            className="no-loans-img"
          />
          <p className="no-loans-text">
            {searchTerm
              ? "No loans match your search"
              : "No active loans found"}
          </p>
          {searchTerm && (
            <button
              onClick={() => setSearchTerm("")}
              className="clear-search-btn"
            >
              Clear search
            </button>
          )}
        </div>
      ) : (
        <div className="loan-table-wrapper">
          <div className="table-responsive">
            <table className="modern-loan-table">
              <thead>
                <tr>
                  <th>Loan Number</th>
                  <th>Loan Type</th>
                  <th>Requested Amount</th>
                  <th>Installments</th>
                  <th>Status</th>
                  <th>Loan Balance</th>
                  <th>Remaining Period</th>
                  <th>Amount in Arrears</th>
                </tr>
              </thead>
              <tbody>
                {filteredLoans.map((loan) => (
                  <tr key={loan.LoanNo}>
                    <td data-label="Loan Number">
                      <span className="loan-number">{loan.LoanNo}</span>
                    </td>
                    <td data-label="Loan Type">{loan.LoanProductType}</td>
                    <td data-label="Requested Amount">
                      <span className="amount">Ksh {loan.RequestedAmount}</span>
                    </td>
                    <td data-label="Installments">
                      {loan.Installments} months
                    </td>
                    <td data-label="Loan Status">
                      <span
                        className={`loan-status-badge ${loan.LoanStatus.toLowerCase()}`}
                      >
                        {loan.LoanStatus}
                      </span>
                    </td>
                    <td data-label="Loan Balance">
                      <span className="amount">Ksh {loan.LoanBalance}</span>
                    </td>

                    <td data-label="Remaining Period">
                      {loan.RemainingPeriod} months
                    </td>
                    <td data-label="Amount in Arrears">
                      <span
                        className={`amount ${
                          loan.AmountArrears > 0 ? "arrears" : ""
                        }`}
                      >
                        Ksh {loan.AmountArrears}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            Showing {filteredLoans.length} of {loans.length} loans
          </div>
        </div>
      )}
    </div>
  );
}

export default LoanBalances;
