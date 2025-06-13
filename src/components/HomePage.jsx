import React, { useState } from 'react';

const HomePage = ({ setPage, setSearch, handleSearch, accessToken, setJustSearched, username }) => {
  const [homeSearch, setHomeSearch] = useState('');

  const handleHomeSubmit = e => {
    e.preventDefault();
    if (!accessToken) {
      if (typeof handleSearch === 'function') {
        handleSearch({ key: 'Enter', preventDefault: () => {}, stopPropagation: () => {}, value: homeSearch });
      }
      return;
    }
    setSearch(homeSearch);
    if (typeof setJustSearched === 'function') setJustSearched(true);
    setPage('search');
  };

  // Personalized greeting if logged in
  const greeting = accessToken && username ? `Welcome back, ${username.split(' ')[0]}!` : null;

  return (
    <div>
      {/* Hero Banner Section */}
      <div className="homepage-banner">
        <form className="homepage-banner-searchbar" onSubmit={handleHomeSubmit}>
          {greeting && <div className="homepage-greeting">{greeting}</div>}
          <div className="homepage-banner-title">The hardware part search catalog</div>
          <div className="homepage-banner-subtitle">Find hardware parts, models, suppliers, or procurement orders instantly.</div>
          <div className="homepage-banner-searchbar-row">
            <div className="homepage-search-input-wrapper">
              <span className="homepage-search-icon" aria-hidden="true">🔍</span>
              <input
                type="text"
                value={homeSearch}
                onChange={e => setHomeSearch(e.target.value)}
                placeholder="e.g. SSD, Dell PowerEdge, supplier name…"
                aria-label="Search for hardware parts, models, or suppliers"
                autoFocus
              />
            </div>
            <button type="submit" className="homepage-banner-searchbar-btn" aria-label="Search">Search</button>
          </div>
        </form>
      </div>
      {/* About Section */}
      <section className="homepage-about-section">
        <div className="homepage-about-container">
          <h2>Welcome to the Procurement Catalog</h2>
          <p>
            This site is your one-stop platform for searching, requesting, and tracking hardware parts and procurement orders across your organization. Whether you need to find a specific component, submit a new purchase request, or follow the status of your order through the procurement workflow, this catalog makes the process simple and transparent.
          </p>
        </div>
      </section>
      {/* Feature Highlights Section */}
      <section className="homepage-features-section">
        <div className="homepage-features-container">
          <h3>What you can do here</h3>
          <div className="homepage-features-grid">
            <div className="homepage-feature-card">
              <h4>🔍 Powerful Search</h4>
              <p>Find hardware parts, models, and suppliers quickly using advanced search and filtering tools.</p>
            </div>
            <div className="homepage-feature-card">
              <h4>📝 Easy Order Requests</h4>
              <p>Submit new procurement requests with guided forms and required field checks.</p>
            </div>
            <div className="homepage-feature-card">
              <h4>📦 Track Your Orders</h4>
              <p>View the status and workflow of your orders in real time, including approvals, shipment, and payment.</p>
            </div>
            <div className="homepage-feature-card">
              <h4>📄 Attachments & Notes</h4>
              <p>Upload quotes, files, and add notes to keep all order information in one place.</p>
            </div>
            <div className="homepage-feature-card">
              <h4>👥 Team Collaboration</h4>
              <p>Work with coordinators, reviewers, and suppliers to keep procurement moving smoothly.</p>
            </div>
            <div className="homepage-feature-card">
              <h4>🔔 Notifications</h4>
              <p>Get notified about order status changes, approvals, and required actions.</p>
            </div>
          </div>
        </div>
      </section>
      {/* How It Works Section */}
      <section className="homepage-how-section">
        <div className="homepage-how-container">
          <h3>How it works</h3>
          <ol className="homepage-how-list">
            <li><b>Search</b> for the part or order you need.</li>
            <li><b>Submit</b> a new request or view order details.</li>
            <li><b>Track</b> your order through the procurement workflow.</li>
            <li><b>Receive</b> notifications and updates at every step.</li>
          </ol>
        </div>
      </section>
      {/* Contact/Help Section */}
      <section className="homepage-help-section">
        <div className="homepage-help-container">
          <h3>Need help?</h3>
          <p>Check the <a href="#" style={{ color: '#2d72d9', textDecoration: 'underline' }}>FAQ</a> or contact your procurement team for support.</p>
        </div>
      </section>
      <div style={{ height: '60px' }} />
    </div>
  );
};

export default HomePage;
