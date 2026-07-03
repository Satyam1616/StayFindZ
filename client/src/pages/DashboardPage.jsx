/**
 * DashboardPage — Host dashboard with listings, bookings management, and earnings
 */
import { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import {
  FiGrid, FiCalendar, FiPlus, FiEdit2, FiTrash2,
  FiStar, FiEye, FiUsers, FiMapPin, FiCheck, FiX,
  FiDollarSign, FiTrendingUp, FiBarChart2, FiClock,
} from 'react-icons/fi';
import toast from 'react-hot-toast';
import { listingsApi } from '../api/listings';
import { bookingsApi } from '../api/bookings';
import { useAuth } from '../context/AuthContext';
import './DashboardPage.css';

const STATUS_LABELS = {
  pending: 'Pending',
  confirmed: 'Confirmed',
  cancelled: 'Cancelled',
  completed: 'Completed',
};

export default function DashboardPage() {
  const { isAuthenticated, isHost, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('listings');
  const queryClient = useQueryClient();

  const { data: listingsData, isLoading: listingsLoading } = useQuery({
    queryKey: ['myListings'],
    queryFn: () => listingsApi.getMyListings().then((res) => res.data.data.listings),
    enabled: isAuthenticated && isHost,
  });

  const { data: bookingsData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['hostBookings'],
    queryFn: () => bookingsApi.getHostBookings().then((res) => res.data.data.bookings),
    enabled: isAuthenticated && isHost,
  });

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['hostStats'],
    queryFn: () => bookingsApi.getHostStats().then((res) => res.data.data.stats),
    enabled: isAuthenticated && isHost,
  });

  const approveMutation = useMutation({
    mutationFn: (id) => bookingsApi.approve(id),
    onSuccess: () => {
      toast.success('Booking approved!');
      queryClient.invalidateQueries(['hostBookings']);
      queryClient.invalidateQueries(['hostStats']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to approve'),
  });

  const rejectMutation = useMutation({
    mutationFn: (id) => bookingsApi.reject(id),
    onSuccess: () => {
      toast.success('Booking rejected');
      queryClient.invalidateQueries(['hostBookings']);
      queryClient.invalidateQueries(['hostStats']);
    },
    onError: (err) => toast.error(err.response?.data?.message || 'Failed to reject'),
  });

  if (!loading && (!isAuthenticated || !isHost)) {
    return <Navigate to="/" replace />;
  }

  const handleDelete = async (id) => {
    if (!confirm('Deactivate this listing?')) return;
    try {
      await listingsApi.delete(id);
      toast.success('Listing deactivated');
      queryClient.invalidateQueries(['myListings']);
    } catch (error) {
      toast.error('Failed to deactivate listing');
    }
  };

  const formatPrice = (price) => new Intl.NumberFormat('en-IN', {
    style: 'currency', currency: 'INR', maximumFractionDigits: 0,
  }).format(price);

  const formatDate = (date) => new Date(date).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short',
  });

  const pendingBookings = bookingsData?.filter(b => b.status === 'pending') || [];

  return (
    <div className="dashboard-page container" id="dashboard">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="dashboard-header">
          <h1 className="dashboard-title">Host Dashboard</h1>
          <Link to="/listings/new" className="btn btn-primary" id="add-listing-btn">
            <FiPlus size={18} /> Add Listing
          </Link>
        </div>

        {/* Tab Navigation */}
        <div className="dashboard-tabs">
          <button
            className={`tab-btn ${activeTab === 'listings' ? 'active' : ''}`}
            onClick={() => setActiveTab('listings')}
            id="tab-listings"
          >
            <FiGrid size={16} /> My Listings
            {listingsData && <span className="tab-count">{listingsData.length}</span>}
          </button>
          <button
            className={`tab-btn ${activeTab === 'bookings' ? 'active' : ''}`}
            onClick={() => setActiveTab('bookings')}
            id="tab-bookings"
          >
            <FiCalendar size={16} /> Incoming Bookings
            {pendingBookings.length > 0 && (
              <span className="tab-count tab-count-alert">{pendingBookings.length} new</span>
            )}
          </button>
          <button
            className={`tab-btn ${activeTab === 'earnings' ? 'active' : ''}`}
            onClick={() => setActiveTab('earnings')}
            id="tab-earnings"
          >
            <FiDollarSign size={16} /> Earnings
          </button>
        </div>

        {/* ─── Listings Tab ─── */}
        {activeTab === 'listings' && (
          <div className="dashboard-content">
            {listingsLoading ? (
              <div className="dashboard-grid">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '200px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : listingsData?.length === 0 ? (
              <div className="dashboard-empty">
                <p className="empty-icon">🏠</p>
                <h3>No listings yet</h3>
                <p>Start hosting by adding your first property!</p>
              </div>
            ) : (
              <div className="dashboard-grid">
                {listingsData?.map((listing) => (
                  <div key={listing.id} className="dashboard-listing-card">
                    <div className="dlc-image">
                      <img src={listing.images?.[0]} alt={listing.title} />
                      {!listing.isActive && (
                        <span className="dlc-inactive-badge">Inactive</span>
                      )}
                    </div>
                    <div className="dlc-info">
                      <h3 className="dlc-title">{listing.title}</h3>
                      <p className="dlc-location"><FiMapPin size={12} /> {listing.city}</p>
                      <div className="dlc-stats">
                        <span className="dlc-price">{formatPrice(listing.pricePerNight)}/night</span>
                        {listing.avgRating && (
                          <span className="dlc-rating"><FiStar size={12} className="star-icon" /> {listing.avgRating}</span>
                        )}
                        <span className="dlc-bookings">{listing._count?.bookings || 0} bookings</span>
                      </div>
                      <div className="dlc-actions">
                        <Link to={`/listings/${listing.id}`} className="btn btn-ghost btn-sm">
                          <FiEye size={14} /> View
                        </Link>
                        <Link to={`/listings/${listing.id}/edit`} className="btn btn-ghost btn-sm">
                          <FiEdit2 size={14} /> Edit
                        </Link>
                        <button className="btn btn-ghost btn-sm dlc-delete" onClick={() => handleDelete(listing.id)}>
                          <FiTrash2 size={14} /> Remove
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Bookings Tab ─── */}
        {activeTab === 'bookings' && (
          <div className="dashboard-content">
            {bookingsLoading ? (
              <div className="dashboard-bookings-list">
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
                ))}
              </div>
            ) : bookingsData?.length === 0 ? (
              <div className="dashboard-empty">
                <p className="empty-icon">📅</p>
                <h3>No bookings yet</h3>
                <p>Incoming reservations will appear here.</p>
              </div>
            ) : (
              <div className="dashboard-bookings-list">
                {bookingsData?.map((booking) => (
                  <div key={booking.id} className={`booking-row ${booking.status === 'pending' ? 'booking-row-pending' : ''}`}>
                    <div className="booking-row-image">
                      <img src={booking.listing?.images?.[0]} alt="" />
                    </div>
                    <div className="booking-row-info">
                      <div className="booking-row-top">
                        <h4>{booking.listing?.title}</h4>
                        <span className={`badge badge-${booking.status}`}>
                          {STATUS_LABELS[booking.status]}
                        </span>
                      </div>
                      <div className="booking-row-details">
                        <span><FiUsers size={14} /> {booking.guest?.name}</span>
                        <span><FiCalendar size={14} /> {formatDate(booking.checkIn)} — {formatDate(booking.checkOut)}</span>
                        <span className="booking-row-price">{formatPrice(booking.totalPrice)}</span>
                      </div>
                    </div>
                    {/* Approve / Reject Buttons */}
                    {booking.status === 'pending' && (
                      <div className="booking-row-actions">
                        <button
                          className="btn btn-approve"
                          onClick={() => approveMutation.mutate(booking.id)}
                          disabled={approveMutation.isPending}
                          title="Approve booking"
                        >
                          <FiCheck size={16} /> Approve
                        </button>
                        <button
                          className="btn btn-reject"
                          onClick={() => rejectMutation.mutate(booking.id)}
                          disabled={rejectMutation.isPending}
                          title="Reject booking"
                        >
                          <FiX size={16} /> Decline
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ─── Earnings Tab ─── */}
        {activeTab === 'earnings' && (
          <div className="dashboard-content">
            {statsLoading ? (
              <div className="earnings-loading">
                <div className="earnings-stats-grid">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="skeleton" style={{ height: '120px', borderRadius: '12px' }} />
                  ))}
                </div>
              </div>
            ) : !statsData ? (
              <div className="dashboard-empty">
                <p className="empty-icon">📊</p>
                <h3>No earnings data</h3>
              </div>
            ) : (
              <>
                {/* Stats Cards */}
                <div className="earnings-stats-grid">
                  <motion.div className="stat-card stat-card-primary" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0 }}>
                    <div className="stat-card-icon"><FiDollarSign size={24} /></div>
                    <div className="stat-card-content">
                      <span className="stat-card-value">{formatPrice(statsData.totalRevenue)}</span>
                      <span className="stat-card-label">Total Revenue</span>
                    </div>
                  </motion.div>
                  <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
                    <div className="stat-card-icon icon-success"><FiCheck size={24} /></div>
                    <div className="stat-card-content">
                      <span className="stat-card-value">{statsData.completedBookings + statsData.confirmedBookings}</span>
                      <span className="stat-card-label">Total Bookings</span>
                    </div>
                  </motion.div>
                  <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
                    <div className="stat-card-icon icon-warning"><FiClock size={24} /></div>
                    <div className="stat-card-content">
                      <span className="stat-card-value">{statsData.pendingCount}</span>
                      <span className="stat-card-label">Pending Requests</span>
                    </div>
                  </motion.div>
                  <motion.div className="stat-card" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
                    <div className="stat-card-icon icon-info"><FiStar size={24} /></div>
                    <div className="stat-card-content">
                      <span className="stat-card-value">{statsData.avgRating || '—'}</span>
                      <span className="stat-card-label">Average Rating ({statsData.totalReviews} reviews)</span>
                    </div>
                  </motion.div>
                </div>

                {/* Revenue Chart */}
                <div className="earnings-chart-card">
                  <div className="chart-header">
                    <h3><FiBarChart2 size={18} /> Monthly Revenue</h3>
                    <span className="chart-subtitle">Last 6 months</span>
                  </div>
                  <div className="chart-container">
                    {statsData.monthlyRevenue?.map((m, i) => {
                      const maxRev = Math.max(...statsData.monthlyRevenue.map(r => r.revenue), 1);
                      const heightPercent = (m.revenue / maxRev) * 100;
                      return (
                        <div key={m.month} className="chart-bar-group">
                          <div className="chart-bar-wrapper">
                            <motion.div
                              className="chart-bar"
                              initial={{ height: 0 }}
                              animate={{ height: `${Math.max(heightPercent, 4)}%` }}
                              transition={{ delay: i * 0.08, duration: 0.4 }}
                            />
                          </div>
                          <span className="chart-bar-label">{m.month}</span>
                          <span className="chart-bar-value">
                            {m.revenue > 0 ? formatPrice(m.revenue) : '—'}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Summary */}
                <div className="earnings-summary">
                  <div className="summary-item">
                    <FiGrid size={16} />
                    <span>{statsData.listingCount} active listing{statsData.listingCount !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="summary-item">
                    <FiTrendingUp size={16} />
                    <span>{statsData.completedBookings} completed stay{statsData.completedBookings !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="summary-item">
                    <FiCalendar size={16} />
                    <span>{statsData.confirmedBookings} upcoming booking{statsData.confirmedBookings !== 1 ? 's' : ''}</span>
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
