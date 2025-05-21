import { useState } from 'react'
import './App.css'

function App() {
  const [page, setPage] = useState('home')

  return (
    <div>
      <nav className="taskbar">
        <div className="taskbar-title" style={{cursor: 'pointer'}} onClick={() => setPage('home')}>
          <img src="/vite.svg" alt="Vite Logo" style={{ height: '32px', verticalAlign: 'middle' }} />
        </div>
        <ul className="taskbar-links">
          <li><a href="#" onClick={() => setPage('orders')}>Orders</a></li>
          <li><a href="#" onClick={() => setPage('about')}>About</a></li>
          <li><a href="#" onClick={() => setPage('contact')}>Contact</a></li>
        </ul>
      </nav>
      <main style={{ marginTop: 80 }}>
        {page === 'about' && <div>About Page</div>}
        {page === 'contact' && <div>Contact Page</div>}
        {page === 'orders' && <div>Orders Page</div>}
        {page === 'home' && <div>Welcome to the homepage!</div>}
      </main>
    </div>
  )
}

export default App
