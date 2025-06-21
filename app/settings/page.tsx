import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"

export default function SettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
        <p className="text-muted-foreground">Manage your project settings and preferences.</p>
      </div>

      <Separator />

      <Card>
        <CardHeader>
          <CardTitle>Project Details</CardTitle>
          <CardDescription>Update your project information and settings.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input id="project-name" defaultValue="Water Quality Monitor" />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Input id="project-description" defaultValue="Real-time water quality monitoring dashboard" />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="auto-deploy">Auto Deploy</Label>
              <p className="text-sm text-muted-foreground">Automatically deploy when you push to the main branch.</p>
            </div>
            <Switch id="auto-deploy" defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="preview-deployments">Preview Deployments</Label>
              <p className="text-sm text-muted-foreground">Create preview deployments for pull requests.</p>
            </div>
            <Switch id="preview-deployments" defaultChecked />
          </div>

          <Button>Save Changes</Button>
        </CardContent>
      </Card>
    </div>
  )
}
