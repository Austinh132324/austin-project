import { useState, useEffect, useCallback, createContext, useContext, ReactNode } from 'react'
import '../styles/Toast.css'

export interface ToastMessage {
  id: string
  text: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

interface ToastContextValue {
  addToast: (text: string, type?: ToastMessage['type'], duration?: number) => void
}

const ToastContext = createContext<ToastContextValue>({ addToast: () => {} })

export function useToast() {
  return useContext(ToastContext)
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([])

  const addToast = useCallback((text: string, type: ToastMessage['type'] = 'info', duration = 4000) => {
    const id = Date.now().toString() + Math.random().toString(36).slice(2)
    setToasts(prev => [...prev, { id, text, type, duration }])
  }, [])

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ addToast }}>
      {children}
      <div className="toast-container" role="status" aria-live="polite">
        {toasts.map(toast => (
          <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

function ToastItem({ toast, onDismiss }: { toast: ToastMessage; onDismiss: (id: string) => void }) {
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setExiting(true), toast.duration || 4000)
    return () => clearTimeout(timer)
  }, [toast.duration])

  useEffect(() => {
    if (exiting) {
      const timer = setTimeout(() => onDismiss(toast.id), 300)
      return () => clearTimeout(timer)
    }
  }, [exiting, onDismiss, toast.id])

  return (
    <div className={`toast-item toast-${toast.type} ${exiting ? 'toast-exit' : ''}`}>
      <span className="toast-icon">
        {toast.type === 'success' && '\u2713'}
        {toast.type === 'error' && '\u2717'}
        {toast.type === 'warning' && '\u26A0'}
        {toast.type === 'info' && '\u2139'}
      </span>
      <span className="toast-text">{toast.text}</span>
      <button className="toast-close" onClick={() => setExiting(true)} aria-label="Dismiss notification">&times;</button>
    </div>
  )
}
