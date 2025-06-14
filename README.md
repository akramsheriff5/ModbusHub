# PLC Modbus Hub

A comprehensive web application for PLC monitoring and management using Modbus TCP protocol.

## Features

- User Authentication (Login/Logout)
- PLC Connection Management
- Register Configuration
- Real-time Data Streaming via WebSocket
- Dashboard with Register Cards
- Database Integration

## Tech Stack

### Backend
- Python Flask
- SQLAlchemy (Database ORM)
- Flask-SocketIO (WebSocket support)
- pymodbus (Modbus TCP communication)

### Frontend
- Vite + React
- TailwindCSS (Styling)
- Socket.IO Client
- React Router
- React Query

## Project Structure

```
plc-modbus-hub/
├── backend/
│   ├── app/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── services/
│   │   └── utils/
│   ├── config.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   └── utils/
│   └── package.json
└── README.md
```

## Setup Instructions

### Backend Setup
1. Create a virtual environment:
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. Install dependencies:
   ```bash
   cd backend
   pip install -r requirements.txt
   ```

3. Run the Flask server:
   ```bash
   python run.py
   ```

### Frontend Setup
1. Install dependencies:
   ```bash
   cd frontend
   npm install
   ```

2. Run the development server:
   ```bash
   npm run dev
   ```

## Environment Variables

Create a `.env` file in the backend directory with the following variables:
```
FLASK_APP=run.py
FLASK_ENV=development
DATABASE_URL=sqlite:///plc_hub.db
SECRET_KEY=your-secret-key
```

## License

MIT 