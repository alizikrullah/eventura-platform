import { AlertTriangle, Loader2 } from 'lucide-react'

import { cn } from '@/lib/utils'

import { Button } from './button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from './dialog'

interface ConfirmActionDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  confirmLabel: string
  onConfirm: () => void
  cancelLabel?: string
  loading?: boolean
  errorMessage?: string
  variant?: 'default' | 'danger'
}

export function ConfirmActionDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
  cancelLabel = 'Batal',
  loading = false,
  errorMessage,
  variant = 'danger',
}: ConfirmActionDialogProps) {
  const confirmButtonClassName =
    variant === 'danger'
      ? 'bg-red-500 text-white hover:bg-red-600'
      : 'bg-primary-900 text-white hover:bg-primary-800'

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[calc(100%-2rem)] max-w-md rounded-2xl border border-gray-200 bg-white p-0 shadow-xl">
        <DialogHeader className="border-b border-gray-100 px-6 py-5 text-left">
          <div className="flex items-start gap-3">
            <div className={cn(
              'mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full',
              variant === 'danger' ? 'bg-red-50 text-red-500' : 'bg-primary-50 text-primary-900',
            )}>
              <AlertTriangle className="h-5 w-5" />
            </div>
            <div className="space-y-1">
              <DialogTitle className="text-lg font-bold text-gray-900">{title}</DialogTitle>
              <DialogDescription className="text-sm leading-6 text-gray-500">
                {description}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="px-6 py-5">
          {errorMessage ? (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {errorMessage}
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-gray-100 px-6 py-4 sm:space-x-0 sm:gap-3">
          <Button
            type="button"
            variant="outline"
            className="h-11 flex-1 rounded-xl border-gray-200 text-gray-600 hover:bg-gray-50"
            onClick={() => onOpenChange(false)}
            disabled={loading}
          >
            {cancelLabel}
          </Button>
          <Button
            type="button"
            className={cn('h-11 flex-1 rounded-xl font-semibold', confirmButtonClassName)}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {loading ? 'Memproses...' : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}