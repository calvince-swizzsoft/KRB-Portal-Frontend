import React, { useEffect, useState } from 'react';
import banner from "../img/KRBLogo.png";
import "../css/GurantorStatement.css";
import { authorizedFetch } from '../js/authorizedFetch';
import KrbsacoLoader from './KrbsacoLoader';

function ShareCertificateStatement() {
  const [pdfUrl, setPdfUrl] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  const memberNo = sessionStorage.getItem("memberNo");

  useEffect(() => {
    const checkIfMobile = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    checkIfMobile();
    window.addEventListener('resize', checkIfMobile);
    
    return () => window.removeEventListener('resize', checkIfMobile);
  }, []);

  useEffect(() => {
    if (!memberNo) {
      setError("Member number not found");
      return;
    }

    const fetchPDF = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await authorizedFetch(`/api/member-share-certificate/?member_no=${memberNo}`,
          {
            method: "GET",
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(errorText || `Server error: ${response.status}`);
        }

        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/pdf')) {
          throw new Error('Invalid response format - expected PDF');
        }

        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        setPdfUrl(url);
      } catch (err) {
        console.error("Fetch error:", err);
        setError(err.message || "Failed to load PDF. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchPDF();

    return () => {
      if (pdfUrl) URL.revokeObjectURL(pdfUrl);
    };
  }, [memberNo]);

  if (!memberNo) {
    return <div className="error-message">Error: No member number found</div>;
  }

  if(loading) return <KrbsacoLoader/>;

  return (
    <div className="statement-container">
      <div className="statement-card">
        <div className="statement-header">
          <img src={banner} alt="KRB Logo" className="logo-img" />
          <small className="sacco-name">Kenya Road Board Sacco</small>
        </div>

        <h2 className="statement-title">Share Certificate</h2>

        <div className="statement-content">
          {loading && (
            <div className="loading-indicator">
              <div className="spinner"></div>
              <p>Loading your statement...</p>
            </div>
          )}

          {error && <p className="error-message">{error}</p>}

          {pdfUrl && (
            <>
              {isMobile ? (
                <div className="mobile-pdf-container">
                  <p className="mobile-message">
                    For best viewing experience, please download the statement:
                  </p>
                  <div className="mobile-buttons">
                    <a 
                      href={pdfUrl} 
                      download={`member-share-certificate_${memberNo}.pdf`}
                      className="download-btn"
                    >
                      Download PDF
                    </a>
                    <a 
                      href={pdfUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="view-btn"
                    >
                      Open in PDF Viewer
                    </a>
                  </div>
                </div>
              ) : (
                <iframe
                  src={pdfUrl}
                  title="Loan Guarantor Statement"
                  className="pdf-viewer"
                />
              )}
            </>
          )}
        </div>

        {pdfUrl && !isMobile && (
          <div className="action-buttons">
            <a 
              href={pdfUrl} 
              download={`member-share-certificate_${memberNo}.pdf`}
              className="download-btn"
            >
              Download Statement
            </a>
            <a 
              href={pdfUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="view-btn"
            >
              Open in New Tab
            </a>
          </div>
        )}
      </div>
    </div>
  );
}

export default ShareCertificateStatement;