import React, { useState } from 'react';

const HomePage = ({ setPage, setSearch, handleSearch, accessToken }) => {
  const [homeSearch, setHomeSearch] = useState('');

  const handleHomeSubmit = e => {
    e.preventDefault();
    // Always redirect to login if not logged in, regardless of input
    if (!accessToken) {
      if (typeof handleSearch === 'function') {
        handleSearch({ key: 'Enter', preventDefault: () => {}, stopPropagation: () => {}, value: homeSearch });
      }
      return;
    }
    // If logged in, proceed as normal
    setSearch(homeSearch);
    setPage('search');
    setTimeout(() => {
      if (typeof handleSearch === 'function') {
        handleSearch({ key: 'Enter', preventDefault: () => {}, stopPropagation: () => {}, value: homeSearch });
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
      <div style={{ height: '60px' }} />
    </div>
  );
};

export default HomePage;
