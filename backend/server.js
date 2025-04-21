const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { spawn } = require('child_process');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Memory state (for development without C++ binary)
let memoryState = {
    totalMemory: 1024, // KB
    usedMemory: 0,
    freeMemory: 1024,
    fragmentation: 0,
    blocks: [{ id: null, start: 0, size: 1024, status: 'free' }],
    processQueue: []
};

// Helper function to execute C++ binary
function executeMemorySim(args) {
    return new Promise((resolve, reject) => {
        // Path to the C++ binary
        const binaryPath = path.join(__dirname, 'memory_sim.exe');
        
        // Spawn the C++ process
        const process = spawn(binaryPath, args);
        
        let output = '';
        let errorOutput = '';
        
        // Collect output
        process.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        // Collect error output
        process.stderr.on('data', (data) => {
            errorOutput += data.toString();
        });
        
        // Handle process completion
        process.on('close', (code) => {
            if (code !== 0) {
                console.error(`C++ process exited with code ${code}`);
                console.error(`Error output: ${errorOutput}`);
                reject(new Error(`C++ process failed with code ${code}`));
                return;
            }
            
            try {
                // Parse the JSON output from the C++ binary
                const result = JSON.parse(output);
                resolve(result);
            } catch (error) {
                console.error('Failed to parse C++ output:', error);
                console.error('Raw output:', output);
                reject(error);
            }
        });
        
        // Handle process errors
        process.on('error', (error) => {
            console.error('Failed to start C++ process:', error);
            reject(error);
        });
    });
}

// API Routes

// Get memory status
app.get('/memory-status', async (req, res) => {
    try {
        // Try to execute C++ binary
        const result = await executeMemorySim(['--status']);
        res.json(result);
    } catch (error) {
        console.error('Error getting memory status:', error);
        // Return mock memory state for development
        res.json(memoryState);
    }
});

// Allocate memory
app.post('/allocate', async (req, res) => {
    const { size, algorithm } = req.body;
    
    if (!size || !algorithm) {
        return res.status(400).json({ error: 'Size and algorithm are required' });
    }
    
    try {
        // Try to execute C++ binary
        const result = await executeMemorySim(['--allocate', size.toString(), '--algorithm', algorithm]);
        res.json({ status: 'success', memory: result });
    } catch (error) {
        console.error('Error allocating memory:', error);
        // Simulate allocation for development
        simulateAllocation(size, algorithm);
        res.json({ status: 'success', memory: memoryState });
    }
});

// Deallocate memory
app.post('/deallocate', async (req, res) => {
    const { processId } = req.body;
    
    if (!processId) {
        return res.status(400).json({ error: 'Process ID is required' });
    }
    
    try {
        // Try to execute C++ binary
        const result = await executeMemorySim(['--deallocate', processId.toString()]);
        res.json({ status: 'success', memory: result });
    } catch (error) {
        console.error('Error deallocating memory:', error);
        // Simulate deallocation for development
        simulateDeallocation(processId);
        res.json({ status: 'success', memory: memoryState });
    }
});

// Simulate memory allocation (for development without C++ binary)
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
    
    // Update memory statistics
    updateMemoryStats();
}

// Simulate memory deallocation (for development without C++ binary)
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
        
        // Update memory statistics
        updateMemoryStats();
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

// Update memory statistics
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
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Memory Management Simulator API is available at http://localhost:${PORT}`);
});