#pragma once

#include <emscripten/html5_webgpu.h>
#include <string>

namespace WebGPUUtils {
    
    // Check if WebGPU is available in the browser
    bool isWebGPUAvailable();
    
    // Get adapter information
    std::string getAdapterInfo(WGPUAdapter adapter);
    
    // Create WebGPU device from adapter
    WGPUDevice createDevice(WGPUAdapter adapter);
    
}