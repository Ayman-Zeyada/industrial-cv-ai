export interface CameraStatus {
  available: boolean
  stream?: MediaStream | null
  error?: string
}

export interface CameraConstraints {
  width?: number
  height?: number
  frameRate?: number
  facingMode?: 'user' | 'environment'
  deviceId?: string
}

export class CameraCapture {
  private stream: MediaStream | null = null
  private videoElement: HTMLVideoElement | null = null
  private canvas: HTMLCanvasElement | null = null
  private context: CanvasRenderingContext2D | null = null

  async initialize(constraints: CameraConstraints = {}): Promise<CameraStatus> {
    try {
      // Check if getUserMedia is available
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        return {
          available: false,
          error: 'Camera API not supported in this browser'
        }
      }

      console.log('Requesting camera access...')

      // Default constraints optimized for computer vision
      const defaultConstraints: MediaStreamConstraints = {
        video: {
          width: { ideal: constraints.width || 1280, min: 640 },
          height: { ideal: constraints.height || 720, min: 480 },
          frameRate: { ideal: constraints.frameRate || 30, min: 15 },
          facingMode: constraints.facingMode || 'environment'
        },
        audio: false
      }

      // Add device ID if specified
      if (constraints.deviceId) {
        (defaultConstraints.video as MediaTrackConstraints).deviceId = constraints.deviceId
      }

      // Request camera stream
      this.stream = await navigator.mediaDevices.getUserMedia(defaultConstraints)

      if (!this.stream) {
        return {
          available: false,
          error: 'Failed to obtain camera stream'
        }
      }

      console.log('Camera stream obtained successfully')
      console.log('Stream tracks:', this.stream.getTracks().map(track => ({
        kind: track.kind,
        label: track.label,
        settings: track.getSettings()
      })))

      return {
        available: true,
        stream: this.stream
      }

    } catch (error) {
      console.error('Camera initialization failed:', error)
      
      let errorMessage = 'Unknown camera error'
      if (error instanceof Error) {
        errorMessage = error.message
      } else if (typeof error === 'string') {
        errorMessage = error
      } else if (error && typeof error === 'object' && 'name' in error) {
        // Handle specific getUserMedia errors
        switch ((error as any).name) {
          case 'NotAllowedError':
            errorMessage = 'Camera access denied by user'
            break
          case 'NotFoundError':
            errorMessage = 'No camera found'
            break
          case 'NotReadableError':
            errorMessage = 'Camera is already in use'
            break
          case 'OverconstrainedError':
            errorMessage = 'Camera constraints cannot be satisfied'
            break
          case 'SecurityError':
            errorMessage = 'Camera access blocked by security policy'
            break
          default:
            errorMessage = error.name || 'Camera error'
        }
      }

      return {
        available: false,
        error: errorMessage
      }
    }
  }

  getStream(): MediaStream | null {
    return this.stream
  }

  getVideoTrack(): MediaStreamTrack | null {
    if (!this.stream) return null
    const videoTracks = this.stream.getVideoTracks()
    return videoTracks.length > 0 ? videoTracks[0] : null
  }

  getStreamSettings(): MediaTrackSettings | null {
    const videoTrack = this.getVideoTrack()
    return videoTrack ? videoTrack.getSettings() : null
  }

  async getAvailableCameras(): Promise<MediaDeviceInfo[]> {
    try {
      const devices = await navigator.mediaDevices.enumerateDevices()
      return devices.filter(device => device.kind === 'videoinput')
    } catch (error) {
      console.error('Failed to enumerate cameras:', error)
      return []
    }
  }

  createVideoElement(): HTMLVideoElement {
    if (this.videoElement) {
      return this.videoElement
    }

    this.videoElement = document.createElement('video')
    this.videoElement.autoplay = true
    this.videoElement.muted = true
    this.videoElement.playsInline = true

    if (this.stream) {
      this.videoElement.srcObject = this.stream
    }

    return this.videoElement
  }

  setupCanvas(width: number = 640, height: number = 480): HTMLCanvasElement {
    this.canvas = document.createElement('canvas')
    this.canvas.width = width
    this.canvas.height = height
    this.context = this.canvas.getContext('2d')

    return this.canvas
  }

  captureFrame(): ImageData | null {
    if (!this.videoElement || !this.canvas || !this.context) {
      console.error('Video element or canvas not set up')
      return null
    }

    if (this.videoElement.readyState !== this.videoElement.HAVE_ENOUGH_DATA) {
      console.warn('Video not ready for frame capture')
      return null
    }

    try {
      // Draw video frame to canvas
      this.context.drawImage(
        this.videoElement,
        0, 0,
        this.canvas.width,
        this.canvas.height
      )

      // Get image data
      const imageData = this.context.getImageData(
        0, 0,
        this.canvas.width,
        this.canvas.height
      )

      return imageData

    } catch (error) {
      console.error('Failed to capture frame:', error)
      return null
    }
  }

  async takePhoto(): Promise<Blob | null> {
    if (!this.canvas) {
      console.error('Canvas not set up')
      return null
    }

    const frameData = this.captureFrame()
    if (!frameData) {
      return null
    }

    return new Promise((resolve) => {
      this.canvas!.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg', 0.9)
    })
  }

  startFrameProcessing(callback: (imageData: ImageData) => void, fps: number = 30): number {
    const interval = 1000 / fps

    const processFrame = () => {
      const frameData = this.captureFrame()
      if (frameData) {
        callback(frameData)
      }
    }

    return window.setInterval(processFrame, interval)
  }

  stopFrameProcessing(intervalId: number): void {
    clearInterval(intervalId)
  }

  stop(): void {
    if (this.stream) {
      this.stream.getTracks().forEach(track => {
        track.stop()
        console.log(`Stopped ${track.kind} track: ${track.label}`)
      })
      this.stream = null
    }

    if (this.videoElement) {
      this.videoElement.srcObject = null
      this.videoElement = null
    }

    this.canvas = null
    this.context = null
  }
}