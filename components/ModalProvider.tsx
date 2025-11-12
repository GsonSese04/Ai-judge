"use client"
import { createContext, useContext, useState, ReactNode } from 'react'
import { Modal } from './Modal'

interface ModalContextType {
  showModal: (message: string, title?: string, type?: 'info' | 'error' | 'success' | 'warning') => void
}

const ModalContext = createContext<ModalContextType | undefined>(undefined)

export function ModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [title, setTitle] = useState<string | undefined>(undefined)
  const [type, setType] = useState<'info' | 'error' | 'success' | 'warning'>('info')

  const showModal = (msg: string, ttl?: string, modalType: 'info' | 'error' | 'success' | 'warning' = 'info') => {
    setMessage(msg)
    setTitle(ttl)
    setType(modalType)
    setIsOpen(true)
  }

  const closeModal = () => {
    setIsOpen(false)
  }

  return (
    <ModalContext.Provider value={{ showModal }}>
      {children}
      <Modal
        isOpen={isOpen}
        onClose={closeModal}
        title={title}
        message={message}
        type={type}
      />
    </ModalContext.Provider>
  )
}

export function useModal() {
  const context = useContext(ModalContext)
  if (!context) {
    throw new Error('useModal must be used within ModalProvider')
  }
  return context
}

