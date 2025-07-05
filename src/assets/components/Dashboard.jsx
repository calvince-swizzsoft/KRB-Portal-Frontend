import React, { useEffect, useState } from "react";
import KRBLogo from "../img/KRBLogo.png";
import {
  IoWalletOutline,
  IoCardOutline,
  IoStatsChartOutline,
  IoPeopleOutline,
  IoTrendingDownOutline,
  IoGiftOutline,
  IoPersonOutline,
  IoIdCardOutline,
  IoBusinessOutline,
  IoNotificationsOutline,
  IoCallOutline,
  IoLogoWhatsapp,
  IoMailOutline,
} from "react-icons/io5";
import KrbsacoLoader from "./KrbsacoLoader";
import { IoIosNotifications } from "react-icons/io";
import { FaMoneyBillWave, FaUserTie } from "react-icons/fa";
import "../css/Dashboard.css";
import { authorizedFetch } from "../js/authorizedFetch";
import { Link } from "react-router-dom";

import {
  FaWhatsapp,
  FaPhone,
  FaEnvelope,
  FaQuestionCircle,
} from "react-icons/fa";

function Dashboard() {
  const [memberData, setMemberData] = useState(null);
  const [deductionsData, setDeductionsData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [requests, setRequests] = useState();
  const [isLoanDrawerOpen, setIsLoanDrawerOpen] = useState(false);

  const memberNo = sessionStorage.getItem("memberNo");

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch member account statistics
        const statsResponse = await authorizedFetch(
          `/api/member-account-statistics/?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );

        if (statsResponse.status !== 200) {
          throw new Error("Failed to fetch member data");
        }
        const statsData = await statsResponse.json();
        setMemberData(statsData);

        // Fetch monthly deductions
        const deductionsResponse = await authorizedFetch(
          `/api/monthly-deductions/?memberNumber=${memberNo}`,
          { method: "GET" }
        );
        if (deductionsResponse.status !== 200) {
          throw new Error("Failed to fetch deductions data");
        }
        const deductionsData = await deductionsResponse.json();
        setDeductionsData(deductionsData.data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [memberNo]);

  const formatCurrency = (value) => {
    if (!value) return "0.00";
    const num =
      typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    return num.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const fetchGuarantorRequests = async () => {
      try {
        const memberNo = sessionStorage.getItem("memberNo");
        if (!memberNo) {
          throw new Error("Member number not found");
        }

        const response = await authorizedFetch(
          `/api/loans-for-guarantee/?member=${memberNo}`,
          {
            method: "GET",
          }
        );

        const data = await response.json();

        if (data?.count !== undefined) {
          setRequests(data.count);
        } else {
          throw new Error("Unexpected API format");
        }
      } catch (error) {
        console.error("Failed to fetch requests", error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchGuarantorRequests();
  }, []);

  const items = [
    {
      label: "Member Deposits",
      value: memberData ? formatCurrency(memberData.MemberDeposits) : "0.00",
      icon: <IoWalletOutline size={24} />,
      color: "#4f46e5",
    },
    {
      label: "Share Capital",
      value: memberData ? formatCurrency(memberData.ShareCapital) : "0.00",
      icon: <FaMoneyBillWave size={24} />,
      color: "#10b981",
    },
    {
      label: "Loan Balance",
      value: memberData
        ? formatCurrency(memberData.OutstandingLoanBalance)
        : "0.00",
      icon: <IoCardOutline size={24} />,
      color: "#ef4444",
    },
    {
      label: "Monthly Contribution",
      value: deductionsData?.contributions
        ? formatCurrency(deductionsData.contributions.monthlyContribution)
        : "0.00",
      icon: <IoPeopleOutline size={24} />,
      color: "#8b5cf6",
    },
    {
      label: "Total Loan Repayments",
      value: deductionsData?.summary
        ? formatCurrency(deductionsData.summary.totalLoanRepayments)
        : "0.00",
      icon: <IoTrendingDownOutline size={24} />,
      color: "#f59e0b",
    },
    {
      label: "Total Monthly Deductions",
      value: deductionsData?.summary
        ? formatCurrency(deductionsData.summary.totalMonthlyDeductions)
        : "0.00",
      icon: <IoGiftOutline size={24} />,
      color: "#14b8a6",
    },
    {
      label: "Junior Savings",
      value: memberData ? formatCurrency(memberData.JuniorSavings) : "0.00",
      icon: <IoPersonOutline size={24} />,
      color: "#ec4899",
    },
  ];

  const newsItems = [
    "📢 Annual General Meeting on 15th June 2025",
    "📱 Mobile App v2.0 Released - Update now!",
    "💼 Digital financial training begins next week",
    "🎉 Dividend payouts scheduled for 30th June 2025",
    "🔒 Enhanced security features implemented",
    "📈 Record profits reported for Q2 2025",
    "🌱 New green investment opportunities available",
  ];

  const saccoForms = [
    { name: "Membership Application Form", link: "/forms/membership.pdf" },
    { name: "Loan Application Form", link: "/forms/loan.pdf" },
    { name: "Withdrawal Form", link: "/forms/withdrawal.pdf" },
    { name: "Nomination Form", link: "/forms/nomination.pdf" },
  ];

  if (loading) {
    return <KrbsacoLoader />;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard-container">
      <div className="support-container">
        <div className={`support-drawer ${isDrawerOpen ? "open" : ""}`}>
          <a
            href="https://wa.me/254706126213"
            target="_blank"
            rel="noopener noreferrer"
            className="support-icon whatsapp"
          >
            <FaWhatsapp />
          </a>
          <a href="tel:+254706126213" className="support-icon phone">
            <FaPhone />
          </a>
          <a
            href="mailto:support@krbsacco.co.ke"
            className="support-icon email"
          >
            <FaEnvelope />
          </a>
        </div>

        <div
          className="support-button"
          onClick={() => setIsDrawerOpen((prev) => !prev)}
        >
          <FaQuestionCircle />
          <span className="tooltip">Technical Support</span>
        </div>
      </div>

      {/* Header */}
      <header className="dashboard-header">
        <div className="logo-title">
          <img src={KRBLogo} alt="KRB Logo" className="logo" />
          <span>Kenya Road Board SACCO</span>
        </div>
        <div className="right">
          <div className="usersection">
            <div style={{ position: "relative" }}>
              <Link to="/Home/guarantor-request">
                <IoIosNotifications style={{ cursor: "pointer" }} />
                {requests > 0 && (
                  <span className="notification-badge">{requests}</span>
                )}
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Statistics */}
      <section className="stats-grid">
        {items.map((item, index) => (
          <div
            className="stat-card"
            key={index}
            style={{ "--card-color": item.color }}
          >
            <div
              className="card-icon"
              style={{ backgroundColor: `${item.color}20` }}
            >
              {item.icon}
            </div>
            <div className="card-content">
              <h3>{item.label}</h3>
              <p>
                {item.label.includes("Number")
                  ? item.value
                  : `Ksh ${item.value}`}
              </p>
            </div>
          </div>
        ))}
      </section>

      <div className="dashboard-row">
        {/* Loan Deductions Details */}
        {deductionsData && (
          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <IoCardOutline size={20} />
              <h3>Monthly Deductions Summary</h3>
            </div>

            <div className="dashboard-card-body">
              <p>
                <strong>Contribution:</strong> Ksh{" "}
                {deductionsData.contributions?.monthlyContribution || "0.00"}
              </p>
              <p style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <strong>Loan Repayments:</strong> Ksh{" "}
                {deductionsData.summary?.totalLoanRepayments || "0.00"}
                <span
                  title="View breakdown"
                  style={{
                    cursor: "pointer",
                    color: "#2563eb",
                    fontSize: "16px",
                  }}
                  onClick={() => setIsLoanDrawerOpen(true)}
                >
                  ℹ️
                </span>
              </p>
              <p>
                <strong>Total Deductions:</strong> Ksh{" "}
                {deductionsData.summary?.totalMonthlyDeductions || "0.00"}
              </p>
            </div>
          </section>
        )}

        {/* Dependents */}
        {memberData?.Dependents?.length > 0 && (
          <section className="dashboard-card">
            <div className="dashboard-card-header">
              <FaUserTie size={20} />
              <h3>Dependents</h3>
            </div>

            <div className="dashboard-card-body dependents-list">
              {memberData.Dependents.map((dependent, index) => (
                <div className="dependent-card" key={index}>
                  <p>
                    <strong>No:</strong> {dependent.DependentNo}
                  </p>
                  <p>
                    <strong>Name:</strong> {dependent.DependentName}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}
        {isLoanDrawerOpen && (
          <div
            className="loan-drawer-overlay"
            onClick={() => setIsLoanDrawerOpen(false)}
          >
            <div className="loan-drawer" onClick={(e) => e.stopPropagation()}>
              <div className="drawer-header">
                <h3>Loan Repayment Breakdown</h3>
                <button
                  className="close-btn"
                  onClick={() => setIsLoanDrawerOpen(false)}
                >
                  ✖
                </button>
              </div>
              <div className="drawer-body">
                {deductionsData?.loanDeductions?.length > 0 ? (
                  deductionsData.loanDeductions.map((loan, index) => (
                    <div key={index} className="drawer-item">
                      <p>
                        <strong>Loan No:</strong> {loan.loanNumber}
                      </p>
                      <p>
                        <strong>Type:</strong> {loan.loanType}
                      </p>
                      <p>
                        <strong>Monthly Repayment:</strong> Ksh{" "}
                        {loan.monthlyRepayment}
                      </p>
                    </div>
                  ))
                ) : (
                  <p>No loan deduction data available.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Bottom Section */}
      <section className="bottom-section">
        <div className="forms-card">
          <div className="card-header">
            <IoBusinessOutline size={20} />
            <h3>SACCO Forms</h3>
          </div>
          <ul>
            {saccoForms.map((form, index) => (
              <li key={index}>
                <a href={form.link} target="_blank" rel="noreferrer" download>
                  {form.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div className="news-card">
          <div className="card-header">
            <IoNotificationsOutline size={20} />
            <h3>Latest News</h3>
            <span className="view-all">View All</span>
          </div>
          <div className="news-list">
            {newsItems.map((item, index) => (
              <div className="news-item" key={index}>
                <p>{item}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
