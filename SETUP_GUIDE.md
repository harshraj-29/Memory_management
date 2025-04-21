# Memory Management Simulator - Setup Guide

This guide provides step-by-step instructions for setting up and running the Memory Management Simulator project.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

- **Node.js** (v14 or higher) - [Download Node.js](https://nodejs.org/)
- **C++ Compiler**:
  - Windows: Visual C++ or MinGW/g++ - [Download MinGW](https://www.mingw-w64.org/downloads/)
  - Linux/Mac: g++ (usually pre-installed)

## Setup Instructions

### 1. Clone or Download the Repository

If you haven't already, clone or download the repository to your local machine.

### 2. Install Backend Dependencies

1. Open a terminal/command prompt
2. Navigate to the backend directory:
   ```
   cd c:\Users\harsh\Desktop\sim\memory-management-simulator\backend
  
   ```
3. Install the required Node.js packages:
   ```
   npm install
   ```
   This will install Express.js, CORS, and body-parser packages required by the server.

### 3. Compile the C++ Module

1. While still in the backend directory, compile the C++ code:

   **For Windows (using g++):**
   ```
   g++ memory_sim.cpp -o memory_sim.exe
   ```

   **For Windows (using Visual C++):**
   ```
   cl memory_sim.cpp /Fe:memory_sim.exe
   ```

   **For Linux/Mac:**
   ```
   g++ memory_sim.cpp -o memory_sim.out
   ```

### 4. Start the Backend Server

1. While still in the backend directory, start the Node.js server:
   ```
   npm start
   ```
   You should see a message indicating that the server is running on port 3000.

### 5. Access the Frontend

1. Open a web browser
2. You can access the frontend in one of two ways:

   **Option 1: Direct File Access**
   - Simply open the `index.html` file located in the frontend directory using your web browser
   - Navigate to: `file:///path/to/memory-management-simulator/frontend/index.html`

   **Option 2: Using a Local Server**
   - If you have a local server like Live Server (VS Code extension), http-server, or similar, you can serve the frontend directory

## Using the Simulator

Once both the backend server and frontend are running, you can use the simulator as follows:

1. **Allocate Memory**:
   - Enter a process size in KB
   - Select an allocation algorithm from the dropdown
   - Click "Allocate Memory"

2. **Deallocate Memory**:
   - Select a process ID from the dropdown
   - Click "Deallocate Memory"

3. **Simulation Controls**:
   - Play: Start automatic allocation/deallocation
   - Pause: Pause the simulation
   - Reset: Clear all memory blocks and reset statistics

4. **Page Replacement** (when using Paging algorithm):
   - Select a page replacement algorithm (FIFO or LRU)

## Troubleshooting

### Backend Issues

1. **Port Conflict**:
   - If port 3000 is already in use, modify the PORT variable in `server.js`

2. **C++ Compilation Errors**:
   - Ensure you have a C++ compiler installed and properly configured
   - Check for any error messages during compilation

### Frontend Issues

1. **Connection to Backend**:
   - If the frontend cannot connect to the backend, check that the API_URL in `script.js` matches your server address (default is `http://localhost:3000`)

2. **CORS Issues**:
   - If you're experiencing CORS is cd path/to/memory-management-simulator/backendsues, ensure the backend server is running and has CORS enabled (already configured in `server.js`)

## Development Notes

- The backend includes a fallback memory state for development without the C++ binary
- The frontend script also includes a mock memory state for initial development

## Project Structure

- **Frontend**: HTML, CSS, and JavaScript for visualization and user interaction
- **Backend**: Node.js with Express.js for handling API requests
- **C++ Logic**: Core implementation of memory management algorithms