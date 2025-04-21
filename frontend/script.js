// Global Variables
let memoryState = {
    totalMemory: 1024, // KB
    usedMemory: 0,
    freeMemory: 1024,
    fragmentation: 0,
    blocks: [],
    processQueue: []
};

let simulationRunning = false;
let simulationInterval;
const API_URL = 'http://localhost:3000';

// DOM Elements
const processSizeInput = document.getElementById('process-size');
const algorithmSelect = document.getElementById('algorithm');
const pageReplacementSelect = document.getElementById('page-replacement');
const processIdSelect = document.getElementById('process-id');
const allocateBtn = document.getElementById('allocate-btn');
const deallocateBtn = document.getElementById('deallocate-btn');
const playBtn = document.getElementById('play-btn');
const pauseBtn = document.getElementById('pause-btn');
const resetBtn = document.getElementById('reset-btn');
const memoryBlocksContainer = document.getElementById('memory-blocks');
const processQueueContainer = document.getElementById('process-queue');
const totalMemorySpan = document.getElementById('total-memory');
const usedMemorySpan = document.getElementById('used-memory');
const freeMemorySpan = document.getElementById('free-memory');
const fragmentationSpan = document.getElementById('fragmentation');

// Event Listeners
document.addEventListener('DOMContentLoaded', initializeSimulator);
allocateBtn.addEventListener('click', allocateMemory);
deallocateBtn.addEventListener('click', deallocateMemory);
playBtn.addEventListener('click', startSimulation);
pauseBtn.addEventListener('click', pauseSimulation);
resetBtn.addEventListener('click', resetSimulation);

// Initialize the simulator
function initializeSimulator() {
    // Set initial memory state
    updateMemoryStats();
    fetchMemoryStatus();
}

// Fetch memory status from the backend
async function fetchMemoryStatus() {
    try {
        const response = await fetch(`${API_URL}/memory-status`);
        if (!response.ok) {
            throw new Error('Failed to fetch memory status');
        }
        const data = await response.json();
        updateMemoryState(data);
    } catch (error) {
        console.error('Error fetching memory status:', error);
        // For initial development, create a mock memory state
        createMockMemoryState();
    }
}

// Create a mock memory state for initial development
function createMockMemoryState() {
    memoryState.blocks = [
        { id: null, start: 0, size: 256, status: 'free' },
        { id: 1, start: 256, size: 128, status: 'allocated' },
        { id: null, start: 384, size: 64, status: 'free' },
        { id: 2, start: 448, size: 256, status: 'allocated' },
        { id: null, start: 704, size: 320, status: 'free' }
    ];
    
    memoryState.processQueue = [
        { id: 3, size: 192 },
        { id: 4, size: 384 }
    ];
    
    updateMemoryState(memoryState);
}

// Update the memory state and UI
function updateMemoryState(data) {
    memoryState = data;
    renderMemoryBlocks();
    renderProcessQueue();
    updateMemoryStats();
    updateProcessIdDropdown();
}

// Render memory blocks in the UI
function renderMemoryBlocks() {
    memoryBlocksContainer.innerHTML = '';
    
    memoryState.blocks.forEach(block => {
        const blockElement = document.createElement('div');
        blockElement.className = `memory-block ${block.status}`;
        
        // Calculate width based on block size relative to total memory
        const widthPercentage = (block.size / memoryState.totalMemory) * 100;
        blockElement.style.width = `${widthPercentage}%`;
        
        // Add block information
        if (block.status === 'allocated') {
            blockElement.innerHTML = `<div>P${block.id}</div><div>${block.size}KB</div>`;
        } else {
            blockElement.innerHTML = `<div>Free</div><div>${block.size}KB</div>`;
        }
        
        memoryBlocksContainer.appendChild(blockElement);
    });
}

// Render process queue in the UI
function renderProcessQueue() {
    processQueueContainer.innerHTML = '';
    
    memoryState.processQueue.forEach(process => {
        const processElement = document.createElement('div');
        processElement.className = 'process-item';
        processElement.innerHTML = `
            <div class="process-id">P${process.id}</div>
            <div class="process-size">${process.size}KB</div>
        `;
        
        processQueueContainer.appendChild(processElement);
    });
}

// Update memory statistics in the UI
function updateMemoryStats() {
    // Calculate used memory and free memory
    let usedMem = 0;
    let fragmentedMem = 0;
    
    if (memoryState.blocks && memoryState.blocks.length > 0) {
        memoryState.blocks.forEach(block => {
            if (block.status === 'allocated') {
                usedMem += block.size;
            } else if (block.status === 'fragmented') {
                fragmentedMem += block.size;
            }
        });
    }
    
    memoryState.usedMemory = usedMem;
    memoryState.freeMemory = memoryState.totalMemory - usedMem;
    memoryState.fragmentation = (fragmentedMem / memoryState.totalMemory) * 100;
    
    // Update UI
    totalMemorySpan.textContent = `${memoryState.totalMemory} KB`;
    usedMemorySpan.textContent = `${memoryState.usedMemory} KB`;
    freeMemorySpan.textContent = `${memoryState.freeMemory} KB`;
    fragmentationSpan.textContent = `${memoryState.fragmentation.toFixed(2)}%`;
}

// Update process ID dropdown for deallocation
function updateProcessIdDropdown() {
    // Clear existing options except the first one
    while (processIdSelect.options.length > 1) {
        processIdSelect.remove(1);
    }
    
    // Add options for allocated processes
    if (memoryState.blocks) {
        const allocatedProcesses = memoryState.blocks.filter(block => block.status === 'allocated');
        
        allocatedProcesses.forEach(process => {
            const option = document.createElement('option');
            option.value = process.id;
            option.textContent = `Process ${process.id} (${process.size}KB)`;
            processIdSelect.appendChild(option);
        });
    }
}

// Allocate memory
async function allocateMemory() {
    const size = parseInt(processSizeInput.value);
    const algorithm = algorithmSelect.value;
    
    if (isNaN(size) || size <= 0) {
        alert('Please enter a valid process size');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/allocate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ size, algorithm })
        });
        
        if (!response.ok) {
            throw new Error('Failed to allocate memory');
        }
        
        const data = await response.json();
        updateMemoryState(data.memory);
    } catch (error) {
        console.error('Error allocating memory:', error);
        // For development without backend, simulate allocation
        simulateAllocation(size, algorithm);
    }
}

// Deallocate memory
async function deallocateMemory() {
    const processId = parseInt(processIdSelect.value);
    
    if (isNaN(processId)) {
        alert('Please select a process to deallocate');
        return;
    }
    
    try {
        const response = await fetch(`${API_URL}/deallocate`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ processId })
        });
        
        if (!response.ok) {
            throw new Error('Failed to deallocate memory');
        }
        
        const data = await response.json();
        updateMemoryState(data.memory);
    } catch (error) {
        console.error('Error deallocating memory:', error);
        // For development without backend, simulate deallocation
        simulateDeallocation(processId);
    }
}

// Simulate memory allocation (for development without backend)
function simulateAllocation(size, algorithm) {
    // Generate a new process ID
    const newProcessId = Math.max(...memoryState.blocks
        .filter(block => block.status === 'allocated')
        .map(block => block.id || 0), 0) + 1;
    
    // Simple first-fit algorithm for demonstration
    let allocated = false;
    
    if (algorithm === 'fixed-partitioning') {
        // Fixed partitioning logic
        const partitionSize = 256; // Example fixed partition size
        
        if (size <= partitionSize) {
            // Find a free partition
            for (let i = 0; i < memoryState.blocks.length; i++) {
                if (memoryState.blocks[i].status === 'free' && memoryState.blocks[i].size === partitionSize) {
                    memoryState.blocks[i].status = 'allocated';
                    memoryState.blocks[i].id = newProcessId;
                    allocated = true;
                    break;
                }
            }
        }
    } else {
        // Dynamic partitioning (first-fit, best-fit, worst-fit)
        let selectedBlockIndex = -1;
        
        if (algorithm === 'first-fit' || algorithm === 'dynamic-partitioning') {
            // First-fit: allocate in the first block that fits
            for (let i = 0; i < memoryState.blocks.length; i++) {
                if (memoryState.blocks[i].status === 'free' && memoryState.blocks[i].size >= size) {
                    selectedBlockIndex = i;
                    break;
                }
            }
        } else if (algorithm === 'best-fit') {
            // Best-fit: allocate in the smallest block that fits
            let minExtraSpace = Infinity;
            
            for (let i = 0; i < memoryState.blocks.length; i++) {
                if (memoryState.blocks[i].status === 'free' && memoryState.blocks[i].size >= size) {
                    const extraSpace = memoryState.blocks[i].size - size;
                    if (extraSpace < minExtraSpace) {
                        minExtraSpace = extraSpace;
                        selectedBlockIndex = i;
                    }
                }
            }
        } else if (algorithm === 'worst-fit') {
            // Worst-fit: allocate in the largest block
            let maxExtraSpace = -1;
            
            for (let i = 0; i < memoryState.blocks.length; i++) {
                if (memoryState.blocks[i].status === 'free' && memoryState.blocks[i].size >= size) {
                    const extraSpace = memoryState.blocks[i].size - size;
                    if (extraSpace > maxExtraSpace) {
                        maxExtraSpace = extraSpace;
                        selectedBlockIndex = i;
                    }
                }
            }
        }
        
        if (selectedBlockIndex !== -1) {
            const block = memoryState.blocks[selectedBlockIndex];
            const remainingSize = block.size - size;
            
            // Update the selected block
            block.size = size;
            block.status = 'allocated';
            block.id = newProcessId;
            
            // Create a new block for the remaining space if any
            if (remainingSize > 0) {
                const newBlock = {
                    id: null,
                    start: block.start + size,
                    size: remainingSize,
                    status: 'free'
                };
                
                memoryState.blocks.splice(selectedBlockIndex + 1, 0, newBlock);
            }
            
            allocated = true;
        }
    }
    
    if (!allocated) {
        // Add to process queue if allocation failed
        memoryState.processQueue.push({
            id: newProcessId,
            size: size
        });
    }
    
    updateMemoryState(memoryState);
}

// Simulate memory deallocation (for development without backend)
function simulateDeallocation(processId) {
    // Find the block with the given process ID
    const blockIndex = memoryState.blocks.findIndex(block => 
        block.status === 'allocated' && block.id === processId);
    
    if (blockIndex !== -1) {
        // Mark the block as free
        memoryState.blocks[blockIndex].status = 'free';
        memoryState.blocks[blockIndex].id = null;
        
        // Merge adjacent free blocks
        mergeAdjacentFreeBlocks();
        
        // Try to allocate waiting processes
        tryAllocateWaitingProcesses();
        
        updateMemoryState(memoryState);
    }
}

// Merge adjacent free blocks
function mergeAdjacentFreeBlocks() {
    for (let i = 0; i < memoryState.blocks.length - 1; i++) {
        if (memoryState.blocks[i].status === 'free' && memoryState.blocks[i+1].status === 'free') {
            // Merge the blocks
            memoryState.blocks[i].size += memoryState.blocks[i+1].size;
            // Remove the second block
            memoryState.blocks.splice(i+1, 1);
            // Check the same index again
            i--;
        }
    }
}

// Try to allocate waiting processes
function tryAllocateWaitingProcesses() {
    if (memoryState.processQueue.length === 0) return;
    
    // Try to allocate the first waiting process
    const waitingProcess = memoryState.processQueue[0];
    
    // Find a free block that can fit the process
    const blockIndex = memoryState.blocks.findIndex(block => 
        block.status === 'free' && block.size >= waitingProcess.size);
    
    if (blockIndex !== -1) {
        // Allocate the process
        const block = memoryState.blocks[blockIndex];
        const remainingSize = block.size - waitingProcess.size;
        
        // Update the block
        block.size = waitingProcess.size;
        block.status = 'allocated';
        block.id = waitingProcess.id;
        
        // Create a new block for the remaining space if any
        if (remainingSize > 0) {
            const newBlock = {
                id: null,
                start: block.start + waitingProcess.size,
                size: remainingSize,
                status: 'free'
            };
            
            memoryState.blocks.splice(blockIndex + 1, 0, newBlock);
        }
        
        // Remove the process from the queue
        memoryState.processQueue.shift();
    }
}

// Start simulation
function startSimulation() {
    if (simulationRunning) return;
    
    simulationRunning = true;
    simulationInterval = setInterval(() => {
        // Simulate automatic allocation and deallocation
        if (Math.random() < 0.5 && memoryState.freeMemory > 50) {
            // Random allocation
            const size = Math.floor(Math.random() * 100) + 20; // 20-120 KB
            const algorithms = ['first-fit', 'best-fit', 'worst-fit'];
            const algorithm = algorithms[Math.floor(Math.random() * algorithms.length)];
            
            simulateAllocation(size, algorithm);
        } else if (memoryState.blocks.some(block => block.status === 'allocated')) {
            // Random deallocation
            const allocatedBlocks = memoryState.blocks.filter(block => block.status === 'allocated');
            const randomBlock = allocatedBlocks[Math.floor(Math.random() * allocatedBlocks.length)];
            
            simulateDeallocation(randomBlock.id);
        }
    }, 2000); // Every 2 seconds
}

// Pause simulation
function pauseSimulation() {
    if (!simulationRunning) return;
    
    simulationRunning = false;
    clearInterval(simulationInterval);
}

// Reset simulation
function resetSimulation() {
    pauseSimulation();
    
    // Reset memory state
    memoryState = {
        totalMemory: 1024,
        usedMemory: 0,
        freeMemory: 1024,
        fragmentation: 0,
        blocks: [{ id: null, start: 0, size: 1024, status: 'free' }],
        processQueue: []
    };
    
    updateMemoryState(memoryState);
}