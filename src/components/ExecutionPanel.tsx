import React, { useRef, useEffect } from 'react'
import { Terminal, Clock } from 'lucide-react'

interface ExecutionPanelProps {
  logs: string[]
  isRunning: boolean
  currentTest: string | null
}

export function ExecutionPanel({ logs, isRunning, currentTest }: ExecutionPanelProps) {
  const logsEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    logsEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [logs])

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Current Test Info */}
      {isRunning && currentTest && (
        <div style={{
          padding: '0.75rem 1rem',
          backgroundColor: '#dbeafe',
          borderRadius: '0.5rem',
          marginBottom: '1rem',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem'
        }}>
          <Clock size={18} className="spin" style={{
            animation: 'spin 2s linear infinite'
          }} />
          <span style={{ fontWeight: 500 }}>
            正在执行: {currentTest}
          </span>
        </div>
      )}

      {/* Logs */}
      <div className="logs-container">
        {logs.length === 0 ? (
          <div className="empty-state">
            <Terminal size={48} />
            <p>暂无日志</p>
            <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
              选择测试用例并点击"开始测试"
            </p>
          </div>
        ) : (
          <>
            {logs.map((log, index) => (
              <div key={index} className="log-entry">
                <span style={{ color: '#9ca3af' }}>
                  {new Date().toLocaleTimeString()}
                </span>{' '}
                {log}
              </div>
            ))}
            {isRunning && (
              <div className="log-entry">
                <span style={{ animation: 'blink 1s infinite' }}>_</span>
              </div>
            )}
            <div ref={logsEndRef} />
          </>
        )}
      </div>

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        @keyframes blink {
          0%, 50% { opacity: 1; }
          51%, 100% { opacity: 0; }
        }
      `}</style>
    </div>
  )
}
