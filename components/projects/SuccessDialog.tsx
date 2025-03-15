"use client"

import { Dialog } from '@headlessui/react'

interface SuccessDialogProps {
  projectName: string
  scenesCount: number
  onClose: () => void
}

export default function SuccessDialog({ projectName, scenesCount, onClose }: SuccessDialogProps) {
  return (
    <Dialog open={true} onClose={onClose} as="div" className="fixed inset-0 z-50 overflow-hidden">
      <div className="fixed inset-0 bg-black opacity-30" aria-hidden="true" />
      <div className="flex items-center justify-center min-h-full p-4">
        <Dialog.Panel className="w-full max-w-md bg-background rounded-lg p-6 z-10 mx-auto">
          <Dialog.Title className="text-2xl font-bold mb-4">
            Progetto {projectName} creato con successo
          </Dialog.Title>
          <Dialog.Description className="mb-6">
            Sono state create {scenesCount} scene.
          </Dialog.Description>
          <div className="flex justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
            >
              OK
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  )
}
