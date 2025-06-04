import React, { useEffect, useState } from "react";
import KRBLogo from "../img/KRBLogo.png";
import { authorizedFetch } from "../js/authorizedFetch";
import "../css/MemberAccounts.css";
import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaBirthdayCake,
  FaVenusMars,
  FaUserCheck,
  FaWallet,
  FaMoneyBillWave,
} from "react-icons/fa";
import { MdCategory } from "react-icons/md";
import { GrStatusUnknown } from "react-icons/gr";
import { toast } from "react-toastify";

function MemberAccounts() {
  const [profile, setProfile] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const memberNo = sessionStorage.getItem("memberNo");
  const accesstoken = sessionStorage.getItem("token");
  const refreshtoken = sessionStorage.getItem("refresh");

  useEffect(() => {
    const fetchData = async () => {
      try {
        if (!memberNo) {
          toast.error("Member number not found.");
          return;
        }

        const profileRes = await authorizedFetch(
          `/api/member-profile?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );
        const profileJson = await profileRes.json();
        console.log(profileJson);

        if (profileJson?.profile?.profile) {
          setProfile(profileJson.profile.profile);
        } else {
          toast.error("Failed to load member profile.");
        }

        const statsRes = await authorizedFetch(
          `/api/member-account-statistics?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );
        const statsJson = await statsRes.json();

        if (statsJson) {
          setStats(statsJson);
        } else {
          toast.error("Failed to load member account statistics.");
        }
      } catch (err) {
        console.error(err);
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
          month: "long",
          day: "numeric",
        });
  };

  if (loading) return <div className="profile-container">Loading...</div>;
  if (!profile || !stats)
    return <div className="profile-container">Failed to load data.</div>;

  return (
    <div className="profile-container">
      <div className="profile-card">
        <div className="header-section">
          <div className="logo-container">
            <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
            <div className="sacco-name">Kenya Road Board Sacco</div>
          </div>
          <h1 className="page-title">Member Account Details</h1>
        </div>

        <div className="profile-columns">
          <div className="column">
            <Field
              icon={<FaUser />}
              label="Member Number"
              value={profile.MemberNumber || "N/A"}
            />
            <Field
              icon={<FaUserCheck />}
              label="Member Name"
              value={profile.FullName || "N/A"}
            />
            <Field
              icon={<GrStatusUnknown />}
              label="Account Status"
              value={profile.Status || "N/A"}
            />
            <Field
              icon={<FaPhone />}
              label="Mobile Number"
              value={profile.Phone || "N/A"}
            />
          </div>

          <div className="column">
            <Field
              icon={<FaIdCard />}
              label="ID Number"
              value={profile.IDNumber || "N/A"}
            />
            <Field
              icon={<MdCategory />}
              label="KRA PIN"
              value={profile.KRAPin || "N/A"}
            />
            <Field
              icon={<FaWallet />}
              label="Payroll Number"
              value={profile.PayrollNumber || "N/A"}
            />
            <Field
              icon={<FaBirthdayCake />}
              label="Join Date"
              value={formatDate(profile.JoinDate)}
            />
          </div>
        </div>

        <h3 className="profile-subtitle">Account Statistics</h3>

        <div className="profile-columns">
          <div className="column">
            <Field
              icon={<FaWallet />}
              label="Deposit Balance"
              value={`KES ${formatCurrency(stats.MemberDeposits)}`}
            />
            <Field
              icon={<FaMoneyBillWave />}
              label="Share Capital"
              value={`KES ${formatCurrency(stats.ShareCapital)}`}
            />
          </div>
          <div className="column">
            <Field
              icon={<FaUser />}
              label="Loan Balance"
              value={`KES ${formatCurrency(stats.OutstandingLoanBalance)}`}
            />
            <Field
              icon={<FaWallet />}
              label="Junior Savings"
              value={`KES ${formatCurrency(stats.JuniorSavings)}`}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({ icon, label, value }) {
  return (
    <div className="profile-field">
      <div className="profile-icon">{icon}</div>
      <div className="profile-info">
        <span className="profile-label">{label}</span>
        <span className="profile-value">{value}</span>
      </div>
    </div>
  );
}

export default MemberAccounts;
