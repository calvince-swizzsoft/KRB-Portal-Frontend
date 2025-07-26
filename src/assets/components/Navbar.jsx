import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  FiUser,
  FiFileText,
  FiDollarSign,
  FiPieChart,
  FiHelpCircle,
  FiLogOut,
  FiChevronDown,
  FiChevronRight,
  FiX,
} from "react-icons/fi";
import { RiDashboardHorizontalLine } from "react-icons/ri";
import "../css/Navbar.css";
import Logo from "../img/KRBLogo.png";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { authorizedFetch } from "../js/authorizedFetch";

const Navbar = ({ isOpen, setIsOpen, onLinkClick }) => {
  const [activeMenu, setActiveMenu] = useState("");
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const navigate = useNavigate();

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? "" : menu);
  };

  const handleNavLinkClick = () => {
    if (onLinkClick) onLinkClick();
  };

  const changepassword = async () => {
    const memberNo = sessionStorage.getItem("memberNo");

    if (!memberNo) {
      toast.error("Session expired. Please sign in again.");
      setTimeout(() => {
        navigate("/");
      }, 3000);
      return;
    }

    try {
      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/send-otp/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ memberNumber: memberNo }),
        }
      );

      const data = await response.json();
      console.log("OTP Response:", data);

      if (response.ok) {
        sessionStorage.setItem("signedup", "true");
        sessionStorage.setItem("memberNo", memberNo);

        toast.success("OTP sent successfully!");

        navigate("/change-password");
      } else {
        toast.error(data.detail || "Failed to send OTP. Try again.");
      }
    } catch (error) {
      toast.error("Network error. Try again later.");
      console.error("Password change error:", error);
    }
  };

  const handlelogout = () => {
    sessionStorage.clear();

    toast.success("Logging Out", {
      theme: "light",
      autoClose: 5000,
    });

    setTimeout(() => {
      navigate("/");
    }, 2000);
  };

  const [memberName, setMemberName] = useState("");
  const [memberNumber, setMemberNumber] = useState("");
  const [profilePic,setProfilePic] = useState("")

  useEffect(() => {
    const fetchMemberProfile = async () => {
      const memberNo = sessionStorage.getItem("memberNo");
      if (!memberNo) return;

      try {
        const response = await authorizedFetch(
          `/api/member-profile/?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );
        if (response.status !== 200)
          throw new Error("Failed to fetch member profile");

        const data = await response.json();
        const profile = data.profile;

        setMemberName(profile.FullName);
        setMemberNumber(profile.MemberNumber);
        setProfilePic(profile.ImageBase64)
      } catch (error) {
        console.error("Error fetching member profile:", error);
      }
    };

    fetchMemberProfile();
  }, []);

  const navItems = [
    {
      id: "Dashboard",
      icon: <RiDashboardHorizontalLine />,
      label: "DASHBOARD",
      to: "Dashboard",
      type: "link",
    },
    {
      id: "member",
      icon: <FiUser />,
      label: "Member Details",
      type: "dropdown",
      links: [
        { to: "/member-profile", label: "Member Profile" },
        { to: "/member-accounts", label: "Member Accounts" },
      ],
    },
    {
      id: "guarantor",
      icon: <FiFileText />,
      label: "Guarantorship",
      type: "dropdown",
      links: [{ to: "/guarantor-request", label: "Guarantorship Request" }],
    },
    {
      id: "loan",
      icon: <FiDollarSign />,
      label: "My Loan",
      type: "dropdown",
      links: [
        { to: "/loan-balances", label: "Loan Balances" },
        { to: "/AppliedLoans", label: "Applied Loans" },
        { to: "/loan-application", label: "Loan Application" },
      ],
    },
    {
      id: "statements",
      icon: <FiPieChart />,
      label: "Statements",
      type: "dropdown",
      links: [
        { to: "/detailed-statement", label: "Detailed Statement" },
        { to: "/loan-balance-statement", label: "Loan Balance Statement" },
        { to: "/deposit-statement", label: "Deposit Statement" },
        { to: "/guarantor-statement", label: "Guarantor Statement" },
        { to: "/guaranteed-statement", label: "Guaranteed Statement" },
        { to: "/share-certificate", label: "Share Certificate" },
      ],
    },
  ];

  return (
    <div
      className={`navbar-container ${
        isMobile ? (isOpen ? "show" : "hide") : "show"
      }`}
    >
      <div className="navbar-header">
        <div className="navbar-brand">
          <img src={Logo} alt="KRB Logo" className="logo" />
          <span className="brand-text">KRB SACCO</span>
        </div>
        {isMobile && (
          <button onClick={() => setIsOpen(false)} className="close-btn">
            <FiX size={20} />
          </button>
        )}
      </div>

      <nav className="navbar-menu">
        {navItems.map((item) => {
          if (item.type === "link") {
            return (
              <Link
                key={item.id}
                to={item.to}
                className="menu-link"
                onClick={handleNavLinkClick}
              >
                <div className="menu-label">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          }

          return (
            <div key={item.id} className="menu-group">
              <button
                onClick={() => toggleMenu(item.id)}
                className="menu-button"
              >
                <div className="menu-label">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {activeMenu === item.id ? (
                  <FiChevronDown />
                ) : (
                  <FiChevronRight />
                )}
              </button>
              {activeMenu === item.id && (
                <div className="submenu">
                  {item.links.map((link) => (
                    <Link
                      key={link.to}
                      to={`/Home${link.to}`}
                      className="submenu-link"
                      onClick={handleNavLinkClick}
                    >
                      {link.label}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </nav>

      <div className="navbar-footer">
        <div className="user-profile">
          <div className="user-avatar">
            <img
              src={profilePic ? `data:image/jpeg;base64,${profilePic}` : Logo}
              alt="Profile"
              className="avatar-image"
            />
            <div className="online-status"></div>
          </div>
          <div className="user-details">
            <p className="username">{memberName}</p>
            <p className="member-id">{memberNumber}</p>
          </div>
        </div>

        <div className="footer-actions">
          <button
            className="action-button logout-button"
            onClick={changepassword}
          >
            <FiHelpCircle className="action-icon" />
            <span>Change Password</span>
          </button>
          <button
            className="action-button logout-button"
            onClick={handlelogout}
          >
            <FiLogOut className="action-icon" />
            <span>Log Out</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
