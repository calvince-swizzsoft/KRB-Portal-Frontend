import React, { useState, useRef, useEffect } from "react";
import { FaCamera, FaTimes, FaUpload, FaIdCard, FaPlus, FaMinus } from "react-icons/fa";
import KRBLogo from '../img/KRBLogo.png';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { authorizedFetch } from "../js/authorizedFetch";
import '../css/EditProfile.css';

const EditProfile = () => {
  const [isMobile, setIsMobile] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const [idFrontImage, setIdFrontImage] = useState(null);
  const [idBackImage, setIdBackImage] = useState(null);
  const [kraPinImage, setKraPinImage] = useState(null);
  const [previewIdFront, setPreviewIdFront] = useState(null);
  const [previewIdBack, setPreviewIdBack] = useState(null);
  const [previewKraPin, setPreviewKraPin] = useState(null);
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    idDocument: true,
    kraPin: true
  });
  
  const member_full_name = sessionStorage.getItem('fullName');
  const memberNumber = sessionStorage.getItem("memberNo");

  const [formData, setFormData] = useState({
    fullNames: member_full_name || "",
    phoneNumber: "",
    email: "",
    iDNumber: "",
    kRAPin: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const profileInputRef = useRef(null);
  const idFrontInputRef = useRef(null);
  const idBackInputRef = useRef(null);
  const kraPinInputRef = useRef(null);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    handleResize(); // Set initial value
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const toggleSection = (section) => {
    setExpandedSections(prev => ({
      ...prev,
      [section]: !prev[section]
    }));
  };

  const handleImageUpload = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      switch (type) {
        case 'profile':
          setProfileImage(file);
          setPreviewImage(reader.result);
          break;
        case 'idFront':
          setIdFrontImage(file);
          setPreviewIdFront(reader.result);
          break;
        case 'idBack':
          setIdBackImage(file);
          setPreviewIdBack(reader.result);
          break;
        case 'kraPin':
          setKraPinImage(file);
          setPreviewKraPin(reader.result);
          break;
        default:
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  const handleRemoveImage = (type) => {
    switch (type) {
      case 'profile':
        setProfileImage(null);
        setPreviewImage(null);
        if (profileInputRef.current) profileInputRef.current.value = "";
        break;
      case 'idFront':
        setIdFrontImage(null);
        setPreviewIdFront(null);
        if (idFrontInputRef.current) idFrontInputRef.current.value = "";
        break;
      case 'idBack':
        setIdBackImage(null);
        setPreviewIdBack(null);
        if (idBackInputRef.current) idBackInputRef.current.value = "";
        break;
      case 'kraPin':
        setKraPinImage(null);
        setPreviewKraPin(null);
        if (kraPinInputRef.current) kraPinInputRef.current.value = "";
        break;
      default:
        break;
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const convertToBase64 = (file) => {
        return new Promise((resolve) => {
          if (!file) resolve("");
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(file);
        });
      };

      const [profileBase64, idFrontBase64, idBackBase64, kraPinBase64] = await Promise.all([
        convertToBase64(profileImage),
        convertToBase64(idFrontImage),
        convertToBase64(idBackImage),
        convertToBase64(kraPinImage)
      ]);

      const dataToSend = {
        memberNumber,
        ...formData,
        profileImage: profileBase64,
        idFrontImage: idFrontBase64,
        idBackImage: idBackBase64,
        kraPinImage: kraPinBase64
      };

      const response = await authorizedFetch(`/api/edit-member-details/`, {
        method: 'POST',
        body: JSON.stringify(dataToSend)
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Update Error:", error);
      toast.error("An error occurred while updating profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={`edit-profile-container ${isMobile ? 'mobile' : 'desktop'}`}>
      <ToastContainer position="top-right" autoClose={5000} />
      <div className="header">
        <img src={KRBLogo} alt="Logo" />
        <h1 className="edit-profile-title">Edit Profile</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="edit-profile-form">
        {/* Profile Picture Section */}
        <div className="form-section">
          <div className="profile-image-container">
            <div className="profile-image-wrapper">
              {previewImage ? (
                <>
                  <img src={previewImage} alt="Profile" className="profile-image" />
                  <button 
                    type="button" 
                    className="remove-image-btn"
                    onClick={() => handleRemoveImage('profile')}
                  >
                    <FaTimes />
                  </button>
                </>
              ) : (
                <div className="profile-image-placeholder">
                  <FaCamera className="placeholder-icon" />
                </div>
              )}
              <button
                type="button"
                className="upload-image-btn"
                onClick={() => profileInputRef.current.click()}
              >
                <FaCamera /> {previewImage ? 'Change' : 'Upload'}
              </button>
              <input
                type="file"
                ref={profileInputRef}
                onChange={(e) => handleImageUpload('profile', e)}
                accept="image/*"
                hidden
              />
            </div>
          </div>
        </div>

        {/* Personal Information Section */}
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('personalInfo')}>
            <h2>Personal Information</h2>
            {expandedSections.personalInfo ? <FaMinus /> : <FaPlus />}
          </div>
          
          {expandedSections.personalInfo && (
            <div className="section-content">
              <div className="form-group">
                <label>Full Names</label>
                <input
                  type="text"
                  name="fullNames"
                  value={formData.fullNames}
                  onChange={handleInputChange}
                  className={errors.fullNames ? "error" : ""}
                  disabled
                />
                {errors.fullNames && <span className="error-message">{errors.fullNames}</span>}
              </div>

              <div className="form-group">
                <label>Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleInputChange}
                  placeholder="0712345678"
                  className={errors.phoneNumber ? "error" : ""}
                />
                {errors.phoneNumber && <span className="error-message">{errors.phoneNumber}</span>}
              </div>

              <div className="form-group">
                <label>Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  placeholder="example@domain.com"
                  className={errors.email ? "error" : ""}
                />
                {errors.email && <span className="error-message">{errors.email}</span>}
              </div>
            </div>
          )}
        </div>

        {/* ID Document Section */}
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('idDocument')}>
            <h2><FaIdCard className="icon" /> ID Document</h2>
            {expandedSections.idDocument ? <FaMinus /> : <FaPlus />}
          </div>
          
          {expandedSections.idDocument && (
            <div className="section-content">
              <div className="form-group">
                <label>ID Number</label>
                <input
                  type="text"
                  name="iDNumber"
                  value={formData.iDNumber}
                  onChange={handleInputChange}
                  placeholder="12345678"
                  className={errors.iDNumber ? "error" : ""}
                />
                {errors.iDNumber && <span className="error-message">{errors.iDNumber}</span>}
              </div>

              <div className="document-upload-container">
                <div className="document-upload">
                  <h3>Front Side</h3>
                  <div className="document-preview">
                    {previewIdFront ? (
                      <>
                        <img src={previewIdFront} alt="ID Front" />
                        <button
                          type="button"
                          className="remove-doc-btn"
                          onClick={() => handleRemoveImage('idFront')}
                        >
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <div className="document-placeholder">
                        <FaIdCard className="doc-icon" />
                        <p>Upload front side</p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="upload-doc-btn"
                      onClick={() => idFrontInputRef.current.click()}
                    >
                      <FaUpload /> Select File
                    </button>
                    <input
                      type="file"
                      ref={idFrontInputRef}
                      onChange={(e) => handleImageUpload('idFront', e)}
                      accept="image/*"
                      hidden
                    />
                  </div>
                </div>

                <div className="document-upload">
                  <h3>Back Side</h3>
                  <div className="document-preview">
                    {previewIdBack ? (
                      <>
                        <img src={previewIdBack} alt="ID Back" />
                        <button
                          type="button"
                          className="remove-doc-btn"
                          onClick={() => handleRemoveImage('idBack')}
                        >
                          <FaTimes />
                        </button>
                      </>
                    ) : (
                      <div className="document-placeholder">
                        <FaIdCard className="doc-icon" />
                        <p>Upload back side</p>
                      </div>
                    )}
                    <button
                      type="button"
                      className="upload-doc-btn"
                      onClick={() => idBackInputRef.current.click()}
                    >
                      <FaUpload /> Select File
                    </button>
                    <input
                      type="file"
                      ref={idBackInputRef}
                      onChange={(e) => handleImageUpload('idBack', e)}
                      accept="image/*"
                      hidden
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* KRA PIN Section */}
        <div className="form-section">
          <div className="section-header" onClick={() => toggleSection('kraPin')}>
            <h2>KRA PIN Document</h2>
            {expandedSections.kraPin ? <FaMinus /> : <FaPlus />}
          </div>
          
          {expandedSections.kraPin && (
            <div className="section-content">
              <div className="form-group">
                <label>KRA PIN Number</label>
                <input
                  type="text"
                  name="kRAPin"
                  value={formData.kRAPin}
                  onChange={handleInputChange}
                  placeholder="A123456789X"
                  className={errors.kRAPin ? "error" : ""}
                />
                {errors.kRAPin && <span className="error-message">{errors.kRAPin}</span>}
              </div>

              <div className="document-upload-single">
                <div className="document-preview">
                  {previewKraPin ? (
                    <>
                      <img src={previewKraPin} alt="KRA PIN" />
                      <button
                        type="button"
                        className="remove-doc-btn"
                        onClick={() => handleRemoveImage('kraPin')}
                      >
                        <FaTimes />
                      </button>
                    </>
                  ) : (
                    <div className="document-placeholder">
                      <FaIdCard className="doc-icon" />
                      <p>Upload KRA PIN document</p>
                    </div>
                  )}
                  <button
                    type="button"
                    className="upload-doc-btn"
                    onClick={() => kraPinInputRef.current.click()}
                  >
                    <FaUpload /> Select File
                  </button>
                  <input
                    type="file"
                    ref={kraPinInputRef}
                    onChange={(e) => handleImageUpload('kraPin', e)}
                    accept="image/*"
                    hidden
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="form-actions">
          <button
            type="submit"
            className="submit-btn"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;