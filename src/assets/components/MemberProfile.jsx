import React, { useEffect, useState } from "react";
import KRBLogo from "../img/KRBLogo.png";
import { useNavigate } from "react-router-dom";
import "../css/MemberProfile.css";

import {
  FaUser,
  FaPhone,
  FaIdCard,
  FaUserCheck,
  FaWallet,
  FaCalendarAlt,
  FaPencilAlt,
  FaChevronRight,
} from "react-icons/fa";
import { toast } from "react-toastify";
import { authorizedFetch } from "../js/authorizedFetch";

function MemberProfile() {
  const [data, setData] = useState(null);
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
          `/api/member-profile?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );
        const result = await response.json();
        console.log(result);

        if (result?.profile?.status === "success") {
          setData(result.profile.profile);
          console.log(data);
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
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading your profile...</p>
      </div>
    );
  if (!data)
    return <div className="error-container">No profile data available.</div>;

  return (
    <div className="member-profile-container">
      <main className="profile-main">
        <div className="profile-card">
          <div className="profile-title-memberprofile">Member Profile</div>
          <div className="profile-header-section">
            <div className="avatar-container">
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
            <div className="profile-meta">
              <div className="member-name-line">
                <span className="member-value">{data.FullName || "N/A"}</span>
              </div>
              <div className={`member-status ${data.Status?.toLowerCase()}`}>
                {data.Status || "N/A"}
              </div>
              <div className="member-number">
                <span>Member #:</span> {data.MemberNumber || "N/A"}
              </div>
            </div>
          </div>

          {/* Profile Details Sections */}
          <div className="profile-sections">
            {/* Personal Information Section */}
            <section className="profile-section">
              <div className="section-header">
                <h4>Personal Information</h4>
                <div className="section-divider"></div>
              </div>
              <div className="section-content">
                <ProfileField
                  icon={<FaIdCard />}
                  label="ID Number"
                  value={data.IDNumber || "N/A"}
                />
                <ProfileField
                  icon={<FaPhone />}
                  label="Phone"
                  value={data.Phone || "N/A"}
                />
                <ProfileField
                  icon={<FaCalendarAlt />}
                  label="Join Date"
                  value={data.JoinDate || "N/A"}
                />
                {Array.isArray(data.next_of_kin) &&
                data.next_of_kin.length > 0 ? (
                  data.next_of_kin.map((kin, index) => (
                    <ProfileField
                      key={index}
                      icon={<FaUser />}
                      label={`Next of Kin ${index + 1}`}
                      value={`${kin.FullName || "N/A"} (${
                        kin.Relationship || "N/A"
                      }) - ${kin.Phone || "N/A"}`}
                    />
                  ))
                ) : (
                  <ProfileField
                    icon={<FaUser />}
                    label="Next of Kin"
                    value="N/A"
                  />
                )}
              </div>
            </section>

            {/* Employment Details Section */}
            <section className="profile-section">
              <div className="section-header">
                <h4>Employment Details</h4>
                <div className="section-divider"></div>
              </div>
              <div className="section-content">
                <ProfileField
                  icon={<FaWallet />}
                  label="Payroll Number"
                  value={data.PayrollNumber || "N/A"}
                />
                <ProfileField
                  icon={<FaIdCard />}
                  label="KRA PIN"
                  value={data.KRAPin || "N/A"}
                />
              </div>
            </section>
          </div>

          {/* Action Button */}
          <button className="update-button" onClick={UpdateProfile}>
            <FaPencilAlt className="button-icon" />
            Update Profile
            <FaChevronRight className="button-arrow" />
          </button>
        </div>
      </main>
    </div>
  );
}

function ProfileField({ icon, label, value }) {
  return (
    <div className="profile-field">
      <div className="field-icon">{icon}</div>
      <div className="field-content">
        <div className="field-label">{label}</div>
        <div className="field-value">{value}</div>
      </div>
    </div>
  );
}

export default MemberProfile;
