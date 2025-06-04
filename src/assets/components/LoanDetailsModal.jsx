import React, { useState, useEffect } from "react";
import "../css/LoanDetailsModal.css";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import OTPModal from "./OTPModal";
import axios from "axios";
import { authorizedFetch } from "../js/authorizedFetch";

function LoanDetailsModal({ loan, onClose }) {
  const [activeTab, setActiveTab] = useState("loan");
  const [showAddGuarantor, setShowAddGuarantor] = useState(false);
  const [isLoadingGuarantors, setIsLoadingGuarantors] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeMembers, setActiveMembers] = useState([]);
  const [filteredMembers, setFilteredMembers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const memberNo = sessionStorage.getItem("memberNo");
  const [editableLoan, setEditableLoan] = useState({
    amount: 0,
    installments: 0,
    productType: "",
  });
  const [guarantorDetails, setGuarantorDetails] = useState({
    name: "",
    memberNumber: "",
  });
  const [guarantors, setGuarantors] = useState([]);

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

  useEffect(() => {
    if (searchQuery) {
      const filtered = activeMembers.filter((member) =>
        member.MemberName.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredMembers(filtered);
    } else {
      setFilteredMembers([]);
    }
  }, [searchQuery, activeMembers]);

  const fetchActiveMembers = async () => {
    try {
      const response = await authorizedFetch(
        `/api/active-members/`,{
          method:'GET'
        }
      );
      if (!response.ok) throw new Error("Failed to fetch active members");

      const data = await response.json();
      if (data.status === "success" && data.active_members.OnlineGuarantors) {
        setActiveMembers(data.active_members.OnlineGuarantors);
      }
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
    const { name, value } = e.target;
    setGuarantorDetails((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSearchQuery(value);
  };

  const selectMember = (member) => {
    setGuarantorDetails({
      name: member.MemberName,
      memberNumber: member.MemberNo,
    });
    setSearchQuery(member.MemberName);
    setFilteredMembers([]);
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

  const addGuarantor = async () => {
    if (!guarantorDetails.memberNumber) {
      toast.error("Please select a member");
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        member_number: guarantorDetails.memberNumber,
        loan_number: loan.id,
      };

      const response = await authorizedFetch(
        `/api/request-guarantorship/`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (response.status !== 200) {
        toast.error(data.message || "Failed to send guarantor request");
        return;
      }

      toast.success(data.message || "Guarantor request sent successfully");

      setGuarantorDetails({ name: "", memberNumber: "" });
      setShowAddGuarantor(false);
      fetchGuarantors();
    } catch (error) {
      toast.error("An unexpected error occurred. Please try again.");
      console.error("Error sending guarantor request:", error);
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

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to remove guarantor: ${errorText}`);
      }

      toast.success("Guarantor removed successfully");

      setGuarantors((prev) =>
        prev.filter((g) => g.memberNumber !== memberNumber)
      );
    } catch (error) {
      toast.error(error.message);
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
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error("Failed to save changes");

      toast.success("Loan details updated successfully!");
    } catch (error) {
      toast.error(error.message);
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

      if (!response.ok) {
        toast.error(data.message || "Failed to submit loan");
        return;
      }
      toast.success(data.message || "Loan submitted successfully");

      setTimeout(() => {
        onclose();
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
          {["loan", "guarantors", "Submit Loan"].map((tab) => (
            <button
              key={tab}
              className={`loan-modal-tab ${activeTab === tab ? "active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "loan" ? "Loan Details" : tab}
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
                            <td data-label="Name">{g.name}</td>
                            <td data-label="Member No">{g.memberNumber}</td>
                            <td data-label="Amount">Ksh {g.amount}</td>
                            <td data-label="ID Number">
                              {g.IdNumber || "Null"}
                            </td>
                            <td data-label="Phone">{g.phone}</td>
                            <td data-label="Email">{g.email || "Null"}</td>
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

                  <div className="add-guarantor-section">
                    {showAddGuarantor ? (
                      <div className="guarantor-form">
                        <div className="member-search-container">
                          <input
                            type="text"
                            placeholder="Search member by name"
                            name="name"
                            value={searchQuery}
                            onChange={(e) => {
                              setSearchQuery(e.target.value);
                              setGuarantorDetails({
                                ...guarantorDetails,
                                name: e.target.value,
                              });
                            }}
                            className="guarantor-input"
                          />
                          {filteredMembers.length > 0 && (
                            <div className="member-dropdown">
                              {filteredMembers.map((member) => (
                                <div
                                  key={member.MemberNo}
                                  className="member-dropdown-item"
                                  onClick={() => selectMember(member)}
                                >
                                  {member.MemberName} ({member.MemberNo})
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        <input
                          type="hidden"
                          name="memberNumber"
                          value={guarantorDetails.memberNumber}
                        />
                        <div className="guarantor-actions">
                          <button
                            onClick={addGuarantor}
                            disabled={
                              isSubmitting || !guarantorDetails.memberNumber
                            }
                            className={`guarantor-submit-btn ${
                              isSubmitting ? "disabled" : ""
                            }`}
                          >
                            {isSubmitting ? "Submitting..." : "Add Guarantor"}
                          </button>
                          <button
                            onClick={() => {
                              setShowAddGuarantor(false);
                              setSearchQuery("");
                              setFilteredMembers([]);
                            }}
                            className="guarantor-cancel-btn"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
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
