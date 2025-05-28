import React, { useEffect, useState } from "react";
import KRBLogo from "../img/KRBLogo.png";
import { useNavigate } from "react-router-dom";
import "../css/MemberProfile.css";

import {
  FaUser,
  FaEnvelope,
  FaPhone,
  FaIdCard,
  FaBirthdayCake,
  FaVenusMars,
  FaUserCheck,
  FaWallet,
} from "react-icons/fa";
import { MdCategory } from "react-icons/md";
import { toast } from "react-toastify";

function MemberProfile() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const UpdateProfile = () => {
    navigate("/Home/EditProfile");
  };

  useEffect(() => {
    const memberNo = localStorage.getItem("memberNo");

    const fetchMemberProfile = async () => {
      try {
        if (!memberNo) {
          toast.error("Member number not found in localStorage");
          return;
        }

        const response = await fetch(`https://webportal-n6uv.onrender.com/api/member-profile?member_no=${memberNo}`);
        const result = await response.json();

        if (result && result.profile) {
          setData(result.profile);
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

  if (loading) return <div className="profile-container">Loading...</div>;
  if (!data)
    return <div className="profile-container">No profile data available.</div>;

  return (
    <>
      <div className="profile-container">
        <div className="profile-card">
          <div className="header-section">
            <div className="logo-container">
              <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
              <div className="sacco-name">Kenya Road Board Sacco</div>
            </div>
            <h1 className="page-title">Member Profile</h1>
          </div>

          <div className="profile-columns">
            <div className="column">
              <Field
                icon={<FaUser />}
                label="Member Number"
                value={data.MemberNumber || "N/A"}
              />
              <Field
                icon={<FaUserCheck />}
                label="Member Name"
                value={data.FullName || "N/A"}
              />
              <Field
                icon={<FaEnvelope />}
                label="Email Address"
                value={data.Email || "N/A"}
              />
              <Field
                icon={<FaUserCheck />}
                label="Account Status"
                value={data.Status || "N/A"}
              />
              <Field
                icon={<FaPhone />}
                label="Mobile Number"
                value={data.Phone || "N/A"}
              />
            </div>
            <div className="column">
              <Field
                icon={<FaIdCard />}
                label="ID Number"
                value={data.IDNumber || "N/A"}
              />
              <Field
                icon={<MdCategory />}
                label="Account Category"
                value={data.AccountCategory || "N/A"}
              />
              <Field
                icon={<FaWallet />}
                label="Fosa Account"
                value={data.FosaAccount || "N/A"}
              />
              <Field
                icon={<FaBirthdayCake />}
                label="Date of Birth"
                value={data.DateOfBirth || "N/A"}
              />
              <Field
                icon={<FaVenusMars />}
                label="Gender"
                value={data.Gender || "N/A"}
              />
            </div>
          </div>

          <button className="update-button" onClick={UpdateProfile}>
            Update Profile
          </button>
        </div>
      </div>
    </>
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

export default MemberProfile;
