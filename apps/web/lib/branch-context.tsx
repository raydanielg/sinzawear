"use client"

import { createContext, useContext, useState, useEffect, ReactNode } from "react"

interface BranchContextValue {
  selectedBranch: string
  setSelectedBranch: (id: string) => void
  branches: { id: string; name: string; code?: string }[]
  setBranches: (branches: { id: string; name: string; code?: string }[]) => void
  branchParam: string
}

const BranchContext = createContext<BranchContextValue | null>(null)

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranchState] = useState<string>("all")
  const [branches, setBranches] = useState<{ id: string; name: string; code?: string }[]>([])

  useEffect(() => {
    const stored = localStorage.getItem("selectedBranch")
    if (stored) setSelectedBranchState(stored)
  }, [])

  function setSelectedBranch(id: string) {
    setSelectedBranchState(id)
    localStorage.setItem("selectedBranch", id)
  }

  const branchParam = selectedBranch !== "all" ? selectedBranch : ""

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, branches, setBranches, branchParam }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const ctx = useContext(BranchContext)
  if (!ctx) throw new Error("useBranch must be used within BranchProvider")
  return ctx
}
