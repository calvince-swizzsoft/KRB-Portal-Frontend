import React, { useState, useEffect } from "react";
import { Outlet } from "react-router-dom";
import { FiMenu } from "react-icons/fi";
import Navbar from "../components/Navbar.jsx";
import styles from "../css/Layout.module.css";

const Layout = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      // Close sidebar when switching from mobile to desktop
      if (!mobile && isOpen) setIsOpen(false);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [isOpen]);

  // Close sidebar when clicking outside on mobile
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (isMobile && 
          isOpen && 
          !event.target.closest(`.${styles.sidebar}`) &&
          !event.target.closest(`.${styles.menuButton}`)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, isMobile]);

  const handleLinkClick = () => {
    if (isMobile) {
      setIsOpen(false);
    }
  };

  return (
    <div className={styles.layoutContainer}>
      <div 
        className={`${styles.sidebarOverlay} ${isOpen && isMobile ? 'isOpen' : ''}`}
        onClick={() => setIsOpen(false)}
      />
      
      {/* Sidebar */}
      <div className={`${styles.sidebar} ${(isOpen || !isMobile) ? styles.isOpen : ''}`}>
        <Navbar isOpen={isOpen} setIsOpen={setIsOpen} onLinkClick={handleLinkClick} />
      </div>

      {/* Main content */}
      <div className={styles.contentWrapper}>
        {isMobile && (
          <header className={styles.mobileHeader}>
            <div style={{ display: "flex", alignItems: "center", gap: "20%", width: "100%"}}>
              <button
                onClick={() => setIsOpen(!isOpen)}
                className={styles.menuButton}
                aria-label="Toggle menu"
              >
                <FiMenu size={24} />
              </button>
            </div>
            <div style={{ width: "24px" }} />
          </header>
        )}

        <main className={styles.mainContent}>
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default Layout;