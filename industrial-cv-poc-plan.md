# Industrial Vision AI - Proof of Concept Development Plan

## POC Goal

Build a minimal web application that can detect defects in objects using a webcam, running entirely in the browser with WebGPU acceleration.

## Test Setup for Home

- **Test objects**: PCBs, pills/candies, or LEGO bricks (consistent manufactured items)
- **Defects to detect**: Missing components, wrong colors, scratches, misalignment
- **Camera**: Built-in laptop webcam or USB webcam
- **Browser**: Chrome 113+ or Edge 113+ (WebGPU support required)

## Technical Architecture Overview

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

## Phase 1: Foundation (Week 1-2)

### Task 1.1: Development Environment Setup
```bash
# Required tools
- Emscripten SDK (latest version with WebGPU support)
- CMake 3.20+ for build configuration
- Node.js 18+ and npm
- Vite for fast development
- Chrome Canary for latest WebGPU features
- C++17 compatible compiler

# Install Emscripten
git clone https://github.com/emscripten-core/emsdk.git
cd emsdk
./emsdk install latest
./emsdk activate latest
source ./emsdk_env.sh
```

**Deliverable**: Working development environment

### Task 1.2: Basic WebGPU Detection
```javascript
// Verify WebGPU availability
async function initWebGPU() {
  if (!navigator.gpu) {
    throw new Error('WebGPU not supported');
  }
  
  const adapter = await navigator.gpu.requestAdapter();
  const device = await adapter.requestDevice();
  
  return { adapter, device };
}
```

**Deliverable**: Simple HTML page that confirms WebGPU availability

### Task 1.3: Camera Stream Capture
```javascript
// Set up camera access
async function setupCamera() {
  const stream = await navigator.mediaDevices.getUserMedia({
    video: { 
      width: 1280, 
      height: 720,
      facingMode: 'environment'
    }
  });
  
  const video = document.createElement('video');
  video.srcObject = stream;
  await video.play();
  
  return video;
}
```

**Deliverable**: Web page displaying live camera feed

## Phase 2: WebGPU Pipeline (Week 3-4)

### Task 2.1: Basic Compute Shader
```wgsl
// Simple grayscale conversion shader
@group(0) @binding(0) var inputTexture: texture_2d<f32>;
@group(0) @binding(1) var outputTexture: texture_storage_2d<rgba8unorm, write>;

@compute @workgroup_size(8, 8)
fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
  let coords = vec2<i32>(global_id.xy);
  let color = textureLoad(inputTexture, coords, 0);
  let gray = dot(color.rgb, vec3<f32>(0.299, 0.587, 0.114));
  textureStore(outputTexture, coords, vec4<f32>(gray, gray, gray, 1.0));
}
```

**Deliverable**: Camera feed processed through WebGPU (grayscale conversion)

### Task 2.2: Frame Transfer Pipeline
```cpp
// C++ module for efficient frame handling
#include <emscripten.h>
#include <emscripten/bind.h>
#include <emscripten/html5_webgpu.h>

class FrameProcessor {
private:
    WGPUDevice device;
    WGPUComputePipeline pipeline;
    WGPUBuffer outputBuffer;

public:
    FrameProcessor(WGPUDevice dev) : device(dev) {
        initializePipeline();
    }
    
    // Process video frame using WebGPU
    ProcessedFrame processFrame(uint32_t textureId, int width, int height) {
        // Create command encoder
        WGPUCommandEncoder encoder = wgpuDeviceCreateCommandEncoder(device, nullptr);
        
        // Set up compute pass
        WGPUComputePassEncoder computePass = wgpuCommandEncoderBeginComputePass(encoder, nullptr);
        
        // Bind pipeline and resources
        wgpuComputePassEncoderSetPipeline(computePass, pipeline);
        
        // Dispatch compute shader
        wgpuComputePassEncoderDispatchWorkgroups(computePass, 
            (width + 7) / 8, (height + 7) / 8, 1);
        
        // Submit commands
        wgpuComputePassEncoderEnd(computePass);
        WGPUCommandBuffer commands = wgpuCommandEncoderFinish(encoder, nullptr);
        wgpuQueueSubmit(wgpuDeviceGetQueue(device), 1, &commands);
        
        return readResults();
    }
};

// Emscripten bindings
EMSCRIPTEN_BINDINGS(frame_processor) {
    emscripten::class_<FrameProcessor>("FrameProcessor")
        .constructor<intptr_t>()
        .function("processFrame", &FrameProcessor::processFrame);
}

**Deliverable**: Efficient frame transfer from camera to GPU

### Task 2.3: Basic Image Processing
Implement GPU-accelerated versions of:
- Gaussian blur (for noise reduction)
- Sobel edge detection
- Threshold operations
- Connected component labeling

**Deliverable**: Library of basic CV operations on GPU

## Phase 3: Classical CV Detection (Week 5-6)

### Task 3.1: Template Matching
```wgsl
// GPU-accelerated template matching
@compute @workgroup_size(16, 16)
fn template_match(
  @builtin(global_invocation_id) id: vec3<u32>,
  image: texture_2d<f32>,
  template: texture_2d<f32>
) -> f32 {
  // Normalized cross-correlation
  var sum = 0.0;
  for (var y = 0u; y < template_height; y++) {
    for (var x = 0u; x < template_width; x++) {
      let img_val = textureLoad(image, id.xy + vec2(x, y), 0);
      let tmpl_val = textureLoad(template, vec2(x, y), 0);
      sum += img_val.r * tmpl_val.r;
    }
  }
  return sum;
}
```

**Deliverable**: Can find known objects in camera feed

### Task 3.2: Defect Detection Algorithm
```cpp
// C++ defect detection implementation
struct Defect {
    int x, y, width, height;
    float confidence;
    std::string type;
};

class DefectDetector {
private:
    WGPUDevice device;
    WGPUTexture referenceTexture;
    
public:
    std::vector<Defect> detectDefects(WGPUTexture imageTexture, WGPUTexture referenceTexture) {
        std::vector<Defect> defects;
        
        // 1. Align image with reference using feature matching
        auto alignmentMatrix = computeAlignment(imageTexture, referenceTexture);
        
        // 2. Compute difference map on GPU
        auto diffMap = computeDifferenceMap(imageTexture, referenceTexture, alignmentMatrix);
        
        // 3. Threshold to find significant differences
        auto binaryMap = threshold(diffMap, 0.1f);
        
        // 4. Morphological operations to filter noise
        auto filteredMap = morphologicalClose(binaryMap);
        
        // 5. Extract defect regions using connected components
        defects = extractDefectRegions(filteredMap);
        
        return defects;
    }
    
private:
    // GPU-accelerated alignment using feature matching
    Mat3x3 computeAlignment(WGPUTexture img, WGPUTexture ref) {
        // Implementation using GPU compute shaders
    }
    
    // Extract connected components
    std::vector<Defect> extractDefectRegions(WGPUTexture binaryMap) {
        // Connected component labeling on GPU
    }
};

**Deliverable**: Basic defect detection working

### Task 3.3: Simple Training Interface
```typescript
interface TrainingUI {
  captureGoodSample(): void;
  captureDefectSample(): void;
  markDefectRegion(bbox: BoundingBox): void;
  saveTrainingData(): void;
}
```

**Deliverable**: Can capture and label training samples

## Phase 4: AI Integration (Week 7-8)

### Task 4.1: ONNX Runtime WebGPU
```javascript
// Initialize ONNX Runtime with WebGPU backend
import * as ort from 'onnxruntime-web/webgpu';

async function loadModel() {
  const session = await ort.InferenceSession.create(
    './models/defect_detector.onnx',
    { executionProviders: ['webgpu'] }
  );
  return session;
}
```

**Deliverable**: ONNX model running on WebGPU

### Task 4.2: Simple CNN for Defect Classification
```python
# Train simple model locally (PyTorch)
class DefectDetector(nn.Module):
    def __init__(self):
        super().__init__()
        self.conv1 = nn.Conv2d(3, 32, 3)
        self.conv2 = nn.Conv2d(32, 64, 3)
        self.fc = nn.Linear(64 * 28 * 28, 2)  # Good/Defect
    
    def forward(self, x):
        x = F.relu(F.max_pool2d(self.conv1(x), 2))
        x = F.relu(F.max_pool2d(self.conv2(x), 2))
        x = x.view(-1, 64 * 28 * 28)
        return self.fc(x)

# Export to ONNX
torch.onnx.export(model, dummy_input, "defect_detector.onnx")
```

**Deliverable**: Trained model for good/defect classification

### Task 4.3: Inference Pipeline
```cpp
// C++ inference pipeline
struct InferenceResult {
    std::vector<BoundingBox> boxes;
    std::vector<float> confidences;
    std::vector<std::string> classes;
};

class InferencePipeline {
private:
    OrtSession* session;
    WGPUDevice device;
    
public:
    InferencePipeline(const std::string& modelPath, WGPUDevice dev) : device(dev) {
        // Initialize ONNX Runtime with WebGPU provider
        OrtSessionOptions* options;
        OrtCreateSessionOptions(&options);
        OrtSessionOptionsAppendExecutionProvider_WebGPU(options, 0);
        
        OrtCreateSession(env, modelPath.c_str(), options, &session);
    }
    
    InferenceResult runInference(WGPUTexture frameTexture, int width, int height) {
        // 1. Preprocess frame (resize, normalize)
        auto preprocessed = preprocessFrame(frameTexture, width, height);
        
        // 2. Run through ONNX model
        std::vector<float> output = runONNXModel(preprocessed);
        
        // 3. Post-process (NMS, confidence threshold)
        InferenceResult result = postProcess(output);
        
        return result;
    }
    
private:
    WGPUBuffer preprocessFrame(WGPUTexture texture, int width, int height) {
        // Resize to model input size
        // Normalize pixel values
        // Convert to CHW format
    }
    
    InferenceResult postProcess(const std::vector<float>& rawOutput) {
        // Apply Non-Maximum Suppression
        // Filter by confidence threshold
        // Convert to bounding boxes
    }
};

**Deliverable**: Real-time inference on camera feed

## Phase 5: MVP Application (Week 9-10)

### Task 5.1: React Application Shell
```typescript
// Main application structure
function InspectionApp() {
  const [mode, setMode] = useState<'setup' | 'training' | 'inspection'>('setup');
  const [stats, setStats] = useState<InspectionStats>({ fps: 0, detected: 0 });
  
  return (
    <div className="app">
      <Header mode={mode} />
      <CameraView onFrame={processFrame} />
      <ControlPanel mode={mode} onModeChange={setMode} />
      <StatsPanel stats={stats} />
      {mode === 'training' && <TrainingUI />}
    </div>
  );
}
```

**Deliverable**: Complete UI for all workflows

### Task 5.2: Local Storage for Models
```javascript
// Use IndexedDB for model persistence
class ModelStorage {
  async saveModel(name: string, data: ArrayBuffer) {
    const db = await this.openDB();
    await db.put('models', { name, data, timestamp: Date.now() });
  }
  
  async loadModel(name: string): Promise<ArrayBuffer> {
    const db = await this.openDB();
    const model = await db.get('models', name);
    return model.data;
  }
}
```

**Deliverable**: Models persist between sessions

### Task 5.3: Performance Optimization
```cpp
// C++ performance optimizations
class OptimizedFrameProcessor : public FrameProcessor {
private:
    // Ring buffer for zero-copy frame handling
    struct RingBuffer {
        std::vector<WGPUTexture> textures;
        std::atomic<size_t> writeIndex{0};
        std::atomic<size_t> readIndex{0};
        static constexpr size_t BUFFER_SIZE = 4;
        
        RingBuffer(WGPUDevice device, int width, int height) {
            textures.reserve(BUFFER_SIZE);
            for (size_t i = 0; i < BUFFER_SIZE; ++i) {
                textures.push_back(createTexture(device, width, height));
            }
        }
    };
    
    RingBuffer frameBuffer;
    std::chrono::steady_clock::time_point lastFrameTime;
    
public:
    void processFrameOptimized(uint8_t* frameData, int width, int height) {
        // Frame skipping for consistent latency
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::milliseconds>(
            now - lastFrameTime).count();
        
        if (elapsed < 33) { // Target 30 FPS
            return;
        }
        
        // Get next available texture from ring buffer
        size_t writeIdx = frameBuffer.writeIndex.load();
        WGPUTexture texture = frameBuffer.textures[writeIdx % RingBuffer::BUFFER_SIZE];
        
        // Upload frame data to GPU texture (async)
        uploadFrameToTexture(frameData, texture, width, height);
        
        // Batch processing for multiple frames
        if (shouldBatchProcess()) {
            batchProcessFrames();
        }
        
        frameBuffer.writeIndex.store(writeIdx + 1);
        lastFrameTime = now;
        
        // Update performance counters
        updatePerformanceMetrics();
    }
    
private:
    void updatePerformanceMetrics() {
        static PerformanceCounter counter;
        counter.frameCount++;
        counter.gpuTime = measureGPUTime();
        counter.fps = calculateFPS();
    }
};

// CMake configuration for optimizations
// CMakeLists.txt additions:
// set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -O3 -msimd128")
// target_compile_options(industrial_cv PRIVATE 
//     -ffast-math 
//     -funroll-loops
//     -march=native)

**Deliverable**: Achieve 30+ FPS on average laptop

## Testing Plan

### Home Testing Setup
1. **Test Objects**:
   - Option A: Buy a PCB kit with known defects
   - Option B: Use LEGO sets (missing pieces = defects)
   - Option C: Printed patterns with artificial defects

2. **Test Scenarios**:
   - Single object inspection
   - Moving conveyor simulation (manual movement)
   - Different lighting conditions
   - Various defect types

3. **Performance Metrics**:
   - FPS achieved
   - Detection accuracy
   - False positive rate
   - Latency (frame to decision)

### Success Criteria
- [ ] Runs at 30+ FPS on integrated GPU
- [ ] Detects 90%+ of obvious defects
- [ ] Less than 5% false positive rate
- [ ] Works with different object types
- [ ] No internet connection required

## Technical Risks & Mitigations

### Risk 1: WebGPU Limitations
- **Mitigation**: Implement WebGL fallback for core features
- **Mitigation**: Profile extensively on different GPUs

### Risk 2: Camera API Variations
- **Mitigation**: Test on multiple devices/browsers
- **Mitigation**: Implement robust error handling

### Risk 3: C++/WASM Performance
- **Mitigation**: Use SIMD instructions extensively
- **Mitigation**: Minimize JS ↔ WASM boundary crossings
- **Mitigation**: Use Emscripten's MINIMAL_RUNTIME option
- **Mitigation**: Profile with Chrome DevTools WASM profiler

## Deliverables Summary

### Week 2: Foundation Complete
- WebGPU initialization working
- Camera feed captured and displayed

### Week 4: GPU Pipeline Working
- Basic image processing on GPU
- Efficient frame transfer pipeline

### Week 6: Classical CV Detection
- Template matching functional
- Basic defect detection algorithm

### Week 8: AI Integration
- ONNX model running on WebGPU
- Real-time inference working

### Week 10: MVP Complete
- Full application with UI
- Persistent model storage
- 30+ FPS performance

## Next Steps After POC

1. **Field Testing**: Deploy to real factory for feedback
2. **Model Improvement**: Collect real defect data
3. **Platform Features**: Multi-camera, cloud sync, analytics
4. **Performance**: Further GPU optimizations
5. **Robustness**: Handle edge cases, improve UX

## Building with Emscripten

### Compilation Commands
```bash
# Basic compilation with WebGPU support
emcc main.cpp \
    -s USE_WEBGPU=1 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MAXIMUM_MEMORY=4GB \
    -s ASSERTIONS=1 \
    -O3 \
    --bind \
    -o industrial_cv.js

# With SIMD optimizations
emcc main.cpp \
    -s USE_WEBGPU=1 \
    -s WASM=1 \
    -s SIMD=1 \
    -msimd128 \
    -O3 \
    --bind \
    -o industrial_cv_simd.js
```

### CMakeLists.txt Example
```cmake
cmake_minimum_required(VERSION 3.20)
project(industrial_cv_webgpu)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

# Emscripten-specific settings
if(EMSCRIPTEN)
    set(CMAKE_EXECUTABLE_SUFFIX ".js")
    
    # WebGPU flags
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s USE_WEBGPU=1")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s WASM=1")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s ALLOW_MEMORY_GROWTH=1")
    
    # Optimization flags
    set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
    
    # Enable SIMD
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -msimd128")
endif()

# Source files
add_executable(industrial_cv
    src/main.cpp
    src/frame_processor.cpp
    src/defect_detector.cpp
    src/inference_pipeline.cpp
)

# Link Emscripten bindings
if(EMSCRIPTEN)
    set_target_properties(industrial_cv PROPERTIES
        LINK_FLAGS "--bind -s EXPORT_ES6=1 -s MODULARIZE=1"
    )
endif()
```

---

This POC demonstrates the core technical feasibility while keeping scope manageable. The home testing approach allows rapid iteration without factory access.