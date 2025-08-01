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
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s MAXIMUM_MEMORY=4GB")
    
    # Optimization flags
    set(CMAKE_CXX_FLAGS_RELEASE "-O3 -DNDEBUG")
    
    # Enable SIMD
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -msimd128")
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s SIMD=1")
    
    # Enable WebAssembly exceptions
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s DISABLE_EXCEPTION_CATCHING=0")
    
    # Memory debugging (disable in production)
    set(CMAKE_CXX_FLAGS "${CMAKE_CXX_FLAGS} -s ASSERTIONS=1")
endif()

# Source files
add_executable(industrial_cv
    src/cpp/main.cpp
    src/cpp/frame_processor.cpp
    src/cpp/webgpu_utils.cpp
)

# Link Emscripten bindings
if(EMSCRIPTEN)
    set_target_properties(industrial_cv PROPERTIES
        LINK_FLAGS "--bind -s EXPORT_ES6=1 -s MODULARIZE=1 -s EXPORT_NAME=IndustrialCV"
    )
endif()

# Include directories
target_include_directories(industrial_cv PRIVATE src/cpp)