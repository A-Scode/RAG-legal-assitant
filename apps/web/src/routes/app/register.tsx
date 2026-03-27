import { createFileRoute, Link } from '@tanstack/react-router'
import * as z from 'zod'
import { toast } from 'sonner'
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
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { useGetOtp, useRegister } from '@/hooks/useAuth'
import { useState } from 'react'

export const Route = createFileRoute('/app/register')({
  component: RouteComponent,
})

const registerSchema = z
  .object({
    first_name: z.string().min(2, "First name must be at least 2 characters."),
    last_name: z.string().min(2, "Last name must be at least 2 characters."),
    username: z.string().min(3, "Username must be at least 3 characters."),
    email: z.string().email("Invalid email address."),
    password: z
      .string()
      .min(8, "Password must be at least 8 characters.")
      .max(100, "Password must be at most 100 characters."),
    confirmPassword: z.string(),
    otp: z.string().length(6, "OTP must be 6 digits."),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  })

function RouteComponent() {
  const getOtp = useGetOtp()
  const register = useRegister()
  const [otpSent, setOtpSent] = useState(false)

  const registerForm = useForm({
    defaultValues: {
      first_name: "",
      last_name: "",
      username: "",
      email: "",
      password: "",
      confirmPassword: "",
      otp: "",
    },
    validators: {
      onSubmit: registerSchema,
    },
    onSubmit: async ({ value }) => {
      register.mutate(value)
    },
  })

  const handleSendOtp = async () => {
    const email = registerForm.getFieldValue("email")
    if (!email || !z.string().email().safeParse(email).success) {
      toast.error("Please enter a valid email address first")
      return
    }
    
    getOtp.mutate({ email, otp_type: "register" }, {
      onSuccess: () => setOtpSent(true)
    })
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-linear-to-br from-background to-muted/50 p-4">
      <Card className="w-full max-w-md animate-in fade-in zoom-in duration-300">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl font-bold tracking-tight">Create an Account</CardTitle>
          <CardDescription>
            Enter your details below to register
          </CardDescription>
        </CardHeader>
        <form
          noValidate
          onSubmit={(e) => {
            e.preventDefault()
            registerForm.handleSubmit()
          }}
        >
          <CardContent>
            <FieldGroup className="gap-4">
              <div className="grid grid-cols-2 gap-4">
                <registerForm.Field
                  name="first_name"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>First Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="First Name"
                          autoComplete="given-name"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
                <registerForm.Field
                  name="last_name"
                  children={(field) => {
                    const isInvalid =
                      field.state.meta.isTouched && !field.state.meta.isValid
                    return (
                      <Field data-invalid={isInvalid}>
                        <FieldLabel htmlFor={field.name}>Last Name</FieldLabel>
                        <Input
                          id={field.name}
                          name={field.name}
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="Last Name"
                          autoComplete="family-name"
                        />
                        {isInvalid && <FieldError errors={field.state.meta.errors} />}
                      </Field>
                    )
                  }}
                />
              </div>
              <registerForm.Field
                name="username"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Username</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="Choose Username"
                        autoComplete="username"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <registerForm.Field
                name="email"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Email</FieldLabel>
                      <div className="flex gap-2">
                        <Input
                          id={field.name}
                          name={field.name}
                          type="email"
                          value={field.state.value}
                          onBlur={field.handleBlur}
                          onChange={(e) => field.handleChange(e.target.value)}
                          aria-invalid={isInvalid}
                          placeholder="name@gmail.com"
                          autoComplete="email"
                          className="flex-1"
                        />
                        <Button 
                          type="button" 
                          variant="outline" 
                          onClick={handleSendOtp}
                          disabled={getOtp.isPending}
                        >
                          {getOtp.isPending ? "Sending..." : otpSent ? "Resend" : "Send OTP"}
                        </Button>
                      </div>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <registerForm.Field
                name="otp"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>OTP (6 digits)</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder={otpSent ? "123456" : "Send OTP first"}
                        disabled={!otpSent}
                        maxLength={6}
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <registerForm.Field
                name="password"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      <FieldDescription>At least 8 characters</FieldDescription>
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
              <registerForm.Field
                name="confirmPassword"
                children={(field) => {
                  const isInvalid =
                    field.state.meta.isTouched && !field.state.meta.isValid
                  return (
                    <Field data-invalid={isInvalid}>
                      <FieldLabel htmlFor={field.name}>Confirm Password</FieldLabel>
                      <Input
                        id={field.name}
                        name={field.name}
                        type="password"
                        value={field.state.value}
                        onBlur={field.handleBlur}
                        onChange={(e) => field.handleChange(e.target.value)}
                        aria-invalid={isInvalid}
                        placeholder="••••••••"
                        autoComplete="new-password"
                      />
                      {isInvalid && <FieldError errors={field.state.meta.errors} />}
                    </Field>
                  )
                }}
              />
            </FieldGroup>
          </CardContent>
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={register.isPending}>
              {register.isPending ? "Creating Account..." : "Create Account"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Already have an account?{" "}
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
