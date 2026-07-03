/**
 * HomePage — Premium landing page with hero, categories, listings, 
 * featured destinations, how-it-works, stats, and testimonials
 */
import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FiSearch, FiMapPin, FiCalendar, FiUsers, FiSliders, FiX,
  FiShield, FiStar, FiHeart, FiArrowRight, FiCheckCircle,
} from 'react-icons/fi';
import { listingsApi } from '../api/listings';
import { useAuth } from '../context/AuthContext';
import PropertyCard from '../components/PropertyCard';
import './HomePage.css';

const CATEGORIES = [
  { key: 'all', label: 'All', icon: '🏠' },
  { key: 'Beach', label: 'Beach', icon: '🏖️' },
  { key: 'Mountains', label: 'Mountains', icon: '🏔️' },
  { key: 'City', label: 'City', icon: '🏙️' },
  { key: 'Heritage', label: 'Heritage', icon: '🏛️' },
  { key: 'Unique', label: 'Unique', icon: '🌿' },
  { key: 'Countryside', label: 'Countryside', icon: '🌾' },
  { key: 'Lakefront', label: 'Lakefront', icon: '🚤' },
];

const CATEGORY_MAP = {
  Beach: 'Goa',
  Mountains: 'Manali',
  City: 'Mumbai',
  Heritage: 'Jaipur',
  Unique: 'Wayanad',
  Countryside: 'Udaipur',
  Lakefront: 'Srinagar',
};

const FEATURED_DESTINATIONS = [
  { city: 'Goa', image: 'https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?w=600&q=80', tagline: 'Sun, sand & seafood', properties: '120+' },
  { city: 'Jaipur', image: 'https://images.unsplash.com/photo-1599661046289-e31897846e41?w=600&q=80', tagline: 'Royal heritage stays', properties: '85+' },
  { city: 'Manali', image: 'https://images.unsplash.com/photo-1626621341517-bbf3d9990a23?w=600&q=80', tagline: 'Mountain escapes', properties: '95+' },
  { city: 'Mumbai', image: 'https://images.unsplash.com/photo-1570168007204-dfb528c6958f?w=600&q=80', tagline: 'City that never sleeps', properties: '200+' },
  { city: 'Srinagar', image: 'https://images.unsplash.com/photo-1587474260584-136574528ed5?w=600&q=80', tagline: 'Paradise on earth', properties: '60+' },
  { city: 'Wayanad', image: 'https://images.unsplash.com/photo-1602002418816-5c0aeef426aa?w=600&q=80', tagline: 'Into the wild', properties: '45+' },
];

const HOW_IT_WORKS = [
  { step: '01', title: 'Search', desc: 'Browse verified stays across 50+ Indian destinations with real photos and reviews.', icon: <FiSearch size={28} /> },
  { step: '02', title: 'Book', desc: 'Reserve instantly with secure payments. No hidden fees, transparent pricing.', icon: <FiCheckCircle size={28} /> },
  { step: '03', title: 'Experience', desc: 'Check in and enjoy your stay. Our 24/7 support is always available.', icon: <FiHeart size={28} /> },
];

const TESTIMONIALS = [
  { name: 'Priya Patel', role: 'Traveler', avatar: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=100&h=100&fit=crop&crop=face', quote: 'The houseboat in Srinagar was a dream! StayFinder made booking so easy. Will definitely use again for my next trip.', rating: 5 },
  { name: 'Rohan Verma', role: 'Host', avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=100&h=100&fit=crop&crop=face', quote: 'As a host, the dashboard makes managing bookings effortless. My income has grown 3x since listing on StayFinder.', rating: 5 },
  { name: 'Ananya Desai', role: 'Traveler', avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=100&h=100&fit=crop&crop=face', quote: 'Found an amazing treehouse in Wayanad that I would never have discovered otherwise. The verified reviews gave me confidence.', rating: 4 },
];

export default function HomePage() {
  const { isAuthenticated, isHost } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [activeCategory, setActiveCategory] = useState('all');
  const [searchCity, setSearchCity] = useState(searchParams.get('city') || '');
  const [searchCheckIn, setSearchCheckIn] = useState(searchParams.get('checkIn') || '');
  const [searchCheckOut, setSearchCheckOut] = useState(searchParams.get('checkOut') || '');
  const [searchGuests, setSearchGuests] = useState(searchParams.get('guests') || '');
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    type: searchParams.get('type') || '',
    sortBy: searchParams.get('sortBy') || 'newest',
  });

  const queryParams = {
    page,
    limit: 12,
    ...(searchParams.get('search') && { search: searchParams.get('search') }),
    ...(searchParams.get('city') && { city: searchParams.get('city') }),
    ...(searchParams.get('checkIn') && { checkIn: searchParams.get('checkIn') }),
    ...(searchParams.get('checkOut') && { checkOut: searchParams.get('checkOut') }),
    ...(searchParams.get('guests') && { guests: searchParams.get('guests') }),
    ...(searchParams.get('minPrice') && { minPrice: searchParams.get('minPrice') }),
    ...(searchParams.get('maxPrice') && { maxPrice: searchParams.get('maxPrice') }),
    ...(searchParams.get('type') && { type: searchParams.get('type') }),
    ...(searchParams.get('sortBy') && { sortBy: searchParams.get('sortBy') }),
    ...(activeCategory !== 'all' && CATEGORY_MAP[activeCategory] && { city: CATEGORY_MAP[activeCategory] }),
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ['listings', queryParams],
    queryFn: () => listingsApi.getAll(queryParams).then((res) => res.data.data),
    staleTime: 30000,
  });

  const buildSearchParams = () => {
    const params = {};
    if (searchCity.trim()) params.city = searchCity.trim();
    if (searchCheckIn) params.checkIn = searchCheckIn;
    if (searchCheckOut) params.checkOut = searchCheckOut;
    if (searchGuests) params.guests = searchGuests;
    if (filters.minPrice) params.minPrice = filters.minPrice;
    if (filters.maxPrice) params.maxPrice = filters.maxPrice;
    if (filters.type) params.type = filters.type;
    if (filters.sortBy && filters.sortBy !== 'newest') params.sortBy = filters.sortBy;
    return params;
  };

  const handleHeroSearch = (e) => {
    e.preventDefault();
    setSearchParams(buildSearchParams());
    setActiveCategory('all');
    setPage(1);
  };

  const handleApplyFilters = () => {
    setSearchParams(buildSearchParams());
    setShowFilters(false);
    setPage(1);
  };

  const handleClearFilters = () => {
    setFilters({ minPrice: '', maxPrice: '', type: '', sortBy: 'newest' });
    const params = {};
    if (searchCity.trim()) params.city = searchCity.trim();
    if (searchCheckIn) params.checkIn = searchCheckIn;
    if (searchCheckOut) params.checkOut = searchCheckOut;
    if (searchGuests) params.guests = searchGuests;
    setSearchParams(params);
    setShowFilters(false);
    setPage(1);
  };

  const handleCategoryChange = (key) => {
    setActiveCategory(key);
    setPage(1);
    if (key === 'all') {
      setSearchParams(buildSearchParams());
      if (!searchCity.trim()) setSearchCity('');
    }
  };

  useEffect(() => {
    setSearchCity(searchParams.get('city') || '');
    setSearchCheckIn(searchParams.get('checkIn') || '');
    setSearchCheckOut(searchParams.get('checkOut') || '');
    setSearchGuests(searchParams.get('guests') || '');
    setFilters({
      minPrice: searchParams.get('minPrice') || '',
      maxPrice: searchParams.get('maxPrice') || '',
      type: searchParams.get('type') || '',
      sortBy: searchParams.get('sortBy') || 'newest',
    });
  }, [searchParams]);

  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="homepage" id="homepage">
      {/* ─── Hero Section ─────────────────────────────────── */}
      <section className="hero" id="hero-section">
        <div className="hero-bg">
          <div className="hero-gradient" />
        </div>
        <div className="hero-content container">
          <motion.h1
            className="hero-title"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            Find your next
            <span className="hero-highlight"> perfect stay</span>
          </motion.h1>
          <motion.p
            className="hero-subtitle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.15 }}
          >
            Discover unique homes, experiences, and places around India
          </motion.p>

          <motion.form
            className="hero-search-form"
            onSubmit={handleHeroSearch}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
          >
            <div className="hero-search-bar" id="hero-search-bar">
              <div className="hero-search-field">
                <FiMapPin size={18} className="field-icon" />
                <div className="field-content">
                  <label className="field-label">Where</label>
                  <input
                    type="text"
                    placeholder="Search destinations"
                    value={searchCity}
                    onChange={(e) => setSearchCity(e.target.value)}
                    className="field-input"
                    id="hero-city-input"
                  />
                </div>
              </div>
              <div className="search-divider" />
              <div className="hero-search-field">
                <FiCalendar size={18} className="field-icon" />
                <div className="field-content">
                  <label className="field-label">Check in</label>
                  <input
                    type="date"
                    className="field-input"
                    value={searchCheckIn}
                    onChange={(e) => setSearchCheckIn(e.target.value)}
                    min={today}
                    id="hero-checkin-input"
                  />
                </div>
              </div>
              <div className="search-divider" />
              <div className="hero-search-field">
                <FiCalendar size={18} className="field-icon" />
                <div className="field-content">
                  <label className="field-label">Check out</label>
                  <input
                    type="date"
                    className="field-input"
                    value={searchCheckOut}
                    onChange={(e) => setSearchCheckOut(e.target.value)}
                    min={searchCheckIn || today}
                    id="hero-checkout-input"
                  />
                </div>
              </div>
              <div className="search-divider" />
              <div className="hero-search-field">
                <FiUsers size={18} className="field-icon" />
                <div className="field-content">
                  <label className="field-label">Guests</label>
                  <input
                    type="number"
                    placeholder="Add guests"
                    min="1"
                    value={searchGuests}
                    onChange={(e) => setSearchGuests(e.target.value)}
                    className="field-input"
                    id="hero-guests-input"
                  />
                </div>
              </div>
              <button type="submit" className="hero-search-btn" id="hero-search-btn">
                <FiSearch size={20} />
                <span className="search-btn-text">Search</span>
              </button>
            </div>
          </motion.form>

          {/* Trust Badges */}
          <motion.div
            className="hero-trust"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <span className="trust-item"><FiShield size={14} /> Verified hosts</span>
            <span className="trust-dot">·</span>
            <span className="trust-item"><FiStar size={14} /> 4.8 avg rating</span>
            <span className="trust-dot">·</span>
            <span className="trust-item"><FiCheckCircle size={14} /> Instant booking</span>
          </motion.div>
        </div>
      </section>

      {/* ─── Categories ───────────────────────────────────── */}
      <section className="categories container" id="categories-section">
        <div className="categories-strip">
          {CATEGORIES.map((cat) => (
            <button
              key={cat.key}
              className={`category-btn ${activeCategory === cat.key ? 'active' : ''}`}
              onClick={() => handleCategoryChange(cat.key)}
              id={`cat-${cat.key}`}
            >
              <span className="category-icon">{cat.icon}</span>
              <span className="category-label">{cat.label}</span>
            </button>
          ))}
        </div>
        <button className="filter-btn" id="filter-btn" onClick={() => setShowFilters(true)}>
          <FiSliders size={16} />
          Filters
        </button>
      </section>

      {/* ─── Listings Grid ────────────────────────────────── */}
      <section className="listings-section container" id="listings-section">
        {isLoading ? (
          <div className="listings-grid">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="card-skeleton">
                <div className="skeleton skeleton-image" />
                <div className="skeleton-content">
                  <div className="skeleton skeleton-title" />
                  <div className="skeleton skeleton-text" />
                  <div className="skeleton skeleton-price" />
                </div>
              </div>
            ))}
          </div>
        ) : isError ? (
          <div className="listings-empty">
            <p className="empty-icon">😕</p>
            <h3>Something went wrong</h3>
            <p>Unable to load listings. Please check if the server is running.</p>
          </div>
        ) : data?.listings?.length === 0 ? (
          <div className="listings-empty">
            <p className="empty-icon">🔍</p>
            <h3>No results found</h3>
            <p>Try adjusting your search or filters to find what you're looking for.</p>
          </div>
        ) : (
          <>
            <div className="listings-grid">
              <AnimatePresence>
                {data?.listings?.map((listing, i) => (
                  <PropertyCard key={listing.id} listing={listing} index={i} />
                ))}
              </AnimatePresence>
            </div>

            {data?.pagination?.totalPages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page === 1}
                  onClick={() => setPage((p) => p - 1)}
                >
                  Previous
                </button>
                <span className="page-info">
                  Page {data.pagination.page} of {data.pagination.totalPages}
                </span>
                <button
                  className="btn btn-secondary btn-sm"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage((p) => p + 1)}
                >
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </section>

      {/* ─── Featured Destinations ────────────────────────── */}
      <section className="featured-section" id="featured-destinations">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Explore popular destinations</h2>
            <p className="section-desc">Handpicked cities with the best stays across India</p>
          </div>
          <div className="destinations-grid">
            {FEATURED_DESTINATIONS.map((dest, i) => (
              <motion.div
                key={dest.city}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
              >
                <Link
                  to={`/?city=${dest.city}`}
                  className="destination-card"
                  onClick={() => { setSearchCity(dest.city); setActiveCategory('all'); }}
                >
                  <img src={dest.image} alt={dest.city} className="destination-image" loading="lazy" />
                  <div className="destination-overlay">
                    <h3 className="destination-city">{dest.city}</h3>
                    <p className="destination-tagline">{dest.tagline}</p>
                    <span className="destination-count">{dest.properties} properties</span>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─────────────────────────────────── */}
      <section className="how-section" id="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">How StayFinder works</h2>
            <p className="section-desc">Book your perfect stay in 3 simple steps</p>
          </div>
          <div className="how-grid">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div
                key={item.step}
                className="how-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.12 }}
              >
                <div className="how-icon">{item.icon}</div>
                <span className="how-step">Step {item.step}</span>
                <h3 className="how-title">{item.title}</h3>
                <p className="how-desc">{item.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Stats Bar ────────────────────────────────────── */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-number">10K+</span>
              <span className="stat-label">Happy guests</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">500+</span>
              <span className="stat-label">Verified properties</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">50+</span>
              <span className="stat-label">Destinations</span>
            </div>
            <div className="stat-divider" />
            <div className="stat-item">
              <span className="stat-number">4.8</span>
              <span className="stat-label">Average rating</span>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Testimonials ─────────────────────────────────── */}
      <section className="testimonials-section" id="testimonials">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">Loved by guests & hosts</h2>
            <p className="section-desc">See what our community has to say</p>
          </div>
          <div className="testimonials-grid">
            {TESTIMONIALS.map((t, i) => (
              <motion.div
                key={t.name}
                className="testimonial-card"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
              >
                <div className="testimonial-stars">
                  {Array.from({ length: 5 }).map((_, j) => (
                    <FiStar key={j} size={14} className={j < t.rating ? 'star-filled' : 'star-empty'} />
                  ))}
                </div>
                <p className="testimonial-quote">"{t.quote}"</p>
                <div className="testimonial-author">
                  <img src={t.avatar} alt={t.name} className="testimonial-avatar" />
                  <div>
                    <p className="testimonial-name">{t.name}</p>
                    <p className="testimonial-role">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ──────────────────────────────────── */}
      <section className="cta-section" id="cta">
        <div className="container">
          <div className="cta-card">
            <div className="cta-content">
              <h2 className="cta-title">
                {isHost ? 'Manage your properties' : 'Become a host on StayFinder'}
              </h2>
              <p className="cta-desc">
                {isHost
                  ? 'Go to your dashboard to manage listings, track bookings, and grow your earnings.'
                  : 'Turn your extra space into extra income. Join thousands of hosts earning on StayFinder.'}
              </p>
              <Link
                to={isAuthenticated ? (isHost ? '/dashboard' : '/register') : '/register'}
                className="btn btn-primary btn-lg cta-btn"
              >
                {isHost ? 'Go to Dashboard' : 'Start hosting'}
                <FiArrowRight size={18} />
              </Link>
            </div>
            <div className="cta-visual">
              <div className="cta-stat-card">
                <span className="cta-stat-value">₹45,000</span>
                <span className="cta-stat-label">Average monthly income per host</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Filter Modal ─────────────────────────────────── */}
      {showFilters && (
        <div className="filter-modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="filter-modal" onClick={(e) => e.stopPropagation()}>
            <div className="filter-modal-header">
              <h3>Filters</h3>
              <button className="filter-modal-close" onClick={() => setShowFilters(false)}>
                <FiX size={20} />
              </button>
            </div>
            <div className="filter-modal-body">
              <div className="input-group">
                <label className="input-label">Min Price (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={filters.minPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, minPrice: e.target.value }))}
                  placeholder="1000"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Max Price (₹)</label>
                <input
                  type="number"
                  className="input"
                  value={filters.maxPrice}
                  onChange={(e) => setFilters((f) => ({ ...f, maxPrice: e.target.value }))}
                  placeholder="50000"
                />
              </div>
              <div className="input-group">
                <label className="input-label">Property Type</label>
                <select
                  className="input"
                  value={filters.type}
                  onChange={(e) => setFilters((f) => ({ ...f, type: e.target.value }))}
                >
                  <option value="">Any type</option>
                  <option value="entire_place">Entire place</option>
                  <option value="private_room">Private room</option>
                  <option value="shared_room">Shared room</option>
                </select>
              </div>
              <div className="input-group">
                <label className="input-label">Sort By</label>
                <select
                  className="input"
                  value={filters.sortBy}
                  onChange={(e) => setFilters((f) => ({ ...f, sortBy: e.target.value }))}
                >
                  <option value="newest">Newest</option>
                  <option value="price_asc">Price: Low to High</option>
                  <option value="price_desc">Price: High to Low</option>
                  <option value="rating_desc">Highest Rated</option>
                </select>
              </div>
            </div>
            <div className="filter-modal-actions">
              <button className="btn btn-ghost" onClick={handleClearFilters}>Clear all</button>
              <button className="btn btn-primary" onClick={handleApplyFilters}>Apply</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
