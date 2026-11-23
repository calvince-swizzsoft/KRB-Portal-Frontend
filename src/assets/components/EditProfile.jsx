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
import { Link, useLocation } from "react-router-dom";
import { authorizedFetch } from "../js/authorizedFetch";
import "../css/EditProfile.css";

const emptyContact = {
  name: "",
  email: "",
  idNumber: "",
  phone: "",
  relationshipType: "",
  dob: "",
  address: "",
  isBeneficiary: false,
};
const emptyNominee = { ...emptyContact, allocation: 0, guardian: "", isGuardian: false };
const kinRelationships = ["Father", "Mother", "Spouse", "Sibling", "Child"];
const nomineeRelationships = [...kinRelationships, "Brother", "Sister"];
const maxProfileImageBytes = 5_000_000;

const imagePreview = (base64) => base64 ? `data:image/png;base64,${base64}` : null;

function toDateInput(value = "") {
  const isoDate = value.match(/^\d{4}-\d{2}-\d{2}(?=$|T| )/)?.[0];
  if (isoDate) return isoDate;

  const date = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!date) return "";
  const [, month, day, year] = date;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
}

const contactFields = [
  ["name", "Full name", "text"],
  ["phone", "Phone number", "tel"],
  ["email", "Email address", "email"],
  ["idNumber", "ID number", "text"],
  ["dob", "Date of birth", "date"],
  ["address", "Address", "text"],
];

function ContactCards({ title, label, records, onOpen }) {
  return (
    <section className="profile-contact-section" aria-label={title}>
      <div className="profile-contact-heading">
        <h2>{title}</h2>
        <button type="button" className="add-kin-btn" onClick={() => onOpen()}>
          <FaPlus aria-hidden="true" /> Add {label}
        </button>
      </div>
      {records.length === 0 ? (
        <p className="profile-contact-empty">No saved {title.toLowerCase()}.</p>
      ) : (
        <ul className="profile-contact-grid">
          {records.map((record, index) => (
            <li className="profile-contact-card" key={index}>
              <div>
                <strong>{record.name || "Unnamed record"}</strong>
                <p>
                  {record.relationshipType || "Relationship unspecified"}
                  {record.isGuardian ? <span> · Guardian</span> : (
                    record.allocation !== undefined && <span> · {record.allocation}% allocation</span>
                  )}
                </p>
                {(record.idNumber || record.phone || record.email || record.guardian) && (
                  <dl className="profile-contact-summary">
                    {record.idNumber && <div><dt>ID number</dt><dd>{record.idNumber}</dd></div>}
                    {record.phone && <div><dt>Phone</dt><dd>{record.phone}</dd></div>}
                    {record.email && (
                      <div>
                        <dt>Email</dt>
                        <dd className="profile-contact-email" title={record.email}>{record.email}</dd>
                      </div>
                    )}
                    {record.guardian && <div><dt>Guardian</dt><dd>{record.guardian}</dd></div>}
                  </dl>
                )}
              </div>
              <button
                type="button"
                className="profile-contact-edit"
                aria-label={`Edit ${record.name || label}`}
                onClick={() => onOpen(index)}
              >
                Edit
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function ContactEditor({ editor, pending, onChange, onCancel, onSave }) {
  const { kind, index, draft } = editor;
  const isNominee = kind === "nominee";
  const label = isNominee ? "Nominee" : "Next of Kin";
  const relationships = isNominee ? nomineeRelationships : kinRelationships;

  return (
    <section className="profile-contact-section" aria-labelledby="profile-contact-title">
      <h2 id="profile-contact-title">{index === null ? "Add" : "Edit"} {label}</h2>
      {draft.incomplete && (
        <p>Some saved details are unavailable. Re-enter them before saving changes.</p>
      )}
      {isNominee && <p>Save a separate Guardian record before adding a beneficiary under 18.</p>}
      <fieldset className="profile-contact-fields" disabled={pending}>
        {contactFields.map(([field, caption, type]) => (
          <label className="profile-contact-field" key={field}>
            {caption}
            <input
              type={type}
              value={draft[field]}
              maxLength={field === "idNumber" ? (isNominee ? 40 : 20) : undefined}
              readOnly={field === "name" && index !== null}
              onChange={(event) => onChange(field, event.target.value)}
            />
            {field === "name" && index !== null && <small>The ERP uses this name to identify the record.</small>}
          </label>
        ))}
        <label className="profile-contact-field">
          Relationship
          <select value={draft.relationshipType} onChange={(event) => onChange("relationshipType", event.target.value)}>
            <option value="">Select relationship</option>
            {draft.relationshipType && !relationships.includes(draft.relationshipType) && (
              <option value={draft.relationshipType}>{draft.relationshipType}</option>
            )}
            {relationships.map((relationship) => (
              <option key={relationship} value={relationship}>{relationship}</option>
            ))}
          </select>
        </label>
        {isNominee && (
          <>
            <label className="profile-contact-field">
              Record type
              <select value={draft.isGuardian ? "guardian" : "nominee"}
                onChange={(event) => onChange("isGuardian", event.target.value === "guardian")}>
                <option value="nominee">Nominee</option>
                <option value="guardian">Guardian</option>
              </select>
            </label>
            {!draft.isGuardian && (
              <>
            <label className="profile-contact-field">
              Allocation (%)
              <input type="number" min="1" max="100" step="any" value={draft.allocation}
                onChange={(event) => onChange("allocation", event.target.value)} />
            </label>
            <label className="profile-contact-field">
              Guardian
              <input type="text" value={draft.guardian}
                onChange={(event) => onChange("guardian", event.target.value)} />
            </label>
            <label className="profile-contact-checkbox">
              <input type="checkbox" checked={draft.isBeneficiary}
                onChange={(event) => onChange("isBeneficiary", event.target.checked)} />
              Is Beneficiary
            </label>
              </>
            )}
          </>
        )}
      </fieldset>
      <div className="profile-contact-actions">
        <button type="button" className="profile-contact-edit" disabled={pending} onClick={onCancel}>Cancel</button>
        <button type="button" className="submit-btn primary" disabled={pending} onClick={onSave}>
          {pending ? "Saving…" : `Save ${label}`}
        </button>
      </div>
    </section>
  );
}

const EditProfile = () => {
  const pendingLoanCode = useLocation().state?.pendingLoanCode;
  // State for responsive design
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  // Image states
  const [previewImage, setPreviewImage] = useState(null);
  const [savedProfileImage, setSavedProfileImage] = useState(null);
  const [previewIdFront, setPreviewIdFront] = useState(null);
  const [previewIdBack, setPreviewIdBack] = useState(null);
  const [previewKraPin, setPreviewKraPin] = useState(null);
  const [savedDocuments, setSavedDocuments] = useState({});
  const [activeTab, setActiveTab] = useState("personal");

  // Form sections state
  const [expandedSections, setExpandedSections] = useState({
    personalInfo: true,
    idDocument: false,
    kraPin: false,
  });

  const memberNumber = sessionStorage.getItem("memberNo") || "";

  const [formData, setFormData] = useState({
    fullNames: "",
    phoneNumber: "",
    email: "",
    iDNumber: "",
    kRAPin: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Next of Kin and Nominees state
  const [nextOfKins, setNextOfKins] = useState([]);
  const [nominees, setNominees] = useState([]);
  const [profileStatus, setProfileStatus] = useState("loading");
  const [contactEditor, setContactEditor] = useState(null);
  const [isSavingContact, setIsSavingContact] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function loadProfile() {
      try {
        if (!memberNumber) throw new Error("Member number is missing");
        const response = await authorizedFetch(
          `/api/member-profile/?member_no=${encodeURIComponent(memberNumber)}`,
          { signal: controller.signal }
        );
        const result = await response.json();
        if (!response.ok || result.status !== "success" || !result.profile) {
          throw new Error("Could not load member profile");
        }
        if (controller.signal.aborted) return;

        const kin = (result.next_of_kin ?? []).map((record) => ({
          ...emptyContact,
          name: record.Name ?? "",
          email: record.Email ?? "",
          phone: record.Telephone ?? "",
          relationshipType: record.Relationship ?? "",
          idNumber: record.IDNumber ?? "",
          address: record.Address ?? "",
          dob: toDateInput(record.DOB ?? ""),
          isBeneficiary: record.IsBeneficiary === true,
        }));
        const savedNominees = (result.nominees ?? []).map((record) => ({
          ...emptyNominee,
          name: record.Name ?? "",
          dob: toDateInput(record.DOB ?? ""),
          relationshipType: record.Relationship ?? "",
          email: record.Email ?? "",
          idNumber: record.IDNumber ?? "",
          phone: record.Telephone ?? "",
          address: record.Address ?? "",
          isBeneficiary: record.IsBeneficiary === true,
          allocation: parseFloat(record.Allocation) || 0,
          guardian: record.Guardian ?? "",
          isGuardian: record.IsGuardian === true,
          incomplete: !Object.hasOwn(record, "IDNumber"),
        }));
        const profile = result.profile;
        setFormData({
          fullNames: profile.FullName ?? "",
          phoneNumber: profile.Phone ?? "",
          email: profile.Email ?? "",
          iDNumber: profile.IDNumber ?? "",
          kRAPin: profile.KRAPin ?? "",
        });
        setSavedProfileImage(imagePreview(profile.ImageBase64));
        setSavedDocuments({
          idFront: imagePreview(profile.IdFrontBase64),
          idBack: imagePreview(profile.IdBackBase64),
          kraPin: imagePreview(profile.KraPinDocumentBase64),
        });
        setNextOfKins(kin);
        setNominees(savedNominees);
        setProfileStatus("ready");
      } catch {
        if (!controller.signal.aborted) setProfileStatus("error");
      }
    }

    loadProfile();
    return () => controller.abort();
  }, [memberNumber]);

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
    if (file.size > maxProfileImageBytes) {
      e.target.value = "";
      toast.error("Select an image that is 5 MB or smaller.");
      return;
    }

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

  const openContactEditor = (kind, index = null) => {
    const records = kind === "nominee" ? nominees : nextOfKins;
    const emptyRecord = kind === "nominee" ? emptyNominee : emptyContact;
    setContactEditor({ kind, index, draft: { ...(index === null ? emptyRecord : records[index]) } });
  };

  const changeContact = (field, value) => {
    setContactEditor((editor) => ({
      ...editor,
      draft: { ...editor.draft, [field]: value },
    }));
  };

  // Calculate age from date of birth
  const calculateAge = (dob) => {
    if (!dob) return 0;
    const birthDate = new Date(dob + "T00:00:00");
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Validate form - Made optional, only validate if field has value
  const validateForm = () => {
    const newErrors = {};
    
    // Only validate phone if it has value
    if (formData.phoneNumber.trim() && !/^\d{10}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = "Phone number must be 10 digits";
    }

    // Only validate email if it has value
    if (formData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email";
    }

    // Only validate ID number if it has value
    if (formData.iDNumber.trim() && !/^\d{7,8}$/.test(formData.iDNumber)) {
      newErrors.iDNumber = "ID number must be 7 or 8 digits";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveContact = async () => {
    if (!contactEditor || isSavingContact) return;

    const { kind, index, draft } = contactEditor;
    const isNominee = kind === "nominee";
    const label = isNominee ? "nominee" : "next of kin";
    const records = isNominee ? nominees : nextOfKins;
    const setRecords = isNominee ? setNominees : setNextOfKins;
    const name = index === null ? draft.name.trim() : draft.name;
    if (!name.trim() || !draft.relationshipType.trim()) {
      toast.error("Full name and relationship are required.");
      return;
    }
    if (index === null && records.some((record) => record.name.trim().toLowerCase() === name.toLowerCase())) {
      toast.error("A record with this name already exists. Open its card to edit it.");
      return;
    }

    let allocation;
    const isGuardian = isNominee && draft.isGuardian;
    const isBeneficiary = !isGuardian && draft.isBeneficiary;
    if (isNominee && !isGuardian) {
      allocation = Number(draft.allocation);
      if (!Number.isFinite(allocation) || allocation < 1 || allocation > 100) {
        toast.error("Enter an allocation between 1% and 100%.");
        return;
      }
      const otherAllocation = nominees.reduce(
        (total, { allocation }, row) => row === index ? total : total + allocation,
        0
      );
      if (Math.round((otherAllocation + allocation) * 1e10) / 1e10 > 100) {
        toast.error("Total nominee allocation cannot exceed 100%.");
        return;
      }
      if (isBeneficiary && (!draft.dob || new Date(draft.dob + "T00:00:00") > new Date())) {
        toast.error("Enter a valid date of birth for the beneficiary.");
        return;
      }
      if (isBeneficiary && calculateAge(draft.dob) < 18 &&
          !nominees.some((nominee, row) => row !== index && nominee.isGuardian)) {
        toast.error("Add a separate Guardian record before saving a beneficiary under 18.");
        return;
      }
    }

    const prefix = isNominee ? "nominee" : "nextOfKin";
    const body = {
      memberNumber,
      [prefix + "Name"]: name,
      [prefix + "Email"]: draft.email,
      [prefix + "IdNumber"]: draft.idNumber,
      [prefix + "Telephone"]: draft.phone,
      [prefix + "RelationshipType"]: draft.relationshipType,
      [prefix + "DOB"]: draft.dob,
      [prefix + "Address"]: draft.address,
      [prefix + "IsBeneficiary"]: isBeneficiary,
    };
    if (isNominee) {
      body.nomineeAllocation = isGuardian ? 0 : allocation;
      body.nomineeGuardian = isGuardian ? "" : draft.guardian;
      body.nomineeIsGuardian = isGuardian;
    }

    setIsSavingContact(true);
    try {
      const response = await authorizedFetch(
        isNominee ? "/api/update-nominee/" : "/api/update-next-of-kin/",
        { method: "POST", body: JSON.stringify(body) }
      );
      if (!response.ok) {
        const result = await response.json().catch(() => null);
        if (result?.code === "next_of_kin_unconfirmed" || result?.code === "next_of_kin_validation" ||
            result?.code === "nominee_service_outdated" ||
            (isNominee && response.status === 400 && result?.message)) {
          toast.error(result.error || result.message);
          return;
        }
        throw new Error("Could not save " + label + ".");
      }

      const record = { ...draft, name, isBeneficiary };
      if (isNominee) record.allocation = body.nomineeAllocation;
      setRecords((current) => index === null
        ? [...current, record]
        : current.map((item, row) => row === index ? record : item)
      );
      setContactEditor(null);
      toast.success(isNominee ? "Nominee saved." : "Next of kin saved.");
    } catch {
      toast.error("Could not save " + label + ". Your changes are still open.");
    } finally {
      setIsSavingContact(false);
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (activeTab !== "personal" || profileStatus !== "ready" || !validateForm()) return;

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
        if (previewImage) setSavedProfileImage(previewImage);
        setPreviewImage((current) => current === previewImage ? null : current);
        setSavedDocuments((documents) => ({
          idFront: previewIdFront || documents.idFront,
          idBack: previewIdBack || documents.idBack,
          kraPin: previewKraPin || documents.kraPin,
        }));
        setPreviewIdFront((current) => current === previewIdFront ? null : current);
        setPreviewIdBack((current) => current === previewIdBack ? null : current);
        setPreviewKraPin((current) => current === previewKraPin ? null : current);
        toast.success("Profile updated successfully");
      } else {
        if (response.status === 413) {
          toast.error("Each profile or document image must be 5 MB or smaller.");
        } else {
          toast.error("Failed to update profile");
        }
      }
    } catch (error) {
      toast.error("An error occurred while updating profile");
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
            type="button"
            className={activeTab === "personal" ? "tab active" : "tab"}
            onClick={() => setActiveTab("personal")}
          >
            Personal Info
          </button>
          <button
            type="button"
            className={activeTab === "beneficiaries" ? "tab active" : "tab"}
            onClick={() => setActiveTab("beneficiaries")}
          >
            Next of Kin and Nominees
          </button>
        </div>

        {profileStatus === "loading" && <p role="status">Loading your profile…</p>}
        {profileStatus === "error" && (
          <p role="alert">Could not load your profile. Reload the page to try again.</p>
        )}

        {/* Personal tab */}
        {activeTab === "personal" && profileStatus === "ready" && (
          <div className="personal-tab">
            <p>Maximum upload size is 5 MB per image.</p>
            {/* Profile Section */}
            <section className="personal-tab-profile-card">
              <div className="personal-tab-avatar-upload">
                <div
                  className="personal-tab-avatar-preview"
                  onClick={() => profileInputRef.current.click()}
                >
                  {previewImage || savedProfileImage ? (
                    <img
                      src={previewImage || savedProfileImage}
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
                          {(previewIdFront || savedDocuments.idFront) ? (
                            <>
                              <img src={previewIdFront || savedDocuments.idFront} alt="ID Front" />
                              {previewIdFront && (
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
                              )}
                            </>
                          ) : (
                            <div className="personal-tab-document-placeholder">
                              <IdCardIcon className="personal-tab-doc-icon" />
                              <p>Select a file to upload the front of your ID.</p>
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
                          {(previewIdBack || savedDocuments.idBack) ? (
                            <>
                              <img src={previewIdBack || savedDocuments.idBack} alt="ID Back" />
                              {previewIdBack && (
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
                              )}
                            </>
                          ) : (
                            <div className="personal-tab-document-placeholder">
                              <IdCardIcon className="personal-tab-doc-icon" />
                              <p>Select a file to upload the back of your ID.</p>
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
                        {(previewKraPin || savedDocuments.kraPin) ? (
                          <>
                            <img src={previewKraPin || savedDocuments.kraPin} alt="KRA PIN" />
                            {previewKraPin && (
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
                            )}
                          </>
                        ) : (
                          <div className="personal-tab-document-placeholder">
                            <DocumentTextIcon className="personal-tab-doc-icon" />
                            <p>Select a file to upload your KRA PIN document.</p>
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

        {activeTab === "beneficiaries" && profileStatus === "ready" && (
          contactEditor ? (
            <ContactEditor
              editor={contactEditor}
              pending={isSavingContact}
              onChange={changeContact}
              onCancel={() => setContactEditor(null)}
              onSave={saveContact}
            />
          ) : (
            <div className="profile-contact-sections">
              <ContactCards title="Next of Kin" label="Next of Kin" records={nextOfKins}
                onOpen={(index) => openContactEditor("kin", index)} />
              <ContactCards title="Nominees" label="Nominee" records={nominees}
                onOpen={(index) => openContactEditor("nominee", index)} />
            </div>
          )
        )}

        {/* Form Submission */}
        {activeTab === "personal" && profileStatus === "ready" && (
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
                "Save Personal Details"
              )}
            </button>
          </div>
        )}
      </form>
      {pendingLoanCode && (
        <div className="form-actions">
          <Link
            className="submit-btn secondary"
            to="/Home/loan-application"
            state={{ reviewedLoanCode: pendingLoanCode }}
          >
            My details are current. Continue to loan
          </Link>
        </div>
      )}
    </div>
  );
};

export default EditProfile;
