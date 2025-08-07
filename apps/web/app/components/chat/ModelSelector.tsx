'use client'

import * as React from "react"
import { ChevronDown } from "lucide-react"

interface ModelSelectorProps {
  value: string
  onChange: (value: string) => void
  className?: string
}

const models = [
  { value: 'auto', label: 'Auto (Smart Routing)', description: 'Automatically selects the best model' },
  { value: 'deepseek', label: 'DeepSeek', description: 'Best for coding and technical tasks' },
  { value: 'glm', label: 'GLM-4.5', description: 'General purpose, most cost-effective' },
  { value: 'qwen', label: 'Qwen-Plus', description: 'Advanced reasoning and analysis' },
]

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false)
  const selectedModel = models.find(m => m.value === value) || models[0]
  const dropdownRef = React.useRef<HTMLDivElement>(null)

  React.useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const buttonStyle = {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    minWidth: '200px',
    padding: '8px 12px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    boxShadow: '0 1px 2px rgba(0, 0, 0, 0.05)',
    transition: 'all 0.2s'
  }

  const dropdownStyle = {
    position: 'absolute' as const,
    top: '100%',
    left: 0,
    marginTop: '4px',
    width: '300px',
    backgroundColor: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '6px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
    zIndex: 10,
    display: isOpen ? 'block' : 'none'
  }

  const menuItemStyle = {
    padding: '8px 12px',
    cursor: 'pointer',
    transition: 'background-color 0.2s',
    borderBottom: '1px solid #f3f4f6'
  }

  const menuItemHoverStyle = {
    ...menuItemStyle,
    backgroundColor: '#f9fafb'
  }

  return (
    <div style={{ position: 'relative', display: 'inline-block' }} ref={dropdownRef}>
      <button
        style={buttonStyle}
        onClick={() => setIsOpen(!isOpen)}
        onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
        onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
      >
        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {selectedModel.label}
        </span>
        <ChevronDown size={16} style={{ marginLeft: '8px', opacity: 0.5 }} />
      </button>
      
      <div style={dropdownStyle}>
        {models.map((model, index) => (
          <div
            key={model.value}
            style={index === models.length - 1 ? { ...menuItemStyle, borderBottom: 'none' } : menuItemStyle}
            onClick={() => {
              onChange(model.value)
              setIsOpen(false)
            }}
            onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#f9fafb'}
            onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
          >
            <div style={{ fontWeight: '500', marginBottom: '2px' }}>{model.label}</div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>{model.description}</div>
          </div>
        ))}
      </div>
    </div>
  )
}