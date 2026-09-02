"use client"

import { useEffect, useState, useCallback } from "react"
import { Button } from "@workspace/ui/components/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@workspace/ui/components/dialog"
import { HugeiconsIcon } from "@hugeicons/react"
import { Download04Icon, PrinterIcon, Cancel01Icon } from "@hugeicons/core-free-icons"
import type { jsPDF } from "jspdf"

interface PdfPreviewModalProps {
  open: boolean
  onClose: () => void
  doc: jsPDF | null
  filename: string
  title?: string
}

export function PdfPreviewModal({ open, onClose, doc, filename, title = "PDF Preview" }: PdfPreviewModalProps) {
  const [blobUrl, setBlobUrl] = useState<string>("")

  useEffect(() => {
    if (open && doc) {
      const blob = doc.output("blob")
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
      return () => {
        URL.revokeObjectURL(url)
        setBlobUrl("")
      }
    } else {
      setBlobUrl("")
    }
  }, [open, doc])

  const handleDownload = useCallback(() => {
    if (doc) {
      doc.save(filename)
    }
  }, [doc, filename])

  const handlePrint = useCallback(() => {
    if (blobUrl) {
      const w = window.open(blobUrl, "_blank")
      if (w) {
        w.onload = () => w.print()
      }
    }
  }, [blobUrl])

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-4xl h-[90vh] flex flex-col p-0 gap-0">
        <DialogHeader className="px-6 py-4 border-b flex-row items-center justify-between space-y-0">
          <div>
            <DialogTitle className="text-lg">{title}</DialogTitle>
            <DialogDescription className="text-sm text-muted-foreground">{filename}</DialogDescription>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="outline" className="gap-2" onClick={handlePrint} disabled={!blobUrl}>
              <HugeiconsIcon icon={PrinterIcon} strokeWidth={2} className="size-4" />
              Print
            </Button>
            <Button size="sm" className="gap-2" onClick={handleDownload} disabled={!doc}>
              <HugeiconsIcon icon={Download04Icon} strokeWidth={2} className="size-4" />
              Download
            </Button>
            <Button size="sm" variant="ghost" className="h-8 w-8 p-0" onClick={onClose}>
              <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2} className="size-4" />
            </Button>
          </div>
        </DialogHeader>
        <div className="flex-1 overflow-hidden bg-muted/30">
          {blobUrl ? (
            <iframe
              src={blobUrl}
              className="w-full h-full border-0"
              title="PDF Preview"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              Loading PDF...
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
