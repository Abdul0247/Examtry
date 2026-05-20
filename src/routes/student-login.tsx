import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { LogIn, BookOpen } from "lucide-react";
import { studentStartExam } from "@/lib/exam.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/student-login")({
  head: () => ({
    meta: [
      { title: "Student Login — ExamHub" },
      { name: "description", content: "Enter your access code and student number to begin." },
    ],
  }),
  component: StudentLoginPage,
});

function StudentLoginPage() {
  const navigate = useNavigate();
  const start = useServerFn(studentStartExam);
  const [accessCode, setAccessCode] = useState("");
  const [studentNumber, setStudentNumber] = useState("");
  const [busy, setBusy] = useState(false);

  const handleStart = async () => {
    if (!accessCode.trim() || !studentNumber.trim()) return;
    setBusy(true);
    try {
      const result = await start({
        data: { access_code: accessCode, student_number: studentNumber },
      });
      navigate({ to: "/exam", search: { sid: result.submission_id } });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center px-4">
        <div className="w-full max-w-md">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-2xl font-bold text-foreground">Start Your Exam</h1>
            <p className="mt-2 text-muted-foreground">
              Enter the access code and your student number
            </p>
          </div>

          <div className="rounded-xl border border-border bg-card p-6 shadow-sm">
            <div className="space-y-4">
              <div>
                <Label>Access Code</Label>
                <Input
                  className="mt-1 font-mono text-lg tracking-widest"
                  placeholder="ABC123"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  maxLength={10}
                />
                <p className="mt-1 text-xs text-muted-foreground">Get this code from your teacher</p>
              </div>
              <div>
                <Label>Your Student Number</Label>
                <Input
                  className="mt-1"
                  placeholder="e.g., SS2-001"
                  value={studentNumber}
                  onChange={(e) => setStudentNumber(e.target.value)}
                />
              </div>
              <Button
                className="w-full"
                size="lg"
                onClick={handleStart}
                disabled={busy || !accessCode.trim() || !studentNumber.trim()}
              >
                <LogIn className="h-5 w-5" />
                {busy ? "Starting…" : "Start Exam"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
