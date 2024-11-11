# Client Management System

A comprehensive sales department management solution built with Node.js, React.js, and PostgreSQL. This system helps track clients, manage deals, and organize client information efficiently.

[Watch Demo Video](https://youtu.be/6O5QH9wGlCc)

## Features

### Client Management
- Add new clients with detailed information
- Remove existing clients
- View complete client list
- Filter clients by quality and status
- Track client documentation

### Client Categories
- High Quality Clients view
- Finalized Deals tracking
- Pending Clients management

### Authentication & Security
- JWT-based authentication
- Secure document upload and management
- Protected API endpoints

## Tech Stack

### Backend
- Node.js
- Express.js
- PostgreSQL
- JWT for authentication
- Multer for file uploads
- CORS enabled
- bcrypt for password hashing

### Frontend
- React.js
- Axios for API calls
- React Hooks
- Error Boundary implementation
- Responsive design

## Installation

### Prerequisites
- Node.js (v14 or higher)
- PostgreSQL (v12 or higher)
- npm or yarn

### Backend Setup
1. Clone the repository
```bash
git clone https://github.com/BenjaminKakai/frontend-client-management-system.git
```

2. Install dependencies
```bash
cd server
npm install
```

3. Set up environment variables
Create a `.env` file in the server directory:
```env
PORT=3000
DATABASE_URL_POOLED=your_postgresql_connection_string
JWT_SECRET=your_jwt_secret
```

4. Start the server
```bash
npm start
```

### Frontend Setup
1. Navigate to the client directory
```bash
cd client
```

2. Install dependencies
```bash
npm install
```

3. Start the React application
```bash
npm start
```

The application will run on `http://localhost:3001`

## Database Schema

### Clients Table
```sql
CREATE TABLE clients (
    id SERIAL PRIMARY KEY,
    project VARCHAR(255),
    bedrooms INTEGER,
    budget DECIMAL,
    schedule VARCHAR(255),
    email VARCHAR(255),
    fullname VARCHAR(255),
    phone VARCHAR(255),
    quality VARCHAR(50),
    conversation_status VARCHAR(50)
);
```

### Payment Details Table
```sql
CREATE TABLE payment_details (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    amount_paid DECIMAL,
    payment_duration VARCHAR(255),
    total_amount DECIMAL,
    balance DECIMAL,
    payment_date TIMESTAMP
);
```

### Client Documents Table
```sql
CREATE TABLE client_documents (
    id SERIAL PRIMARY KEY,
    client_id INTEGER REFERENCES clients(id),
    document_name VARCHAR(255),
    document_path VARCHAR(255)
);
```

## API Endpoints

### Authentication
- POST `/login` - User authentication
- POST `/refresh-token` - Refresh JWT token

### Client Management
- GET `/clients` - Retrieve all clients
- POST `/clients` - Add new client
- DELETE `/clients/:id` - Remove client
- GET `/clients/finalized` - Get finalized deals
- GET `/clients/high-quality` - Get high-quality clients
- GET `/clients/pending` - Get pending clients

### Document Management
- POST `/clients/:id/documents` - Upload client documents
- GET `/clients/:id/documents` - Retrieve client documents
- DELETE `/documents/:id` - Delete document

## Contact Information

**Benjamin Kakai.**
- Email: Benjaminkakaimasai@gmail.com
- Phone: 0757661033

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
