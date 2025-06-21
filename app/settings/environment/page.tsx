"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Checkbox } from "@/components/ui/checkbox"
import { Info, Plus, MoreVertical, LinkIcon, Unlink, Trash, Edit } from "lucide-react"

export default function EnvironmentVariablesPage() {
  const [activeTab, setActiveTab] = useState("project")
  const [showCreateDialog, setShowCreateDialog] = useState(false)
  const [showLinkDialog, setShowLinkDialog] = useState(false)
  const [showEditDialog, setShowEditDialog] = useState(false)
  const [selectedVar, setSelectedVar] = useState<any>(null)

  // Mock data for demonstration
  const projectVars = [
    { id: 1, key: "DATABASE_URL", value: "postgres://user:pass@host:5432/db", environments: ["Production", "Preview"] },
    { id: 2, key: "API_KEY", value: "sk_test_123456789", environments: ["Production"] },
    { id: 3, key: "DEBUG_MODE", value: "false", environments: ["Development"] },
  ]

  const sharedVars = [
    {
      id: 1,
      key: "SUPABASE_URL",
      value: "https://example.supabase.co",
      environments: ["Production", "Preview", "Development"],
      linkedProjects: ["water-quality-monitor", "sensor-dashboard"],
    },
    {
      id: 2,
      key: "SUPABASE_ANON_KEY",
      value: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
      environments: ["Production", "Preview"],
      linkedProjects: ["water-quality-monitor"],
    },
  ]

  const projects = [
    { id: 1, name: "water-quality-monitor" },
    { id: 2, name: "sensor-dashboard" },
    { id: 3, name: "iot-platform" },
  ]

  const handleCreateSharedVar = () => {
    // Logic to create a shared environment variable
    setShowCreateDialog(false)
  }

  const handleLinkToProjects = () => {
    // Logic to link shared environment variable to projects
    setShowLinkDialog(false)
  }

  const handleEditVar = () => {
    // Logic to edit environment variable
    setShowEditDialog(false)
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Environment Variables</h2>
        <p className="text-muted-foreground">Manage your project and shared environment variables</p>
      </div>

      <Alert>
        <Info className="h-4 w-4" />
        <AlertTitle>Information</AlertTitle>
        <AlertDescription>
          Environment variables are encrypted and only exposed to your selected Vercel deployments. Shared environment
          variables can be linked to multiple projects.
        </AlertDescription>
      </Alert>

      <Tabs defaultValue="project" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="project">Project Variables</TabsTrigger>
          <TabsTrigger value="shared">Shared Variables</TabsTrigger>
        </TabsList>

        <TabsContent value="project" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Project Environment Variables</CardTitle>
                  <CardDescription>
                    Variables specific to this project. These override shared variables with the same name.
                  </CardDescription>
                </div>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  Add Variable
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Environments</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {projectVars.map((variable) => (
                    <TableRow key={variable.id}>
                      <TableCell className="font-medium">{variable.key}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {variable.value.substring(0, 10)}•••••
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variable.environments.map((env) => (
                            <span
                              key={env}
                              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                            >
                              {env}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedVar(variable)
                                setShowEditDialog(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="shared" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>Shared Environment Variables</CardTitle>
                  <CardDescription>
                    Variables defined at the team level that can be linked to multiple projects.
                  </CardDescription>
                </div>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  Create Shared Variable
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Environments</TableHead>
                    <TableHead>Linked Projects</TableHead>
                    <TableHead className="w-[100px]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sharedVars.map((variable) => (
                    <TableRow key={variable.id}>
                      <TableCell className="font-medium">{variable.key}</TableCell>
                      <TableCell>
                        <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">
                          {variable.value.substring(0, 10)}•••••
                        </code>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variable.environments.map((env) => (
                            <span
                              key={env}
                              className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold"
                            >
                              {env}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {variable.linkedProjects.map((project) => (
                            <span
                              key={project}
                              className="inline-flex items-center rounded-full bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400 px-2.5 py-0.5 text-xs font-semibold"
                            >
                              {project}
                            </span>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <span className="sr-only">Open menu</span>
                              <MoreVertical className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedVar(variable)
                                setShowEditDialog(true)
                              }}
                            >
                              <Edit className="mr-2 h-4 w-4" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => {
                                setSelectedVar(variable)
                                setShowLinkDialog(true)
                              }}
                            >
                              <LinkIcon className="mr-2 h-4 w-4" />
                              Link to Projects
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              <Unlink className="mr-2 h-4 w-4" />
                              Unlink from Project
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-destructive">
                              <Trash className="mr-2 h-4 w-4" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create Shared Variable Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create Shared Environment Variable</DialogTitle>
            <DialogDescription>
              Create a new shared environment variable that can be linked to multiple projects.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="key">Key</Label>
              <Input id="key" placeholder="DATABASE_URL" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="value">Value</Label>
              <Input id="value" placeholder="postgres://user:password@host:5432/database" />
            </div>
            <div className="grid gap-2">
              <Label>Environments</Label>
              <div className="flex flex-wrap gap-2">
                {["Production", "Preview", "Development"].map((env) => (
                  <div key={env} className="flex items-center space-x-2">
                    <Checkbox id={`env-${env}`} />
                    <label
                      htmlFor={`env-${env}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {env}
                    </label>
                  </div>
                ))}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="projects">Link to Projects</Label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Select projects" />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.name}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-muted-foreground">You can link this variable to more projects later.</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateSharedVar}>Create</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Link to Projects Dialog */}
      <Dialog open={showLinkDialog} onOpenChange={setShowLinkDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Link to Projects</DialogTitle>
            <DialogDescription>Select projects to link this shared environment variable to.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label>Variable</Label>
              <div className="flex items-center gap-2">
                <code className="rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-sm">{selectedVar?.key}</code>
                <span className="text-sm text-muted-foreground">({selectedVar?.environments.join(", ")})</span>
              </div>
            </div>
            <div className="grid gap-2">
              <Label>Select Projects</Label>
              <div className="max-h-[200px] overflow-y-auto border rounded-md p-2">
                {projects.map((project) => (
                  <div key={project.id} className="flex items-center space-x-2 py-2">
                    <Checkbox
                      id={`project-${project.id}`}
                      checked={selectedVar?.linkedProjects.includes(project.name)}
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLinkDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleLinkToProjects}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Variable Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Edit Environment Variable</DialogTitle>
            <DialogDescription>Update the value and environments for this variable.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit-key">Key</Label>
              <Input id="edit-key" value={selectedVar?.key} readOnly />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit-value">Value</Label>
              <Input id="edit-value" defaultValue={selectedVar?.value} />
            </div>
            <div className="grid gap-2">
              <Label>Environments</Label>
              <div className="flex flex-wrap gap-2">
                {["Production", "Preview", "Development"].map((env) => (
                  <div key={env} className="flex items-center space-x-2">
                    <Checkbox id={`edit-env-${env}`} checked={selectedVar?.environments.includes(env)} />
                    <label
                      htmlFor={`edit-env-${env}`}
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                    >
                      {env}
                    </label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button onClick={handleEditVar}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
