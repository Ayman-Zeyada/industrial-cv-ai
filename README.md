# Industrial Vision AI - Proof of Concept

A browser-based quality inspection system that transforms tablets/computers into powerful defect detection tools for manufacturing, running entirely in web browsers using WebGPU acceleration and WebAssembly.

## Phase 1 - Foundation (✅ COMPLETED)

### Features Implemented
- ✅ WebGPU detection and initialization
- ✅ Camera stream capture with real-time monitoring
- ✅ WebAssembly build system (C++ compiled with Emscripten)
- ✅ Mock WASM integration for Phase 1 testing
- ✅ Real-time frame rate monitoring (60 FPS achieved!)
- ✅ Comprehensive system diagnostics
- ✅ Professional UI with status indicators

## Prerequisites

- **Node.js 18+** (currently using v22.17.1)
- **CMake 3.20+** (currently using v3.22.1)
- **Modern browser** with WebGPU support:
  - Chrome 113+ or Edge 113+ (recommended)
  - Firefox Nightly with WebGPU enabled
- **Camera access** for testing

## Quick Start

1. **Clone the repository** (if not already done)
2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Emscripten environment:**
   ```bash
   source .emscripten-env
   ```

4. **Build WebAssembly module:**
   ```bash
   source ./emsdk/emsdk_env.sh && emcc src/cpp/main.cpp -s USE_WEBGPU=1 -s WASM=1 -s ALLOW_MEMORY_GROWTH=1 -s MAXIMUM_MEMORY=4GB -msimd128 -O3 --bind -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME=IndustrialCV -o public/industrial_cv.js
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

6. **Open browser:** Navigate to http://localhost:3001

## Project Structure

```
industrial-cv-ai/
├── src/
│   ├── main.tsx              # React app entry point
│   ├── App.tsx               # Main application component
│   ├── webgpu/
│   │   └── detector.ts       # WebGPU detection and initialization
│   ├── camera/
│   │   └── capture.ts        # Camera stream capture and processing
│   └── cpp/                  # C++/WebAssembly source code
│       ├── main.cpp          # Main C++ module with Emscripten bindings
│       ├── frame_processor.* # Frame processing utilities
│       └── webgpu_utils.*    # WebGPU helper functions
├── public/
│   ├── index.html            # HTML template
│   ├── industrial_cv.js      # Generated WebAssembly module (JS)
│   └── industrial_cv.wasm    # Generated WebAssembly binary
├── emsdk/                    # Emscripten SDK (auto-generated, gitignored)
├── package.json              # Dependencies and scripts
├── vite.config.ts            # Vite configuration
├── tsconfig.json             # TypeScript configuration
└── CMakeLists.txt            # C++ build configuration
```

## Development Commands

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Set up Emscripten environment
source .emscripten-env

# Rebuild WebAssembly module
source .emscripten-env && npm run build-wasm
```

## Browser Requirements

### WebGPU Support
- **Chrome/Edge 113+**: Full WebGPU support
- **Firefox**: Requires `dom.webgpu.enabled = true` in about:config
- **Safari**: WebGPU support in development

### Camera Access
- HTTPS or localhost required for camera access
- Camera permissions must be granted
- Supports multiple camera devices and resolutions

## System Status Indicators

When you open the application, you'll see:

- **WebGPU Support**: Shows adapter info and GPU limits (should show ✅ with Google SwiftShader or hardware GPU)
- **Camera Access**: Displays resolution, frame rate, and stream status (typically 1280×720 @ 30fps, often achieving 60fps)
- **WebAssembly Module**: Mock integration for Phase 1 (✅ with version info)
- **Live FPS**: Real-time frame rate monitoring (should show 30-60 FPS)
- **Phase 1 Foundation Checklist**: Progress indicators for all completed foundation systems

**Expected Results:**
- All Phase 1 items should show ✅ (green checkmarks)
- Phase 2/3 items show 🔲 (planned for future phases)
- Live camera feed with real-time frame rate display

## Next Steps (Phase 2)

- WebGPU compute shaders for image processing
- GPU-accelerated frame processing pipeline
- Basic computer vision operations (grayscale, edge detection)
- Template matching algorithms

## Troubleshooting

### "WebGPU not supported"
- Use Chrome 113+ or Edge 113+
- Enable WebGPU in experimental features if needed

### "Camera not available"
- Grant camera permissions in browser
- Ensure you're on HTTPS or localhost
- Check if camera is in use by another application

### "WebAssembly module failed to load"
- Rebuild the WASM module: `npm run build-wasm`
- Check browser console for detailed error messages

### Vite scanning errors
- The emsdk directory is excluded from Vite scanning
- If issues persist, delete `node_modules` and `package-lock.json`, then run `npm install`

## Contributing

This is a proof-of-concept project. Contributions should focus on:
- Performance optimizations
- Browser compatibility improvements
- Additional computer vision algorithms
- Better error handling and user experience

## License

MIT License - see LICENSE file for details