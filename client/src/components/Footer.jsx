/**
 * Footer Component
 */
import { FiGlobe, FiDollarSign } from 'react-icons/fi';
import './Footer.css';

export default function Footer() {
  return (
    <footer className="footer" id="main-footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-section">
            <h4 className="footer-heading">Support</h4>
            <a href="#" className="footer-link">Help Centre</a>
            <a href="#" className="footer-link">Safety information</a>
            <a href="#" className="footer-link">Cancellation options</a>
            <a href="#" className="footer-link">Report a concern</a>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">Hosting</h4>
            <a href="#" className="footer-link">StayFinder your home</a>
            <a href="#" className="footer-link">Explore hosting resources</a>
            <a href="#" className="footer-link">Community forum</a>
            <a href="#" className="footer-link">Responsible hosting</a>
          </div>
          <div className="footer-section">
            <h4 className="footer-heading">StayFinder</h4>
            <a href="#" className="footer-link">Newsroom</a>
            <a href="#" className="footer-link">Careers</a>
            <a href="#" className="footer-link">Investors</a>
            <a href="#" className="footer-link">Gift cards</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p className="footer-copyright">© 2026 StayFinder, Inc. · Privacy · Terms · Sitemap</p>
          <div className="footer-locale">
            <button className="footer-locale-btn">
              <FiGlobe size={14} /> English (IN)
            </button>
            <button className="footer-locale-btn">
              <FiDollarSign size={14} /> INR
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
}
