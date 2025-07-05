import React, { useState, useRef, useEffect } from "react";
import {
  FaCamera,
  FaTimes,
  FaUpload,
  FaIdCard,
  FaPlus,
  FaMinus,
  FaUser,
  FaPhone,
  FaEnvelope,
  FaCalendarAlt,
} from "react-icons/fa";
// General Icons
import {
  FiUser as UserIcon,
  FiMail as MailIcon,
  FiPhone as PhoneIcon,
  FiCamera as CameraIcon,
  FiTrash2 as TrashIcon,
  FiUpload as UploadIcon,
  FiFileText as DocumentTextIcon,
} from "react-icons/fi";

import {
  FiCreditCard as IdCardIcon,
  FiFile as DocumentIcon,
} from "react-icons/fi";

const IconXl = ({ icon: Icon }) => <Icon size={24} />;
import KRBLogo from "../img/KRBLogo.png";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ToastContainer } from "react-toastify";
import { authorizedFetch } from "../js/authorizedFetch";
import "../css/EditProfile.css";

const EditProfile = () => {
  // State for responsive design
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Image states
  const [previewImage, setPreviewImage] = useState(null);
  const [previewIdFront, setPreviewIdFront] = useState(null);
  const [previewIdBack, setPreviewIdBack] = useState(null);
  const [previewKraPin, setPreviewKraPin] = useState(null);
  const [activeTab, setActiveTab] = useState("personal");

  // Form sections state
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    idDocument: false,
    kraPin: false,
    nextOfKin: false,
    nominee: false,
  });

  // Form data state
  const member_full_name = sessionStorage.getItem("fullName") || "";
  const memberNumber = sessionStorage.getItem("memberNo") || "";
  const totalNomineeAllocation = sessionStorage.getItem(
    "totalNomineeAllocation"
  );

  const [formData, setFormData] = useState({
    fullNames: member_full_name,
    phoneNumber: "",
    email: "",
    iDNumber: "",
    kRAPin: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Next of Kin and Nominees state
  const [nextOfKins, setNextOfKins] = useState([
    {
      name: "",
      email: "",
      idNumber: "",
      phone: "",
      relationshipType: "",
      dob: "",
      address: "",
      isBeneficiary: false,
    },
  ]);

  const [nominees, setNominees] = useState([
    {
      name: "",
      email: "",
      idNumber: "",
      phone: "",
      relationshipType: "",
      dob: "",
      address: "",
      allocation: 0,
      guardian: "",
      isBeneficiary: false,
    },
  ]);

  // Refs for file inputs
  const profileInputRef = useRef(null);
  const idFrontInputRef = useRef(null);
  const idBackInputRef = useRef(null);
  const kraPinInputRef = useRef(null);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Toggle section expansion
  const toggleSection = (section) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Handle image upload
  const handleImageUpload = (type, e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      switch (type) {
        case "profile":
          setPreviewImage(reader.result);
          break;
        case "idFront":
          setPreviewIdFront(reader.result);
          break;
        case "idBack":
          setPreviewIdBack(reader.result);
          break;
        case "kraPin":
          setPreviewKraPin(reader.result);
          break;
        default:
          break;
      }
    };
    reader.readAsDataURL(file);
  };

  // Remove image
  const handleRemoveImage = (type) => {
    switch (type) {
      case "profile":
        setPreviewImage(null);
        if (profileInputRef.current) profileInputRef.current.value = "";
        break;
      case "idFront":
        setPreviewIdFront(null);
        if (idFrontInputRef.current) idFrontInputRef.current.value = "";
        break;
      case "idBack":
        setPreviewIdBack(null);
        if (idBackInputRef.current) idBackInputRef.current.value = "";
        break;
      case "kraPin":
        setPreviewKraPin(null);
        if (kraPinInputRef.current) kraPinInputRef.current.value = "";
        break;
      default:
        break;
    }
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));

    if (errors[name]) {
      setErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }
  };

  // Handle Next of Kin changes
  const handleNextOfKinChange = (index, field, value) => {
    const updated = [...nextOfKins];
    updated[index][field] = value;
    setNextOfKins(updated);
  };

  // Handle Nominee changes
  const handleNomineeChange = (index, field, value) => {
    const updated = [...nominees];
    updated[index][field] = value;
    setNominees(updated);
  };
  const formatDate = (dateStr) => {
    const d = new Date(dateStr);
    const month = (d.getMonth() + 1).toString().padStart(2, "0");
    const day = d.getDate().toString().padStart(2, "0");
    const year = d.getFullYear();
    return `${month}/${day}/${year}`;
  };

  // Add/Remove Next of Kin
  const addNextOfKin = () =>
    setNextOfKins([
      ...nextOfKins,
      {
        name: "",
        email: "",
        idNumber: "",
        phone: "",
        relationshipType: "",
        dob: "",
        address: "",
        isBeneficiary: false,
      },
    ]);

  const removeNextOfKin = (index) => {
    const updated = [...nextOfKins];
    updated.splice(index, 1);
    setNextOfKins(updated);
  };

  // Add/Remove Nominee
  const addNominee = () =>
    setNominees([
      ...nominees,
      {
        name: "",
        email: "",
        idNumber: "",
        phone: "",
        relationshipType: "",
        dob: "",
        address: "",
        allocation: 0,
        guardian: "",
        isBeneficiary: false,
      },
    ]);

  const removeNominee = (index) => {
    const updated = [...nominees];
    updated.splice(index, 1);
    setNominees(updated);
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Validate form
  const validateForm = () => {
    const newErrors = {};
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

  const saveNextOfKin = async () => {
    try {
      for (const kin of nextOfKins) {
        // Basic validation for required fields
        const isValid =
          kin.name?.trim() &&
          kin.email?.trim() &&
          kin.idNumber?.trim() &&
          kin.phone?.trim() &&
          kin.relationshipType?.trim() &&
          kin.dob?.trim() &&
          kin.address?.trim();

        if (!isValid) {
          toast.error("Please fill in all required fields before saving.");
          return;
        }

        const response = await authorizedFetch("/api/update-next-of-kin/", {
          method: "POST",
          body: JSON.stringify({
            memberNumber,
            nextOfKinName: kin.name,
            nextOfKinEmail: kin.email,
            nextOfKinIdNumber: kin.idNumber,
            nextOfKinTelephone: kin.phone,
            nextOfKinRelationshipType: kin.relationshipType,
            nextOfKinDOB: kin.dob,
            nextOfKinAddress: kin.address,
            nextOfKinIsBeneficiary: kin.isBeneficiary,
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Next of Kin Save Failed:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
            kinData: kin,
          });
          throw new Error("Failed to save");
        }
      }

      toast.success("Next of Kin saved successfully");
      setNextOfKins([]);
    } catch (error) {
      toast.error("Error saving Next of Kin");
      console.error(error);
    }
  };

  const saveNominees = async () => {
    try {
      const sessionAllocation = parseFloat(
        sessionStorage.getItem("totalNomineeAllocation") || "0"
      );
    
      const newAllocations = nominees.reduce((sum, nominee) => {
        const allocation = parseFloat(nominee.allocation) || 0;
        return sum + allocation;
      }, 0);
    
      const totalAllocation = sessionAllocation + newAllocations;
    
      if (totalAllocation > 100) {
        toast.error(
          `Total nominee allocation exceeds 100%. Current: ${totalAllocation.toFixed(
            2
          )}%`
        );
        return;
      }
    
      if (totalAllocation < 100 && nominees.length > 0) {
        const remaining = 100 - totalAllocation;
        toast.warning(`Nominee allocation remaining: ${remaining.toFixed(2)}%`);
        // 👉 DO NOT return here, allow saving to proceed
      }
    
      for (const nominee of nominees) {
        const isValid =
          nominee.name?.trim() &&
          nominee.email?.trim() &&
          nominee.idNumber?.trim() &&
          nominee.phone?.trim() &&
          nominee.relationshipType?.trim() &&
          nominee.dob?.trim() &&
          nominee.address?.trim() &&
          nominee.allocation !== undefined;
      
        if (!isValid) {
          toast.error("Please fill in all required nominee fields.");
          return;
        }
      
        if (calculateAge(nominee.dob) < 18 && !nominee.guardian?.trim()) {
          toast.error("Guardian required for nominees under 18");
          return;
        }
      
        const response = await authorizedFetch("/api/update-nominee/", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            memberNumber,
            nomineeName: nominee.name,
            nomineeEmail: nominee.email,
            nomineeIdNumber: nominee.idNumber,
            nomineeTelephone: nominee.phone,
            nomineeRelationshipType: nominee.relationshipType,
            nomineeDOB: formatDate(nominee.dob),
            nomineeAddress: nominee.address,
            nomineeAllocation: parseFloat(nominee.allocation),
            nomineeGuardian: nominee.guardian,
            nomineeIsBeneficiary: nominee.isBeneficiary,
          }),
        });
      
        if (!response.ok) {
          const errorText = await response.text();
          console.error("Failed to save nominee:", {
            status: response.status,
            statusText: response.statusText,
            errorText,
            nomineeData: nominee,
          });
          toast.error(
            `Failed to save nominee: ${response.status} ${response.statusText}`
          );
          return;
        }
      }

    sessionStorage.setItem(
      "totalNomineeAllocation",
      totalAllocation.toString()
    );

    toast.success("Nominees saved successfully");
    setNominees([]);
  } catch (error) {
    console.error("Error saving nominees:", error);
    toast.error("Error saving nominees");
  }
  };


  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      const convertToBase64 = (file) => {
        return new Promise((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result.split(",")[1]);
          reader.readAsDataURL(file);
        });
      };

      const profileBase64 = previewImage
        ? await convertToBase64(await fetch(previewImage).then((r) => r.blob()))
        : "";
      const idFrontBase64 = previewIdFront
        ? await convertToBase64(
            await fetch(previewIdFront).then((r) => r.blob())
          )
        : "";
      const idBackBase64 = previewIdBack
        ? await convertToBase64(
            await fetch(previewIdBack).then((r) => r.blob())
          )
        : "";
      const kraPinBase64 = previewKraPin
        ? await convertToBase64(
            await fetch(previewKraPin).then((r) => r.blob())
          )
        : "";

      const response = await authorizedFetch("/api/edit-member-details/", {
        method: "POST",
        body: JSON.stringify({
          memberNumber,
          ...formData,
          imageBlob: profileBase64,
          idFront: idFrontBase64,
          idBack: idBackBase64,
          kRAPinDocumentPic: kraPinBase64,
        }),
      });

      if (response.ok) {
        toast.success("Profile updated successfully");
      } else {
        toast.error("Failed to update profile");
      }
    } catch (error) {
      console.error("Update error:", error);
      toast.error("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className={`edit-profile-container ${isMobile ? "mobile" : "desktop"}`}
    >
      <ToastContainer position="top-right" autoClose={5000} />
      <form onSubmit={handleSubmit} className="edit-profile-form">
        <div className="krb-profile-header">
          <div className="krb-header-branding">
            <img src={KRBLogo} alt="KRB Sacco Logo" className="krb-logo" />
            <div className="krb-header-titles">
              <h1>KRB SACCO</h1>
              <p>Update Profile</p>
            </div>
          </div>
        </div>

        {/* tabs section */}
        <div className="edit-tabs">
          <button
            className={activeTab === "personal" ? "tab active" : "tab"}
            onClick={() => setActiveTab("personal")}
          >
            Personal Info
          </button>
          <button
            className={activeTab === "beneficiaries" ? "tab active" : "tab"}
            onClick={() => setActiveTab("beneficiaries")}
          >
            Beneficiaries & Next of Kin
          </button>
        </div>

        {/* Personal tab */}
        {activeTab === "personal" && (
          <div className="personal-tab">
            {/* Profile Section */}
            <section className="personal-tab-profile-card">
              <div className="personal-tab-avatar-upload">
                <div
                  className="personal-tab-avatar-preview"
                  onClick={() => profileInputRef.current.click()}
                >
                  {previewImage ? (
                    <img
                      src={previewImage}
                      alt="Profile"
                      className="personal-tab-avatar-image"
                    />
                  ) : (
                    <div className="personal-tab-avatar-placeholder">
                      <UserIcon className="personal-tab-icon-xl" />
                    </div>
                  )}
                  <div className="personal-tab-avatar-actions">
                    <button
                      type="button"
                      className="personal-tab-btn-icon"
                      onClick={(e) => {
                        e.stopPropagation();
                        profileInputRef.current.click();
                      }}
                    >
                      <CameraIcon />
                    </button>
                    {previewImage && (
                      <button
                        type="button"
                        className="personal-tab-btn-icon danger"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveImage("profile");
                        }}
                      >
                        <TrashIcon />
                      </button>
                    )}
                  </div>
                </div>
                <input
                  type="file"
                  ref={profileInputRef}
                  onChange={(e) => handleImageUpload("profile", e)}
                  accept="image/*"
                  hidden
                />
                <div className="personal-tab-avatar-meta">
                  <h3>Profile Photo</h3>
                  <p>JPG, PNG (Max 5MB)</p>
                </div>
              </div>
            </section>

            {/* Accordion Group */}
            <div className="personal-tab-accordion-group">
              {/* Personal Information Accordion */}
              <div
                className={`personal-tab-accordion-item ${
                  expandedSections.personalInfo ? "open" : ""
                }`}
              >
                <div
                  className="personal-tab-accordion-header"
                  onClick={() => toggleSection("personalInfo")}
                >
                  <div className="personal-tab-accordion-title">
                    <UserIcon className="personal-tab-accordion-icon" />
                    Personal Information
                  </div>
                  {expandedSections.personalInfo ? <FaMinus /> : <FaPlus />}
                </div>
                {expandedSections.personalInfo && (
                  <div className="personal-tab-accordion-content">
                    <div className="personal-tab-form-grid">
                      <div className="personal-tab-form-field">
                        <label className="personal-tab-form-label">
                          <UserIcon className="personal-tab-input-icon" />
                          Full Name
                        </label>
                        <input
                          type="text"
                          name="fullNames"
                          value={formData.fullNames}
                          onChange={handleInputChange}
                          className={`personal-tab-form-input ${
                            errors.fullNames ? "error" : ""
                          }`}
                          disabled
                        />
                        {errors.fullNames && (
                          <span className="personal-tab-error-message">
                            {errors.fullNames}
                          </span>
                        )}
                      </div>

                      <div className="personal-tab-form-field">
                        <label className="personal-tab-form-label">
                          <PhoneIcon className="personal-tab-input-icon" />
                          Phone Number
                        </label>
                        <input
                          type="tel"
                          name="phoneNumber"
                          value={formData.phoneNumber}
                          onChange={handleInputChange}
                          placeholder="0712345678"
                          className={`personal-tab-form-input ${
                            errors.phoneNumber ? "error" : ""
                          }`}
                        />
                        {errors.phoneNumber && (
                          <span className="personal-tab-error-message">
                            {errors.phoneNumber}
                          </span>
                        )}
                      </div>

                      <div className="personal-tab-form-field">
                        <label className="personal-tab-form-label">
                          <MailIcon className="personal-tab-input-icon" />
                          Email Address
                        </label>
                        <input
                          type="email"
                          name="email"
                          value={formData.email}
                          onChange={handleInputChange}
                          placeholder="example@domain.com"
                          className={`personal-tab-form-input ${
                            errors.email ? "error" : ""
                          }`}
                        />
                        {errors.email && (
                          <span className="personal-tab-error-message">
                            {errors.email}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* ID Document Accordion */}
              <div
                className={`personal-tab-accordion-item ${
                  expandedSections.idDocument ? "open" : ""
                }`}
              >
                <div
                  className="personal-tab-accordion-header"
                  onClick={() => toggleSection("idDocument")}
                >
                  <div className="personal-tab-accordion-title">
                    <IdCardIcon className="personal-tab-accordion-icon" />
                    ID Document
                  </div>
                  {expandedSections.idDocument ? <FaMinus /> : <FaPlus />}
                </div>
                {expandedSections.idDocument && (
                  <div className="personal-tab-accordion-content">
                    <div className="personal-tab-form-field">
                      <label className="personal-tab-form-label">
                        ID Number
                      </label>
                      <input
                        type="text"
                        name="iDNumber"
                        value={formData.iDNumber}
                        onChange={handleInputChange}
                        placeholder="12345678"
                        className={`personal-tab-form-input ${
                          errors.iDNumber ? "error" : ""
                        }`}
                      />
                      {errors.iDNumber && (
                        <span className="personal-tab-error-message">
                          {errors.iDNumber}
                        </span>
                      )}
                    </div>

                    <div className="personal-tab-document-upload-grid">
                      <div className="personal-tab-document-uploader">
                        <h3>Front Side</h3>
                        <div
                          className="personal-tab-document-preview"
                          onClick={() => idFrontInputRef.current.click()}
                        >
                          {previewIdFront ? (
                            <>
                              <img src={previewIdFront} alt="ID Front" />
                              <button
                                type="button"
                                className="personal-tab-remove-doc-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage("idFront");
                                }}
                              >
                                <TrashIcon />
                              </button>
                            </>
                          ) : (
                            <div className="personal-tab-document-placeholder">
                              <IdCardIcon className="personal-tab-doc-icon" />
                              <p>Upload front side</p>
                            </div>
                          )}
                          <button
                            type="button"
                            className="personal-tab-upload-doc-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              idFrontInputRef.current.click();
                            }}
                          >
                            <UploadIcon /> Select File
                          </button>
                          <input
                            type="file"
                            ref={idFrontInputRef}
                            onChange={(e) => handleImageUpload("idFront", e)}
                            accept="image/*"
                            hidden
                          />
                        </div>
                      </div>

                      <div className="personal-tab-document-uploader">
                        <h3>Back Side</h3>
                        <div
                          className="personal-tab-document-preview"
                          onClick={() => idBackInputRef.current.click()}
                        >
                          {previewIdBack ? (
                            <>
                              <img src={previewIdBack} alt="ID Back" />
                              <button
                                type="button"
                                className="personal-tab-remove-doc-btn"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRemoveImage("idBack");
                                }}
                              >
                                <TrashIcon />
                              </button>
                            </>
                          ) : (
                            <div className="personal-tab-document-placeholder">
                              <IdCardIcon className="personal-tab-doc-icon" />
                              <p>Upload back side</p>
                            </div>
                          )}
                          <button
                            type="button"
                            className="personal-tab-upload-doc-btn"
                            onClick={(e) => {
                              e.stopPropagation();
                              idBackInputRef.current.click();
                            }}
                          >
                            <UploadIcon /> Select File
                          </button>
                          <input
                            type="file"
                            ref={idBackInputRef}
                            onChange={(e) => handleImageUpload("idBack", e)}
                            accept="image/*"
                            hidden
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* KRA PIN Accordion */}
              <div
                className={`personal-tab-accordion-item ${
                  expandedSections.kraPin ? "open" : ""
                }`}
              >
                <div
                  className="personal-tab-accordion-header"
                  onClick={() => toggleSection("kraPin")}
                >
                  <div className="personal-tab-accordion-title">
                    <DocumentIcon className="personal-tab-accordion-icon" />
                    KRA PIN
                  </div>
                  {expandedSections.kraPin ? <FaMinus /> : <FaPlus />}
                </div>
                {expandedSections.kraPin && (
                  <div className="personal-tab-accordion-content">
                    <div className="personal-tab-form-field">
                      <label className="personal-tab-form-label">
                        KRA PIN Number
                      </label>
                      <input
                        type="text"
                        name="kRAPin"
                        value={formData.kRAPin}
                        onChange={handleInputChange}
                        placeholder="A123456789X"
                        className={`personal-tab-form-input ${
                          errors.kRAPin ? "error" : ""
                        }`}
                      />
                      {errors.kRAPin && (
                        <span className="personal-tab-error-message">
                          {errors.kRAPin}
                        </span>
                      )}
                    </div>

                    <div className="personal-tab-document-uploader single">
                      <h3>KRA PIN Document</h3>
                      <div
                        className="personal-tab-document-preview"
                        onClick={() => kraPinInputRef.current.click()}
                      >
                        {previewKraPin ? (
                          <>
                            <img src={previewKraPin} alt="KRA PIN" />
                            <button
                              type="button"
                              className="personal-tab-remove-doc-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleRemoveImage("kraPin");
                              }}
                            >
                              <TrashIcon />
                            </button>
                          </>
                        ) : (
                          <div className="personal-tab-document-placeholder">
                            <DocumentTextIcon className="personal-tab-doc-icon" />
                            <p>Upload KRA PIN document</p>
                          </div>
                        )}
                        <button
                          type="button"
                          className="personal-tab-upload-doc-btn"
                          onClick={(e) => {
                            e.stopPropagation();
                            kraPinInputRef.current.click();
                          }}
                        >
                          <UploadIcon /> Select File
                        </button>
                        <input
                          type="file"
                          ref={kraPinInputRef}
                          onChange={(e) => handleImageUpload("kraPin", e)}
                          accept="image/*"
                          hidden
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Beneficiariers and Next Of Kin */}
        {activeTab === "beneficiaries" && (
          <>
            {/* Next of Kin Section */}
            <div className="form-section">
              <div
                className="section-header"
                onClick={() => toggleSection("nextOfKin")}
              >
                <h2>Next of Kin</h2>
                {expandedSections.nextOfKin ? <FaMinus /> : <FaPlus />}
              </div>

              {expandedSections.nextOfKin && (
                <div className="section-content expanded">
                  <form onSubmit={saveNextOfKin}>
                    {nextOfKins.map((kin, index) => (
                      <div key={index} className="kin-entry">
                        <div className="form-group">
                          <label>Full Name</label>
                          <input
                            type="text"
                            value={kin.name}
                            onChange={(e) =>
                              handleNextOfKinChange(
                                index,
                                "name",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>Email</label>
                          <input
                            type="email"
                            value={kin.email}
                            onChange={(e) =>
                              handleNextOfKinChange(
                                index,
                                "email",
                                e.target.value
                              )
                            }
                            required
                          />
                        </div>

                        <div className="form-group">
                          <label>ID Number</label>
                          <input
                            type="text"
                            value={kin.idNumber}
                            required
                            onChange={(e) =>
                              handleNextOfKinChange(
                                index,
                                "idNumber",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Phone</label>
                          <input
                            type="tel"
                            value={kin.phone}
                            required
                            onChange={(e) =>
                              handleNextOfKinChange(
                                index,
                                "phone",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Relationship</label>
                          <select
                            value={kin.relationshipType}
                            required
                            onChange={(e) =>
                              handleNextOfKinChange(
                                index,
                                "relationshipType",
                                e.target.value
                              )
                            }
                          >
                            <option value="">Select Relationship</option>
                            <option value="Father">Father</option>
                            <option value="Mother">Mother</option>
                            <option value="Spouse">Spouse</option>
                            <option value="Sibling">Sibling</option>
                            <option value="Child">Child</option>
                          </select>
                        </div>

                        <div className="form-group">
                          <label>Date of Birth</label>
                          <input
                            type="date"
                            value={kin.dob}
                            required
                            onChange={(e) =>
                              handleNextOfKinChange(
                                index,
                                "dob",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="form-group">
                          <label>Address</label>
                          <input
                            type="text"
                            value={kin.address}
                            required
                            onChange={(e) =>
                              handleNextOfKinChange(
                                index,
                                "address",
                                e.target.value
                              )
                            }
                          />
                        </div>

                        <div className="form-group checkbox-group">
                          <label className="checkbox-label">
                            <input
                              type="checkbox"
                              checked={kin.isBeneficiary}
                              required
                              onChange={(e) =>
                                handleNextOfKinChange(
                                  index,
                                  "isBeneficiary",
                                  e.target.checked
                                )
                              }
                            />
                            <span className="checkbox-text">
                              Is Beneficiary
                            </span>
                          </label>
                        </div>

                        <button
                          type="button"
                          className="remove-kin-btn"
                          onClick={() => removeNextOfKin(index)}
                        >
                          <FaTimes /> Remove
                        </button>
                      </div>
                    ))}

                    <div className="form-actions">
                      <button
                        type="button"
                        className="submit-btn secondary"
                        onClick={saveNextOfKin}
                      >
                        Save Next of Kin
                      </button>
                    </div>
                  </form>

                  <button
                    type="button"
                    className="add-kin-btn"
                    onClick={addNextOfKin}
                  >
                    <FaPlus /> Add Next of Kin
                  </button>
                </div>
              )}
            </div>

            {/* Nominees Section */}
            <div className="form-section">
              <div
                className="section-header"
                onClick={() => toggleSection("nominee")}
              >
                <h2>Nominees</h2>
                {expandedSections.nominee ? <FaMinus /> : <FaPlus />}
              </div>

              {expandedSections.nominee && (
                <div className="section-content expanded">
                  {nominees.map((nominee, index) => (
                    <div key={index} className="kin-entry">
                      <div className="form-group">
                        <label>Full Name</label>
                        <input
                          type="text"
                          value={nominee.name}
                          onChange={(e) =>
                            handleNomineeChange(index, "name", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Email</label>
                        <input
                          type="email"
                          value={nominee.email}
                          onChange={(e) =>
                            handleNomineeChange(index, "email", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>ID Number</label>
                        <input
                          type="text"
                          value={nominee.idNumber}
                          onChange={(e) =>
                            handleNomineeChange(
                              index,
                              "idNumber",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Phone</label>
                        <input
                          type="tel"
                          value={nominee.phone}
                          onChange={(e) =>
                            handleNomineeChange(index, "phone", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Relationship</label>
                        <select
                          value={nominee.relationshipType}
                          onChange={(e) =>
                            handleNomineeChange(
                              index,
                              "relationshipType",
                              e.target.value
                            )
                          }
                        >
                          <option value="">Select Relationship</option>
                          <option value="Father">Father</option>
                          <option value="Mother">Mother</option>
                          <option value="Spouse">Spouse</option>
                          <option value="Sibling">Sibling</option>
                          <option value="Child">Child</option>
                          <option value="Brother">Brother</option>
                          <option value="Sister">Sister</option>
                        </select>
                      </div>

                      <div className="form-group">
                        <label>Date of Birth</label>
                        <input
                          type="date"
                          value={nominee.dob}
                          onChange={(e) =>
                            handleNomineeChange(index, "dob", e.target.value)
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Address</label>
                        <input
                          type="text"
                          value={nominee.address}
                          onChange={(e) =>
                            handleNomineeChange(
                              index,
                              "address",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      <div className="form-group">
                        <label>Allocation (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="100"
                          step="0.1"
                          value={nominee.allocation}
                          onChange={(e) =>
                            handleNomineeChange(
                              index,
                              "allocation",
                              e.target.value
                            )
                          }
                        />
                      </div>

                      {calculateAge(nominee.dob) < 18 && (
                        <div className="form-group">
                          <label>Guardian Name</label>
                          <input
                            type="text"
                            value={nominee.guardian}
                            onChange={(e) =>
                              handleNomineeChange(
                                index,
                                "guardian",
                                e.target.value
                              )
                            }
                          />
                        </div>
                      )}

                      <div className="form-group checkbox-group">
                        <label className="checkbox-label">
                          <input
                            type="checkbox"
                            checked={nominee.isBeneficiary}
                            onChange={(e) =>
                              handleNomineeChange(
                                index,
                                "isBeneficiary",
                                e.target.checked
                              )
                            }
                          />
                          <span className="checkbox-text">Is Beneficiary</span>
                        </label>
                      </div>

                      <button
                        type="button"
                        className="remove-kin-btn"
                        onClick={() => removeNominee(index)}
                      >
                        <FaTimes /> Remove
                      </button>
                    </div>
                  ))}

                  <div className="form-actions">
                    <button
                      type="button"
                      className="submit-btn secondary"
                      onClick={saveNominees}
                    >
                      Save Nominees
                    </button>
                  </div>

                  <button
                    type="button"
                    className="add-kin-btn"
                    onClick={addNominee}
                  >
                    <FaPlus /> Add Nominee
                  </button>
                </div>
              )}
            </div>
          </>
        )}

        {/* Form Submission */}
        <div className="form-actions main-actions">
          <button
            type="submit"
            className="submit-btn primary"
            disabled={isSubmitting}
          >
            {isSubmitting ? (
              <>
                <span className="spinner"></span> Saving...
              </>
            ) : (
              "Save All Changes"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EditProfile;
