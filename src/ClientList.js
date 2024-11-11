import React, { useState, useEffect, useCallback, useContext } from 'react';
import { ClientContext } from './ClientProvider';
import axios from 'axios';

const ClientList = ({ onClientRemoved }) => {
  const { clients: contextClients, removeClient, updateClientStatus } = useContext(ClientContext);
  const [filteredClients, setFilteredClients] = useState([]);
  const [isListVisible, setIsListVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [selectedClient, setSelectedClient] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [newDocuments, setNewDocuments] = useState([]);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [error, setError] = useState(null);
  const [expandedClient, setExpandedClient] = useState(null);
  const [paymentDetails, setPaymentDetails] = useState(null);
  const [statusUpdateSuccess, setStatusUpdateSuccess] = useState(null);

  useEffect(() => {
    if (contextClients) {
      setFilteredClients(contextClients);
    }
  }, [contextClients]);

  useEffect(() => {
    const handleBeforeUnload = (event) => {
      if (hasUnsavedChanges) {
        event.preventDefault();
        event.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [hasUnsavedChanges]);

  const handleRemoveClient = async (clientId) => {
    try {
      setLoading(true);
      await axios.delete(`http://localhost:3000/clients/${clientId}`);
      removeClient(clientId);
      onClientRemoved(clientId);
    } catch (error) {
      setError('Error removing client. Please try again.');
      console.error('Error removing client:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = useCallback((event) => {
    const query = event.target.value.toLowerCase();
    setSearchQuery(query);

    if (contextClients) {
      const filtered = contextClients.filter(client =>
        client.fullname.toLowerCase().includes(query) ||
        client.project.toLowerCase().includes(query)
      );
      setFilteredClients(filtered);
    }
  }, [contextClients]);

  const handleExpoundClient = async (client) => {
    setSelectedClient(client);
    try {
      const [documentsResponse, paymentDetailsResponse] = await Promise.all([
        axios.get(`http://localhost:3000/clients/${client.id}/documents`),
        axios.get(`http://localhost:3000/clients/${client.id}/payment-details`)
      ]);
      setDocuments(documentsResponse.data);
      setPaymentDetails(paymentDetailsResponse.data);
    } catch (error) {
      if (error.response && error.response.status === 404) {
        setPaymentDetails(null);
      } else {
        setError('Error fetching client data. Please try again.');
        console.error('Error fetching client data:', error);
      }
    }
  };

  const handleFileChange = (event) => {
    setNewDocuments([...newDocuments, ...Array.from(event.target.files)]);
    setHasUnsavedChanges(true);
  };

  const handleRemoveDocument = (index) => {
    setNewDocuments(newDocuments.filter((_, i) => i !== index));
    setHasUnsavedChanges(true);
  };

  const handleSaveDocuments = async () => {
    if (!selectedClient) return;

    const formData = new FormData();
    newDocuments.forEach((file) => {
      formData.append('documents', file);
    });

    try {
      await axios.post(`http://localhost:3000/clients/${selectedClient.id}/documents`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setNewDocuments([]);
      const response = await axios.get(`http://localhost:3000/clients/${selectedClient.id}/documents`);
      setDocuments(response.data);
      setHasUnsavedChanges(false);
    } catch (error) {
      setError('Error uploading documents. Please try again.');
      console.error('Error uploading documents:', error);
    }
  };

  const handleGoBack = () => {
    if (hasUnsavedChanges) {
      const confirmExit = window.confirm('You have unsaved changes. Are you sure you want to go back without saving?');
      if (!confirmExit) return;
    }
    setSelectedClient(null);
    setNewDocuments([]);
    setHasUnsavedChanges(false);
  };

  const handleDocumentClick = async (documentId) => {
    try {
      const response = await axios.get(`http://localhost:3000/documents/${documentId}`, { responseType: 'blob' });
      const contentType = response.headers['content-type'];

      let filename = 'download';
      const contentDisposition = response.headers['content-disposition'];
      if (contentDisposition && contentDisposition.includes('filename=')) {
        filename = contentDisposition.split('filename=')[1].replace(/"/g, '');
      }

      const blob = new Blob([response.data], { type: contentType });
      const url = window.URL.createObjectURL(blob);

      if (contentType.startsWith('image/')) {
        window.open(url, '_blank');
      } else {
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError('Error opening document. Please try again.');
      console.error('Error opening document:', error);
    }
  };

  const pasteClientName = async (client, status) => {
    try {
        setLoading(true);
        await updateClientStatus(client.id, status);
        setStatusUpdateSuccess(`Successfully updated ${client.fullname}'s status to ${status}`);
        
        setFilteredClients(prevClients =>
            prevClients.map(c =>
                c.id === client.id ? { ...c, conversation_status: status } : c
            )
        );
    } catch (error) {
        console.error('Error updating client status:', error);
        setError(`Error updating client status: ${error.message}`);
    } finally {
        setLoading(false);
    }
};

  const toggleButtons = (client) => {
    setExpandedClient(expandedClient === client.id ? null : client.id);
  };

  const renderClientActions = (client) => (
    <>
      <button onClick={() => handleRemoveClient(client.id)} disabled={loading}>
        {loading ? 'Removing...' : 'Remove'}
      </button>
      <button onClick={() => handleExpoundClient(client)} disabled={loading}>
        Expound
      </button>
      <button onClick={() => toggleButtons(client)} disabled={loading}>
        More Actions
      </button>
      {expandedClient === client.id && (
        <div>
          <button onClick={() => pasteClientName(client, 'Finalized Deal')} disabled={loading}>
            Add to Finalized
          </button>
          <button onClick={() => pasteClientName(client, 'Pending')} disabled={loading}>
            Add to Pending
          </button>
        </div>
      )}
    </>
  );

  if (!contextClients) {
    return <div>Loading clients...</div>;
  }

  return (
    <div style={{ margin: '0 auto', maxWidth: '800px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
        <button onClick={() => setIsListVisible(!isListVisible)}>
          {isListVisible ? 'Hide Client List' : 'Show Client List'}
        </button>
        <input
          type="text"
          placeholder="Search clients..."
          value={searchQuery}
          onChange={handleSearch}
          style={{ width: '200px' }}
          disabled={loading}
        />
      </div>

      {error && <p style={{ color: 'red' }}>{error}</p>}
      {statusUpdateSuccess && <p style={{ color: 'green' }}>{statusUpdateSuccess}</p>}

      {isListVisible && !selectedClient && (
        <div>
          {filteredClients.map((client) => (
            <div key={client.id} id={`client-${client.id}`} style={{ marginBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>{client.fullname} - {client.project} - {client.conversation_status}</span>
              <div>
                {renderClientActions(client)}
              </div>
            </div>
          ))}
        </div>
      )}

      {selectedClient && (
        <div style={{ marginTop: '20px' }}>
          <h2>Client Details: {selectedClient.fullname}</h2>
          {Object.entries(selectedClient).map(([key, value]) => (
            <p key={key}>{key}: {value}</p>
          ))}

          <h3>Uploaded Documents</h3>
          <div style={{ listStyleType: 'none', padding: 0 }}>
            {documents.map((doc) => (
              <div 
                key={doc.id} 
                onClick={() => handleDocumentClick(doc.id)}
                style={{ cursor: 'pointer', marginBottom: '5px', textDecoration: 'underline' }}
              >
                {doc.document_name}
              </div>
            ))}
          </div>

          <h3>Upload New Documents</h3>
          <input 
            type="file" 
            multiple 
            onChange={handleFileChange} 
          />
          <button onClick={handleSaveDocuments}>Save Documents</button>
          {hasUnsavedChanges && <p>You have unsaved changes.</p>}

          <button onClick={handleGoBack}>Back to List</button>
        </div>
      )}
    </div>
  );
};

export default ClientList;