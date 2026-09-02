"use client"

import * as React from "react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@workspace/ui/components/sidebar"
import { HugeiconsIcon } from "@hugeicons/react"
import { Store02Icon, UnfoldMoreIcon, PlusSignIcon, CheckmarkCircle02Icon } from "@hugeicons/core-free-icons"

export function BranchSwitcher({
  branches,
  selectedBranch,
  onSelectBranch,
  onAddBranch,
}: {
  branches: { id: string; name: string; code?: string }[]
  selectedBranch: string
  onSelectBranch: (id: string) => void
  onAddBranch?: () => void
}) {
  const { isMobile } = useSidebar()
  const activeBranch = selectedBranch === "all"
    ? null
    : branches.find((b) => b.id === selectedBranch)

  return (
    <SidebarMenu>
      <SidebarMenuItem>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <SidebarMenuButton
                size="lg"
                className="data-open:bg-sidebar-accent data-open:text-sidebar-accent-foreground"
              />
            }
          >
            <div className="flex aspect-square size-8 items-center justify-center rounded-lg bg-sidebar-primary text-sidebar-primary-foreground">
              <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-4" />
            </div>
            <div className="grid flex-1 text-start text-sm leading-tight">
              <span className="truncate font-medium">{activeBranch ? activeBranch.name : "All Branches"}</span>
              <span className="truncate text-xs text-muted-foreground">
                {activeBranch?.code ? activeBranch.code : `${branches.length} branch(es)`}
              </span>
            </div>
            <HugeiconsIcon icon={UnfoldMoreIcon} strokeWidth={2} className="ms-auto" />
          </DropdownMenuTrigger>
          <DropdownMenuContent
            className="w-fit min-w-56"
            align="start"
            side={isMobile ? "bottom" : "right"}
            sideOffset={4}
          >
            <DropdownMenuGroup>
              <DropdownMenuLabel className="text-xs text-muted-foreground">
                Branches
              </DropdownMenuLabel>
              <DropdownMenuItem
                onClick={() => onSelectBranch("all")}
                className="gap-2 p-2"
              >
                <div className="flex size-6 items-center justify-center rounded-md border">
                  <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-4" />
                </div>
                All Branches
                {selectedBranch === "all" && (
                  <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="ms-auto size-4 text-primary" />
                )}
              </DropdownMenuItem>
              {branches.map((branch) => (
                <DropdownMenuItem
                  key={branch.id}
                  onClick={() => onSelectBranch(branch.id)}
                  className="gap-2 p-2"
                >
                  <div className="flex size-6 items-center justify-center rounded-md border">
                    <HugeiconsIcon icon={Store02Icon} strokeWidth={2} className="size-4" />
                  </div>
                  {branch.name}
                  {selectedBranch === branch.id && (
                    <HugeiconsIcon icon={CheckmarkCircle02Icon} strokeWidth={2} className="ms-auto size-4 text-primary" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuGroup>
            {onAddBranch && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem className="gap-2 p-2" onClick={onAddBranch}>
                    <div className="flex size-6 items-center justify-center rounded-md border bg-transparent">
                      <HugeiconsIcon icon={PlusSignIcon} strokeWidth={2} className="size-4" />
                    </div>
                    <div className="font-medium text-muted-foreground">
                      Add Branch
                    </div>
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </SidebarMenuItem>
    </SidebarMenu>
  )
}
