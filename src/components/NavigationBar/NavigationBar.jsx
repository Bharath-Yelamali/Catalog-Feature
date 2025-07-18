import React from 'react';
import wizardIcon from '../../assets/wizard.svg';

function NavigationBar({
  page,
  setPage,
  accessToken,
  isAdmin,
  handleNavLogin,
  handleLogout,
  setShowSessionPopup
}) {
  return (
    <nav className="taskbar" style={{ display: 'flex', alignItems: 'center', paddingRight: 24 }}>
      <div className="taskbar-title clickable" onClick={() => setPage('home')} style={{ display: 'flex', alignItems: 'center' }}>
        <img src={wizardIcon} alt="Wizard Logo" className="taskbar-logo" />
        {page === 'home' && (
          <span style={{ color: '#fff', fontWeight: 600, fontSize: 22, marginLeft: 12, letterSpacing: '0.01em' }}>Scout</span>
        )}
      </div>
      {/* Workflow navigation progress indicator (not buttons) */}
      {accessToken && ['search', 'requiredFields', 'confirmationSummary'].includes(page) && (
        <div className="workflow-progress" style={{ display: 'flex', alignItems: 'center', gap: 18, marginLeft: 32 }}>
          {[
            { key: 'search', label: '1. Search' },
            { key: 'requiredFields', label: '2. Required Fields' },
            { key: 'confirmationSummary', label: '3. Confirmation Summary' },
            { key: 'submit', label: '4. Submit' }
          ].map((step, idx, arr) => (
            <div key={step.key} style={{ display: 'flex', alignItems: 'center' }}>
              <span
                className={`workflow-step${page === step.key ? ' active' : ''}${arr.findIndex(s => s.key === page) > idx ? ' completed' : ''}`}
                style={{
                  color: '#fff',
                  fontWeight: page === step.key ? 700 : 500,
                  fontSize: 15,
                  borderBottom: page === step.key ? '3px solid #2563eb' : arr.findIndex(s => s.key === page) > idx ? '3px solid #22c55e' : '3px solid #e5e7eb',
                  paddingBottom: 2,
                  minWidth: 90,
                  textAlign: 'left',
                  background: 'none',
                  transition: 'color 0.2s, border-bottom 0.2s',
                }}
              >
                {step.label}
              </span>
              {idx < arr.length - 1 && (
                <span style={{ margin: '0 8px', color: '#fff', fontSize: 18 }}>&rarr;</span>
              )}
            </div>
          ))}
        </div>
      )}
      <div style={{ flex: 1 }} />
      <ul className="taskbar-links" style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', paddingRight: 6 }}>
        {/* Only show Search link if user is logged in */}
        {accessToken && (
          <li><a href="#" onClick={() => setPage('search')} style={{ color: '#fff', textDecoration: 'none' }}>Search</a></li>
        )}
        {/* Only show Orders link if user is logged in */}
        {accessToken && (
          <li><a href="#" onClick={() => setPage('orders')} style={{ color: '#fff', textDecoration: 'none' }}>Orders</a></li>
        )}
        {/* About page removed */}
        {!accessToken ? (
          <li><a href="#" onClick={handleNavLogin} style={{ color: '#fff', textDecoration: 'none' }}>Login</a></li>
        ) : (
          <>
            <li>
              <a href="#" className="taskbar-link" onClick={e => { e.preventDefault(); setShowSessionPopup(true); }} style={{ color: '#fff', textDecoration: 'none' }}>
                Session
              </a>
            </li>
            <li><a href="#" onClick={handleLogout} style={{ color: '#fff', textDecoration: 'none' }}>Logout</a></li>
          </>
        )}
      </ul>
    </nav>
  );
}

export default NavigationBar;
