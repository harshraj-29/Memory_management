#include <iostream>
#include <vector>
#include <string>
#include <algorithm>
#include <queue>
#include <cstring>
#include <sstream>
#include <iomanip>
#include <map>
#include <unordered_map>

// Memory block structure
struct MemoryBlock {
    int id;          // Process ID (null if free)
    int start;       // Start address
    int size;        // Size in KB
    std::string status; // "free", "allocated", or "fragmented"

    MemoryBlock(int _id, int _start, int _size, std::string _status)
        : id(_id), start(_start), size(_size), status(_status) {}
};

// Process structure for queue
struct Process {
    int id;
    int size;

    Process(int _id, int _size) : id(_id), size(_size) {}
};

// Memory Manager class
class MemoryManager {
private:
    int totalMemory;
    int usedMemory;
    int freeMemory;
    double fragmentation;
    std::vector<MemoryBlock> blocks;
    std::vector<Process> processQueue;
    int nextProcessId;

    // Page table for paging algorithm
    std::unordered_map<int, std::vector<int>> pageTable; // process_id -> page numbers
    int pageSize;
    std::vector<bool> frameAllocation; // true if frame is allocated

    // For page replacement algorithms
    std::queue<int> fifoQueue;
    std::vector<int> lruList;

public:
    MemoryManager(int memorySize = 1024, int _pageSize = 4)
        : totalMemory(memorySize), usedMemory(0), freeMemory(memorySize),
          fragmentation(0), nextProcessId(1), pageSize(_pageSize) {
        // Initialize with one free block
        blocks.push_back(MemoryBlock(0, 0, totalMemory, "free"));
        
        // Initialize frame allocation for paging
        int frameCount = totalMemory / pageSize;
        frameAllocation.resize(frameCount, false);
    }

    // Get memory status as JSON string
    std::string getMemoryStatusJson() {
        std::stringstream json;
        
        json << "{\n";
        json << "  \"totalMemory\": " << totalMemory << ",\n";
        json << "  \"usedMemory\": " << usedMemory << ",\n";
        json << "  \"freeMemory\": " << freeMemory << ",\n";
        json << "  \"fragmentation\": " << std::fixed << std::setprecision(2) << fragmentation << ",\n";
        
        // Add blocks
        json << "  \"blocks\": [\n";
        for (size_t i = 0; i < blocks.size(); ++i) {
            json << "    {\n";
            if (blocks[i].id == 0) {
                json << "      \"id\": null,\n";
            } else {
                json << "      \"id\": " << blocks[i].id << ",\n";
            }
            json << "      \"start\": " << blocks[i].start << ",\n";
            json << "      \"size\": " << blocks[i].size << ",\n";
            json << "      \"status\": \"" << blocks[i].status << "\"\n";
            json << "    }";
            if (i < blocks.size() - 1) {
                json << ",";
            }
            json << "\n";
        }
        json << "  ],\n";
        
        // Add process queue
        json << "  \"processQueue\": [\n";
        for (size_t i = 0; i < processQueue.size(); ++i) {
            json << "    {\n";
            json << "      \"id\": " << processQueue[i].id << ",\n";
            json << "      \"size\": " << processQueue[i].size << "\n";
            json << "    }";
            if (i < processQueue.size() - 1) {
                json << ",";
            }
            json << "\n";
        }
        json << "  ]\n";
        
        json << "}";
        
        return json.str();
    }

    // Update memory statistics
    void updateMemoryStats() {
        usedMemory = 0;
        int fragmentedMemory = 0;
        
        for (const auto& block : blocks) {
            if (block.status == "allocated") {
                usedMemory += block.size;
            } else if (block.status == "fragmented") {
                fragmentedMemory += block.size;
            }
        }
        
        freeMemory = totalMemory - usedMemory;
        fragmentation = (static_cast<double>(fragmentedMemory) / totalMemory) * 100.0;
    }

    // Merge adjacent free blocks
    void mergeAdjacentFreeBlocks() {
        for (size_t i = 0; i < blocks.size() - 1; ) {
            if (blocks[i].status == "free" && blocks[i + 1].status == "free") {
                // Merge blocks
                blocks[i].size += blocks[i + 1].size;
                blocks.erase(blocks.begin() + i + 1);
                // Don't increment i, check the same position again
            } else {
                ++i;
            }
        }
    }

    // Try to allocate waiting processes
    void tryAllocateWaitingProcesses() {
        if (processQueue.empty()) return;
        
        // Try to allocate the first waiting process
        Process waitingProcess = processQueue.front();
        
        // Find a free block that can fit the process
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free" && blocks[i].size >= waitingProcess.size) {
                // Allocate the process
                int remainingSize = blocks[i].size - waitingProcess.size;
                
                // Update the block
                blocks[i].size = waitingProcess.size;
                blocks[i].status = "allocated";
                blocks[i].id = waitingProcess.id;
                
                // Create a new block for the remaining space if any
                if (remainingSize > 0) {
                    blocks.insert(blocks.begin() + i + 1, 
                        MemoryBlock(0, blocks[i].start + waitingProcess.size, remainingSize, "free"));
                }
                
                // Remove the process from the queue
                processQueue.erase(processQueue.begin());
                
                // Update memory statistics
                updateMemoryStats();
                return;
            }
        }
    }

    // Fixed Partitioning
    bool allocateFixedPartitioning(int size) {
        const int partitionSize = 256; // Example fixed partition size
        
        if (size > partitionSize) {
            return false; // Process too large for fixed partition
        }
        
        // Find a free partition
        for (auto& block : blocks) {
            if (block.status == "free" && block.size == partitionSize) {
                block.status = "allocated";
                block.id = nextProcessId++;
                updateMemoryStats();
                return true;
            }
        }
        
        // If no partition of exact size exists, initialize partitions
        if (blocks.size() == 1 && blocks[0].status == "free" && blocks[0].size == totalMemory) {
            blocks.clear();
            
            // Create fixed partitions
            int numPartitions = totalMemory / partitionSize;
            for (int i = 0; i < numPartitions; ++i) {
                if (i == 0) {
                    // Allocate the first partition to the process
                    blocks.push_back(MemoryBlock(nextProcessId++, i * partitionSize, partitionSize, "allocated"));
                } else {
                    blocks.push_back(MemoryBlock(0, i * partitionSize, partitionSize, "free"));
                }
            }
            
            updateMemoryStats();
            return true;
        }
        
        return false; // No free partition available
    }

    // First Fit algorithm
    bool allocateFirstFit(int size) {
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free" && blocks[i].size >= size) {
                int remainingSize = blocks[i].size - size;
                
                // Update the block
                blocks[i].size = size;
                blocks[i].status = "allocated";
                blocks[i].id = nextProcessId++;
                
                // Create a new block for the remaining space if any
                if (remainingSize > 0) {
                    blocks.insert(blocks.begin() + i + 1, 
                        MemoryBlock(0, blocks[i].start + size, remainingSize, "free"));
                }
                
                updateMemoryStats();
                return true;
            }
        }
        
        return false; // No suitable block found
    }

    // Best Fit algorithm
    bool allocateBestFit(int size) {
        int bestFitIndex = -1;
        int minExtraSpace = totalMemory + 1;
        
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free" && blocks[i].size >= size) {
                int extraSpace = blocks[i].size - size;
                if (extraSpace < minExtraSpace) {
                    minExtraSpace = extraSpace;
                    bestFitIndex = i;
                }
            }
        }
        
        if (bestFitIndex != -1) {
            int remainingSize = blocks[bestFitIndex].size - size;
            
            // Update the block
            blocks[bestFitIndex].size = size;
            blocks[bestFitIndex].status = "allocated";
            blocks[bestFitIndex].id = nextProcessId++;
            
            // Create a new block for the remaining space if any
            if (remainingSize > 0) {
                blocks.insert(blocks.begin() + bestFitIndex + 1, 
                    MemoryBlock(0, blocks[bestFitIndex].start + size, remainingSize, "free"));
            }
            
            updateMemoryStats();
            return true;
        }
        
        return false; // No suitable block found
    }

    // Worst Fit algorithm
    bool allocateWorstFit(int size) {
        int worstFitIndex = -1;
        int maxExtraSpace = -1;
        
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free" && blocks[i].size >= size) {
                int extraSpace = blocks[i].size - size;
                if (extraSpace > maxExtraSpace) {
                    maxExtraSpace = extraSpace;
                    worstFitIndex = i;
                }
            }
        }
        
        if (worstFitIndex != -1) {
            int remainingSize = blocks[worstFitIndex].size - size;
            
            // Update the block
            blocks[worstFitIndex].size = size;
            blocks[worstFitIndex].status = "allocated";
            blocks[worstFitIndex].id = nextProcessId++;
            
            // Create a new block for the remaining space if any
            if (remainingSize > 0) {
                blocks.insert(blocks.begin() + worstFitIndex + 1, 
                    MemoryBlock(0, blocks[worstFitIndex].start + size, remainingSize, "free"));
            }
            
            updateMemoryStats();
            return true;
        }
        
        return false; // No suitable block found
    }

    // Paging algorithm
    bool allocatePaging(int size) {
        // Calculate number of pages needed
        int pagesNeeded = (size + pageSize - 1) / pageSize; // Ceiling division
        
        // Count free frames
        int freeFrames = 0;
        for (bool isAllocated : frameAllocation) {
            if (!isAllocated) freeFrames++;
        }
        
        if (freeFrames < pagesNeeded) {
            return false; // Not enough free frames
        }
        
        // Allocate frames
        std::vector<int> allocatedFrames;
        for (size_t i = 0; i < frameAllocation.size() && allocatedFrames.size() < pagesNeeded; ++i) {
            if (!frameAllocation[i]) {
                frameAllocation[i] = true;
                allocatedFrames.push_back(i);
            }
        }
        
        // Update page table
        pageTable[nextProcessId] = allocatedFrames;
        
        // Update blocks for visualization
        // Clear existing blocks
        blocks.clear();
        
        // Create blocks based on frame allocation
        for (size_t i = 0; i < frameAllocation.size(); ++i) {
            int blockId = 0;
            std::string status = "free";
            
            // Find which process owns this frame
            for (const auto& entry : pageTable) {
                if (std::find(entry.second.begin(), entry.second.end(), i) != entry.second.end()) {
                    blockId = entry.first;
                    status = "allocated";
                    break;
                }
            }
            
            blocks.push_back(MemoryBlock(blockId, i * pageSize, pageSize, status));
        }
        
        nextProcessId++;
        updateMemoryStats();
        return true;
    }

    // Segmentation algorithm
    bool allocateSegmentation(int size) {
        // For simplicity, we'll implement segmentation as a variation of first-fit
        // where each process has multiple segments (code, data, stack)
        
        // Divide the process into segments (simplified)
        int codeSegmentSize = size / 3;
        int dataSegmentSize = size / 3;
        int stackSegmentSize = size - codeSegmentSize - dataSegmentSize;
        
        // Try to allocate each segment
        bool codeAllocated = false;
        bool dataAllocated = false;
        bool stackAllocated = false;
        int codeStart = 0, dataStart = 0, stackStart = 0;
        
        // Find space for code segment
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free" && blocks[i].size >= codeSegmentSize) {
                codeStart = blocks[i].start;
                int remainingSize = blocks[i].size - codeSegmentSize;
                
                // Update the block
                blocks[i].size = codeSegmentSize;
                blocks[i].status = "allocated";
                blocks[i].id = nextProcessId;
                
                // Create a new block for the remaining space if any
                if (remainingSize > 0) {
                    blocks.insert(blocks.begin() + i + 1, 
                        MemoryBlock(0, blocks[i].start + codeSegmentSize, remainingSize, "free"));
                }
                
                codeAllocated = true;
                break;
            }
        }
        
        // Find space for data segment
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free" && blocks[i].size >= dataSegmentSize) {
                dataStart = blocks[i].start;
                int remainingSize = blocks[i].size - dataSegmentSize;
                
                // Update the block
                blocks[i].size = dataSegmentSize;
                blocks[i].status = "allocated";
                blocks[i].id = nextProcessId;
                
                // Create a new block for the remaining space if any
                if (remainingSize > 0) {
                    blocks.insert(blocks.begin() + i + 1, 
                        MemoryBlock(0, blocks[i].start + dataSegmentSize, remainingSize, "free"));
                }
                
                dataAllocated = true;
                break;
            }
        }
        
        // Find space for stack segment
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free" && blocks[i].size >= stackSegmentSize) {
                stackStart = blocks[i].start;
                int remainingSize = blocks[i].size - stackSegmentSize;
                
                // Update the block
                blocks[i].size = stackSegmentSize;
                blocks[i].status = "allocated";
                blocks[i].id = nextProcessId;
                
                // Create a new block for the remaining space if any
                if (remainingSize > 0) {
                    blocks.insert(blocks.begin() + i + 1, 
                        MemoryBlock(0, blocks[i].start + stackSegmentSize, remainingSize, "free"));
                }
                
                stackAllocated = true;
                break;
            }
        }
        
        // If all segments were allocated successfully
        if (codeAllocated && dataAllocated && stackAllocated) {
            nextProcessId++;
            updateMemoryStats();
            return true;
        }
        
        // If allocation failed, deallocate any segments that were allocated
        if (codeAllocated) {
            deallocateById(nextProcessId);
        }
        
        return false;
    }

    // Buddy System algorithm
    bool allocateBuddySystem(int size) {
        // Round up size to the next power of 2
        int allocSize = 1;
        while (allocSize < size) {
            allocSize *= 2;
        }
        
        // Find the smallest free block that can fit the rounded size
        for (size_t i = 0; i < blocks.size(); ++i) {
            if (blocks[i].status == "free") {
                // Check if block size is a power of 2 and >= allocSize
                int blockSize = blocks[i].size;
                if ((blockSize & (blockSize - 1)) == 0 && blockSize >= allocSize) {
                    // Split the block until it's the right size
                    while (blockSize > allocSize) {
                        blockSize /= 2;
                        // Create two buddy blocks
                        blocks[i].size = blockSize;
                        blocks.insert(blocks.begin() + i + 1, 
                            MemoryBlock(0, blocks[i].start + blockSize, blockSize, "free"));
                    }
                    
                    // Allocate the block
                    blocks[i].status = "allocated";
                    blocks[i].id = nextProcessId++;
                    
                    updateMemoryStats();
                    return true;
                }
            }
        }
        
        // If no suitable block found, try to merge buddies to create larger blocks
        bool merged = false;
        do {
            merged = false;
            for (size_t i = 0; i < blocks.size() - 1; ++i) {
                if (blocks[i].status == "free" && blocks[i+1].status == "free") {
                    int blockSize = blocks[i].size;
                    
                    // Check if blocks are buddies (same size and aligned)
                    if (blocks[i].size == blocks[i+1].size && 
                        (blocks[i].start / blockSize) % 2 == 0 && 
                        blocks[i].start + blockSize == blocks[i+1].start) {
                        
                        // Merge buddies
                        blocks[i].size *= 2;
                        blocks.erase(blocks.begin() + i + 1);
                        merged = true;
                        break;
                    }
                }
            }
        } while (merged);
        
        // Try allocation again after merging
        return allocateBuddySystem(size);
    }

    // Allocate memory using the specified algorithm
    bool allocate(int size, const std::string& algorithm) {
        if (size <= 0 || size > totalMemory) {
            return false;
        }
        
        bool allocated = false;
        
        if (algorithm == "fixed-partitioning") {
            allocated = allocateFixedPartitioning(size);
        } else if (algorithm == "first-fit") {
            allocated = allocateFirstFit(size);
        } else if (algorithm == "best-fit") {
            allocated = allocateBestFit(size);
        } else if (algorithm == "worst-fit") {
            allocated = allocateWorstFit(size);
        } else if (algorithm == "paging") {
            allocated = allocatePaging(size);
        } else if (algorithm == "segmentation") {
            allocated = allocateSegmentation(size);
        } else if (algorithm == "buddy-system") {
            allocated = allocateBuddySystem(size);
        } else {
            // Default to first-fit
            allocated = allocateFirstFit(size);
        }
        
        if (!allocated) {
            // Add to process queue if allocation failed
            processQueue.push_back(Process(nextProcessId++, size));
        }
        
        return allocated;
    }

    // Deallocate memory by process ID
    bool deallocateById(int processId) {
        bool found = false;
        
        // Check if process is using paging
        auto pageTableIt = pageTable.find(processId);
        if (pageTableIt != pageTable.end()) {
            // Free all frames used by the process
            for (int frameNum : pageTableIt->second) {
                frameAllocation[frameNum] = false;
            }
            pageTable.erase(pageTableIt);
            found = true;
            
            // Update blocks for visualization
            blocks.clear();
            for (size_t i = 0; i < frameAllocation.size(); ++i) {
                int blockId = 0;
                std::string status = "free";
                
                // Find which process owns this frame
                for (const auto& entry : pageTable) {
                    if (std::find(entry.second.begin(), entry.second.end(), i) != entry.second.end()) {
                        blockId = entry.first;
                        status = "allocated";
                        break;
                    }
                }
                
                blocks.push_back(MemoryBlock(blockId, i * pageSize, pageSize, status));
            }
        } else {
            // For other algorithms, find and free blocks with the given process ID
            for (auto& block : blocks) {
                if (block.status == "allocated" && block.id == processId) {
                    block.status = "free";
                    block.id = 0;
                    found = true;
                }
            }
        }
        
        if (found) {
            // Merge adjacent free blocks
            mergeAdjacentFreeBlocks();
            
            // Try to allocate waiting processes
            tryAllocateWaitingProcesses();
            
            updateMemoryStats();
        }
        
        return found;
    }
};

// Main function
int main(int argc, char* argv[]) {
    MemoryManager memoryManager;
    
    // Parse command line arguments
    for (int i = 1; i < argc; ++i) {
        std::string arg = argv[i];
        
        if (arg == "--status") {
            // Output memory status
            std::cout << memoryManager.getMemoryStatusJson() << std::endl;
        } else if (arg == "--allocate" && i + 1 < argc) {
            // Allocate memory
            int size = std::stoi(argv[++i]);
            std::string algorithm = "first-fit"; // Default algorithm
            
            // Check for algorithm parameter
            if (i + 2 < argc && std::string(argv[i+1]) == "--algorithm") {
                algorithm = argv[i+2];
                i += 2;
            }
            
            memoryManager.allocate(size, algorithm);
            std::cout << memoryManager.getMemoryStatusJson() << std::endl;
        } else if (arg == "--deallocate" && i + 1 < argc) {
            // Deallocate memory
            int processId = std::stoi(argv[++i]);
            memoryManager.deallocateById(processId);
            std::cout << memoryManager.getMemoryStatusJson() << std::endl;
        }
    }
    
    return 0;
}