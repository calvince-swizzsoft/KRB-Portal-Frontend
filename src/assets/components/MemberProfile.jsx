// MemberProfile.jsx
import React, { useEffect, useState } from "react";
import KRBLogo from "../img/KRBLogo.png";
import KrbsacoLoader from "./KrbsacoLoader";
import { useNavigate } from "react-router-dom";
import "../css/MemberProfile.css";

import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaWallet,
  FaCalendarAlt,
  FaPencilAlt,
  FaEnvelope,
  FaChevronDown,
  FaChevronUp,
  FaUsers,
  FaFileSignature
} from "react-icons/fa";
import { toast } from "react-toastify";
import { authorizedFetch } from "../js/authorizedFetch";

function MemberProfile() {
  const [data, setData] = useState(null);
  const [nextOfKin, setNextOfKin] = useState([]);
  const [dependants, setDependants] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState(() => {
  if (window.innerWidth >= 768) {
    return ['personal', 'kin']; 
  }
  return ['personal']; 
});

  const navigate = useNavigate();

 const toggleSection = (section) => {
  setActiveSection((prev) =>
    prev.includes(section)
      ? prev.filter((s) => s !== section)
      : [...prev, section]
  );
};

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
          { method: "GET" }
        );
        const result = await response.json();

        if (result?.status === "success") {
          setData(result.profile);
          setNextOfKin(result.next_of_kin || []);
          setDependants(result.dependants || []);
          setNominees(result.nominees || []);

          const totalAllocation = (result.nominees || []).reduce((sum, nom) => {
            return sum + (parseFloat(nom.Allocation) || 0);
          }, 0);
          console.log(totalAllocation)
          sessionStorage.setItem("totalNomineeAllocation", totalAllocation);
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

  if (loading) return <KrbsacoLoader />;

  if (!data)
    return (
      <div className="krb-profile-error">
        <p>No profile data available</p>
      </div>
    );

  return (
    <div className="krb-profile-container">
      <div className="krb-profile-header">
        <div className="krb-header-branding">
          <img src={KRBLogo} alt="KRB Sacco Logo" className="krb-logo" />
          <div className="krb-header-titles">
            <h1>KRB SACCO</h1>
            <p>Member Profile</p>
          </div>
        </div>
      </div>

      <div className="krb-profile-content">
        <div className="krb-profile-summary">
          <div className="krb-avatar-container">
            {data.ImageBase64 ? (
              <img
                src={`data:image/png;base64,${data.ImageBase64}`}
                alt="Member"
                className="krb-avatar"
              />
            ) : (
              <div className="krb-avatar-placeholder">
                <FaUser size={32} />
              </div>
            )}
          </div>

          <div className="krb-member-details">
            <div className="krb-name-status">
              <h2>{data.FullName || "N/A"}</h2>
            </div>
            <p className="krb-member-number">Member Number: {data.MemberNumber || "N/A"}</p>

            <div className="krb-quick-info">
              <div className="krb-info-item">
                <FaPhone className="krb-info-icon" />
                <span>{data.Phone || "N/A"}</span>
              </div>
              <div className="krb-info-item">
                <FaEnvelope className="krb-info-icon" />
                <span>{data.Email || "N/A"}</span>
              </div>
              <div className="krb-info-item">
                <FaCalendarAlt className="krb-info-icon" />
                <span>Member since {data.JoinDate || "N/A"}</span>
              </div>
            </div>
          </div>

          <button className="krb-edit-btn" onClick={UpdateProfile}>
            <FaPencilAlt /> Edit Profile
          </button>
        </div>

        <div className="krb-profile-sections">
          {/* Personal Info */}
          <ProfileSection
            title="Personal Information"
            icon={<FaUser />}
           isOpen={activeSection.includes('personal')}
            onToggle={() => toggleSection('personal')}
          >
            <DetailRow icon={<FaIdCard />} label="ID Number" value={data.IDNumber} />
            <DetailRow icon={<FaWallet />} label="Payroll Number" value={data.PayrollNumber} />
            <DetailRow icon={<FaFileSignature />} label="KRA PIN" value={data.KRAPin} />
            <DetailRow icon={<FaIdCard />} label="NHIF Number" value={data.NHIFNumber || "Not provided"} />
          </ProfileSection>

          {/* Next of Kin */}
          {nextOfKin.length > 0 && (
            <ProfileSection
              title={`Next of Kin (${nextOfKin.length})`}
              icon={<FaUsers />}
              isOpen={activeSection.includes('kin')}
              onToggle={() => toggleSection('kin')}
              tableData={{
                headers: ["Name", "Relationship", "Email", "Telephone"],
                rows: nextOfKin.map(kin => [
                  kin.Name, kin.Relationship, kin.Email,
                  `${kin.Allocation}`
                ])
              }}
            />
          )}

          {/* Nominees */}
          {nominees.length > 0 && (
            <ProfileSection
              title={`Nominees (${nominees.length})`}
              icon={<FaUsers />}
              isOpen={activeSection.includes('nominees')}
              onToggle={() => toggleSection('nominees')}
              tableData={{
                headers: ["Name", "Date of Birth", "Allocation", "Relationship"],
                rows: nominees.map(nom => [
                  nom.Name, nom.DOB, `${nom.Allocation || 0}%`, nom.Relationship
                ])
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

const DetailRow = ({ icon, label, value }) => (
  <div className="krb-detail-row">
    <div className="krb-detail-label">
      <span className="krb-detail-icon">{icon}</span>
      {label}
    </div>
    <div className="krb-detail-value">{value || "N/A"}</div>
  </div>
);

const ProfileSection = ({ title, icon, isOpen, onToggle, children, tableData }) => (
  <div className={`krb-profile-section ${isOpen ? 'expanded' : ''}`}>
    <div className="krb-section-header" onClick={onToggle}>
      <div className="krb-section-title">
        {icon}
        <h3>{title}</h3>
      </div>
      {isOpen ? <FaChevronUp /> : <FaChevronDown />}
    </div>
    {isOpen && (
      <div className="krb-section-content">
        {children}
        {tableData && (
          <div className="krb-table-container">
            <table className="krb-info-table">
              <thead>
                <tr>
                  {tableData.headers.map((head, idx) => (
                    <th key={idx}>{head}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {tableData.rows.map((row, idx) => (
                  <tr key={idx}>
                    {row.map((cell, i) => (
                      <td key={i}>{cell || "N/A"}</td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    )}
  </div>
);

export default MemberProfile;
