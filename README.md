# Memory Management Simulator

A comprehensive simulator for various memory management algorithms used in operating systems. This project demonstrates concepts like Fixed Partitioning, Dynamic Partitioning, Paging, Segmentation, and the Buddy System.

## Project Structure

The project consists of three main components:

1. **Frontend**: HTML, CSS, and JavaScript for visualization and user interaction
2. **Backend**: Node.js with Express.js for handling API requests
3. **C++ Logic**: Core implementation of memory management algorithms

## Features

- **Memory Management Algorithms**:
  - Fixed Partitioning
  - Dynamic Partitioning (First Fit, Best Fit, Worst Fit)
  - Paging
  - Segmentation
  - Buddy System

- **Page Replacement Algorithms**:
  - FIFO (First-In-First-Out)
  - LRU (Least Recently Used)

- **Interactive UI**:
  - Allocate memory with different algorithms
  - Deallocate memory
  - Visualize memory blocks and process queue
  - Simulation controls (Play, Pause, Reset)

## Setup Instructions

### Prerequisites

- Node.js (v14 or higher)
- C++ compiler (g++ or Visual C++)

### Installation

1. Clone the repository

2. Install backend dependencies:
   ```
   cd backend
   npm install
   ```

3. Compile the C++ code:
   ```
   # On Windows
   g++ memory_sim.cpp -o memory_sim.exe
   
   # On Linux/Mac
   g++ memory_sim.cpp -o memory_sim.out
   ```

### Running the Application

1. Start the backend server:
   ```
   cd backend
   npm start
   ```

2. Open the frontend in a web browser:
   ```
   # Windows
   start frontend/index.html
   
   # Mac
   open frontend/index.html
   
   # Linux
   xdg-open frontend/index.html
   ```

## Usage

1. **Allocate Memory**:
   - Enter a process size
   - Select an allocation algorithm
   - Click "Allocate Memory"

2. **Deallocate Memory**:
   - Select a process ID from the dropdown
   - Click "Deallocate Memory"

3. **Simulation Controls**:
   - Play: Start automatic allocation/deallocation
   - Pause: Pause the simulation
   - Reset: Clear all memory blocks and reset statistics

## Implementation Details

- **Frontend**: Visualizes memory blocks, process queue, and memory statistics
- **Backend**: Handles API requests and communicates with the C++ module
- **C++ Logic**: Implements memory management algorithms and outputs memory state as JSON

## License

MIT