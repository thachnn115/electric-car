'use client'

import type { ToasterToast } from '@/hooks/use-toast'
import { CheckCircle2, Info, XCircle } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from '@/components/ui/toast'

const getToastIcon = (variant?: 'default' | 'destructive' | 'success' | null) => {
  switch (variant) {
    case 'destructive':
      return <XCircle className="h-5 w-5 shrink-0" />
    case 'success':
      return <CheckCircle2 className="h-5 w-5 shrink-0" />
    default:
      return <Info className="h-5 w-5 shrink-0" />
  }
}

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map((toast: ToasterToast) => {
        const { id, title, description, action, variant, ...props } = toast
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3 flex-1">
              {getToastIcon(variant)}
              <div className="flex-1 space-y-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && <ToastDescription>{description}</ToastDescription>}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
