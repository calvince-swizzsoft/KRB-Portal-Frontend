import React, { useState, useEffect, useRef } from "react";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../css/OnlineLoanApplication.css";
import KRBLogo from "../img/KRBLogo.png";
import KrbsacoLoader from "./KrbsacoLoader";
import { useLocation, useNavigate } from "react-router-dom";
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
  const [disbursementMode, setDisbursementMode] = useState("");
  const [recoveryMode, setRecoveryMode] = useState("");
  const [accountOrMpesaNo, setAccountOrMpesaNo] = useState("");
  const [memberBank, setMemberBank] = useState("");
  const [submitStatus, setSubmitStatus] = useState({
    message: "",
    isError: false,
    isSuccess: false,
  });
  const [expandedLoan, setExpandedLoan] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingLoans, setExistingLoans] = useState([]);
  const [selectedRefinanceLoans, setSelectedRefinanceLoans] = useState([]);
  const [showRefinanceModal, setShowRefinanceModal] = useState(false);
  const [refinanceLoading, setRefinanceLoading] = useState(false);
  const [totalArrears, setTotalArrears] = useState(0);
  const profileReviewDialog = useRef(null);
  const pendingLoanCode = useRef(null);
  const navigate = useNavigate();
  const { pathname, state } = useLocation();
  
  // Use ref to track form submission
  const isSubmittingRef = useRef(false);

  const memberNo = sessionStorage.getItem("memberNo");

  const disbursementModes = [
    { value: 2, label: "Cash" },
    { value: 4, label: "Bank Transfer" },
    { value: 8, label: "Mobile Money" }
  ];

  const recoveryModes = [
    { value: 1, label: "Payroll Deduction" },
    { value: 2, label: "BOSA Receipt" },
    { value: 3, label: "Bank Deposit" }
  ];

  const bankOptions = [
    { value: "", label: "Select Bank" },
    { value: 1, label: "Kenya Commercial Bank (KCB)" },
    { value: 2, label: "Equity Bank" },
    { value: 3, label: "Co-operative Bank" },
    { value: 4, label: "Absa Bank Kenya" },
    { value: 5, label: "NCBA Bank" },
    { value: 6, label: "Standard Chartered Bank" },
    { value: 7, label: "Diamond Trust Bank (DTB)" },
    { value: 8, label: "Stanbic Bank" }
  ];

  const formatErrorMessage = (errorMessage) => {
    if (!errorMessage) return "An unexpected error occurred";
    
    const message = errorMessage.toString().toLowerCase();
    
    if (message.startsWith("failed: your loan") && message.includes("you are blocked from applying for instant loans")) {
      return errorMessage.replace(/^failed:\s*/i, '');
    }

    if (message.includes("arrears")) {
      const arrearsMatch = errorMessage.match(/([\d,]+\.?\d*) in arrears/i);
      const loanMatch = errorMessage.match(/([A-Z\s]+LOAN\s*\d*)/i);
      
      if (arrearsMatch && loanMatch) {
        return `You have Ksh ${arrearsMatch[1]} in arrears on ${loanMatch[1]}. Please clear your arrears before applying for a new loan.`;
      }
      return "You have outstanding loan arrears. Please clear your arrears before applying for a new loan.";
    }
    
    if (message.includes("client callback") || message.includes("business central")) {
      return "System temporarily unavailable. Please try again later or contact the Sacco office for assistance.";
    }
    
    if (message.includes("failed") && message.includes("guarantors")) {
      return "Your loan application requires guarantors. Please visit the Sacco office to complete your application.";
    }
    
    if (message.includes("insufficient shares")) {
      return "You do not have sufficient shares to qualify for this loan. Please build up your shares first.";
    }
    
    if (message.includes("exceeds maximum")) {
      return "The loan amount requested exceeds the maximum allowed for your account. Please reduce the amount.";
    }
    
    if (message.includes("active loan")) {
      return "You already have an active loan of this type. Please complete repayment before applying for another.";
    }
    
    if (message.includes("invalid product") || message.includes("product configuration")) {
      return "This loan product is currently unavailable. Please try another loan product.";
    }
    
    if (message.includes("required") || message.includes("missing")) {
      return "Please fill in all required fields correctly.";
    }
    
    if (message.includes("failed:")) {
      const cleanMessage = errorMessage.replace(/^failed:\s*/i, '');
      return cleanMessage.charAt(0).toUpperCase() + cleanMessage.slice(1);
    }
    
    if (message.includes("true") || message.includes("false")) {
      return "Loan application submitted successfully. Refinancing processed.";
    }
    
    if (message.length <= 10 && /^[A-Z0-9]+$/.test(message)) {
      return `Loan application submitted successfully. Loan Number: ${message}`;
    }
    
    return errorMessage.charAt(0).toUpperCase() + errorMessage.slice(1);
  };

  const formatSuccessMessage = (successMessage) => {
    if (!successMessage) return "Loan application submitted successfully!";
    
    const message = successMessage.toString().toLowerCase();
    
    if (message.includes("true") || message.includes("false")) {
      return "Loan application submitted successfully! Refinancing has been processed.";
    }
    
    if (message.length <= 10 && /^[A-Z0-9]+$/.test(message)) {
      return `Loan application submitted successfully! Loan Number: ${message}`;
    }
    
    if (message.includes("success") || message.includes("submitted") || message.includes("approved")) {
      return "Loan application submitted successfully! It will be processed within 24-48 hours.";
    }
    
    if (message.includes("pending") || message.includes("waiting")) {
      return "Loan application received and is pending approval. You will be notified once processed.";
    }
    
    if (message.includes("received")) {
      return "Loan application received successfully. Thank you for applying.";
    }
    
    return successMessage.charAt(0).toUpperCase() + successMessage.slice(1);
  };

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
        toast.error(formatErrorMessage(error.message));
      } finally {
        setLoading(false);
      }
    };

    fetchLoanProducts();
  }, []);

  useEffect(() => {
    if (loading || !state?.reviewedLoanCode) return;

    const loan = loanProducts.find(
      (product) => product.loan_code === state.reviewedLoanCode
    );
    if (loan) {
      setSelectedLoan(loan);
      setIsModalOpen(true);
    } else {
      toast.error("The selected loan is unavailable. Please choose a loan again.");
    }
    navigate(pathname, { replace: true, state: null });
  }, [loading, loanProducts, navigate, pathname, state]);

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

  // Enhanced parseNumber function
  const parseNumber = (value) => {
    if (value === null || value === undefined || value === '') {
      return 0;
    }
    
    // If it's already a number, return it
    if (typeof value === 'number') {
      return value;
    }
    
    // If it's a string
    if (typeof value === 'string') {
      // Log the original value for debugging
      console.log("parseNumber input:", value);
      
      // Remove all commas, spaces, currency symbols
      let cleanValue = value.replace(/,/g, '');
      cleanValue = cleanValue.replace(/\s/g, '');
      cleanValue = cleanValue.replace(/[^\d.-]/g, '');
      
      // Handle cases like "50,000" which might be parsed as "50000"
      // or "3,258,343.21" which should be "3258343.21"
      
      // Try to parse as float
      const num = parseFloat(cleanValue);
      
      // Debug logging
      console.log("parseNumber cleaned:", cleanValue, "parsed:", num);
      
      return isNaN(num) ? 0 : num;
    }
    
    // For any other type
    try {
      const num = parseFloat(value);
      return isNaN(num) ? 0 : num;
    } catch {
      return 0;
    }
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
    pendingLoanCode.current = loan.loan_code;
    profileReviewDialog.current.showModal();
  };

  const closeModal = () => {
    if (!isSubmittingRef.current) {
      setIsModalOpen(false);
      setShowRefinanceModal(false);
      setSelectedLoan(null);
      setLoanAmount("");
      setLoanPurpose("");
      setRepaymentPeriod("");
      setDisbursementMode("");
      setRecoveryMode("");
      setAccountOrMpesaNo("");
      setMemberBank("");
      setSelectedRefinanceLoans([]);
      setSubmitStatus({ message: "", isError: false, isSuccess: false });
    }
  };

  const validateInputs = () => {
    if (!selectedLoan) return false;

    const amount = parseFloat(loanAmount);
    const period = parseInt(repaymentPeriod);
    const disbursementModeNum = parseInt(disbursementMode);

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

    if (!disbursementMode) {
      toast.error("Please select disbursement mode");
      return false;
    }

    if (!recoveryMode) {
      toast.error("Please select recovery mode");
      return false;
    }

    // Validation based on disbursement mode
    if (disbursementModeNum === 4) { // Bank Transfer
      if (!memberBank) {
        toast.error("Please select your bank");
        return false;
      }
      if (!accountOrMpesaNo.trim()) {
        toast.error("Please enter your bank account number");
        return false;
      }
    } else if (disbursementModeNum === 8) { // Mobile Money
      if (!accountOrMpesaNo.trim()) {
        toast.error("Please enter your mobile money number");
        return false;
      }
      
      // Validate mobile number format
      const mpesaRegex = /^(\+254|0)[17]\d{8}$/;
      if (!mpesaRegex.test(accountOrMpesaNo)) {
        toast.error("Please enter a valid mobile number (e.g., 0712345678 or +254712345678)");
        return false;
      }
    }
    // For Cash (disbursementModeNum === 2), no additional validation needed

    return true;
  };

  const fetchExistingLoans = async () => {
    try {
      setRefinanceLoading(true);
      console.log("Fetching existing loans for member:", memberNo);
      
      const response = await authorizedFetch(`/api/existing-loans/?bosa_no=${memberNo}`, {
        method: "GET",
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("Existing loans error response:", errorText);
        throw new Error(`Failed to fetch existing loans: ${response.status}`);
      }

      const data = await response.json();
      console.log("Existing loans API response:", data);
      
      if (data.error) {
        toast.error(formatErrorMessage(data.error));
        return;
      }

      // Handle both array and object formats
      let loans = [];
      if (Array.isArray(data)) {
        loans = data;
      } else if (data.loans && Array.isArray(data.loans)) {
        loans = data.loans;
      } else if (typeof data === 'object') {
        // If it's a single object, convert to array
        loans = [data];
      }
      
      console.log("Raw loans data:", loans);
      
      // Process each loan to ensure numbers are parsed correctly
      const processedLoans = loans.map(loan => {
        const processedLoan = { ...loan };
        
        // Debug: log original values
        console.log("Processing loan:", loan.LoanNo, "Outstanding:", loan.Outstanding, "Type:", typeof loan.Outstanding);
        
        // Parse all numeric fields with enhanced parseNumber
        processedLoan.Outstanding = parseNumber(loan.Outstanding);
        processedLoan.ArrearsAmt = parseNumber(loan.ArrearsAmt);
        processedLoan.ArrearsDays = parseInt(loan.ArrearsDays) || 0;
        
        // Also check for ProductName (from SOAP response)
        if (!processedLoan.Product && loan.ProductName) {
          processedLoan.Product = loan.ProductName;
        }
        
        console.log("Processed loan:", processedLoan.LoanNo, "Outstanding:", processedLoan.Outstanding);
        
        return processedLoan;
      });
      
      // Remove duplicates based on LoanNo
      const uniqueLoans = [];
      const seenLoanNos = new Set();
      
      processedLoans.forEach(loan => {
        if (loan.LoanNo && !seenLoanNos.has(loan.LoanNo)) {
          seenLoanNos.add(loan.LoanNo);
          uniqueLoans.push(loan);
        }
      });
      
      console.log("Unique existing loans:", uniqueLoans);
      
      setExistingLoans(uniqueLoans);
      
      // Calculate total arrears
      const total = uniqueLoans.reduce((sum, loan) => {
        const arrears = loan.ArrearsAmt || 0;
        return sum + arrears;
      }, 0);
      setTotalArrears(total);
      
      console.log(`Total unique loans: ${uniqueLoans.length}, Total arrears: ${total}`);
      
    } catch (error) {
      console.error("Error fetching existing loans:", error);
      toast.error("Could not load existing loans. Please try again.");
    } finally {
      setRefinanceLoading(false);
    }
  };

  const handleRefinanceSelect = (loan) => {
    console.log("Handling refinance select for loan:", loan);
    
    const isSelected = selectedRefinanceLoans.some(l => l.loan_no === loan.LoanNo);
    
    if (isSelected) {
      // Remove from selection
      console.log("Removing loan from selection:", loan.LoanNo);
      setSelectedRefinanceLoans(prev => 
        prev.filter(l => l.loan_no !== loan.LoanNo)
      );
    } else {
      // Add to selection
      console.log("Adding loan to selection:", loan);
      
      // Use the parseNumber function to ensure we get the correct value
      const outstandingAmount = parseNumber(loan.Outstanding) || 0;
      const arrearsAmount = parseNumber(loan.ArrearsAmt) || 0;
      
      console.log("Parsed Outstanding:", outstandingAmount);
      console.log("Parsed ArrearsAmt:", arrearsAmount);
      
      const newLoanData = {
        loan_no: loan.LoanNo,
        loan_type: selectedLoan?.loan_code || "Unknown",
        // Use Outstanding amount as default, make it editable
        refinance_amount: outstandingAmount,
        original_outstanding: outstandingAmount,
        loan_name: cleanProductName(loan.Product || loan.ProductName) || "Unknown Loan",
        outstanding_amount: outstandingAmount,
        arrears_amount: arrearsAmount,
        arrears_days: parseInt(loan.ArrearsDays) || 0,
        product_code: loan.ProductCode || "Unknown"
      };
      
      console.log("Prepared loan data for backend:", newLoanData);
      
      setSelectedRefinanceLoans(prev => {
        // Check if loan already exists to prevent duplicates
        const alreadyExists = prev.some(l => l.loan_no === newLoanData.loan_no);
        if (alreadyExists) {
          console.log("Loan already in selection, not adding duplicate");
          return prev;
        }
        return [...prev, newLoanData];
      });
    }
  };

  // Function to update refinance amount for a specific loan
  const updateRefinanceAmount = (loanNo, newAmount) => {
    const parsedAmount = parseNumber(newAmount);
    setSelectedRefinanceLoans(prev =>
      prev.map(loan =>
        loan.loan_no === loanNo
          ? { ...loan, refinance_amount: parsedAmount }
          : loan
      )
    );
  };

  const openRefinanceModal = () => {
    console.log("Opening refinance modal...");
    // Always fetch fresh data when opening the modal
    fetchExistingLoans();
    setShowRefinanceModal(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event bubbling
    
    // Prevent double submission
    if (isSubmittingRef.current || !validateInputs()) {
      return;
    }
    
    isSubmittingRef.current = true;
    setIsSubmitting(true);
    setSubmitStatus({ message: "", isError: false, isSuccess: false });

    // Prepare refinance loans data for backend
    const refinanceLoansPayload = selectedRefinanceLoans.map(loan => {
      console.log("Preparing refinance loan payload:", loan);
      return {
        loan_no: loan.loan_no,
        loan_type: loan.loan_type,
        product_code: loan.product_code,
        // Send the refinance_amount (editable amount) instead of arrears_amount
        arrears_amount: loan.refinance_amount,
        original_outstanding: loan.original_outstanding
      };
    });

    console.log("Final refinance payload:", refinanceLoansPayload);

    // Prepare payload based on disbursement mode
    const payload = {
      bosa_no: memberNo,
      loan_type: selectedLoan.loan_code,
      loan_amount: parseFloat(loanAmount),
      loan_purpose: loanPurpose,
      repayment_period: parseInt(repaymentPeriod),
      disbursement_mode: parseInt(disbursementMode),
      recovery_mode: parseInt(recoveryMode),
      refinance_loans: refinanceLoansPayload
    };

    // Add conditional fields based on disbursement mode
    const disbursementModeNum = parseInt(disbursementMode);
    
    if (disbursementModeNum === 4) { // Bank Transfer
      payload.account_or_mpesa_no = accountOrMpesaNo || "";
      payload.member_bank = memberBank ? parseInt(memberBank) : 0;
    } else if (disbursementModeNum === 8) { // Mobile Money
      payload.account_or_mpesa_no = accountOrMpesaNo || "";
      payload.member_bank = 0; // Not required for mobile money
    } else if (disbursementModeNum === 2) { // Cash
      payload.account_or_mpesa_no = ""; // Not required for cash
      payload.member_bank = 0; // Not required for cash
    }

    console.log("Submitting loan application with payload:", payload);

    try {
      const loanResponse = await authorizedFetch(`/api/apply-loan/`, {
        method: "POST",
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const responseData = await loanResponse.json();
      console.log("API Response:", responseData);

      if (!loanResponse.ok) {
        const errorMessage = responseData.error || responseData.message || "Failed to submit loan application";
        throw new Error(errorMessage);
      }

      if (responseData.status === "error") {
        throw new Error(responseData.message);
      }

      if (responseData.status === "success") {
        let successMessage = formatSuccessMessage(responseData.message);
        
        // Add loan number if available
        if (responseData.loan_no) {
          successMessage = `Loan application submitted successfully! Loan Number: ${responseData.loan_no}`;
        }
        
        // Add refinancing info
        if (responseData.refinancing_processed && selectedRefinanceLoans.length > 0) {
          const totalRefinance = selectedRefinanceLoans.reduce((sum, loan) => sum + loan.refinance_amount, 0);
          successMessage += `\n\n${selectedRefinanceLoans.length} existing loan(s) marked for refinancing.`;
          
          if (totalRefinance > 0) {
            successMessage += `\nTotal amount to be refinanced: Ksh ${totalRefinance.toLocaleString()}`;
          }
          
          if (responseData.refinancing_success_count !== undefined) {
            successMessage += `\nSuccessful refinancings: ${responseData.refinancing_success_count}/${selectedRefinanceLoans.length}`;
          }
        }
        
        console.log("Success message to display:", successMessage);
        
        toast.success(successMessage);
        setSubmitStatus({
          message: successMessage,
          isError: false,
          isSuccess: true,
        });
        
        setTimeout(() => {
          closeModal();
          navigate("/Home/AppliedLoans");
        }, 4000);
      } else {
        throw new Error("Unexpected response from server");
      }
      
    } catch (error) {
      console.error("Loan application error:", error);
      
      const friendlyErrorMessage = formatErrorMessage(error.message);
      
      toast.error(friendlyErrorMessage);
      setSubmitStatus({
        message: friendlyErrorMessage,
        isError: true,
        isSuccess: false,
      });
    } finally {
      isSubmittingRef.current = false;
      setIsSubmitting(false);
    }
  };

  // Helper function to clean product names
  const cleanProductName = (productName) => {
    if (!productName) return "Unknown Loan";
    
    // Remove extra characters like \n
    let cleaned = productName.toString().replace(/\\n/g, '').trim();
    
    // Map common product names
    const productMapping = {
      "INSTANT LOAN": "Instant Loan",
      "EMERGENCY LOAN": "Emergency Loan",
      "SCHOOL FEES LOAN": "School Fees Loan",
      "DEVELOPMENT LOAN": "Development Loan",
      "DEVELOPMENT LOAN 1": "Development Loan 1",
      "DEVELOPMENT LOAN 2": "Development Loan 2",
      "INVESTMENT LOAN": "Investment Loan",
      "NORMAL LOAN": "Normal Loan"
    };
    
    return productMapping[cleaned] || cleaned;
  };

  // Render disbursement mode fields based on selection
  const renderDisbursementFields = () => {
    const disbursementModeNum = parseInt(disbursementMode);
    
    if (disbursementModeNum === 4) { // Bank Transfer
      return (
        <>
          <div className="krb-loan-form-group">
            <label>Select Bank</label>
            <select
              value={memberBank}
              onChange={(e) => setMemberBank(e.target.value)}
              required
              className="krb-loan-form-control"
            >
              {bankOptions.map((bank) => (
                <option key={bank.value} value={bank.value}>
                  {bank.label}
                </option>
              ))}
            </select>
          </div>
          <div className="krb-loan-form-group">
            <label>Bank Account Number</label>
            <input
              type="text"
              placeholder="Enter your bank account number"
              value={accountOrMpesaNo}
              onChange={(e) => setAccountOrMpesaNo(e.target.value)}
              required
              className="krb-loan-form-control"
            />
          </div>
        </>
      );
    } else if (disbursementModeNum === 8) { // Mobile Money
      return (
        <div className="krb-loan-form-group">
          <label>Mobile Money Number</label>
          <input
            type="text"
            placeholder="Enter your mobile number (e.g., 0712345678)"
            value={accountOrMpesaNo}
            onChange={(e) => setAccountOrMpesaNo(e.target.value)}
            required
            className="krb-loan-form-control"
          />
          <small className="krb-loan-form-help">
            Format: 0712345678 or +254712345678
          </small>
        </div>
      );
    } else if (disbursementModeNum === 2) { // Cash
      return (
        <div className="krb-loan-form-group">
          <label>Disbursement Note</label>
          <div className="krb-loan-disbursement-note">
            <p>Your loan will be disbursed in cash at the Sacco office.</p>
            <p>Please bring your national ID for verification when collecting.</p>
          </div>
        </div>
      );
    }
    
    return null;
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

      <dialog
        ref={profileReviewDialog}
        className="krb-loan-profile-review"
        aria-labelledby="loan-profile-review-title"
        aria-describedby="loan-profile-review-description"
      >
        <div className="krb-loan-modal-header">
          <h2 id="loan-profile-review-title">Review your member details</h2>
        </div>
        <div className="krb-loan-modal-body">
          <p id="loan-profile-review-description">
            Before applying, review your personal details, beneficiaries
            (nominees), and next of kin. Save any changes before continuing.
          </p>
          <form method="dialog" className="krb-loan-profile-review-actions">
            <button type="submit" className="krb-loan-btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              className="krb-loan-btn-primary"
              onClick={() => {
                profileReviewDialog.current.close();
                navigate("/Home/member-profile", {
                  state: { pendingLoanCode: pendingLoanCode.current },
                });
              }}
            >
              Review profile
            </button>
          </form>
        </div>
      </dialog>

      {isModalOpen && selectedLoan && (
        <div className="krb-loan-modal-backdrop">
          <div className="krb-loan-modal-content">
            <div className="krb-loan-modal-header">
              <h2>Apply for {selectedLoan.product_description}</h2>
              <button
                className="krb-loan-modal-close"
                onClick={closeModal}
                disabled={isSubmitting}
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
                  <label>Disbursement Mode</label>
                  <select
                    value={disbursementMode}
                    onChange={(e) => {
                      const value = e.target.value;
                      setDisbursementMode(value);
                      // Clear fields when mode changes
                      setAccountOrMpesaNo("");
                      setMemberBank("");
                    }}
                    required
                    className="krb-loan-form-control"
                  >
                    <option value="">Select Disbursement Mode</option>
                    {disbursementModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Conditional disbursement fields */}
                {renderDisbursementFields()}

                <div className="krb-loan-form-group">
                  <label>Recovery Mode</label>
                  <select
                    value={recoveryMode}
                    onChange={(e) => setRecoveryMode(e.target.value)}
                    required
                    className="krb-loan-form-control"
                  >
                    <option value="">Select Recovery Mode</option>
                    {recoveryModes.map((mode) => (
                      <option key={mode.value} value={mode.value}>
                        {mode.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Refinancing Section */}
                <div className="krb-loan-form-group">
                  <label>Refinance Existing Loans (Optional)</label>
                  <div className="krb-loan-refinance-section">
                    <button
                      type="button"
                      onClick={openRefinanceModal}
                      className="krb-loan-refinance-btn"
                      disabled={refinanceLoading}
                    >
                      {refinanceLoading ? (
                        <>
                          <span className="krb-loan-spinner-small"></span>
                          Loading Loans...
                        </>
                      ) : (
                        "Select Loans to Refinance"
                      )}
                    </button>
                    
                    {selectedRefinanceLoans.length > 0 ? (
                      <div className="krb-loan-selected-refinance">
                        <div className="krb-loan-selected-header">
                          <span className="krb-loan-selected-count">
                            {selectedRefinanceLoans.length} loan(s) selected for refinancing
                          </span>
                          <span className="krb-loan-total-refinance">
                            Total Refinance Amount: Ksh {selectedRefinanceLoans.reduce((sum, loan) => sum + loan.refinance_amount, 0).toLocaleString()}
                          </span>
                        </div>
                        
                        <div className="krb-loan-selected-list">
                          {selectedRefinanceLoans.map((loan, index) => (
                            <div key={`${loan.loan_no}-${index}`} className="krb-loan-selected-item">
                              <div className="krb-loan-selected-info">
                                <strong>{loan.loan_name}</strong>
                                <div className="krb-loan-selected-details">
                                  <span>Loan No: {loan.loan_no}</span>
                                  <div className="krb-loan-amount-input-container">
                                    <label>Refinance Amount (KES):</label>
                                    <input
                                      type="number"
                                      value={loan.refinance_amount}
                                      onChange={(e) => updateRefinanceAmount(loan.loan_no, e.target.value)}
                                      min="0"
                                      step="0.01"
                                      className="krb-loan-amount-input"
                                      placeholder="Enter amount to refinance"
                                    />
                                    <span className="krb-loan-original-amount">
                                      (Outstanding: Ksh {loan.original_outstanding.toLocaleString()})
                                    </span>
                                    {loan.arrears_amount > 0 && (
                                      <span className="krb-loan-arrears-note">
                                        Arrears: Ksh {loan.arrears_amount.toLocaleString()}
                                      </span>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleRefinanceSelect({ 
                                  LoanNo: loan.loan_no,
                                  Product: loan.loan_name,
                                  Outstanding: loan.outstanding_amount
                                })}
                                className="krb-loan-remove-btn"
                              >
                                Remove
                              </button>
                            </div>
                          ))}
                        </div>
                        
                        <div className="krb-loan-refinance-note">
                          <small>
                            <strong>Note:</strong> Default amount is the Outstanding balance. 
                            You can adjust it to any amount (e.g., change 50,000 to 20,000).
                            The loan type used for refinancing will be: <strong>{selectedLoan.loan_code}</strong>
                          </small>
                        </div>
                      </div>
                    ) : existingLoans.length > 0 ? (
                      <div className="krb-loan-refinance-prompt">
                        <small>
                          You have {existingLoans.length} existing loan(s). Click "Select Loans to Refinance" to choose which loans to refinance with this new loan.
                        </small>
                      </div>
                    ) : (
                      <div className="krb-loan-refinance-prompt">
                        <small>
                          You don't have any existing loans to refinance.
                        </small>
                      </div>
                    )}
                  </div>
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
                    <div className="krb-loan-message-content">
                      {submitStatus.message.split('\n').map((line, index) => (
                        <p key={index} className={index === 0 ? "krb-loan-message-main" : "krb-loan-message-detail"}>
                          {line}
                        </p>
                      ))}
                    </div>
                    {submitStatus.isError && (
                      <div className="krb-loan-error-help">
                        Need help? Contact the Sacco office.
                      </div>
                    )}
                  </div>
                )}

                <div className="krb-loan-form-actions">
                  <button
                    type="button"
                    onClick={closeModal}
                    disabled={isSubmitting}
                    className="krb-loan-btn-secondary"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="krb-loan-btn-primary"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="krb-loan-spinner-small"></div>
                        Submitting...
                      </>
                    ) : (
                      "Submit Application"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Refinance Loans Modal */}
      {showRefinanceModal && (
        <div className="krb-loan-modal-backdrop">
          <div className="krb-loan-modal-content krb-refinance-modal">
            <div className="krb-loan-modal-header">
              <h2>Select Loans to Refinance</h2>
              <button
                className="krb-loan-modal-close"
                onClick={() => setShowRefinanceModal(false)}
                disabled={refinanceLoading}
                aria-label="Close refinance modal"
              >
                &times;
              </button>
            </div>
            <div className="krb-loan-modal-body">
              {refinanceLoading ? (
                <div className="krb-loan-loading-state">
                  <div className="krb-loan-spinner"></div>
                  <p>Loading your existing loans...</p>
                </div>
              ) : existingLoans.length === 0 ? (
                <div className="krb-loan-no-results">
                  <p>No existing loans found</p>
                  <p className="krb-loan-form-help">
                    You don't have any existing loans that can be refinanced.
                  </p>
                  <button
                    onClick={() => setShowRefinanceModal(false)}
                    className="krb-loan-btn-primary"
                  >
                    Close
                  </button>
                </div>
              ) : (
                <>
                  <div className="krb-loan-refinance-instructions">
                    <p>Select the loans you want to refinance with your new loan:</p>
                    <small>This will use part of your new loan to refinance selected loans.</small>
                    <small><strong>Note:</strong> All selected loans will be refinanced using the new loan type: <strong>{selectedLoan?.loan_code}</strong></small>
                    <small>You can adjust the refinance amount for each loan in the main application form.</small>
                  </div>
                  
                  <div className="krb-loan-existing-loans-container">
                    <div className="krb-loan-existing-loans-header">
                      <span className="krb-loan-loan-name">Loan Details</span>
                      <span className="krb-loan-loan-amounts">Amounts</span>
                      <span className="krb-loan-loan-status">Status</span>
                    </div>
                    
                    <div className="krb-loan-existing-loans-list">
                      {existingLoans.map((loan, index) => {
                        const isSelected = selectedRefinanceLoans.some(l => l.loan_no === loan.LoanNo);
                        const hasArrears = (parseNumber(loan.ArrearsAmt) || 0) > 0;
                        const loanName = cleanProductName(loan.Product || loan.ProductName);
                        const outstandingAmount = parseNumber(loan.Outstanding) || 0;
                        const arrearsAmount = parseNumber(loan.ArrearsAmt) || 0;
                        const arrearsDays = parseInt(loan.ArrearsDays) || 0;
                        
                        console.log(`Loan ${loan.LoanNo}: Outstanding=${outstandingAmount}, Arrears=${arrearsAmount}`);
                        
                        return (
                          <div 
                            key={`${loan.LoanNo}-${index}`} 
                            className={`krb-loan-existing-loan-item ${isSelected ? 'krb-loan-selected' : ''} ${hasArrears ? 'krb-loan-has-arrears' : ''}`}
                          >
                            <div className="krb-loan-existing-loan-checkbox">
                              <input
                                type="checkbox"
                                id={`loan-${loan.LoanNo}-${index}`}
                                checked={isSelected}
                                onChange={() => handleRefinanceSelect(loan)}
                              />
                            </div>
                            
                            <div className="krb-loan-loan-info">
                              <div className="krb-loan-loan-name">
                                <label htmlFor={`loan-${loan.LoanNo}-${index}`}>
                                  <strong>{loanName}</strong>
                                  <div className="krb-loan-loan-number">Loan No: {loan.LoanNo}</div>
                                </label>
                              </div>
                              
                              <div className="krb-loan-loan-amounts">
                                <div className="krb-loan-amount-item">
                                  <span className="krb-loan-amount-label">Outstanding:</span>
                                  <span className="krb-loan-amount-value">
                                    Ksh {outstandingAmount.toLocaleString()}
                                  </span>
                                </div>
                                <div className="krb-loan-amount-item">
                                  <span className="krb-loan-amount-label">Arrears:</span>
                                  <span className={`krb-loan-amount-value ${hasArrears ? 'krb-loan-arrears-highlight' : ''}`}>
                                    Ksh {arrearsAmount.toLocaleString()}
                                  </span>
                                </div>
                              </div>
                              
                              <div className="krb-loan-loan-status">
                                {hasArrears ? (
                                  <div className="krb-loan-status-badge krb-loan-arrears-badge">
                                    <span className="krb-loan-arrears-days">{arrearsDays} days</span>
                                    <span>In Arrears</span>
                                  </div>
                                ) : (
                                  <div className="krb-loan-status-badge krb-loan-current-badge">
                                    Current
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  
                  <div className="krb-loan-selection-summary">
                    <div className="krb-loan-summary-item">
                      <span className="krb-loan-summary-label">Selected Loans:</span>
                      <span className="krb-loan-summary-value">{selectedRefinanceLoans.length}</span>
                    </div>
                    <div className="krb-loan-summary-item">
                      <span className="krb-loan-summary-label">Total Refinance Amount:</span>
                      <span className="krb-loan-summary-value krb-loan-summary-refinance">
                        Ksh {selectedRefinanceLoans.reduce((sum, loan) => sum + loan.refinance_amount, 0).toLocaleString()}
                      </span>
                    </div>
                    <div className="krb-loan-summary-item">
                      <span className="krb-loan-summary-label">Total Outstanding:</span>
                      <span className="krb-loan-summary-value">
                        Ksh {selectedRefinanceLoans.reduce((sum, loan) => sum + loan.original_outstanding, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="krb-loan-form-actions">
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedRefinanceLoans([]);
                        setShowRefinanceModal(false);
                      }}
                      className="krb-loan-btn-secondary"
                    >
                      Clear & Close
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowRefinanceModal(false)}
                      className="krb-loan-btn-primary"
                    >
                      Confirm Selection ({selectedRefinanceLoans.length})
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default OnlineLoanApplication;
