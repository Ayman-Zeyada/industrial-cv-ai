export interface WebGPUStatus {
  supported: boolean
  adapter?: GPUAdapter | null
  device?: GPUDevice | null
  error?: string
}

export class WebGPUDetector {
  private adapter: GPUAdapter | null = null
  private device: GPUDevice | null = null

  async initialize(): Promise<WebGPUStatus> {
    try {
      // Check if WebGPU is available
      if (!navigator.gpu) {
        return {
          supported: false,
          error: 'WebGPU not supported in this browser'
        }
      }

      console.log('WebGPU is available, requesting adapter...')

      // Request adapter
      this.adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
      })

      if (!this.adapter) {
        return {
          supported: false,
          error: 'No WebGPU adapter available'
        }
      }

      console.log('WebGPU adapter obtained:', this.adapter.info)

      // Request device
      this.device = await this.adapter.requestDevice({
        requiredFeatures: [],
        requiredLimits: {
          maxBufferSize: 1024 * 1024 * 64, // 64MB buffer limit
          maxTextureDimension2D: 4096,
          maxComputeWorkgroupSizeX: 256,
          maxComputeWorkgroupSizeY: 256,
          maxComputeInvocationsPerWorkgroup: 256
        }
      })

      if (!this.device) {
        return {
          supported: false,
          adapter: this.adapter,
          error: 'Failed to create WebGPU device'
        }
      }

      console.log('WebGPU device created successfully')

      // Set up error handling
      this.device.addEventListener('uncapturederror', (event) => {
        console.error('WebGPU uncaptured error:', event.error)
      })

      return {
        supported: true,
        adapter: this.adapter,
        device: this.device
      }

    } catch (error) {
      console.error('WebGPU initialization failed:', error)
      return {
        supported: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }

  getAdapter(): GPUAdapter | null {
    return this.adapter
  }

  getDevice(): GPUDevice | null {
    return this.device
  }

  getAdapterInfo(): string {
    if (!this.adapter?.info) {
      return 'No adapter information available'
    }

    const info = this.adapter.info
    return `${info.vendor || 'Unknown'} ${info.architecture || ''} - ${info.device || 'Unknown Device'}`
  }

  getLimits(): Record<string, number> {
    if (!this.adapter) {
      return {}
    }

    const limits = this.adapter.limits
    return {
      maxBufferSize: limits.maxBufferSize,
      maxTextureDimension2D: limits.maxTextureDimension2D,
      maxComputeWorkgroupSizeX: limits.maxComputeWorkgroupSizeX,
      maxComputeWorkgroupSizeY: limits.maxComputeWorkgroupSizeY,
      maxComputeInvocationsPerWorkgroup: limits.maxComputeInvocationsPerWorkgroup
    }
  }

  async createSimpleComputePipeline(): Promise<GPUComputePipeline | null> {
    if (!this.device) {
      console.error('No WebGPU device available')
      return null
    }

    try {
      // Simple compute shader for testing
      const shaderCode = `
        @compute @workgroup_size(1)
        fn main(@builtin(global_invocation_id) global_id: vec3<u32>) {
          // Simple test compute shader
        }
      `

      const shaderModule = this.device.createShaderModule({
        code: shaderCode
      })

      const computePipeline = this.device.createComputePipeline({
        layout: 'auto',
        compute: {
          module: shaderModule,
          entryPoint: 'main'
        }
      })

      console.log('Simple compute pipeline created successfully')
      return computePipeline

    } catch (error) {
      console.error('Failed to create compute pipeline:', error)
      return null
    }
  }
}