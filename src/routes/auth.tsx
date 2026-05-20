import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";
import { BookOpen, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Teacher Sign in — ExamHub" },
      { name: "description", content: "Teachers sign in or create an account to manage exams." },
    ],
  }),
  component: AuthPage,
});

function PasswordStrengthIndicator({ password }: { password: string }) {
  const rules = [
    { label: "At least 8 characters", pass: password.length >= 8 },
    { label: "One uppercase letter", pass: /[A-Z]/.test(password) },
    { label: "One number", pass: /[0-9]/.test(password) },
    { label: "One special character (!@#$...)", pass: /[^A-Za-z0-9]/.test(password) },
  ];
  return (
    <ul className="mt-2 space-y-1">
      {rules.map((r) => (
        <li key={r.label} className="flex items-center gap-2 text-xs">
          {r.pass ? (
            <CheckCircle2 className="h-3.5 w-3.5 text-green-500 shrink-0" />
          ) : (
            <XCircle className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
          )}
          <span className={r.pass ? "text-green-600" : "text-muted-foreground"}>{r.label}</span>
        </li>
      ))}
    </ul>
  );
}

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);

  const passwordValid =
    password.length >= 8 &&
    /[A-Z]/.test(password) &&
    /[0-9]/.test(password) &&
    /[^A-Za-z0-9]/.test(password);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "signup") {
      if (!passwordValid) {
        toast.error("Password does not meet requirements.");
        return;
      }
      if (password !== confirmPassword) {
        toast.error("Passwords do not match.");
        return;
      }
    }

    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/dashboard`,
            data: { full_name: fullName, school_name: schoolName },
          },
        });
        if (error) throw error;
        toast.success("Account created. Check your email to verify.");
        navigate({ to: "/dashboard" });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const switchMode = () => {
    setMode(mode === "signin" ? "signup" : "signin");
    setPassword("");
    setConfirmPassword("");
    setShowPassword(false);
    setShowConfirm(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-6 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">
              {mode === "signin" ? "Teacher Sign In" : "Create Teacher Account"}
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Manage exams, rosters, and results.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-sm">
            {mode === "signup" && (
              <>
                <div>
                  <Label>Full Name</Label>
                  <Input className="mt-1" required value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>School Name</Label>
                  <Input className="mt-1" required value={schoolName} onChange={(e) => setSchoolName(e.target.value)} />
                </div>
              </>
            )}

            <div>
              <Label>Email</Label>
              <Input className="mt-1" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>

            <div>
              <Label>Password</Label>
              <div className="relative mt-1">
                <Input
                  type={showPassword ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              {mode === "signup" && password.length > 0 && (
                <PasswordStrengthIndicator password={password} />
              )}
            </div>

            {mode === "signup" && (
              <div>
                <Label>Confirm Password</Label>
                <div className="relative mt-1">
                  <Input
                    type={showConfirm ? "text" : "password"}
                    required
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {confirmPassword.length > 0 && (
                  <p className={`mt-1 text-xs flex items-center gap-1 ${password === confirmPassword ? "text-green-600" : "text-red-500"}`}>
                    {password === confirmPassword ? (
                      <><CheckCircle2 className="h-3.5 w-3.5" /> Passwords match</>
                    ) : (
                      <><XCircle className="h-3.5 w-3.5" /> Passwords do not match</>
                    )}
                  </p>
                )}
              </div>
            )}

            <Button
              type="submit"
              className="w-full"
              size="lg"
              disabled={loading || (mode === "signup" && (!passwordValid || password !== confirmPassword))}
            >
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>

            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={switchMode}
            >
              {mode === "signin"
                ? "Don't have an account? Create one"
                : "Already have an account? Sign in"}
            </button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground">
            Are you a student?{" "}
            <Link to="/student-login" className="text-primary hover:underline">
              Take an exam →
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}