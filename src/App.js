import React, { useState, useEffect } from 'react';
import ErrorBoundary from './ErrorBoundary';
import { ClientProvider } from './ClientProvider';
import ClientForm from './ClientForm';
import RemoveClient from './RemoveClient';
import ClientList from './ClientList';
import HighQualityClients from './HighQualityClients';
import FinalizedDeals from './FinalizedDeals';
import PendingClients from './PendingClients';
import NavBar from './NavBar';
import Footer from './Footer';
import axios from 'axios';
import './App.css';

const backendUrl = 'http://localhost:3000';

const App = () => {
  const [activeView, setActiveView] = useState('home');
  const [clients, setClients] = useState([]);
  const [showOverlay, setShowOverlay] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(!!localStorage.getItem('token'));
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      console.log('No authentication token found');
      setIsLoggedIn(false);
      return;
    }

    const fetchClients = async () => {
      try {
        console.log('Fetching clients with token:', token);
        const response = await axios.get(`${backendUrl}/clients`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });
        console.log('Successfully fetched clients:', response.data);
        setClients(response.data);
        setIsLoggedIn(true);
      } catch (error) {
        console.error('Error fetching clients:', error.response?.data || error);
        if (error.response?.status === 403 || error.response?.status === 401) {
          console.log('Authentication failed, clearing token');
          localStorage.removeItem('token');
          setIsLoggedIn(false);
        }
      }
    };

    if (token) {
      fetchClients();
    }
  }, []);

  useEffect(() => {
    if (activeView === 'home') {
      setShowOverlay(true);
    } else {
      setShowOverlay(false);
    }
  }, [activeView]);

  const handleLogin = async (email, password) => {
    try {
      const response = await axios.post(`${backendUrl}/login`, {
        email,
        password
      });

      console.log('Login response:', response.data);
      
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        setIsLoggedIn(true);
        setLoginError('');
        setActiveView('home');
      } else {
        setLoginError('Invalid login response');
      }
    } catch (error) {
      console.error('Login error:', error.response?.data || error);
      setLoginError('Login failed. Please check your credentials.');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setClients([]);
    setActiveView('login');
  };

  const handleShowView = (view) => {
    setActiveView(view);
  };

  const handleHomeClick = () => {
    setActiveView('home');
    setShowOverlay(true);
  };

  const handleClientAdded = (newClient) => {
    setClients((prevClients) => [...prevClients, newClient]);
  };

  const handleClientRemoved = (removedClientId) => {
    setClients((prevClients) => prevClients.filter(client => client.id !== removedClientId));
  };

  if (!isLoggedIn) {
    return (
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={(e) => {
          e.preventDefault();
          const email = e.target.email.value;
          const password = e.target.password.value;
          handleLogin(email, password);
        }}>
          <input
            type="email"
            name="email"
            placeholder="Email"
            required
            className="login-input"
          />
          <input
            type="password"
            name="password"
            placeholder="Password"
            required
            className="login-input"
          />
          <button type="submit" className="login-button">Login</button>
          {loginError && <div className="error-message">{loginError}</div>}
        </form>
      </div>
    );
  }

  return (
    <ClientProvider>
      <div className="app">
        <ErrorBoundary>
          <NavBar
            onShowForm={() => handleShowView('form')}
            onShowRemoveClient={() => handleShowView('removeClient')}
            onShowClientList={() => handleShowView('clientList')}
            onShowHighQualityClients={() => handleShowView('highQualityClients')}
            onShowFinalizedDeals={() => handleShowView('finalizedDeals')}
            onShowPendingClients={() => handleShowView('pendingClients')}
            onHomeClick={handleHomeClick}
            onLogout={handleLogout}
            isLoggedIn={isLoggedIn}
          />
          <div className="main-content">
            <div className="centered-text" style={{ 
              marginTop: '100px', 
              color: 'orange',
              width: '100%',
              textAlign: 'center' 
            }}>
              <h1 className="rotate-text">Sales Department</h1>
            </div>
            {showOverlay && (
              <div className="overlay" style={{
                textAlign: 'center',
                width: '100%',
                padding: '20px'
              }}>
                <h2>Welcome to Sales Department</h2>
                <p>Your one-stop solution for client management</p>
              </div>
            )}
            {activeView === 'form' && (
              <ClientForm 
                onClientAdded={handleClientAdded} 
                goToHome={handleHomeClick} 
              />
            )}
            {activeView === 'removeClient' && (
              <RemoveClient 
                onClientRemoved={handleClientRemoved} 
              />
            )}
            {activeView === 'clientList' && (
              <ClientList 
                onClientRemoved={handleClientRemoved}
              />
            )}
            {activeView === 'highQualityClients' && (
              <HighQualityClients />
            )}
            {activeView === 'finalizedDeals' && (
              <FinalizedDeals />
            )}
            {activeView === 'pendingClients' && (
              <PendingClients />
            )}
          </div>
          <Footer />
        </ErrorBoundary>
      </div>
    </ClientProvider>
  );
};

export default App;