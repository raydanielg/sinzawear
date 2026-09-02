"use client"

import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react"
import { getBranches } from "@/lib/api"

interface Branch {
  id: string
  name: string
  code?: string
}

interface BranchContextValue {
  selectedBranch: string
  setSelectedBranch: (id: string) => void
  branches: Branch[]
  setBranches: (branches: Branch[]) => void
  branchParam: string
  branchesLoading: boolean
}

const BranchContext = createContext<BranchContextValue | null>(null)

let cachedBranches: Branch[] | null = null
let fetchPromise: Promise<void> | null = null

export function BranchProvider({ children }: { children: ReactNode }) {
  const [selectedBranch, setSelectedBranchState] = useState<string>("all")
  const [branches, setBranches] = useState<Branch[]>(cachedBranches || [])
  const [branchesLoading, setBranchesLoading] = useState(!cachedBranches)

  const loadBranches = useCallback(async () => {
    if (cachedBranches) { setBranches(cachedBranches); setBranchesLoading(false); return }
    if (fetchPromise) { await fetchPromise; setBranches(cachedBranches || []); setBranchesLoading(false); return }
    fetchPromise = (async () => {
      try {
        const result = await getBranches()
        cachedBranches = result
        setBranches(cachedBranches as Branch[])
      } catch {}
      setBranchesLoading(false)
      fetchPromise = null
    })()
    await fetchPromise
    setBranches(cachedBranches || [])
  }, [])

  useEffect(() => {
    const stored = localStorage.getItem("selectedBranch")
    if (stored) setSelectedBranchState(stored)

    loadBranches()

    function syncBranch() {
      const v = localStorage.getItem("selectedBranch")
      if (v) setSelectedBranchState(v)
      else setSelectedBranchState("all")
    }
    window.addEventListener("branchChanged", syncBranch)
    return () => window.removeEventListener("branchChanged", syncBranch)
  }, [loadBranches])

  function setSelectedBranch(id: string) {
    setSelectedBranchState(id)
    localStorage.setItem("selectedBranch", id)
    window.dispatchEvent(new Event("branchChanged"))
  }

  const branchParam = selectedBranch !== "all" ? selectedBranch : ""

  return (
    <BranchContext.Provider value={{ selectedBranch, setSelectedBranch, branches, setBranches, branchParam, branchesLoading }}>
      {children}
    </BranchContext.Provider>
  )
}

export function useBranch() {
  const ctx = useContext(BranchContext)
  if (!ctx) throw new Error("useBranch must be used within BranchProvider")
  return ctx
}
