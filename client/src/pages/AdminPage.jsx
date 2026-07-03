/**
 * AdminPage — Platform administration dashboard
 */
import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FiUsers, FiHome, FiCalendar, FiStar, FiToggleLeft, FiToggleRight } from 'react-icons/fi';
import toast from 'react-hot-toast';
import { adminApi } from '../api/admin';
import { useAuth } from '../context/AuthContext';
import { formatPrice } from '../lib/utils';
import './AdminPage.css';

export default function AdminPage() {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const queryClient = useQueryClient();

  const { data: stats } = useQuery({
    queryKey: ['adminStats'],
    queryFn: () => adminApi.getStats().then((res) => res.data.data.stats),
    enabled: isAuthenticated && isAdmin,
  });

  const { data: users, isLoading: usersLoading } = useQuery({
    queryKey: ['adminUsers'],
    queryFn: () => adminApi.getUsers().then((res) => res.data.data.users),
    enabled: isAuthenticated && isAdmin && activeTab === 'users',
  });

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ['adminListings'],
    queryFn: () => adminApi.getListings().then((res) => res.data.data.listings),
    enabled: isAuthenticated && isAdmin && activeTab === 'listings',
  });

  if (!loading && (!isAuthenticated || !isAdmin)) {
    return <Navigate to="/" replace />;
  }

  const handleToggleListing = async (id) => {
    try {
      await adminApi.toggleListing(id);
      toast.success('Listing status updated');
      queryClient.invalidateQueries(['adminListings']);
    } catch {
      toast.error('Failed to update listing');
    }
  };

  const handleRoleChange = async (userId, role) => {
    try {
      await adminApi.updateUserRole(userId, role);
      toast.success('Role updated');
      queryClient.invalidateQueries(['adminUsers']);
    } catch {
      toast.error('Failed to update role');
    }
  };

  return (
    <div className="admin-page container" id="admin-page">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="admin-title">Admin Dashboard</h1>

        <div className="admin-tabs">
          {['overview', 'users', 'listings'].map((tab) => (
            <button
              key={tab}
              className={`tab-btn ${activeTab === tab ? 'active' : ''}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          ))}
        </div>

        {activeTab === 'overview' && stats && (
          <div className="admin-stats-grid">
            <div className="admin-stat-card">
              <FiUsers size={24} />
              <span className="stat-value">{stats.users}</span>
              <span className="stat-label">Users</span>
            </div>
            <div className="admin-stat-card">
              <FiHome size={24} />
              <span className="stat-value">{stats.listings}</span>
              <span className="stat-label">Listings</span>
            </div>
            <div className="admin-stat-card">
              <FiCalendar size={24} />
              <span className="stat-value">{stats.bookings}</span>
              <span className="stat-label">Bookings</span>
            </div>
            <div className="admin-stat-card">
              <FiStar size={24} />
              <span className="stat-value">{stats.reviews}</span>
              <span className="stat-label">Reviews</span>
            </div>
          </div>
        )}

        {activeTab === 'users' && (
          <div className="admin-table-wrap">
            {usersLoading ? (
              <div className="skeleton" style={{ height: '200px' }} />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Listings</th>
                    <th>Bookings</th>
                  </tr>
                </thead>
                <tbody>
                  {users?.map((u) => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td>{u.email}</td>
                      <td>
                        <select
                          value={u.role}
                          onChange={(e) => handleRoleChange(u.id, e.target.value)}
                          className="admin-select"
                        >
                          <option value="guest">Guest</option>
                          <option value="host">Host</option>
                          <option value="admin">Admin</option>
                        </select>
                      </td>
                      <td>{u._count?.listings || 0}</td>
                      <td>{u._count?.bookings || 0}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}

        {activeTab === 'listings' && (
          <div className="admin-table-wrap">
            {listingsLoading ? (
              <div className="skeleton" style={{ height: '200px' }} />
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Host</th>
                    <th>City</th>
                    <th>Price</th>
                    <th>Status</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {listings?.map((listing) => (
                    <tr key={listing.id}>
                      <td>{listing.title}</td>
                      <td>{listing.host?.name}</td>
                      <td>{listing.city}</td>
                      <td>{formatPrice(listing.pricePerNight)}</td>
                      <td>
                        <span className={`badge ${listing.isActive ? 'badge-confirmed' : 'badge-cancelled'}`}>
                          {listing.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button
                          className="btn btn-ghost btn-sm"
                          onClick={() => handleToggleListing(listing.id)}
                          title={listing.isActive ? 'Deactivate' : 'Activate'}
                        >
                          {listing.isActive ? <FiToggleRight size={18} /> : <FiToggleLeft size={18} />}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
