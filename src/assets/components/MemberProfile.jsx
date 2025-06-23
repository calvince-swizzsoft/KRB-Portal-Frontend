import React, { useEffect, useState } from "react";
import KRBLogo from "../img/KRBLogo.png";
import { useNavigate } from "react-router-dom";
import "../css/MemberProfile.css";

import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaWallet,
  FaCalendarAlt,
  FaPencilAlt,
  FaChevronRight,
  FaEnvelope,
  FaMapMarkerAlt,
  FaBuilding,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { authorizedFetch } from "../js/authorizedFetch";

function MemberProfile() {
  const [data, setData] = useState(null);
  const [nextOfKin, setNextOfKin] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const UpdateProfile = () => {
    if (data?.FullName) {
      sessionStorage.setItem("fullName", data.FullName);
    }
    navigate("/Home/EditProfile");
  };

  useEffect(() => {
    const memberNo = sessionStorage.getItem("memberNo");

    const fetchMemberProfile = async () => {
      try {
        if (!memberNo) {
          toast.error("Member number not found in sessionStorage");
          return;
        }

        const response = await authorizedFetch(
          `/api/member-profile/?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );
        const result = await response.json();

        if (result?.profile?.status === "success") {
          setData(result.profile.profile);
          setNextOfKin(result.next_of_kin || []);
        } else {
          toast.error("Failed to load member profile.");
        }
      } catch (error) {
        console.error("Error fetching member profile:", error);
        toast.error("Server error while loading profile.");
      } finally {
        setLoading(false);
      }
    };

    fetchMemberProfile();
  }, []);

  if (loading)
    return (
      <div className="profile-loading">
        <div className="loading-spinner"></div>
        <p>Loading profile data...</p>
      </div>
    );

  if (!data)
    return (
      <div className="profile-error">
        <p>No profile data available</p>
      </div>
    );

  return (
    <div className="krb-profile-container">
      {/* Profile Header */}
      <div className="profile-header">
        <div className="header-content">
          <h1>Member Profile</h1>
          <button className="edit-btn" onClick={UpdateProfile}>
            <FaPencilAlt /> Edit Profile
          </button>
        </div>
      </div>

      {/* Main Profile Card */}
      <div className="profile-card">
        {/* Profile Summary */}
        <div className="profile-summary">
          <div className="avatar-section">
            {data.ImageBase64 ? (
              <img
                src={`data:image/png;base64,${data.ImageBase64}`}
                alt="Member"
                className="member-avatar"
              />
            ) : (
              <div className="avatar-placeholder">
                <FaUser size={32} />
              </div>
            )}
          </div>

          <div className="member-info">
            <h2>{data.FullName || "N/A"}</h2>
            <div className={`status-badge ${data.Status?.toLowerCase()}`}>
              {data.Status || "N/A"}
            </div>
            <p className="member-number">
              Member #: {data.MemberNumber || "N/A"}
            </p>
          </div>
        </div>

        {/* Profile Details Grid */}
        <div className="profile-grid">
          {/* Personal Information */}
          <div className="profile-section">
            <h3 className="section-title">
              <FaUser className="section-icon" /> Personal Information
            </h3>
            <div className="section-content">
              <DetailRow
                icon={<FaIdCard />}
                label="ID Number"
                value={data.IDNumber}
              />
              <DetailRow icon={<FaPhone />} label="Phone" value={data.Phone} />
              <DetailRow
                icon={<FaEnvelope />}
                label="Email"
                value={data.Email}
              />
              <DetailRow
                icon={<FaCalendarAlt />}
                label="Join Date"
                value={data.JoinDate}
              />
            </div>
          </div>

          {/* Employment Details */}
          <div className="profile-section">
            <h3 className="section-title">
              <FaBuilding className="section-icon" /> Employment Details
            </h3>
            <div className="section-content">
              <DetailRow
                icon={<FaWallet />}
                label="Payroll Number"
                value={data.PayrollNumber}
              />
              <DetailRow
                icon={<FaIdCard />}
                label="KRA PIN"
                value={data.KRAPin}
              />
              <DetailRow
                icon={<FaWallet />}
                label="NHIF NO"
                value={data.NHIFNumber || "NULL"}
              />
            </div>
            
          </div>

          {/* Next of Kin */}
          {nextOfKin.length > 0 && (
            <div className="profile-section">
              <h3 className="section-title">
                <FaUser className="section-icon" /> Next of Kin
              </h3>
              <div className="section-content">
                {nextOfKin.map((kin, index) => (
                  <React.Fragment key={index}>
                    <DetailRow label="Name" value={kin.FullName} />
                    <DetailRow label="Relationship" value={kin.Relationship} />
                    <DetailRow label="Phone" value={kin.Phone} />
                    {index < nextOfKin.length - 1 && (
                      <hr className="kin-divider" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <div className="detail-row">
    <div className="detail-label">
      {icon && <span className="detail-icon">{icon}</span>}
      {label}
    </div>
    <div className="detail-value">{value || "N/A"}</div>
  </div>
);

export default MemberProfile;
