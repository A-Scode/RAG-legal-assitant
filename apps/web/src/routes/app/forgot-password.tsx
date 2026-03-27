import { createFileRoute, Link } from '@tanstack/react-router'
import * as z from 'zod'
import { useForm } from '@tanstack/react-form'
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
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useForgotPassword } from '@/hooks/useAuth'

export const Route = createFileRoute('/app/forgot-password')({
  component: RouteComponent,
})

const forgotPasswordSchema = z.object({
  email: z.string().email("Please enter a valid email address."),
})

function RouteComponent() {
  const forgotPassword = useForgotPassword();

  const forgotPasswordForm = useForm({
    defaultValues: {
      email: "",
    },
    validators: {
      onSubmit: forgotPasswordSchema,
    },
    onSubmit: async ({ value }) => {
      forgotPassword.mutate(value.email);
    },
  })

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-sm animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Forgot Password</CardTitle>
          <CardDescription>
            Enter your email and we'll send you a link to reset your password
          </CardDescription>
        </CardHeader>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            e.stopPropagation()
            forgotPasswordForm.handleSubmit()
          }}
        >
          <CardContent>
            <FieldGroup>
              <forgotPasswordForm.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email Address</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="email"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="name@example.com"
                        autoComplete="email"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button 
                type="submit" 
                className="w-full"
                disabled={forgotPassword.isPending}
            >
              {forgotPassword.isPending ? "Sending link..." : "Send Reset Link"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Remember your password?{" "}
              <Link
                to="/app/login"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      </Card>
    </div>
  )
}
