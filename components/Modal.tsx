"use client"
import { useEffect } from 'react'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  title?: string
  message: string
  type?: 'info' | 'error' | 'success' | 'warning'
}

export function Modal({ isOpen, onClose, title, message, type = 'info' }: ModalProps) {
  useEffect(() => {
    if (isOpen) {
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden'
    } else {
      document.body.style.overflow = 'unset'
    }
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [isOpen])

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }
    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  if (!isOpen) return null

  const typeStyles = {
    info: 'bg-blue-50 border-blue-200',
    error: 'bg-red-50 border-red-200',
    success: 'bg-green-50 border-green-200',
    warning: 'bg-yellow-50 border-yellow-200'
  }

  const iconStyles = {
    info: '🔵',
    error: '❌',
    success: '✅',
    warning: '⚠️'
  }

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      
      {/* Modal */}
      <div 
        className={`relative bg-white rounded-xl shadow-xl border-2 max-w-md w-full p-6 space-y-4 ${typeStyles[type]}`}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4">
          <div className="text-2xl">{iconStyles[type]}</div>
          <div className="flex-1">
            {title && (
              <h3 className="text-lg font-semibold mb-2">{title}</h3>
            )}
            <p className="text-sm sm:text-base whitespace-pre-wrap">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 text-xl leading-none"
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <div className="flex justify-end pt-2">
          <button
            onClick={onClose}
            className="btn text-sm sm:text-base"
          >
            OK
          </button>
        </div>
      </div>
    </div>
  )
}

