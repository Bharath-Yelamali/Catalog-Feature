import React, { useState } from 'react';

const HomePage = ({ setPage, setSearch, handleSearch }) => {
  const [homeSearch, setHomeSearch] = useState('');

  const handleHomeSubmit = e => {
    e.preventDefault();
    setSearch(homeSearch);
    setPage('search');
    setTimeout(() => {
      if (typeof handleSearch === 'function') {
        handleSearch({ key: 'Enter', preventDefault: () => {}, stopPropagation: () => {} });
      }
    }, 0);
  };

  return (
    <div>
      <div className="homepage-banner">
        <form className="homepage-banner-searchbar" onSubmit={handleHomeSubmit}>
          <div className="homepage-banner-title">The hardware part search catalog</div>
          <div className="homepage-banner-searchbar-row">
            <input
              type="text"
              value={homeSearch}
              onChange={e => setHomeSearch(e.target.value)}
              placeholder="Search for hardware parts, models, or keywords..."
              aria-label="Homepage search"
            />
            <button type="submit" className="homepage-banner-searchbar-btn">Search</button>
          </div>
        </form>
      </div>
      {/* Only the login button below the banner */}
      <div className="homepage-login-btn-container" style={{ position: 'relative', zIndex: 1001, marginTop: '520px', marginLeft: 'auto', marginRight: 'auto', textAlign: 'center' }}>
        <button
          className="homepage-login-btn"
          onClick={() => setPage('login')}
        >
          Go to Login
        </button>
      </div>
      <div style={{ height: '60px' }} />
    </div>
  );
};

export default HomePage;
