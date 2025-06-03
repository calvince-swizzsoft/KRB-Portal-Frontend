import React, { useState, useRef, useEffect } from "react";
import { FaCamera, FaTimes } from "react-icons/fa";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import OTPModal from "./OTPModal";
import axios from "axios";
import KRBLogo from "../img/KRBLogo.png";
import "../css/EditProfile.css";

const EditProfile = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [showOTPModal, setShowOTPModal] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [formData, setFormData] = useState({
    fullNames: "",
    phoneNumber: "",
    email: "",
    iDNumber: "",
    kRAPin: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef(null);
  const memberNumber = localStorage.getItem("memberNo");

  const ImageChange = (e) => {
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
    if (!formData.kRAPin.trim()) {
      newErrors.kRAPin = "KRA PIN is required";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    let imageBlob = null;
    if (profileImage) {
      const reader = new FileReader();
      reader.onloadend = async () => {
        imageBlob = reader.result.split(",")[1]; // Remove base64 prefix
        await submitProfile(imageBlob);
      };
      reader.readAsDataURL(profileImage);
    } else {
      await submitProfile(null);
    }
  };

  const submitProfile = async (imageBlob) => {
    const dataToSend = {
      memberNumber,
      fullNames: formData.fullNames,
      phoneNumber: formData.phoneNumber,
      email: formData.email,
      iDNumber: formData.iDNumber,
      kRAPin: formData.kRAPin,
      imageBlob: imageBlob || "",
    };

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_BASE_URL}/api/edit-member-details/`,
        dataToSend
      );

      if (response.status === 200) {
        toast.success("Profile updated successfully");

        // Reset the form fields and image
        setFormData({
          fullNames: "",
          phoneNumber: "",
          email: "",
          iDNumber: "",
          kRAPin: "",
        });

        setProfileImage(null);
        setPreviewImage(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } else {
        toast.error("Something went wrong. Please try again.");
      }
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Update Error:", error);
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

          <div className="form-field">
            <label>KRA PIN</label>
            <input
              type="text"
              name="kRAPin"
              value={formData.kRAPin}
              onChange={handleInputChange}
              placeholder="Enter Your KRA PIN A110B45"
              className={`form-input ${errors.kRAPin ? "error" : ""}`}
            />
            {errors.kRAPin && (
              <span className="error-message">{errors.kRAPin}</span>
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
