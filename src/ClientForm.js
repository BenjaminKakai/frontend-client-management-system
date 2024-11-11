import React, { useState, useContext, useRef } from 'react';
import axiosInstance from './api'; // This should be your configured axios instance
import { ClientContext } from './ClientProvider';

const isTokenExpired = (token) => {
  if (!token) return true;
  try {
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload.exp * 1000 < Date.now();
  } catch (error) {
    console.error('Error decoding token:', error);
    return true;
  }
};

const backendUrl = 'http://localhost:3000';

const ClientForm = ({ goToHome }) => {
  const { addClient } = useContext(ClientContext);
  const [client, setClient] = useState({
    project: '',
    bedrooms: '',
    budget: '',
    schedule: '',
    email: '',
    fullname: '',
    phone: '',
    quality: 'low',
    conversation_status: 'Pending',
  });

  const [paymentDetails, setPaymentDetails] = useState({
    amountPaid: '',
    paymentDuration: '',
    totalAmount: '',
    balance: '',
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const scheduleInputRef = useRef(null);

  const listStyle = {
    listStyleType: 'none',
    padding: 0,
    margin: 0
  };

  const listItemStyle = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '5px'
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name in client) {
      setClient((prevClient) => ({
        ...prevClient,
        [name]: type === 'checkbox' ? (checked ? 'high' : 'low') : value,
        quality: name === 'quality' ? (checked ? 'high' : 'low') : prevClient.quality,
        conversation_status: name === 'conversation_status' ? (checked ? 'ongoing' : 'Pending') : prevClient.conversation_status,
      }));
    } else if (name in paymentDetails) {
      setPaymentDetails((prevDetails) => ({
        ...prevDetails,
        [name]: value
      }));
    }

    if (name === 'schedule' && scheduleInputRef.current) {
      scheduleInputRef.current.blur();
    }
  };

  const handleFileChange = (e) => {
    const newDocuments = Array.from(e.target.files).map(file => ({
      name: file.name,
      file: file
    }));
    setDocuments([...documents, ...newDocuments]);
  };

  const handleRemoveDocument = (index) => {
    setDocuments(documents.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
  
    try {
      const token = localStorage.getItem('token');
      
      if (!token || isTokenExpired(token)) {
        console.log('No token or token expired');
        setError('Your session has expired. Please log in again.');
        setIsLoading(false);
        return;
      }
  
      const clientData = {
        ...client,
        paymentDetails: paymentDetails,
      };
  
      const response = await axiosInstance.post(`/clients`, clientData);
      addClient(response.data);
  
      if (documents.length > 0) {
        const formData = new FormData();
        documents.forEach((doc) => {
          formData.append('documents', doc.file);
        });
  
        await axiosInstance.post(`/clients/${response.data.id}/documents`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
      }
  
      setIsSubmitted(true);
    } catch (error) {
      console.error('Error adding client or uploading documents:', error);
      setError('An error occurred while submitting the form. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAnotherClient = () => {
    setClient({
      project: '',
      bedrooms: '',
      budget: '',
      schedule: '',
      email: '',
      fullname: '',
      phone: '',
      quality: 'low',
      conversation_status: 'Pending',
    });
    setPaymentDetails({
      amountPaid: '',
      paymentDuration: '',
      totalAmount: '',
      balance: '',
    });
    setDocuments([]);
    setIsSubmitted(false);
    setError(null);
  };

  if (isSubmitted) {
    return (
      <div style={{ 
        textAlign: 'center',
        width: '100%',
        padding: '20px',
        maxWidth: '600px',
        margin: '0 auto'
      }}>
        <p style={{ marginBottom: '20px' }}>Client successfully added!</p>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'center', 
          gap: '10px',
          flexWrap: 'wrap' 
        }}>
          <button 
            onClick={handleAddAnotherClient}
            style={{ padding: '8px 16px' }}
          >
            Add Another Client
          </button>
          <button 
            onClick={goToHome}
            style={{ padding: '8px 16px' }}
          >
            Go Back Home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <form onSubmit={handleSubmit}>
        {Object.entries(client).map(([key, value]) => (
          <div key={key} style={{ marginBottom: '10px' }}>
            <label style={{ display: 'flex', alignItems: 'center' }}>
              <span style={{ marginRight: '10px', width: '150px' }}>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
              {key === 'quality' || key === 'conversation_status' ? (
                <input
                  type="checkbox"
                  name={key}
                  checked={value === 'high' || value === 'ongoing'}
                  onChange={handleChange}
                />
              ) : key === 'schedule' ? (
                <input
                  ref={scheduleInputRef}
                  type="datetime-local"
                  name={key}
                  value={value}
                  onChange={handleChange}
                  required
                  style={{ width: '100%', boxSizing: 'border-box' }}
                />
              ) : (
                <input
                  type={key === 'email' ? 'email' : 'text'}
                  name={key}
                  value={value}
                  onChange={handleChange}
                  required
                />
              )}
            </label>
          </div>
        ))}

        <div style={{ marginTop: '20px' }}>
          <h3>Payment Details</h3>
          {Object.entries(paymentDetails).map(([key, value]) => (
            <div key={key} style={{ marginBottom: '10px' }}>
              <label style={{ display: 'flex', alignItems: 'center' }}>
                <span style={{ marginRight: '10px', width: '150px' }}>{key.charAt(0).toUpperCase() + key.slice(1)}:</span>
                <input
                  type={key === 'paymentDuration' ? 'text' : 'number'}
                  name={key}
                  value={value}
                  onChange={handleChange}
                />
              </label>
            </div>
          ))}
        </div>

        <div style={{ marginTop: '20px' }}>
          <h3>Upload Documents</h3>
          <input type="file" multiple onChange={handleFileChange} />
          <ul style={listStyle}>
            {documents.map((doc, index) => (
              <li key={index} style={listItemStyle}>
                <span>{doc.name.split('.').slice(0, -1).join('.')}</span>
                <button type="button" onClick={() => handleRemoveDocument(index)}>Remove</button>
              </li>
            ))}
          </ul>
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" style={{ marginTop: '20px' }} disabled={isLoading}>
          {isLoading ? 'Adding Client...' : 'Add Client'}
        </button>
      </form>
    </div>
  );
};

export default ClientForm;