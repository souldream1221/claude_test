export interface DeviceInfo {
  path: string
  model: string
  serial: string
  firmware_version: string
  capacity_gb: number
  health_percent: number
  temperature_celsius: number
  is_connected: boolean
}

export type TestCategory = 'Read' | 'Write' | 'Erase' | 'Performance' | 'Stability' | 'Protocol'

export interface TestParameter {
  name: string
  param_type: {
    type: 'Integer' | 'Float' | 'String' | 'Boolean' | 'Enum'
    min?: number
    max?: number
    options?: string[]
  }
  default_value: string
  description: string
}

export interface TestCase {
  id: string
  name: string
  category: TestCategory
  description: string
  duration_estimate_sec: number
  parameters: TestParameter[]
}

export interface TestMetric {
  name: string
  value: number
  unit: string
  threshold?: number
}

export type TestResultStatus = 'Pending' | 'Running' | 'Passed' | 'Failed' | 'Error' | 'Cancelled'

export interface TestResult {
  session_id: string
  test_id: string
  test_name: string
  status: TestResultStatus
  start_time: string
  end_time?: string
  duration_ms: number
  message: string
  metrics: TestMetric[]
  logs: string[]
}

export interface TestStatus {
  is_running: boolean
  current_test: string | null
  completed_count: number
  total_count: number
  progress_percent: number
}
