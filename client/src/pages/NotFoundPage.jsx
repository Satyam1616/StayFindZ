/**
 * NotFoundPage — 404 handler
 */
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import './NotFoundPage.css';

export default function NotFoundPage() {
  return (
    <div className="not-found-page container" id="not-found">
      <motion.div
        className="not-found-content"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <p className="not-found-code">404</p>
        <h1>Page not found</h1>
        <p className="not-found-text">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/" className="btn btn-primary">Back to Home</Link>
      </motion.div>
    </div>
  );
}
