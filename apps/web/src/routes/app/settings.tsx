import { createFileRoute, redirect, useRouter } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { useForm } from '@tanstack/react-form'
import * as z from 'zod'
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Separator } from "@/components/ui/separator"
import { useAuthStore, useUserStore } from '@/stores'
import { useUpdateProfile, useClearHistory } from '@/hooks/useAuth'
import { User, Trash2, ShieldAlert, CheckCircle2, Moon, Sun, Monitor, ArrowLeft } from 'lucide-react'
import { useTheme } from 'next-themes'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import { ScrollArea } from "@/components/ui/scroll-area"
import { cn } from "@/lib/utils"

export const Route = createFileRoute('/app/settings')({
  component: RouteComponent,
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: '/app/login',
      })
    }
  }
})

const profileSchema = z.object({
  first_name: z.string().min(1, "First name is required"),
  last_name: z.string().min(1, "Last name is required"),
  state: z.string().optional().nullable(),
  city: z.string().optional().nullable(),
  occupation: z.string().optional().nullable(),
  details: z.string().optional().nullable(),
})

type ProfileFormValues = z.infer<typeof profileSchema>

function RouteComponent() {
  const { user } = useUserStore()
  const updateProfile = useUpdateProfile()
  const clearHistory = useClearHistory()
  const { theme, setTheme } = useTheme()
  const [deleteConfirmInput, setDeleteConfirmInput] = useState("")
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false)
  const router = useRouter()
  const queryClient = useQueryClient()

  const form = useForm({
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      state: user?.state || "",
      city: user?.city || "",
      occupation: user?.occupation || "",
      details: user?.details || "",
    } as ProfileFormValues,
    validators: {
      onSubmit: profileSchema,
    },
    onSubmit: async ({ value }) => {
      updateProfile.mutate(value)
    },
  })

  useEffect(() => {
    if (user) {
      form.setFieldValue("first_name", user.first_name || "")
      form.setFieldValue("last_name", user.last_name || "")
      form.setFieldValue("state", user.state || "")
      form.setFieldValue("city", user.city || "")
      form.setFieldValue("occupation", user.occupation || "")
      form.setFieldValue("details", user.details || "")
    }
  }, [user])

  const handleClearHistory = () => {
    if (deleteConfirmInput === "delete") {
      clearHistory.mutate(undefined, {
        onSuccess: () => {
          setIsDeleteDialogOpen(false)
          setDeleteConfirmInput("")
          queryClient.invalidateQueries({ queryKey: ["chat-sessions"] })
        }
      })
    } else {
      toast.error("Please type 'delete' to confirm")
    }
  }

  return (
    <ScrollArea className="flex-1 w-full bg-background">
      <div className="flex flex-col items-center py-10 px-4 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="w-full max-w-4xl space-y-8 pb-10">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="icon"
              className="rounded-full h-10 w-10 hover:bg-muted/50 active:scale-90 transition-transform"
              onClick={() => router.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
              <p className="text-muted-foreground text-sm">Manage your account settings and preferences.</p>
            </div>
          </div>

          <Separator />

          <form
            onSubmit={(e) => {
              e.preventDefault()
              e.stopPropagation()
              form.handleSubmit()
            }}
            className="space-y-8"
          >
            {/* Profile Section */}
            <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
              <CardHeader>
                <div className="flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" />
                  <CardTitle>Personal Information</CardTitle>
                </div>
                <CardDescription>Update your personal details here.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form.Field
                    name="first_name"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="John"
                        />
                        {field.state.meta.errors && (
                          <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                        )}
                      </Field>
                    )}
                  />
                  <form.Field
                    name="last_name"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Doe"
                        />
                        {field.state.meta.errors && (
                          <p className="text-xs text-destructive mt-1">{field.state.meta.errors.join(', ')}</p>
                        )}
                      </Field>
                    )}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <form.Field
                    name="occupation"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>Occupation</FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value || ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="Legal Consultant"
                        />
                      </Field>
                    )}
                  />
                  <form.Field
                    name="city"
                    children={(field) => (
                      <Field>
                        <FieldLabel htmlFor={field.name}>City</FieldLabel>
                        <Input
                          id={field.name}
                          value={field.state.value || ""}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          placeholder="New York"
                        />
                      </Field>
                    )}
                  />
                </div>

                <form.Field
                  name="state"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>State / Province</FieldLabel>
                      <Input
                        id={field.name}
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="New York"
                      />
                    </Field>
                  )}
                />

                <form.Field
                  name="details"
                  children={(field) => (
                    <Field>
                      <FieldLabel htmlFor={field.name}>Bio / Details</FieldLabel>
                      <Textarea
                        id={field.name}
                        value={field.state.value || ""}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        placeholder="Tell us a bit about yourself..."
                        className="min-h-[100px]"
                      />
                    </Field>
                  )}
                />
              </CardContent>
              <CardFooter className="bg-muted/30 flex justify-end gap-2 p-4">
                <Button 
                    type="submit" 
                    disabled={updateProfile.isPending}
                    className="gap-2"
                >
                  {updateProfile.isPending ? "Saving..." : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      Save Changes
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </form>

          {/* Appearance Section */}
          <Card className="border shadow-md bg-card/50 backdrop-blur-sm">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Sun className="w-5 h-5 text-primary" />
                <CardTitle>Appearance</CardTitle>
              </div>
              <CardDescription>Customize how the app looks on your device.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl border bg-muted/20 gap-4">
                <div className="space-y-0.5">
                    <p className="text-sm font-semibold">Theme Mode</p>
                    <p className="text-xs text-muted-foreground font-medium">Switch between light and dark modes.</p>
                </div>
                <div className="flex gap-1.5 bg-muted p-1.5 rounded-xl ring-1 ring-border/50">
                    <Button 
                        variant={theme === 'light' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setTheme('light')}
                        className={cn(
                          "h-9 px-3 gap-2 rounded-lg transition-all duration-300",
                          theme === 'light' ? "shadow-md scale-105" : "text-muted-foreground hover:bg-background/40"
                        )}
                    >
                        <Sun className="h-4 w-4" />
                        <span className="text-xs font-semibold">Light</span>
                    </Button>
                    <Button 
                        variant={theme === 'dark' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setTheme('dark')}
                        className={cn(
                          "h-9 px-3 gap-2 rounded-lg transition-all duration-300",
                          theme === 'dark' ? "shadow-md scale-105" : "text-muted-foreground hover:bg-background/40"
                        )}
                    >
                        <Moon className="h-4 w-4" />
                        <span className="text-xs font-semibold">Dark</span>
                    </Button>
                    <Button 
                        variant={theme === 'system' ? 'default' : 'ghost'} 
                        size="sm" 
                        onClick={() => setTheme('system')}
                        className={cn(
                          "h-9 px-3 gap-2 rounded-lg transition-all duration-300",
                          theme === 'system' ? "shadow-md scale-105" : "text-muted-foreground hover:bg-background/40"
                        )}
                    >
                        <Monitor className="h-4 w-4" />
                        <span className="text-xs font-semibold">System</span>
                    </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Danger Zone */}
          <Card className="border-destructive/20 shadow-md bg-destructive/5 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-destructive/10">
              <div className="flex items-center gap-2 text-destructive">
                <ShieldAlert className="w-5 h-5" />
                <CardTitle>Danger Zone</CardTitle>
              </div>
              <CardDescription className="text-destructive/80 font-medium">Irreversible actions for your account.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
                <div className="space-y-1">
                  <p className="font-bold text-lg">Clear Chat History</p>
                  <p className="text-sm text-muted-foreground font-medium max-w-md">This will permanently delete all your chat sessions and cannot be undone.</p>
                </div>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="destructive" className="gap-2 shrink-0 h-11 px-6 font-semibold shadow-lg shadow-destructive/20 active:scale-95 transition-transform">
                      <Trash2 className="w-4 h-4" />
                      Clear All History
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="rounded-2xl">
                    <DialogHeader>
                      <DialogTitle className="text-destructive flex items-center gap-2 text-xl">
                        <ShieldAlert className="w-6 h-6" />
                        Are you absolutely sure?
                      </DialogTitle>
                      <DialogDescription className="text-base">
                        This action will permanently delete all your chat history. It cannot be undone.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-6 space-y-4">
                      <p className="text-sm font-medium">Please type <span className="font-bold underline text-foreground">delete</span> to confirm your action.</p>
                      <Input
                        value={deleteConfirmInput}
                        onChange={(e) => setDeleteConfirmInput(e.target.value)}
                        placeholder="Type 'delete' here"
                        className="h-12 border-destructive/30 focus-visible:ring-destructive bg-destructive/5"
                      />
                    </div>
                    <DialogFooter className="gap-2 sm:gap-0">
                      <Button variant="ghost" className="rounded-xl h-11" onClick={() => {
                        setIsDeleteDialogOpen(false)
                        setDeleteConfirmInput("")
                      }}>
                        Cancel
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={handleClearHistory}
                        disabled={deleteConfirmInput !== "delete" || clearHistory.isPending}
                        className="gap-2 rounded-xl h-11 px-6 font-semibold shadow-md active:scale-95 transition-transform"
                      >
                        {clearHistory.isPending ? "Clearing..." : (
                            <>
                                <Trash2 className="w-4 h-4" />
                                Delete Everything
                            </>
                        )}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardContent>
          </Card>

          <footer className="text-center pt-10">
            <Separator className="mb-8 opacity-50" />
            <p className="text-xs text-muted-foreground font-medium tracking-tight">
                Legal RAG Assistant v1.0.0
            </p>
          </footer>
        </div>
      </div>
    </ScrollArea>
  )
}
