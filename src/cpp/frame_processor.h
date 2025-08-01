#pragma once

#include <emscripten/html5_webgpu.h>
#include <string>

struct ProcessedFrame {
    bool processed = false;
    int width = 0;
    int height = 0;
    std::string error = "";
};

class FrameProcessor {
private:
    WGPUDevice device = nullptr;
    WGPUComputePipeline pipeline = nullptr;
    WGPUBuffer outputBuffer = nullptr;
    
    bool initializePipeline();
    
public:
    FrameProcessor();
    ~FrameProcessor() = default;
    
    bool initialize(WGPUDevice device);
    ProcessedFrame processFrame(uint32_t textureId, int width, int height);
};