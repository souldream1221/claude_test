import React, { useState, useEffect, useCallback } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import {
  HardDrive,
  Play,
  Square,
  RefreshCw,
  CheckSquare,
  FileText,
  BarChart3,
  Cpu,
  Thermometer,
  Activity,
  Settings,
  Download
} from 'lucide-react'
import { TestCasePanel } from './components/TestCasePanel'
import { ExecutionPanel } from './components/ExecutionPanel'
import { ResultsPanel } from './components/ResultsPanel'
import { DeviceInfo, TestCase, TestResult, TestStatus } from './types'

function App() {
  const [deviceInfo, setDeviceInfo] = useState<DeviceInfo | null>(null)
  const [testCases, setTestCases] = useState<TestCase[]>([])
  const [selectedTests, setSelectedTests] = useState<Set<string>>(new Set())
  const [testStatus, setTestStatus] = useState<TestStatus>({
    is_running: false,
    current_test: null,
    completed_count: 0,
    total_count: 0,
    progress_percent: 0
  })
  const [testResults, setTestResults] = useState<TestResult[]>([])
  const [sessionId, setSessionId] = useState<string | null>(null)
  const [logs, setLogs] = useState<string[]>([])
  const [activeTab, setActiveTab] = useState<'execution' | 'results'>('execution')

  // 初始化：获取设备信息和测试用例
  useEffect(() => {
    loadDeviceInfo()
    loadTestCases()
  }, [])

  // 轮询测试状态
  useEffect(() => {
    if (!testStatus.is_running) return

    const interval = setInterval(async () => {
      try {
        const status: TestStatus = await invoke('get_test_status')
        setTestStatus(status)

        if (sessionId && !status.is_running) {
          const results: TestResult[] = await invoke('get_test_results', { sessionId })
          setTestResults(results)
          setActiveTab('results')
        }
      } catch (error) {
        console.error('Error fetching test status:', error)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [testStatus.is_running, sessionId])

  const loadDeviceInfo = async () => {
    try {
      const info: DeviceInfo = await invoke('get_device_info')
      setDeviceInfo(info)
    } catch (error) {
      console.error('Error loading device info:', error)
    }
  }

  const loadTestCases = async () => {
    try {
      const cases: TestCase[] = await invoke('list_available_tests')
      setTestCases(cases)
    } catch (error) {
      console.error('Error loading test cases:', error)
    }
  }

  // 检测平台并返回默认设备路径
  const getDefaultDevicePath = () => {
    const platform = navigator.platform.toLowerCase()
    if (platform.includes('win')) {
      return '\\\\.\\PhysicalDrive0'
    }
    return '/dev/sg0'
  }

  const handleStartTest = async () => {
    if (selectedTests.size === 0) {
      alert('请至少选择一个测试用例')
      return
    }

    const testIds = Array.from(selectedTests)
    const devicePath = deviceInfo?.path || getDefaultDevicePath()

    try {
      setLogs(['开始测试...'])
      const sid: string = await invoke('start_test', {
        testIds,
        devicePath
      })
      setSessionId(sid)
      setTestStatus({ ...testStatus, is_running: true })
      setActiveTab('execution')
    } catch (error) {
      console.error('Error starting test:', error)
      setLogs(prev => [...prev, `错误: ${error}`])
    }
  }

  const handleStopTest = async () => {
    try {
      await invoke('stop_test')
      setLogs(prev => [...prev, '测试已停止'])
    } catch (error) {
      console.error('Error stopping test:', error)
    }
  }

  const handleSelectAll = () => {
    if (selectedTests.size === testCases.length) {
      setSelectedTests(new Set())
    } else {
      setSelectedTests(new Set(testCases.map(t => t.id)))
    }
  }

  const handleExport = async (format: 'json' | 'csv') => {
    if (!sessionId || testResults.length === 0) {
      alert('没有可导出的结果')
      return
    }

    // 根据平台选择导出路径
    const isWindows = navigator.platform.toLowerCase().includes('win')
    const path = isWindows
      ? `%TEMP%\\ufs_test_results_${sessionId}.${format}`
      : `/tmp/ufs_test_results_${sessionId}.${format}`

    try {
      await invoke('export_results', { sessionId, format, path })
      alert(`结果已导出到: ${path}`)
    } catch (error) {
      console.error('Error exporting results:', error)
    }
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>
          <HardDrive size={24} />
          UFS Test Application
        </h1>
        <div className="device-info">
          {deviceInfo ? (
            <>
              <span><Cpu size={16} /> {deviceInfo.model}</span>
              <span><Thermometer size={16} /> {deviceInfo.temperature_celsius}°C</span>
              <span>健康度: {deviceInfo.health_percent}%</span>
              <span>容量: {deviceInfo.capacity_gb}GB</span>
              <div className="device-status">
                <span className={`status-dot ${deviceInfo.is_connected ? '' : 'disconnected'}`}></span>
                {deviceInfo.is_connected ? '已连接' : '未连接'}
              </div>
            </>
          ) : (
            <span>正在检测设备...</span>
          )}
        </div>
      </header>

      {/* Main Content */}
      <div className="main-container">
        {/* Sidebar - Test Cases */}
        <aside className="sidebar">
          <div className="sidebar-header">
            <h2>测试用例</h2>
            <button
              className="btn btn-secondary"
              onClick={handleSelectAll}
              disabled={testStatus.is_running}
            >
              <CheckSquare size={16} />
              全选
            </button>
          </div>
          <TestCasePanel
            testCases={testCases}
            selectedTests={selectedTests}
            onSelectionChange={setSelectedTests}
            disabled={testStatus.is_running}
          />
        </aside>

        {/* Content Area */}
        <main className="content">
          {/* Control Panel */}
          <div className="panel">
            <div className="control-panel">
              {!testStatus.is_running ? (
                <button
                  className="btn btn-primary"
                  onClick={handleStartTest}
                  disabled={selectedTests.size === 0}
                >
                  <Play size={18} />
                  开始测试
                </button>
              ) : (
                <button
                  className="btn btn-danger"
                  onClick={handleStopTest}
                >
                  <Square size={18} />
                  停止测试
                </button>
              )}

              <button
                className="btn btn-secondary"
                onClick={loadDeviceInfo}
                disabled={testStatus.is_running}
              >
                <RefreshCw size={16} />
                刷新设备
              </button>

              {testStatus.is_running && (
                <div className="progress-container">
                  <div className="progress-bar">
                    <div
                      className="progress-fill"
                      style={{ width: `${testStatus.progress_percent}%` }}
                    />
                  </div>
                  <div className="progress-text">
                    正在执行: {testStatus.current_test || '准备中'}
                    ({testStatus.completed_count}/{testStatus.total_count})
                  </div>
                </div>
              )}

              <div style={{ marginLeft: 'auto', display: 'flex', gap: '0.5rem' }}>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleExport('json')}
                  disabled={testResults.length === 0}
                >
                  <Download size={16} />
                  导出JSON
                </button>
                <button
                  className="btn btn-secondary"
                  onClick={() => handleExport('csv')}
                  disabled={testResults.length === 0}
                >
                  <Download size={16} />
                  导出CSV
                </button>
              </div>
            </div>
          </div>

          {/* Tabs */}
          <div className="panel execution-panel">
            <div className="panel-header">
              <div style={{ display: 'flex', gap: '1rem' }}>
                <button
                  className={`btn ${activeTab === 'execution' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('execution')}
                >
                  <Activity size={16} />
                  执行日志
                </button>
                <button
                  className={`btn ${activeTab === 'results' ? 'btn-primary' : 'btn-secondary'}`}
                  onClick={() => setActiveTab('results')}
                >
                  <BarChart3 size={16} />
                  测试结果
                </button>
              </div>
            </div>

            {activeTab === 'execution' ? (
              <ExecutionPanel
                logs={logs}
                isRunning={testStatus.is_running}
                currentTest={testStatus.current_test}
              />
            ) : (
              <ResultsPanel results={testResults} />
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default App
