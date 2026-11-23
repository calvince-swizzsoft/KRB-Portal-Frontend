import React, { useState, useEffect } from "react";
import "../css/LoanDetailsModal.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OTPModal from "./OTPModal";
import axios from "axios";
import { authorizedFetch } from "../js/authorizedFetch";

const asLoanAmount = (value) => Number(String(value ?? "").replaceAll(",", "")) || 0;
const formatLoanAmount = new Intl.NumberFormat("en-KE", {
  style: "currency",
  currency: "KES",
  minimumFractionDigits: 2,
}).format;

function LoanDetailsModal({ loan, onClose }) {
  const [activeTab, setActiveTab] = useState("loan");
  const [showAddGuarantor, setShowAddGuarantor] = useState(false);
  const [isLoadingGuarantors, setIsLoadingGuarantors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMembers, setActiveMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const memberNo = sessionStorage.getItem("memberNo");
  const [editableLoan, setEditableLoan] = useState({
    amount: 0,
    installments: 0,
    productType: "",
  });
  const [selectedMemberNumber, setSelectedMemberNumber] = useState("");
  const memberQuery = searchQuery.trim().toLowerCase();
  const filteredMembers = memberQuery && !selectedMemberNumber
    ? activeMembers.filter((member) =>
      member.MemberName?.toLowerCase().includes(memberQuery) ||
      String(member.MemberNo ?? "").toLowerCase().includes(memberQuery)
    )
    : [];
  const [guarantors, setGuarantors] = useState([]);
  const [eligibleProduct, setEligibleProduct] = useState(null);
  const [selfAmount, setSelfAmount] = useState("");
  const [selfLimit, setSelfLimit] = useState(null);
  const [selfError, setSelfError] = useState("");
  const [savedSelfAmount, setSavedSelfAmount] = useState(null);
  const selfGuarantee = guarantors.find((guarantor) => guarantor.selfGuarantee);
  const allowsSelfGuarantee = Boolean(loan?.productType && eligibleProduct === loan.productType);
  const committedAmount = selfGuarantee
    ? asLoanAmount(selfGuarantee.amount)
    : savedSelfAmount?.loanId === loan?.id ? savedSelfAmount.amount : null;
  const limit = selfLimit?.loanId === loan?.id ? selfLimit.amount : null;
  const selectedAmount = Number(selfAmount);
  const validAmount = /^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(selfAmount) &&
    selectedAmount > 0 && limit !== null && selectedAmount <= limit;
  const remainingAfterSelf = Math.max(0, asLoanAmount(loan?.amount) - (committedAmount ?? selectedAmount));

  useEffect(() => {
    if (!loan?.productType) return;
    const controller = new AbortController();
    const checkEligibility = async () => {
      try {
        const query = new URLSearchParams({ loan_type: loan.productType });
        const response = await authorizedFetch(`/api/self-guarantee-eligibility/?${query}`, {
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("Could not check self-guarantee eligibility.");
        const { allowed } = await response.json();
        if (!controller.signal.aborted) setEligibleProduct(allowed ? loan.productType : null);
      } catch (error) {
        if (!controller.signal.aborted) toast.error(error.message);
      }
    };
    checkEligibility();
    return () => controller.abort();
  }, [loan?.productType]);

  useEffect(() => {
    if (activeTab !== "self-guarantee" || !loan?.id || committedAmount !== null) return;
    const controller = new AbortController();
    setSelfLimit(null);
    setSelfError("");

    async function loadLimit() {
      try {
        const query = new URLSearchParams({ loan_number: loan.id });
        const response = await authorizedFetch(`/api/self-guarantee-eligibility/?${query}`, {
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || "Could not load your self-guarantee limit.");
        const maximum = Number(data.max_amount);
        if (!Number.isFinite(maximum) || maximum < 0) throw new Error("Self-guarantee limit is unavailable.");
        if (!controller.signal.aborted) setSelfLimit({ loanId: loan.id, amount: maximum });
      } catch (error) {
        if (!controller.signal.aborted) setSelfError(error.message);
      }
    }

    loadLimit();
    return () => controller.abort();
  }, [activeTab, committedAmount, loan?.id]);

  useEffect(() => {
    if (loan) {
      setEditableLoan({
        amount: loan.amount,
        installments: loan.installments,
        productType: loan.productType,
      });
      fetchGuarantors();
    }
  }, [loan]);

  useEffect(() => {
    if (showAddGuarantor) {
      fetchActiveMembers();
    }
  }, [showAddGuarantor]);

  const fetchActiveMembers = async () => {
    try {
      const response = await authorizedFetch(
        `/api/active-members/`,{
          method:'GET'
        }
      );
      if (!response.ok) throw new Error("Failed to fetch active members");

      const data = await response.json();
      const members = data.active_members?.OnlineGuarantors;
      if (data.status !== "success" || !Array.isArray(members)) {
        throw new Error("Failed to fetch active members");
      }
      setActiveMembers(members);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleLoanChange = (e) => {
    const { name, value } = e.target;
    setEditableLoan((prev) => ({
      ...prev,
      [name]: name === "amount" ? parseFloat(value) || 0 : parseInt(value) || 0,
    }));
  };

  const handleGuarantorChange = (e) => {
    const { value } = e.target;
    setSelectedMemberNumber("");
    setSearchQuery(value);
  };

  const selectMember = (member) => {
    setSelectedMemberNumber(member.MemberNo);
    setSearchQuery(member.MemberName);
  };

  const fetchGuarantors = async () => {
    setIsLoadingGuarantors(true);
    try {
      const memberNo = sessionStorage.getItem("memberNo");
      const response = await authorizedFetch(
        `/api/get-loan-guarantors/?loan_no=${loan.id}&member_number=${memberNo}`,{
          method: 'GET'
        }
      );
      if (!response.ok) throw new Error("Failed to fetch guarantors");

      const data = await response.json();
      const guarantorArray = data.guarantors;

      const transformedGuarantors = guarantorArray.map((g) => ({
        id: g.AccountNo,
        name: g.GuarantorName,
        memberNumber: g.AccountNo,
        amount: g.AmountGuaranteed,
        selfGuarantee: g.SelfGuarantee === true,
        status: g.ApprovalStatus,
        email: g.EmailAddress,
        phone: g.Telephone,
        idNumber: g.IdNumber,
      }));

      setGuarantors(transformedGuarantors);
    } catch (error) {
      toast.error(error.message);
    } finally {
      setIsLoadingGuarantors(false);
    }
  };

  const addGuarantor = async (self = false) => {
    if (isSubmitting) return;
    if (self && (!validAmount || committedAmount !== null)) return;
    const guarantorNumber = self ? memberNo : selectedMemberNumber;
    if (!guarantorNumber) {
      toast.error("Please select a member");
      return;
    }

    setIsSubmitting(true);
    if (self) setSelfError("");
    try {
      const payload = {
        member_number: guarantorNumber,
        loan_number: loan.id,
      };
      if (self) payload.self_guarantee_amount = selfAmount;

      const response = await authorizedFetch(`/api/request-guarantorship/`, {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const data = await response.json();

      const status = String(data.status ?? "").toLowerCase();
      const isError =
        !response.ok ||
        data.success === false ||
        ["error", "failed", "failure"].includes(status) ||
        Boolean(data.error) ||
        (data.success !== true && status !== "success" &&
          /\b(error|failed|invalid|already)\b/i.test(data.message ?? ""));

      if (isError) {
        const errorMessage = data.message || data.error || "Failed to send guarantor request";
        if (self) setSelfError(errorMessage);
        else toast.error(errorMessage);
        return;
      }

      if (self) {
        setSavedSelfAmount({ loanId: loan.id, amount: selectedAmount });
        toast.success("Self-guarantee saved.");
      } else {
        toast.success(data.message || "Guarantor request sent successfully");
        setSelectedMemberNumber("");
        setSearchQuery("");
        setShowAddGuarantor(false);
      }
      fetchGuarantors();
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const removeGuarantor = async (memberNumber) => {
    try {
      const payload = {
        memberNumber: sessionStorage.getItem("memberNo"),
        loanNumber: loan.id,
        guarantorNumber: memberNumber,
      };

      const response = await authorizedFetch(
        `/api/remove-guarantor/`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      // Check for error dynamically
      const responseString = JSON.stringify(data).toLowerCase();
      const isError = 
        !response.ok ||
        responseString.includes('error') ||
        responseString.includes('failed') ||
        responseString.includes('invalid');

      if (isError) {
        const errorMessage = data.message || data.error || "Failed to remove guarantor";
        toast.error(errorMessage);
        return;
      }

      toast.success(data.message || "Guarantor removed successfully");

      if (memberNumber === memberNo) setSavedSelfAmount(null);
      setGuarantors((prev) =>
        prev.filter((g) => g.memberNumber !== memberNumber)
      );
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred");
    }
  };

  const handleSaveChanges = async () => {
    if (!editableLoan.amount || editableLoan.amount <= 0) {
      toast.error("Please enter a valid loan amount");
      return;
    }
    if (!editableLoan.installments || editableLoan.installments <= 0) {
      toast.error("Please enter a valid repayment period");
      return;
    }

    setIsSaving(true);

    try {
      const payload = {
        loanNumber: loan.id,
        memberNumber: sessionStorage.getItem("memberNo"),
        amountRequest: String(editableLoan.amount),
        loanType: editableLoan.productType,
        repaymentPeriod: editableLoan.installments,
      };

      const response = await authorizedFetch(
        `/api/edit-loan/`,
        {
          method: "POST",
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      // Check for error dynamically
      const responseString = JSON.stringify(data).toLowerCase();
      const isError = 
        !response.ok ||
        responseString.includes('error') ||
        responseString.includes('failed') ||
        responseString.includes('invalid');

      if (isError) {
        const errorMessage = data.message || data.errors || data.error || "Failed to save changes";
        toast.error(errorMessage);
        return;
      }

      toast.success(data.message || "Loan details updated successfully!");
    } catch (error) {
      toast.error(error.message || "An unexpected error occurred");
      console.error("Error saving changes:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const submitLoan = async () => {
    if (!memberNo || !loan?.id) {
      toast.error("Missing member or loan number");
      return;
    }

    try {
      const response = await authorizedFetch(
        `/api/submit-loan/`,
        {
          method: "POST",
          body: JSON.stringify({
            memberNumber: memberNo,
            loanNumber: loan.id,
          }),
        }
      );

      const data = await response.json();

      // Check for error dynamically
      const responseString = JSON.stringify(data).toLowerCase();
      const isError = 
        !response.ok ||
        data.error ||
        responseString.includes('error') ||
        responseString.includes('failed') ||
        responseString.includes('invalid') ||
        responseString.includes('already') ||
        responseString.includes('denied') ||
        responseString.includes('rejected');

      if (isError) {
        // Extract the most relevant error message dynamically
        let errorMessage = "Operation failed";
        
        if (data.error) {
          errorMessage = data.error;
        } else if (data.data && typeof data.data === 'string') {
          errorMessage = data.data;
        } else if (data.message) {
          errorMessage = data.message;
        } else if (data.errors) {
          errorMessage = data.errors;
        }
        
        toast.error(errorMessage);
        return;
      }

      // Success case
      const successMessage = data.message || "Loan submitted successfully";
      toast.success(successMessage);

      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (error) {
      toast.error("An unexpected error occurred while submitting the loan");
      console.error(error);
    }
  };

  if (!loan) return null;

  return (
    <div className="loan-modal-overlay">
      <ToastContainer />
      <div className="loan-modal-container">
        <div className="loan-modal-header">
          <h2>Loan Application: {loan.id}</h2>
          <button className="loan-modal-close" onClick={onClose}>
            &times;
          </button>
        </div>

        <div className="loan-modal-tabs">
          {["loan", ...(allowsSelfGuarantee || committedAmount !== null ? ["self-guarantee"] : []), "guarantors", "Submit Loan"].map((tab) => (
            <button
              key={tab}
              className={`loan-modal-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {{ loan: "Loan Details", "self-guarantee": "Self-guarantee", guarantors: "Guarantors" }[tab] || tab}
            </button>
          ))}
        </div>

        <div className="loan-modal-content">
          {activeTab === "loan" && (
            <div className="loan-details-section">
              <div className="loan-detail">
                <label>Loan ID</label>
                <div className="loan-value">{loan.id}</div>
              </div>
              <div className="loan-detail">
                <label>Loan Type</label>
                <div className="loan-value">{loan.productType}</div>
              </div>
              <div className="loan-detail">
                <label>Product Name</label>
                <div className="loan-value">{loan.productName}</div>
              </div>
              <div className="loan-detail editable">
                <label>Requested Amount (Ksh)</label>
                <input
                  type="number"
                  name="amount"
                  value={editableLoan.amount}
                  onChange={handleLoanChange}
                  min="1000"
                  step="1000"
                />
              </div>
              <div className="loan-detail">
                <label>Interest Rate</label>
                <div className="loan-value">{loan.interestRate}%</div>
              </div>
              <div className="loan-detail editable">
                <label>Repayment Period (months)</label>
                <input
                  type="number"
                  name="installments"
                  value={editableLoan.installments}
                  onChange={handleLoanChange}
                  min="1"
                  max="36"
                />
              </div>
              <div className="loan-modal-actions">
                <button
                  className="save-changes-btn"
                  onClick={handleSaveChanges}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          )}

          {activeTab === "self-guarantee" && (
            <section className="self-guarantee-panel" aria-labelledby="self-guarantee-heading">
              <h3 id="self-guarantee-heading">Use my own deposits</h3>
              {committedAmount === null ? (
                <>
                  <p>You can commit up to 90% of your free deposits, capped at the loan amount.</p>
                  {limit !== null && (
                    <p><strong>Maximum you can commit:</strong> {formatLoanAmount(limit)}</p>
                  )}
                  {limit === null && !selfError && <p role="status">Checking your available deposits…</p>}
                  {limit === 0 && <p>You have no free deposits available for this loan.</p>}
                  {limit > 0 && (
                    <form className="self-guarantee-form" onSubmit={(event) => {
                      event.preventDefault();
                      addGuarantor(true);
                    }}>
                      <label htmlFor="self-guarantee-amount">Amount to commit (KES)</label>
                      <input
                        id="self-guarantee-amount"
                        className="guarantor-input"
                        type="number"
                        inputMode="decimal"
                        min="0.01"
                        max={limit}
                        step="0.01"
                        value={selfAmount}
                        disabled={isSubmitting}
                        aria-invalid={selectedAmount > limit}
                        onChange={(event) => {
                          setSelfAmount(event.target.value);
                          setSelfError("");
                        }}
                      />
                      {selectedAmount > limit && (
                        <p className="self-guarantee-error" role="alert">
                          Enter {formatLoanAmount(limit)} or less. The 90% free-deposit limit applies.
                        </p>
                      )}
                      {validAmount && (
                        <p>Loan amount left for guarantors: <strong>{formatLoanAmount(remainingAfterSelf)}</strong></p>
                      )}
                      <button className="add-guarantor-btn" type="submit" disabled={!validAmount || isSubmitting}>
                        {isSubmitting ? "Saving…" : "Confirm self-guarantee"}
                      </button>
                    </form>
                  )}
                  {selfError && <p className="self-guarantee-error" role="alert">{selfError}</p>}
                </>
              ) : (
                <>
                  <p><strong>Committed from your deposits:</strong> {formatLoanAmount(committedAmount)}</p>
                  {remainingAfterSelf > 0 ? (
                    <>
                      <p>Guarantors need to cover <strong>{formatLoanAmount(remainingAfterSelf)}</strong> of this loan.</p>
                      <button type="button" className="add-guarantor-btn" onClick={() => setActiveTab("guarantors")}>
                        Go to Guarantors
                      </button>
                    </>
                  ) : <p>Your deposit commitment covers the full loan amount.</p>}
                </>
              )}
            </section>
          )}

          {activeTab === "guarantors" && (
            <div className="guarantors-section">
              {isLoadingGuarantors ? (
                <div className="loading-state">
                  <div className="spinner"></div>
                  <p>Loading guarantors...</p>
                </div>
              ) : (
                <>
                  <div className="guarantors-list-container">
                    <table>
                      <thead>
                        <tr>
                          <th>Name</th>
                          <th>Member No</th>
                          <th>Amount</th>
                          <th>ID Number</th>
                          <th>Phone Number</th>
                          <th>Email</th>
                          <th>Status</th>
                          <th>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {guarantors.map((g, index) => (
                          <tr key={g.id || index}>
                            <td data-label="Name">{g.selfGuarantee ? `${g.name} (Self-guarantee)` : g.name}</td>
                            <td data-label="Member No">{g.memberNumber}</td>
                            <td data-label="Amount">Ksh {g.amount}</td>
                            <td data-label="ID Number">
                              {g.idNumber || "—"}
                            </td>
                            <td data-label="Phone">{g.phone}</td>
                            <td data-label="Email">{g.email || "—"}</td>
                            <td data-label="Status">
                              <span data-status={g.status}>{g.status}</span>
                            </td>
                            <td>
                              <button
                                className="remove-btn"
                                onClick={() => removeGuarantor(g.memberNumber)}
                                disabled={g.status === "Approved"}
                              >
                                Remove
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {selfGuarantee && (() => {
                    const approvedCover = guarantors.reduce((total, guarantor) => {
                      if (!["yes", "true", "approved"].includes(String(guarantor.status).toLowerCase())) return total;
                      return total + asLoanAmount(guarantor.amount);
                    }, 0);
                    const remaining = asLoanAmount(loan.amount) - approvedCover;
                    return remaining > 0 && (
                      <p>Remaining approved cover needed: {formatLoanAmount(remaining)}</p>
                    );
                  })()}
                  <div className="add-guarantor-section">
                    {showAddGuarantor ? (
                      <div className="guarantor-form">
                        <div className="member-search-container">
                          <input
                            type="text"
                            placeholder="Search by name or member number"
                            name="name"
                            value={searchQuery}
                            onChange={handleGuarantorChange}
                            className="guarantor-input"
                          />
                          {filteredMembers.length > 0 && (
                            <div className="member-dropdown">
                              {filteredMembers.map((member) => (
                                <button
                                  type="button"
                                  key={member.MemberNo}
                                  className="member-dropdown-item"
                                  onClick={() => selectMember(member)}
                                >
                                  {member.MemberName} ({member.MemberNo})
                                </button>
                              ))}
                            </div>
                          )}
                        </div>
                        {!selectedMemberNumber && (
                          <p>Select a member from the search results to enable Add Guarantor.</p>
                        )}
                        <div className="guarantor-actions">
                          <button
                            type="button"
                            onClick={() => addGuarantor()}
                            disabled={isSubmitting || !selectedMemberNumber}
                            className={`guarantor-submit-btn ${
                              isSubmitting ? "disabled" : ""
                            }`}
                          >
                            {isSubmitting ? "Submitting..." : "Add Guarantor"}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowAddGuarantor(false);
                              setSearchQuery("");
                              setSelectedMemberNumber("");
                            }}
                            className="guarantor-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setShowAddGuarantor(true)}
                        className="add-guarantor-btn"
                      >
                        + Add Guarantor
                      </button>
                    )}
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === "Submit Loan" && (
            <div className="submit-loan-container">
              <small>Submit Loan For Approval</small>
              <div className="loan-info-fields">
                <input
                  type="text"
                  value={memberNo}
                  readOnly
                  className="loan-info-input"
                />
                <input
                  type="text"
                  value={loan?.id}
                  readOnly
                  className="loan-info-input"
                />
              </div>

              <button onClick={submitLoan} className="submit-loan-btn">
                Submit Loan Application
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default LoanDetailsModal;
