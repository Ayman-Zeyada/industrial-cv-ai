#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/html5_webgpu.h>
#include <iostream>
#include <memory>

class IndustrialCVCore {
public:
    IndustrialCVCore() {
        std::cout << "Industrial CV Core initialized" << std::endl;
    }
    
    bool initializeWebGPU() {
        // WebGPU initialization will be handled by JavaScript
        // This is a placeholder for C++ WebGPU integration
        std::cout << "WebGPU initialization called from C++" << std::endl;
        return true;
    }
    
    std::string getVersion() const {
        return "Industrial CV POC v0.1.0";
    }
    
    void processFrame(intptr_t textureId, int width, int height) {
        // Placeholder for frame processing
        std::cout << "Processing frame: " << width << "x" << height << std::endl;
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(industrial_cv) {
    emscripten::class_<IndustrialCVCore>("IndustrialCVCore")
        .constructor()
        .function("initializeWebGPU", &IndustrialCVCore::initializeWebGPU)
        .function("getVersion", &IndustrialCVCore::getVersion)
        .function("processFrame", &IndustrialCVCore::processFrame);
}