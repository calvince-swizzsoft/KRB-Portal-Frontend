import React, { useState, useRef, useEffect } from "react";
import { FaCamera, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import KRBLogo from "../img/KRBLogo.png";
import "../css/EditProfile.css";

const EditProfile = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [formData, setFormData] = useState({
    fullNames: "",
    phoneNumber: "",
    email: "",
    iDNumber: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const memberNumber = localStorage.getItem("memberNo");

  // Fetch member details on component mount
  useEffect(() => {
    const memberNo = localStorage.getItem("memberNo");
    const fetchMemberDetails = async () => {
      try {
        const response = await fetch(
          `${
            import.meta.env.VITE_API_BASE_URL
          }/api/member-profile/${memberNo}/`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch member details");
        }

        const data = await response.json();
        setFormData({
          fullNames: data.FullName || "",
          phoneNumber: data.Phone || "",
          email: data.Email || "",
          iDNumber: data.IDNumber || "",
        });
      } catch (error) {
        toast.error(error.message);
      }
    };

    fetchMemberDetails();
  }, [memberNumber]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setProfileImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreviewImage(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setProfileImage(null);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: "",
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.fullNames.trim()) {
      newErrors.fullNames = "Full names are required";
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required";
    } else if (!/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10 digits";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    if (!formData.iDNumber.trim()) {
      newErrors.iDNumber = "ID number is required";
    } else if (!/^\d{7,8}$/.test(formData.iDNumber)) {
      newErrors.iDNumber = "ID number must be 7 or 8 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const payload = {
        memberNumber,
        fullNames: formData.fullNames,
        phoneNumber: formData.phoneNumber,
        email: formData.email,
        iDNumber: formData.iDNumber,
      };

      const response = await fetch(
        `${import.meta.env.VITE_API_BASE_URL}/api/edit-member-details/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || "Failed to update profile");
      }

      toast.success("Profile updated successfully!");
    } catch (error) {
      toast.error(error.message || "An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="edit-profile-container">
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
      />
      <div className="header-section">
        <div className="logo-container">
          <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
          <div className="sacco-name">Kenya Road Board Sacco</div>
        </div>
        <h1 className="page-title">Edit Profile</h1>
      </div>

      <div className="profile-picture-section">
        <div className="profile-image-container">
          {previewImage ? (
            <>
              <img src={previewImage} alt="Profile" className="profile-image" />
              <button
                className="remove-image-button"
                onClick={handleRemoveImage}
              >
                <FaTimes />
              </button>
            </>
          ) : (
            <div className="default-profile">👤</div>
          )}

          <label className="upload-button" onClick={handleUploadClick}>
            <FaCamera />
          </label>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleImageChange}
            accept="image/*"
            className="hidden-input"
          />
        </div>
      </div>

      <div className="profile-info-section">
        <h2 className="section-title">Profile Information</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-field">
            <label htmlFor="fullNames">Full Names</label>
            <input
              type="text"
              id="fullNames"
              name="fullNames"
              value={formData.fullNames}
              onChange={handleInputChange}
              placeholder="Enter your full names"
              className={`form-input ${errors.fullNames ? "error" : ""}`}
            />
            {errors.fullNames && (
              <span className="error-message">{errors.fullNames}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="phoneNumber">Phone Number</label>
            <input
              type="tel"
              id="phoneNumber"
              name="phoneNumber"
              value={formData.phoneNumber}
              onChange={handleInputChange}
              placeholder="Enter your phone number (e.g., 0712345678)"
              className={`form-input ${errors.phoneNumber ? "error" : ""}`}
            />
            {errors.phoneNumber && (
              <span className="error-message">{errors.phoneNumber}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleInputChange}
              placeholder="Enter your email"
              className={`form-input ${errors.email ? "error" : ""}`}
            />
            {errors.email && (
              <span className="error-message">{errors.email}</span>
            )}
          </div>

          <div className="form-field">
            <label htmlFor="iDNumber">ID Number</label>
            <input
              type="text"
              id="iDNumber"
              name="iDNumber"
              value={formData.iDNumber}
              onChange={handleInputChange}
              placeholder="Enter your ID number"
              className={`form-input ${errors.iDNumber ? "error" : ""}`}
            />
            {errors.iDNumber && (
              <span className="error-message">{errors.iDNumber}</span>
            )}
          </div>

          <div className="button-section">
            <button
              type="submit"
              className="save-button"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditProfile;
