import React from "react";
import "../css/ConfirmModal.css";

function ConfirmModal({ title, message, onConfirm, onCancel }) {
  return (
    <div className="confirm-overlay">
      <div className="confirm-modal">
        <h3>{title || "Confirm Action"}</h3>
        <p>{message || "Are you sure you want to proceed?"}</p>
        <div className="modal-actions">
          <button className="confirm-btn" onClick={onConfirm}>
            Yes, Delete
          </button>
          <button className="cancel-btn" onClick={onCancel}>
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;