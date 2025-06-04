import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import KRBLogo from '../img/KRBLogo.png';
import '../css/ChangePassword.css';
import { authorizedFetch } from '../js/authorizedFetch';

function ChangePassword() {
  const navigate = useNavigate();
  const memberNo = sessionStorage.getItem('memberNo');
  
  const [formData, setFormData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const [passwordVisibility, setPasswordVisibility] = useState({
    currentPassword: false,
    newPassword: false,
    confirmPassword: false
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const togglePasswordVisibility = (field) => {
    setPasswordVisibility({
      ...passwordVisibility,
      [field]: !passwordVisibility[field]
    });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
    // Clear error when user types
    if (errors[name]) {
      setErrors({
        ...errors,
        [name]: ''
      });
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.currentPassword) {
      newErrors.currentPassword = 'Current password is required';
    }
    
    if (!formData.newPassword) {
      newErrors.newPassword = 'New password is required';
    } else if (formData.newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters';
    }
    
    if (formData.newPassword !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) return;
    
    setIsSubmitting(true);
    
    try {
      const response = await authorizedFetch(`/api/change-password/`, {
        method: 'POST',
        body: JSON.stringify({
          member_no: memberNo,
          current_pass: formData.currentPassword,
          new_pass: formData.newPassword
        })
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to change password');
      }

      toast.success('Password changed successfully!');
      
      // Clear form
      setFormData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Optionally redirect after successful change
      // navigate('/dashboard');
      
    } catch (error) {
      toast.error(error.message || 'An error occurred while changing password');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="change-password-container">
      <div className="password-form-wrapper">
        <div className="header-section">
          <div className="logo-container">
            <img src={KRBLogo} alt="KRB Logo" className="krb-logo" />
            <div className="sacco-name">Kenya Road Board Sacco</div>
          </div>
          <h1 className="page-title">Change Password</h1>
        </div>

        <form onSubmit={handleSubmit} className="password-form">
          <div className="form-group">
            <label htmlFor="currentPassword">Current Password</label>
            <input
              type="password"
              id="currentPassword"
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className={`form-control ${errors.currentPassword ? 'is-invalid' : ''}`}
              placeholder="Enter your current password"
            />
            {errors.currentPassword && (
              <div className="invalid-feedback">{errors.currentPassword}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="newPassword">New Password</label>
            <input
              type="password"
              id="newPassword"
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className={`form-control ${errors.newPassword ? 'is-invalid' : ''}`}
              placeholder="Enter your new password"
            />
            {errors.newPassword && (
              <div className="invalid-feedback">{errors.newPassword}</div>
            )}
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">Confirm New Password</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className={`form-control ${errors.confirmPassword ? 'is-invalid' : ''}`}
              placeholder="Confirm your new password"
            />
            {errors.confirmPassword && (
              <div className="invalid-feedback">{errors.confirmPassword}</div>
            )}
          </div>

          <div className="form-actions">
            <button
              type="submit"
              className="submit-btn"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default ChangePassword;