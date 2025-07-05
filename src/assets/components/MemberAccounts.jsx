import React, { useEffect, useState } from "react";
import KRBLogo from "../img/KRBLogo.png";
import KrbsacoLoader from "./KrbsacoLoader";
import { authorizedFetch } from "../js/authorizedFetch";
import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaCalendarAlt,
  FaUserCheck,
  FaWallet,
  FaMoneyBillWave,
  FaPiggyBank,
  FaHandHoldingUsd,
  FaPercent
} from "react-icons/fa";
import { MdCategory } from "react-icons/md";
import { IoMdInformationCircle } from "react-icons/io";
import { toast } from "react-toastify";
import '../css/MemberAccounts.css'

function MemberAccounts() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const memberNo = sessionStorage.getItem("memberNo");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!memberNo) {
          toast.error("Member number not found.");
          return;
        }

        // Fetch member profile
        const profileRes = await authorizedFetch(
          `/api/member-profile/?member_no=${memberNo}`,
          { method: "GET" }
        );
        const profileJson = await profileRes.json();

        if (profileJson?.profile) {
          setProfile(profileJson.profile);
        } else {
          toast.error("Failed to load member profile.");
        }

        // Fetch member stats
        const statsRes = await authorizedFetch(
          `/api/member-account-statistics/?member_no=${memberNo}`,
          { method: "GET" }
        );
        const statsJson = await statsRes.json();

        const normalizedStats = {
          ...statsJson,
          PayrollNumber: statsJson["Payroll No"],
        };

        if (normalizedStats) {
          setStats(normalizedStats);
        } else {
          toast.error("Failed to load member account statistics.");
        }

      } catch (err) {
        console.error("Error:", err);
        toast.error("Error loading data.");
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
      style: "currency",
      currency: "KES",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "N/A";
    const date = new Date(dateStr);
    return isNaN(date.getTime())
      ? dateStr
      : date.toLocaleDateString("en-US", {
          year: "numeric",
          month: "short",
          day: "numeric",
        });
  };

  if (loading) return <KrbsacoLoader />;
  if (!profile) {
    return <div className="memberaccountstatistics-error">Profile not found.</div>;
  }

  if (!stats?.MemberDeposits) {
    return <div className="memberaccountstatistics-error">Account statistics not available.</div>;
  }

  return (
    <div className="memberaccountstatistics-container">
      {/* Glassmorphism Header */}
      <header className="memberaccountstatistics-header">
        <div className="memberaccountstatistics-header-content">
          <div className="memberaccountstatistics-logo-title">
            <img src={KRBLogo} alt="KRB Logo" className="memberaccountstatistics-logo" />
            <span className="memberaccountstatistics-sacco-name">Kenya Road Board SACCO</span>
          </div>
          <div className="memberaccountstatistics-user-badge">
            <span className="memberaccountstatistics-member-id">Member Number {memberNo}</span>
          </div>
        </div>
      </header>

      {/* Main Dashboard Content */}
<main className="member-dashboard">
  {/* Top Row - Profile and Financial Summary */}
  <div className="dashboard-top-row">
    {/* Profile Card - Wider with better layout */}
    <div className="profile-card">
      <div className="profile-avatar-container">
        {profile.ImageBase64 ? (
          <img 
            src={`data:image/png;base64,${profile.ImageBase64}`} 
            alt="Member" 
            className="profile-avatar"
          />
        ) : (
          <div className="avatar-placeholder">
            <FaUser size={40} />
          </div>
        )}
      </div>
      <div className="profile-details">
        <div className="profile-header">
          <h2 className="profile-name">{profile.FullName || "N/A"}</h2>
          <span className={`status-badge status-${profile.Status?.toLowerCase()}`}>
            {profile.Status || "N/A"}
          </span>
        </div>
        
        <div className="profile-meta-grid">
          <div className="meta-item">
            <FaPhone className="meta-icon" />
            <div>
              <span className="meta-label">Phone</span>
              <span className="meta-value">{profile.Phone || "N/A"}</span>
            </div>
          </div>
          <div className="meta-item">
            <FaCalendarAlt className="meta-icon" />
            <div>
              <span className="meta-label">Member Since</span>
              <span className="meta-value">{formatDate(profile.JoinDate)}</span>
            </div>
          </div>
          <div className="meta-item">
            <FaIdCard className="meta-icon" />
            <div>
              <span className="meta-label">ID Number</span>
              <span className="meta-value">{profile.IDNumber || "N/A"}</span>
            </div>
          </div>
          <div className="meta-item">
            <MdCategory className="meta-icon" />
            <div>
              <span className="meta-label">KRA PIN</span>
              <span className="meta-value">{profile.KRAPin || "N/A"}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    {/* Financial Summary Cards - Horizontal Layout */}
    <div className="financial-summary">
      <h3 className="section-title">
        <FaWallet className="section-icon" /> 
        Financial Summary
      </h3>
      <div className="financial-cards">
        <FinancialCard 
          icon={<FaPiggyBank className="card-icon" />}
          title="Deposit Balance"
          value={formatCurrency(stats.MemberDeposits)}
          trend="up"
          variant="primary"
        />
        <FinancialCard 
          icon={<FaMoneyBillWave className="card-icon" />}
          title="Share Capital"
          value={formatCurrency(stats.ShareCapital)}
          trend="neutral"
          variant="secondary"
        />
        <FinancialCard 
          icon={<FaHandHoldingUsd className="card-icon" />}
          title="Loan Balance"
          value={formatCurrency(stats.OutstandingLoanBalance)}
          trend="down"
          variant="tertiary"
        />
      </div>
    </div>
  </div>

  {/* Middle Row - Account Details */}
  <div className="dashboard-middle-row">
    {/* Account Statistics */}
    <div className="account-details-card">
      <h3 className="section-title">
        <FaWallet className="section-icon" /> 
        Account Details
      </h3>
      <div className="details-grid">
        <InfoField 
          icon={<FaPercent className="field-icon" />}
          label="Outstanding Interest"
          value={formatCurrency(stats.OutstandingInterest)}
          highlight
        />
        <InfoField 
          icon={<FaWallet className="field-icon" />}
          label="Junior Savings"
          value={formatCurrency(stats.JuniorSavings)}
        />
        <InfoField 
          icon={<FaUserCheck className="field-icon" />}
          label="Payroll No"
          value={stats.PayrollNumber || "N/A"}
        />
      </div>
    </div>

    {/* Dependents Section */}
    {stats.Dependents && stats.Dependents.length > 0 && (
      <div className="dependents-card">
        <h3 className="section-title">
          <FaUserCheck className="section-icon" /> 
          Dependents ({stats.Dependents.length})
        </h3>
        <div className="dependents-grid">
          {stats.Dependents.map((dep, index) => (
            <div key={index} className="dependent-item">
              <div className="dependent-avatar">
                <FaUser className="dependent-icon" />
              </div>
              <div className="dependent-info">
                <h4 className="dependent-name">{dep.DependentName}</h4>
                <p className="dependent-number">No: {dep.DependentNo}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    )}
  </div>
</main>
    </div>
  );
}

// Financial Card Component
function FinancialCard({ icon, title, value, trend }) {
  return (
    <div className={`memberaccountstatistics-financial-card memberaccountstatistics-trend-${trend}`}>
      <div className="memberaccountstatistics-card-header">
        <div className="memberaccountstatistics-card-icon-container">
          {icon}
        </div>
        <h4 className="memberaccountstatistics-card-title">{title}</h4>
      </div>
      <p className="memberaccountstatistics-card-value">{value}</p>
      <div className="memberaccountstatistics-card-trend">
        {trend === 'up' && '↑'}
        {trend === 'down' && '↓'}
        {trend === 'neutral' && '→'}
      </div>
    </div>
  );
}

// Info Field Component
function InfoField({ icon, label, value }) {
  return (
    <div className="memberaccountstatistics-info-field">
      <div className="memberaccountstatistics-info-icon">
        {icon}
      </div>
      <div className="memberaccountstatistics-info-content">
        <label className="memberaccountstatistics-info-label">{label}</label>
        <p className="memberaccountstatistics-info-value">{value}</p>
      </div>
    </div>
  );
}

export default MemberAccounts;