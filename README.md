# PLC Modbus Hub

## Project Description

This project is a web-based application designed to monitor and control Modbus TCP/IP PLCs. It features a Flask backend for API services and Modbus communication, a React frontend for data visualization, and real-time updates via WebSockets. It also includes a mock PLC simulator for development and testing without a physical PLC.

## Features

- **PLC Management:** Add, view, update, and delete PLC configurations.
- **Register Management:** Add, view, update, and delete Modbus registers for each PLC.
- **Real-time Monitoring:** Live updates of register values via WebSockets for selected PLCs.
- **Dashboard:** Visualize real-time register data with summary cards.
- **Mock PLC Simulator:** Simulate Modbus TCP/IP communication for development and testing.
- **Authentication:** User registration and login.

## Technologies Used

**Backend (Flask)**
- Python 3.8+
- Flask: Web framework
- Flask-SQLAlchemy: ORM for database interactions
- Flask-SocketIO: WebSocket integration
- PyModbus: Modbus TCP/IP communication library
- SQLite: Default database
- Flask-Migrate: Database migrations
- Flask-CORS: Cross-Origin Resource Sharing

**Frontend (React)**
- React.js: JavaScript library for building user interfaces
- React Query: Data fetching, caching, and synchronization
- Chart.js: Flexible JavaScript charting library
- Socket.IO-client: WebSocket client
- Axios: Promise-based HTTP client
- Tailwind CSS: Utility-first CSS framework
- Vite: Next-generation frontend tooling

## Setup and Installation

### Prerequisites
- Python 3.8+
- Node.js (LTS version) and npm/yarn

### 1. Clone the Repository

```bash
git clone <repository-url>
cd Adcons-Modbus-hub # or your repository name
```

### 2. Backend Setup

Navigate to the `backend` directory:

```bash
cd backend
```

Create and activate a virtual environment:

```bash
python -m venv venv
# On Windows
.\venv\Scripts\activate
# On macOS/Linux
source venv/bin/activate
```

Install Python dependencies:

```bash
pip install -r requirements.txt
```

Initialize the database and run migrations:

```bash
flask db init
flask db migrate -m "Initial migration"
flask db upgrade
```

Set environment variables (create a `.env` file in the `backend` directory):

```dotenv
SECRET_KEY=your_secret_key_here
DATABASE_URL=sqlite:///instance/plc_hub.db # Or your preferred database URL
```

### 3. Frontend Setup

Open a new terminal and navigate to the `frontend` directory:

```bash
cd frontend
```

Install Node.js dependencies:

```bash
npm install
# or
yarn install
```

## Running the Application

### 1. Start the Backend Server

In your `backend` terminal (with the virtual environment activated):

```bash
python run.py
```

This will start the Flask server and Socket.IO on `http://localhost:5000`.

### 2. Start the Frontend Development Server

In your `frontend` terminal:

```bash
npm run dev
# or
yarn dev
```

This will start the React development server on `http://localhost:5173` (or another available port).

Open your browser and navigate to `http://localhost:5173` to access the application.

## API Endpoints

All API endpoints are prefixed with `/api`.

### PLC Management
- `GET /api/plcs`: Get all PLCs
- `GET /api/plcs/<plc_id>`: Get a specific PLC by ID
- `POST /api/plcs`: Add a new PLC

### Register Management
- `GET /api/plcs/<plc_id>/registers`: Get all registers for a PLC
- `POST /api/plcs/<plc_id>/registers`: Add a new register to a PLC
- `PUT /api/plcs/<plc_id>/registers/<register_id>`: Update a register
- `DELETE /api/plcs/<plc_id>/registers/<register_id>`: Delete a register

### Monitoring
- `POST /api/plcs/<plc_id>/start-monitoring`: Start real-time monitoring of a PLC's registers
- `POST /api/plcs/<plc_id>/stop-monitoring`: Stop real-time monitoring

### Mock PLC Endpoints

These endpoints are for the simulated PLC functionality. They are prefixed with `/api/mock`.

- `GET /api/mock/plcs`: Get all mock PLCs
- `POST /api/mock/plcs`: Add a new mock PLC
- `DELETE /api/mock/plcs/<plc_id>`: Remove a mock PLC
- `GET /api/mock/plcs/<plc_id>/registers`: Get all registers for a mock PLC
- `POST /api/mock/plcs/<plc_id>/registers`: Add a new register to a mock PLC
- `PUT /api/mock/plcs/<plc_id>/registers/<register_id>`: Update a mock register
- `DELETE /api/mock/plcs/<plc_id>/registers/<register_id>`: Remove a mock register
- `GET /api/mock/plcs/<plc_id>/registers/<register_id>/value`: Get mock register value
- `PUT /api/mock/plcs/<plc_id>/registers/<register_id>/value`: Set mock register value
- `POST /api/mock/plcs/<plc_id>/monitor`: Start monitoring mock registers
- `DELETE /api/mock/plcs/<plc_id>/monitor`: Stop monitoring mock registers

## Using the Mock PLC

To use the mock PLC, simply interact with the `/api/mock` endpoints from your frontend or through tools like Postman/Insomnia. The mock PLC will generate random values for its registers.

## Troubleshooting

- **`RuntimeError: Working outside of application context.`**: If you encounter this error in backend threads, ensure that `with app.app_context():` is used around database operations as shown in `registers.py` and `plc_routes.py`.
- **WebSocket connection issues**: Ensure your frontend `socket.io-client` is configured to connect to `http://localhost:5000` (your backend) and not the frontend development server.
- **`Connection to (...) failed: [Errno 11001] getaddrinfo failed`**: This indicates your backend cannot connect to the PLC. Ensure your PLC (or simulator) is running and accessible at the specified IP address and port.

## License

This project is licensed under the MIT License. 