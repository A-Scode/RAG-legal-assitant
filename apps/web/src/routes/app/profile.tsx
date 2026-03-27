import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { useAuthStore, useUserStore } from '@/stores'
import { createFileRoute, redirect, useRouter, useNavigate } from '@tanstack/react-router'
import { Briefcase, Mail, MapPin, ShieldCheck, User, Globe, FileText, Settings, LogOut, ArrowLeft } from 'lucide-react'
import { logout } from '@/lib/utils'
import { useTheme } from 'next-themes'

export const Route = createFileRoute('/app/profile')({
  component: RouteComponent,
  beforeLoad: () => {
    if (!useAuthStore.getState().isAuthenticated) {
      throw redirect({
        to: '/app/login',
      })
    }
  }
})

function RouteComponent() {
  const { user } = useUserStore()
  const router = useRouter()
  const navigate = useNavigate()
  const { resolvedTheme } = useTheme()
  
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}`.toUpperCase() : '??'
  const fullName = user ? `${user.first_name} ${user.last_name}` : 'Guest User'
  const bannerSrc = resolvedTheme === 'dark' ? '/profile-bg-dark.svg' : '/profile-bg-light.svg'

  return (
    <div className="flex-1 overflow-y-auto bg-background pb-12">
      {/* Banner Section */}
      <div className="relative h-64 w-full overflow-hidden">
        <img 
          src={bannerSrc} 
          alt="Profile Banner" 
          className="h-full w-full object-cover transition-transform duration-700 hover:scale-110"
        />
        <div className="absolute inset-0 bg-black/10" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-transparent" />
        
        {/* Navigation Back Button */}
        <div className="absolute top-6 left-6 z-20">
            <Button
              variant="secondary"
              size="icon"
              className="rounded-full shadow-lg bg-background/80 hover:bg-background/100 transition-all border-none backdrop-blur-md active:scale-90"
              onClick={() => router.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 -mt-32 relative z-10 overflow-visible">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 animate-in fade-in slide-in-from-bottom-8 duration-700 overflow-visible">
          
          {/* Sidebar / Profile Info */}
          <div className="lg:col-span-4 space-y-6 overflow-visible">
            <Card className="border-none shadow-2xl bg-card/80 backdrop-blur-xl hover:shadow-primary/10 transition-shadow overflow-visible">
              <CardHeader className="text-center pb-2 overflow-visible">
                <div className="flex justify-center -mt-20 relative z-50">
                  <Avatar className="size-36 border-8 border-background ring-4 ring-primary/10 shadow-2xl transition-all hover:ring-primary/20 duration-500">
                    <AvatarImage src="" />
                    <AvatarFallback className="text-4xl bg-gradient-to-br from-primary to-primary/60 text-primary-foreground font-extrabold tracking-tighter shadow-inner">
                      {initials}
                    </AvatarFallback>
                  </Avatar>
                </div>
                <div className="mt-4">
                  <CardTitle className="text-2xl font-bold tracking-tight">{fullName}</CardTitle>
                  <CardDescription className="text-primary font-semibold tracking-wide">
                    @{user?.username || 'username'}
                  </CardDescription>
                </div>
                <div className="flex justify-center gap-2 mt-2">
                  <Badge variant="secondary" className="px-3 py-1 bg-primary/10 text-primary border-none shadow-sm hover:bg-primary/20 transition-colors">
                    Legal Member
                  </Badge>
                  <Badge variant="outline" className="px-3 py-1 font-medium bg-background/50">
                    Free Tier
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-6 pt-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                    <div className="p-2 transition-all rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary">
                      <Mail className="h-4 w-4" />
                    </div>
                    <span className="truncate font-medium">{user?.email || 'email@example.com'}</span>
                  </div>
                  {user?.occupation && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                      <div className="p-2 transition-all rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary">
                        <Briefcase className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{user.occupation}</span>
                    </div>
                  )}
                  {(user?.city || user?.state) && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground group">
                      <div className="p-2 transition-all rounded-lg bg-muted group-hover:bg-primary/10 group-hover:text-primary">
                        <MapPin className="h-4 w-4" />
                      </div>
                      <span className="font-medium">{[user.city, user.state].filter(Boolean).join(', ')}</span>
                    </div>
                  )}
                </div>

                <Separator className="opacity-40" />

                <div className="grid grid-cols-2 gap-4 text-center">
                  <div className="space-y-1 p-3 rounded-xl bg-muted/20 border border-transparent hover:border-border/50 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Reports</p>
                    <p className="text-2xl font-black text-foreground">12</p>
                  </div>
                  <div className="space-y-1 p-3 rounded-xl bg-muted/20 border border-transparent hover:border-border/50 transition-colors">
                    <p className="text-[10px] text-muted-foreground uppercase font-black tracking-widest">Storage</p>
                    <p className="text-2xl font-black text-foreground">45%</p>
                  </div>
                </div>

                <div className="flex flex-col gap-2 pt-2">
                  <Button 
                    variant="outline" 
                    className="w-full justify-start gap-3 rounded-xl hover:bg-muted/50 border-muted mt-2 shadow-sm" 
                    size="sm"
                    onClick={() => navigate({ to: '/app/settings' })}
                  >
                    <Settings className="h-4 w-4" /> Account Settings
                  </Button>
                  <Button 
                    variant="ghost" 
                    className="w-full justify-start gap-3 rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10 transition-colors" 
                    size="sm"
                    onClick={logout}
                  >
                    <LogOut className="h-4 w-4" /> Logout
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="border-none shadow-xl bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 group hover:shadow-primary/5 transition-all">
               <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-black uppercase tracking-widest flex items-center gap-2 text-primary">
                    <ShieldCheck className="h-4 w-4" />
                    Security Baseline
                  </CardTitle>
               </CardHeader>
               <CardContent>
                  <p className="text-xs text-muted-foreground leading-relaxed font-medium">
                    Your account is currently protected with standard encryption. 
                    <span 
                      className="text-primary font-black cursor-pointer hover:underline block mt-1 uppercase tracking-tight"
                      onClick={() => navigate({ to: '/app/settings' })}
                    >
                      Verify Identity
                    </span>
                  </p>
               </CardContent>
            </Card>
          </div>

          {/* Main Details Section */}
          <div className="lg:col-span-8 space-y-6">
            <Card className="border-none shadow-xl bg-card/80 backdrop-blur-md overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-7 bg-muted/5 border-b mb-6">
                <div className="space-y-1">
                  <CardTitle className="text-2xl font-black tracking-tight flex items-center gap-3">
                    <User className="h-6 w-6 text-primary" />
                    Legal Profile
                  </CardTitle>
                  <CardDescription className="font-medium">Maintain your professional identity and legal focus.</CardDescription>
                </div>
                <Button 
                    variant="default" 
                    className="gap-2 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-105 active:scale-95 px-6"
                    onClick={() => navigate({ to: '/app/settings' })}
                >
                  <FileText className="h-4 w-4" /> Edit Profile
                </Button>
              </CardHeader>
              <CardContent className="space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-6">
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">First Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input value={user?.first_name || ''} readOnly className="pl-11 h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary/50 font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Last Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input value={user?.last_name || ''} readOnly className="pl-11 h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary/50 font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Email Address</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input value={user?.email || ''} readOnly className="pl-11 h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary/50 font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Professional Occupation</Label>
                    <div className="relative">
                      <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input value={user?.occupation || 'Not specified'} readOnly className="pl-11 h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary/50 font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Primary City</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input value={user?.city || 'Not specified'} readOnly className="pl-11 h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary/50 font-semibold" />
                    </div>
                  </div>
                  <div className="space-y-2.5 group">
                    <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-1 group-focus-within:text-primary transition-colors">Jurisdiction / State</Label>
                    <div className="relative">
                      <Globe className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                      <Input value={user?.state || 'Not specified'} readOnly className="pl-11 h-12 rounded-xl bg-muted/40 border-transparent focus:border-primary/50 font-semibold" />
                    </div>
                  </div>
                </div>

                <div className="space-y-3 group bg-muted/20 p-6 rounded-2xl border border-border/40 hover:bg-muted/30 transition-colors">
                  <Label className="text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 group-focus-within:text-primary transition-colors">
                    <FileText className="h-4 w-4" />
                    Professional Biography
                  </Label>
                  <div className="min-h-[120px] text-sm leading-relaxed text-muted-foreground/90 font-medium italic">
                    {user?.details || "No additional professional details provided. Update your biography in settings to personalize your legal assistant experience."}
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
               <Card className="border-none shadow-lg bg-card/80 backdrop-blur-md overflow-hidden group hover:shadow-primary/5 transition-all hover:bg-card/90 cursor-alias">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <ShieldCheck className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Managed Assets</CardTitle>
                    <CardDescription className="font-semibold flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                      4 active legal containers
                    </CardDescription>
                  </CardHeader>
               </Card>
               <Card className="border-none shadow-lg bg-card/80 backdrop-blur-md overflow-hidden group hover:shadow-primary/5 transition-all hover:bg-card/90 cursor-alias">
                  <CardHeader className="pb-3">
                    <div className="w-12 h-12 rounded-2xl bg-primary/10 text-primary flex items-center justify-center mb-3 group-hover:scale-110 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-500">
                      <Globe className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-xl font-bold">Global Reach</CardTitle>
                    <CardDescription className="font-semibold">All Jurisdictions accessible</CardDescription>
                  </CardHeader>
               </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
