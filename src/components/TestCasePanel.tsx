import React from 'react'
import {
  BookOpen,
  PenTool,
  Trash2,
  Zap,
  Shield,
  FileCheck,
  ChevronDown,
  ChevronRight
} from 'lucide-react'
import { TestCase, TestCategory } from '../types'

interface TestCasePanelProps {
  testCases: TestCase[]
  selectedTests: Set<string>
  onSelectionChange: (selected: Set<string>) => void
  disabled?: boolean
}

const categoryIcons: Record<TestCategory, React.ReactNode> = {
  Read: <BookOpen size={16} />,
  Write: <PenTool size={16} />,
  Erase: <Trash2 size={16} />,
  Performance: <Zap size={16} />,
  Stability: <Shield size={16} />,
  Protocol: <FileCheck size={16} />
}

const categoryNames: Record<TestCategory, string> = {
  Read: '读取测试',
  Write: '写入测试',
  Erase: '擦除测试',
  Performance: '性能测试',
  Stability: '稳定性测试',
  Protocol: '协议测试'
}

export function TestCasePanel({
  testCases,
  selectedTests,
  onSelectionChange,
  disabled
}: TestCasePanelProps) {
  const [expandedCategories, setExpandedCategories] = React.useState<Set<TestCategory>>(
    new Set(['Performance', 'Read', 'Write'])
  )

  // 按类别分组
  const groupedTests = testCases.reduce((acc, test) => {
    if (!acc[test.category]) {
      acc[test.category] = []
    }
    acc[test.category].push(test)
    return acc
  }, {} as Record<TestCategory, TestCase[]>)

  const toggleCategory = (category: TestCategory) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(category)) {
      newExpanded.delete(category)
    } else {
      newExpanded.add(category)
    }
    setExpandedCategories(newExpanded)
  }

  const toggleTest = (testId: string) => {
    if (disabled) return
    const newSelected = new Set(selectedTests)
    if (newSelected.has(testId)) {
      newSelected.delete(testId)
    } else {
      newSelected.add(testId)
    }
    onSelectionChange(newSelected)
  }

  const selectAllInCategory = (category: TestCategory, select: boolean) => {
    if (disabled) return
    const testsInCategory = groupedTests[category] || []
    const newSelected = new Set(selectedTests)

    testsInCategory.forEach(test => {
      if (select) {
        newSelected.add(test.id)
      } else {
        newSelected.delete(test.id)
      }
    })

    onSelectionChange(newSelected)
  }

  return (
    <div className="test-categories">
      {(Object.keys(groupedTests) as TestCategory[]).map(category => {
        const tests = groupedTests[category]
        const selectedCount = tests.filter(t => selectedTests.has(t.id)).length
        const allSelected = selectedCount === tests.length

        return (
          <div key={category} className="category">
            <div
              className="category-header"
              onClick={() => toggleCategory(category)}
            >
              {expandedCategories.has(category) ? (
                <ChevronDown size={18} />
              ) : (
                <ChevronRight size={18} />
              )}
              {categoryIcons[category]}
              <span>{categoryNames[category]}</span>
              <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                {selectedCount}/{tests.length}
              </span>
            </div>

            {expandedCategories.has(category) && (
              <div className="category-content">
                <div
                  className="test-item"
                  onClick={() => selectAllInCategory(category, !allSelected)}
                >
                  <input
                    type="checkbox"
                    checked={allSelected}
                    onChange={() => {}}
                    disabled={disabled}
                  />
                  <span style={{ fontWeight: 500 }}>全选</span>
                </div>
                {tests.map(test => (
                  <div
                    key={test.id}
                    className={`test-item ${selectedTests.has(test.id) ? 'selected' : ''}`}
                    onClick={() => toggleTest(test.id)}
                    title={test.description}
                  >
                    <input
                      type="checkbox"
                      checked={selectedTests.has(test.id)}
                      onChange={() => {}}
                      disabled={disabled}
                    />
                    <span>{test.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      ~{Math.ceil(test.duration_estimate_sec / 60)}分钟
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
