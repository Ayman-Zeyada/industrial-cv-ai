import React, { useEffect, useState, useRef } from 'react'
import { WebGPUDetector } from './webgpu/detector'
import { CameraCapture } from './camera/capture'

interface SystemStatus {
  webgpu: {
    supported: boolean
    adapter?: GPUAdapter | null
    device?: GPUDevice | null
    error?: string
    limits?: Record<string, number>
  }
  camera: {
    available: boolean
    stream?: MediaStream | null
    error?: string
    settings?: MediaTrackSettings | null
  }
  wasm: {
    loaded: boolean
    module?: any
    error?: string
  }
}

function App() {
  const [status, setStatus] = useState<SystemStatus>({
    webgpu: { supported: false },
    camera: { available: false },
    wasm: { loaded: false }
  })
  const videoRef = useRef<HTMLVideoElement>(null)
  const [frameRate, setFrameRate] = useState<number>(0)

  useEffect(() => {
    initializeSystems()
  }, [])

  const initializeSystems = async () => {
    // Initialize WebGPU
    const webgpuDetector = new WebGPUDetector()
    const webgpuResult = await webgpuDetector.initialize()
    
    setStatus(prev => ({
      ...prev,
      webgpu: {
        ...webgpuResult,
        limits: webgpuDetector.getLimits()
      }
    }))

    // Initialize Camera
    const cameraCapture = new CameraCapture()
    const cameraResult = await cameraCapture.initialize()
    
    setStatus(prev => ({
      ...prev,
      camera: {
        ...cameraResult,
        settings: cameraCapture.getStreamSettings()
      }
    }))

    // Setup video element if camera is available
    if (cameraResult.stream && videoRef.current) {
      videoRef.current.srcObject = cameraResult.stream
      
      // Setup frame rate monitoring
      let frameCount = 0
      let lastTime = performance.now()
      
      const updateFrameRate = () => {
        frameCount++
        const currentTime = performance.now()
        
        if (currentTime - lastTime >= 1000) {
          setFrameRate(Math.round(frameCount * 1000 / (currentTime - lastTime)))
          frameCount = 0
          lastTime = currentTime
        }
        
        requestAnimationFrame(updateFrameRate)
      }
      
      videoRef.current.addEventListener('loadeddata', () => {
        updateFrameRate()
      })
    }

    // Initialize WebAssembly module (simplified approach for Phase 1)
    try {
      console.log('Loading WebAssembly module...')
      
      // For Phase 1, we'll just simulate a successful WASM load
      // The actual C++ integration will be fully implemented in Phase 2
      setStatus(prev => ({
        ...prev,
        wasm: {
          loaded: true,
          module: {
            // Mock WASM module for Phase 1 testing
            core: {
              getVersion: () => 'Industrial CV POC v0.1.0 (Phase 1 - Mock)',
              initializeWebGPU: () => true,
              processFrame: (textureId: number, width: number, height: number) => {
                console.log(`Mock frame processing: ${width}x${height} (texture: ${textureId})`)
                return { processed: true, width, height }
              }
            }
          }
        }
      }))
      
      console.log('Mock WASM module loaded successfully for Phase 1')
      
    } catch (error) {
      console.error('Failed to load WebAssembly module:', error)
      setStatus(prev => ({
        ...prev,
        wasm: {
          loaded: false,
          error: error instanceof Error ? error.message : 'WASM loading failed'
        }
      }))
    }
  }

  return (
    <div className="container">
      <h1>Industrial Vision AI - Phase 1 POC</h1>
      
      <div className="status-panel">
        <h2>System Status</h2>
        
        <div style={{ marginBottom: '20px' }}>
          <h3>WebGPU Support</h3>
          <div className={status.webgpu.supported ? 'success' : 'error'}>
            Status: {status.webgpu.supported ? '✅ Supported' : '❌ Not Supported'}
          </div>
          {status.webgpu.adapter && (
            <>
              <div className="success">
                Adapter: {status.webgpu.adapter.info?.vendor || 'Unknown'} - {status.webgpu.adapter.info?.architecture || 'Unknown'}
              </div>
              {status.webgpu.limits && (
                <div style={{ fontSize: '0.9em', marginTop: '8px' }}>
                  <strong>Limits:</strong> Buffer: {Math.round(status.webgpu.limits.maxBufferSize / 1024 / 1024)}MB, 
                  Texture: {status.webgpu.limits.maxTextureDimension2D}px, 
                  Workgroup: {status.webgpu.limits.maxComputeWorkgroupSizeX}×{status.webgpu.limits.maxComputeWorkgroupSizeY}
                </div>
              )}
            </>
          )}
          {status.webgpu.error && (
            <div className="error">Error: {status.webgpu.error}</div>
          )}
        </div>

        <div style={{ marginBottom: '20px' }}>
          <h3>Camera Access</h3>
          <div className={status.camera.available ? 'success' : 'error'}>
            Status: {status.camera.available ? '✅ Available' : '❌ Not Available'}
          </div>
          {status.camera.settings && (
            <div style={{ fontSize: '0.9em', marginTop: '8px' }}>
              <strong>Settings:</strong> {status.camera.settings.width}×{status.camera.settings.height} @ {status.camera.settings.frameRate}fps
              {frameRate > 0 && <span> | Actual: {frameRate}fps</span>}
            </div>
          )}
          {status.camera.error && (
            <div className="error">Error: {status.camera.error}</div>
          )}
        </div>

        <div>
          <h3>WebAssembly Module</h3>
          <div className={status.wasm.loaded ? 'success' : 'error'}>
            Status: {status.wasm.loaded ? '✅ Loaded' : '❌ Not Loaded'}
          </div>
          {status.wasm.module && (
            <div className="success">
              Version: {status.wasm.module.core.getVersion()}
            </div>
          )}
          {status.wasm.error && (
            <div className="error">Error: {status.wasm.error}</div>
          )}
        </div>
      </div>

      <div className="camera-container">
        <h2>Camera Feed</h2>
        {status.camera.stream ? (
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            width="640" 
            height="480"
            style={{ border: '2px solid #4a4a4a', borderRadius: '4px' }}
          />
        ) : (
          <div style={{ padding: '60px', background: '#000', borderRadius: '4px' }}>
            {status.camera.available ? 'Initializing camera...' : 'Camera not available'}
          </div>
        )}
        
        {frameRate > 0 && (
          <div style={{ marginTop: '10px', textAlign: 'center' }}>
            <span className="success">Live FPS: {frameRate}</span>
          </div>
        )}
      </div>

      <div className="status-panel" style={{ marginTop: '20px' }}>
        <h2>Phase 1 Foundation Checklist</h2>
        <div style={{ marginBottom: '15px', fontSize: '0.9em', color: '#ccc' }}>
          Phase 1 focuses on establishing the foundation systems. Full C++/WASM integration comes in Phase 2.
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <div>
            <div className={status.webgpu.supported ? 'success' : 'warning'}>
              {status.webgpu.supported ? '✅' : '⚠️'} WebGPU Detection
            </div>
            <div className={status.camera.available ? 'success' : 'warning'}>
              {status.camera.available ? '✅' : '⚠️'} Camera Stream
            </div>
            <div className={status.wasm.loaded ? 'success' : 'warning'}>
              {status.wasm.loaded ? '✅' : '⚠️'} WebAssembly Module (Mock)
            </div>
          </div>
          <div>
            <div className={frameRate >= 15 ? 'success' : 'warning'}>
              {frameRate >= 15 ? '✅' : '⚠️'} Frame Rate ({frameRate} {'>='}15 FPS)
            </div>
            <div className="warning">
              🔲 GPU Compute Pipeline (Phase 2)
            </div>
            <div className="warning">
              🔲 Defect Detection (Phase 3)
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App