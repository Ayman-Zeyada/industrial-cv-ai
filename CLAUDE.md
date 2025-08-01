# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Industrial Vision AI is a browser-based quality inspection system that transforms tablets/computers into powerful defect detection tools for manufacturing. The system runs entirely in web browsers using WebGPU acceleration and WebAssembly for performance-critical computer vision operations.

## Architecture

The system follows a layered architecture:

```
┌─────────────────────────────────────────┐
│         Web UI (React)                  │
├─────────────────────────────────────────┤
│    WebAssembly Module (C++)            │
├─────────────────────────────────────────┤
│      WebGPU Compute Shaders            │
├─────────────────────────────────────────┤
│     Browser APIs (Camera, Storage)     │
└─────────────────────────────────────────┘
```

Key technical components:
- **Frontend**: React-based UI for camera control, training interface, and inspection workflows
- **Computer Vision Core**: C++/WebAssembly modules for image processing and defect detection
- **GPU Acceleration**: WebGPU compute shaders for real-time processing (30+ FPS target)
- **AI Inference**: ONNX Runtime with WebGPU backend for neural network inference
- **Storage**: IndexedDB for model persistence and training data

## Development Setup

### Required Tools
```bash
# Install Emscripten SDK for WebAssembly compilation
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh

# Node.js 18+ for frontend development
# CMake 3.20+ for build configuration
# Chrome 113+ or Edge 113+ (WebGPU support required)
```

### Build Commands

Currently the repository contains planning documents only. When development begins, these commands will be relevant:

```bash
# C++/WebAssembly compilation with WebGPU support
emcc main.cpp \
    -s USE_WEBGPU=1 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MAXIMUM_MEMORY=4GB \
    -s SIMD=1 \
    -msimd128 \
    -O3 \
    --bind \
    -o industrial_cv.js

# Frontend development server
npm run dev

# Production build
npm run build
```

## Implementation Phases

The POC development follows a 10-week plan:

1. **Weeks 1-2**: Environment setup, WebGPU detection, camera capture
2. **Weeks 3-4**: WebGPU compute pipeline, frame processing
3. **Weeks 5-6**: Classical CV algorithms (template matching, defect detection)
4. **Weeks 7-8**: AI integration with ONNX Runtime
5. **Weeks 9-10**: Complete MVP with React UI and performance optimization

## Key Technical Considerations

### Performance Requirements
- Target: 30+ FPS on integrated GPUs
- Use ring buffers for zero-copy frame handling
- Batch GPU operations when possible
- Minimize JavaScript ↔ WebAssembly boundary crossings

### Browser Compatibility
- Primary: Chrome/Edge 113+ (WebGPU support)
- Fallback: WebGL implementation for broader compatibility
- Progressive enhancement for different GPU capabilities

### Testing Strategy
- Home testing with PCBs, LEGO bricks, or printed patterns
- Success criteria: 90%+ defect detection, <5% false positives
- Performance profiling with Chrome DevTools WebGPU inspector

## Domain-Specific Knowledge

### Manufacturing Context
- Target markets: Electronics (PCB inspection), Pharmaceutical (pill counting), Automotive (surface defects)
- Quality control replaces $50,000+ traditional machine vision systems
- Must work offline for factory security requirements
- Industrial cameras vs consumer webcams consideration

### Computer Vision Pipeline
- Real-time alignment using feature matching
- Difference mapping between reference and test images
- Morphological operations for noise filtering
- Connected component analysis for defect region extraction
- Template matching for known defect patterns

When implementing features, always consider the manufacturing environment constraints: no internet connectivity, varying lighting conditions, and the need for non-technical operators to use the system effectively.