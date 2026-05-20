import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AppHeader } from "@/components/AppHeader";
import { BookOpen } from "lucide-react";
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

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [schoolName, setSchoolName] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        toast.success("Account created. You're signed in.");
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
              <Input className="mt-1" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Please wait…" : mode === "signin" ? "Sign In" : "Create Account"}
            </Button>
            <button
              type="button"
              className="w-full text-sm text-muted-foreground hover:text-foreground"
              onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
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
