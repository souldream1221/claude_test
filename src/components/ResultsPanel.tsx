import React from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts'
import {
  CheckCircle,
  XCircle,
  AlertCircle,
  Clock,
  TrendingUp
} from 'lucide-react'
import { TestResult, TestResultStatus } from '../types'

interface ResultsPanelProps {
  results: TestResult[]
}

const statusIcons: Record<TestResultStatus, React.ReactNode> = {
  Passed: <CheckCircle size={16} style={{ color: 'var(--success-color)' }} />,
  Failed: <XCircle size={16} style={{ color: 'var(--error-color)' }} />,
  Error: <AlertCircle size={16} style={{ color: 'var(--error-color)' }} />,
  Running: <Clock size={16} style={{ color: 'var(--primary-color)' }} />,
  Pending: <Clock size={16} style={{ color: 'var(--text-secondary)' }} />,
  Cancelled: <XCircle size={16} style={{ color: 'var(--warning-color)' }} />
}

const statusClasses: Record<TestResultStatus, string> = {
  Passed: 'status-passed',
  Failed: 'status-failed',
  Error: 'status-failed',
  Running: 'status-running',
  Pending: 'status-pending',
  Cancelled: 'status-failed'
}

export function ResultsPanel({ results }: ResultsPanelProps) {
  // 计算统计数据
  const passed = results.filter(r => r.status === 'Passed').length
  const failed = results.filter(r => r.status === 'Failed' || r.status === 'Error').length
  const total = results.length
  const passRate = total > 0 ? Math.round((passed / total) * 100) : 0

  // 准备图表数据
  const chartData = results.flatMap(r =>
    r.metrics.map(m => ({
      test: r.test_name,
      metric: m.name,
      value: m.value,
      unit: m.unit
    }))
  )

  // 性能数据
  const performanceData = results
    .filter(r => r.metrics.length > 0)
    .map(r => ({
      name: r.test_name,
      ...r.metrics.reduce((acc, m) => ({
        ...acc,
        [m.name]: m.value
      }), {})
    }))

  if (results.length === 0) {
    return (
      <div className="empty-state">
        <TrendingUp size={48} />
        <p>暂无测试结果</p>
        <p style={{ fontSize: '0.875rem', marginTop: '0.5rem' }}>
          完成测试后，结果将显示在这里
        </p>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Summary Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-label">总测试数</div>
          <div className="metric-value">{total}</div>
        </div>
        <div className="metric-card">
          <div className="metric-label">通过</div>
          <div className="metric-value" style={{ color: 'var(--success-color)' }}>
            {passed}
          </div>
        </div>
        <div className="metric-card">
          <div class="metric-label">失败</div>
          <div className="metric-value" style={{ color: 'var(--error-color)' }}>
            {failed}
          </div>
        </div>
        <div className="metric-card">
          <div className="metric-label">通过率</div>
          <div className="metric-value">
            {passRate}%
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div style={{ overflow: 'auto' }}>
        <table className="results-table">
          <thead>
            <tr>
              <th>测试名称</th>
              <th>状态</th>
              <th>耗时</th>
              <th>指标</th>
              <th>消息</th>
            </tr>
          </thead>
          <tbody>
            {results.map((result, index) => (
              <tr key={index}>
                <td>{result.test_name}</td>
                <td>
                  <span className={`status-badge ${statusClasses[result.status]}`}>
                    {statusIcons[result.status]}
                    {result.status}
                  </span>
                </td>
                <td>{(result.duration_ms / 1000).toFixed(2)}s</td>
                <td>
                  {result.metrics.map((m, i) => (
                    <div key={i} style={{ fontSize: '0.75rem' }}>
                      {m.name}: {m.value.toFixed(2)} {m.unit}
                    </div>
                  ))}
                </td>
                <td style={{ maxWidth: '300px', fontSize: '0.875rem' }}>
                  {result.message}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Performance Chart */}
      {performanceData.length > 0 && (
        <div className="panel" style={{ marginTop: '1rem' }}>
          <div className="panel-title">
            <TrendingUp size={18} />
            性能指标对比
          </div>
          <div className="chart-container">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={performanceData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis />
                <Tooltip />
                <Legend />
                {Object.keys(performanceData[0])
                  .filter(key => key !== 'name')
                  .map((key, index) => (
                    <Bar
                      key={key}
                      dataKey={key}
                      fill={['#3b82f6', '#10b981', '#f59e0b', '#ef4444'][index % 4]}
                    />
                  ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  )
}
