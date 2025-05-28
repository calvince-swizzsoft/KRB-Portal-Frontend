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
} from "react-icons/io5";
import { FaMoneyBillWave, FaUserTie } from "react-icons/fa";
import "../css/Dashboard.css";

function Dashboard() {
  const [memberData, setMemberData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const memberNo = localStorage.getItem("memberNo");

  useEffect(() => {
    const fetchMemberData = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/member-account-statistics?member_no=${memberNo}`
        );
        if (!response.ok) {
          throw new Error("Failed to fetch member data");
        }
        const data = await response.json();
        setMemberData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchMemberData();
  }, []);

  const formatCurrency = (value) => {
    if (!value) return "0.00";
    // Remove commas if present and parse to number
    const num =
      typeof value === "string" ? parseFloat(value.replace(/,/g, "")) : value;
    return num.toLocaleString("en-KE", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

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
      label: "Junior Savings",
      value: memberData ? formatCurrency(memberData.JuniorSavings) : "0.00",
      icon: <IoPersonOutline size={24} />,
      color: "#f59e0b",
    },
    {
      label: "Withdrawable Savings",
      value: memberData
        ? formatCurrency(memberData.WithdrawableSavings)
        : "0.00",
      icon: <IoStatsChartOutline size={24} />,
      color: "#8b5cf6",
    },
    // {
    //   label: "Outstanding Interest",
    //   value: memberData ? formatCurrency(memberData.OutstandingInterest) : "0.00",
    //   icon: <IoTrendingDownOutline size={24} />,
    //   color: "#ec4899",
    // },
    {
      label: "Total Arrears",
      value: memberData ? formatCurrency(memberData.TotalArrears) : "0.00",
      icon: <IoGiftOutline size={24} />,
      color: "#14b8a6",
    },
    // {
    //   label: "Payroll Number",
    //   value: memberData ? memberData["Payroll No"] : "N/A",
    //   icon: <IoIdCardOutline size={24} />,
    //   color: "#f97316",
    // },
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
    return <div className="dashboard-loading">Loading member data...</div>;
  }

  if (error) {
    return <div className="dashboard-error">Error: {error}</div>;
  }

  return (
    <div className="dashboard">
      {/* Header Section */}
      <div className="header-section">
        <div className="logo-container">
          <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
          <div className="sacco-name">Kenya Road Board Sacco</div>
        </div>
        <h1 className="page-title">Dashboard</h1>
      </div>

      {/* Stats Grid */}
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
            <div className="card-wave"></div>
          </div>
        ))}
      </section>

      {/* Dependents Section */}
      {/* {memberData?.Dependents && memberData.Dependents.length > 0 && (
        <section className="stats-grid">
          
          <div className="stat-card">
            <div className="">
            <FaUserTie size={20} />
            <h3>Dependents</h3>
          </div>
            {memberData.Dependents.map((dependent, index) => (
              <div className="dependent-card" key={index}>
                <div className="dependent-info">
                  <p><strong>Dependent No:</strong> {dependent.DependentNo}</p>
                  <p><strong>Name:</strong> {dependent.DependentName}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )} */}

      {/* Bottom Section */}
      <section className="dashboard-bottom">
        {/* SACCO Forms Card */}
        <div className="forms-card">
          <div className="card-header">
            <IoBusinessOutline size={20} />
            <h3>Download SACCO Forms</h3>
          </div>
          <ul className="forms-list">
            {saccoForms.map((form, index) => (
              <li key={index}>
                <a href={form.link} download target="_blank" rel="noreferrer">
                  {form.name}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* News Card */}
        <div className="news-card">
          <div className="card-header">
            <IoNotificationsOutline size={20} />
            <h3>Latest Updates</h3>
            <span className="view-all">View All</span>
          </div>
          <div className="news-scroll-container">
            <div className="news-list">
              {newsItems.map((item, index) => (
                <div className="news-item" key={index}>
                  <p>{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

export default Dashboard;
