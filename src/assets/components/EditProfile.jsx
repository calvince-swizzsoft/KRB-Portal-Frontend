import React, { useState, useRef } from 'react';
import { FaCamera, FaTimes } from 'react-icons/fa';
import KRBLogo from '../img/KRBLogo.png'
import '../css/EditProfile.css';

const EditProfile = () => {
  const [profileImage, setProfileImage] = useState(null);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);

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
      fileInputRef.current.value = '';
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current.click();
  };

  return (
    <div className="edit-profile-container">
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
              <img 
                src={previewImage} 
                alt="Profile" 
                className="profile-image"
              />
            </>
          ) : (
            <div className="default-profile">👤</div>
          )}
          
          <label 
            className="upload-button"
            onClick={handleUploadClick}
          >
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
        <form>
          <div className="form-field">
            <label htmlFor="member-name">Member Name</label>
            <input 
              type="text" 
              id="member-name" 
              name="member-name" 
              placeholder="Enter your name"
              className="form-input"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="email">Email</label>
            <input 
              type="email" 
              id="email" 
              name="email" 
              placeholder="Enter your email"
              className="form-input"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="phone-number">Phone Number</label>
            <input 
              type="tel" 
              id="phone-number" 
              name="phone-number" 
              placeholder="Enter your phone number"
              className="form-input"
            />
          </div>
          
          <div className="form-field">
            <label htmlFor="id-number">ID Number</label>
            <input 
              type="text" 
              id="id-number" 
              name="id-number" 
              placeholder="Enter your ID number"
              className="form-input"
            />
          </div>
        </form>
      </div>
      
      <div className="button-section">
        <button type="submit" className="save-button">
          Save Changes
        </button>
      </div>
    </div>
  );
};

export default EditProfile;