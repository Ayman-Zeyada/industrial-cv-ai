#!/bin/bash

# Source Emscripten environment
source ./emsdk/emsdk_env.sh

# Create output directory
mkdir -p public

# Compile C++ to WebAssembly with WebGPU support
emcc src/cpp/main.cpp \
    -s USE_WEBGPU=1 \
    -s WASM=1 \
    -s ALLOW_MEMORY_GROWTH=1 \
    -s MAXIMUM_MEMORY=4GB \
    -s SIMD=1 \
    -msimd128 \
    -O3 \
    --bind \
    -s EXPORT_ES6=1 \
    -s MODULARIZE=1 \
    -s EXPORT_NAME=IndustrialCV \
    -o public/industrial_cv.js

echo "WebAssembly build complete!"
echo "Output files:"
echo "  - public/industrial_cv.js"
echo "  - public/industrial_cv.wasm"