import { createFileRoute, useNavigate, Link, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { QuestionBuilder, type QBQuestion } from "@/components/QuestionBuilder";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";
import { Save, ArrowLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useSession } from "@/hooks/use-session";
import { createExam } from "@/lib/exam.functions";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";

export const Route = createFileRoute("/create-exam")({
  head: () => ({
    meta: [
      { title: "Create Exam — ExamHub" },
      { name: "description", content: "Create a new computer-based test for your students." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: CreateExamPage,
});

function CreateExamPage() {
  const navigate = useNavigate();
  const { session } = useSession();
  const userId = session?.user.id ?? "";
  const create = useServerFn(createExam);

  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [className, setClassName] = useState("");
  const [duration, setDuration] = useState("45");
  const [opensAt, setOpensAt] = useState("");
  const [closesAt, setClosesAt] = useState("");
  const [activate, setActivate] = useState(true);
  const [rosterText, setRosterText] = useState("");
  const [questions, setQuestions] = useState<QBQuestion[]>([
    {
      id: crypto.randomUUID(),
      text: "",
      image_url: null,
      options: [
        { text: "", image_url: null },
        { text: "", image_url: null },
        { text: "", image_url: null },
        { text: "", image_url: null },
      ],
      correctIndex: 0,
    },
  ]);
  const [saving, setSaving] = useState(false);

  const parseRoster = () =>
    rosterText
      .split(/\r?\n/)
      .map((l) => l.trim())
      .filter(Boolean)
      .map((line) => {
        const parts = line.split(",").map((p) => p.trim());
        return { full_name: parts[0] || "", student_number: parts[1] || "" };
      })
      .filter((r) => r.full_name && r.student_number);

  const handleSave = async () => {
    if (!title || !subject || !className) return toast.error("Fill in title, subject, and class");
    const roster = parseRoster();
    if (roster.length === 0) return toast.error("Add at least one student to the roster");
    for (const q of questions) {
      if (!q.text.trim()) return toast.error("All questions must have text");
      if (q.options.some((o) => !o.text.trim())) return toast.error("All options must have text");
    }

    setSaving(true);
    try {
      const result = await create({
        data: {
          title,
          subject,
          class_name: className,
          duration_minutes: parseInt(duration, 10),
          opens_at: opensAt ? new Date(opensAt).toISOString() : null,
          closes_at: closesAt ? new Date(closesAt).toISOString() : null,
          status: activate ? "active" : "draft",
          roster,
          questions: questions.map((q) => ({
            text: q.text,
            image_url: q.image_url,
            options: q.options.map((o, oi) => ({
              text: o.text,
              image_url: o.image_url,
              is_correct: oi === q.correctIndex,
            })),
          })),
        },
      });
      toast.success(`Exam created. Access code: ${result.access_code}`);
      navigate({ to: "/dashboard" });
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard">
              <ArrowLeft className="h-4 w-4" />
              Back to Dashboard
            </Link>
          </Button>
        </div>

        <h1 className="mb-2 text-2xl font-bold text-foreground">Create New Exam</h1>
        <p className="mb-8 text-muted-foreground">
          Set details, add students, then build your questions. The exam is only accessible during its time window.
        </p>

        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Exam Details</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>Exam Title</Label>
              <Input className="mt-1" placeholder="e.g., Mathematics Mid-Term Exam" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div>
              <Label>Subject</Label>
              <Input className="mt-1" placeholder="e.g., Mathematics" value={subject} onChange={(e) => setSubject(e.target.value)} />
            </div>
            <div>
              <Label>Class</Label>
              <Select value={className} onValueChange={setClassName}>
                <SelectTrigger className="mt-1"><SelectValue placeholder="Select class" /></SelectTrigger>
                <SelectContent>
                  {["JSS1","JSS2","JSS3","SS1","SS2","SS3"].map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Duration (minutes)</Label>
              <Input className="mt-1" type="number" min="1" max="360" value={duration} onChange={(e) => setDuration(e.target.value)} />
            </div>
            <div>
              <Label>Opens at</Label>
              <Input className="mt-1" type="datetime-local" value={opensAt} onChange={(e) => setOpensAt(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">Students cannot start before this time.</p>
            </div>
            <div>
              <Label>Closes at</Label>
              <Input className="mt-1" type="datetime-local" value={closesAt} onChange={(e) => setClosesAt(e.target.value)} />
              <p className="mt-1 text-xs text-muted-foreground">Auto-submit & lock after this time.</p>
            </div>
            <div className="sm:col-span-2 flex items-center gap-2">
              <input id="act" type="checkbox" checked={activate} onChange={(e) => setActivate(e.target.checked)} />
              <Label htmlFor="act">Activate immediately (otherwise saved as draft)</Label>
            </div>
          </div>
        </div>

        <div className="mb-8 rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-2 text-lg font-semibold text-foreground">Student Roster</h2>
          <p className="mb-3 text-sm text-muted-foreground">
            One per line: <code className="rounded bg-muted px-1">Full Name, Student Number</code>. Only listed students can take this exam.
          </p>
          <Textarea
            rows={6}
            className="font-mono text-sm"
            placeholder={"Adebayo Oluwaseun, SS2-001\nChioma Nwosu, SS2-002"}
            value={rosterText}
            onChange={(e) => setRosterText(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted-foreground">{parseRoster().length} student(s) parsed</p>
        </div>

        <div className="mb-8">
          <h2 className="mb-4 text-lg font-semibold text-foreground">Questions ({questions.length})</h2>
          {userId ? (
            <QuestionBuilder questions={questions} onChange={setQuestions} userId={userId} />
          ) : (
            <p className="text-sm text-muted-foreground">Loading…</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="outline" asChild><Link to="/dashboard">Cancel</Link></Button>
          <Button onClick={handleSave} size="lg" disabled={saving || !userId}>
            <Save className="h-5 w-5" />
            {saving ? "Saving…" : "Create Exam"}
          </Button>
        </div>
      </div>
    </div>
  );
}
