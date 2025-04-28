# 📝 Memory Management Simulator Project Prompt

## 📌 Project Overview

Create a Memory Management Simulator that demonstrates various memory management algorithms used in operating systems. The project will have the following components:

- **Frontend**: Built using HTML, CSS, and JavaScript, providing a visual representation of memory allocation.
- **Backend**: Developed using Node.js (Express.js) to handle requests and communicate with the C++ module.
- **C++ Logic**: Implements various memory management algorithms and is executed by the backend using child processes.

## 📌 Features & Requirements

### ✅ Memory Management Algorithms to Implement

1. **Fixed Partitioning**
2. **Dynamic Partitioning**
3. **Paging**
4. **Segmentation**
5. **Buddy System**
6. **Allocation Strategies**:
   - First Fit
   - Best Fit
   - Worst Fit
7. **Page Replacement Algorithms**:
   - FIFO
   - LRU (Least Recently Used)

### ✅ User Interactions (Frontend)

1. **Allocate Memory**
   - Users can input process sizes
   - Select an allocation algorithm

2. **Deallocate Memory**
   - Remove a process from memory

3. **Memory Visualization**
   - Represent memory as colored blocks with different statuses
   - Display process queue waiting for memory allocation

4. **Simulation Controls**
   - Play
   - Pause
   - Reset simulation

### ✅ Backend (Node.js + Express)

#### API Endpoints

1. `POST /allocate`
   - Sends memory allocation request to the C++ logic

2. `POST /deallocate`
   - Sends process removal request

3. `GET /memory-status`
   - Returns the current state of memory

#### Additional Backend Responsibilities

- Execute C++ Binary using `child_process`
- Convert frontend requests into C++ command-line arguments

### ✅ C++ Logic

- Process memory allocation & deallocation requests
- Handle different memory management algorithms
- Output memory state as JSON for frontend visualization

## 📌 Step-by-Step Development Plan

### 1️⃣ Setup the Project Structure

```bash
mkdir memory-management-simulator
cd memory-management-simulator
mkdir backend frontend
```

### 2️⃣ Backend Setup (Node.js)

```bash
cd backend
npm init -y
npm install express cors child_process body-parser
touch server.js
```

### 3️⃣ Implement C++ Logic for Memory Management

```bash
touch memory_sim.cpp
g++ memory_sim.cpp -o memory_sim.out
```

### 4️⃣ Create API Routes

- Create `routes.js`
- Setup Express routes for allocation, deallocation, and memory status
- Use `child_process.spawn` to execute `memory_sim.out`

### 5️⃣ Setup Frontend

```bash
cd ../frontend
touch index.html style.css script.js
```

- `index.html`: UI components for memory visualization
- `style.css`: Styles for memory blocks
- `script.js`: Fetch API data and update UI dynamically

### 6️⃣ Test Backend

```bash
cd ../backend
node server.js
```

### 7️⃣ Test Frontend

```bash
open index.html  # (Windows: start index.html, Linux/Mac: open index.html)
```

### 8️⃣ Improve UI and Add Animations

- Use CSS animations for real-time memory allocation
- Add interactive elements

### 9️⃣ Optimize C++ Logic

- Reduce execution time for large memory blocks
- Implement efficient data structures

### 🔟 Final Testing & Deployment

- Test all edge cases
- Host Backend on Render/Vercel
- Host Frontend on Netlify/GitHub Pages

## 📌 Dependencies

### Backend
- Node.js
- Express.js
- CORS
- Body-parser
- Child_process (built-in)

### Frontend
- Vanilla JavaScript
- HTML, CSS

### C++
- Standard Template Library (STL)

## 📌 API Specifications

### POST /allocate

**Request**:
```json
{
  "size": 100,
  "algorithm": "first-fit"
}
```

**Response**:
```json
{
  "status": "success",
  "memory": [...]
}
```

### POST /deallocate

**Request**:
```json
{
  "processId": 2
}
```

**Response**:
```json
{
  "status": "success",
  "memory": [...]
}
```

### GET /memory-status

**Response**:
```json
{
  "memory": [...]
}
```

---
