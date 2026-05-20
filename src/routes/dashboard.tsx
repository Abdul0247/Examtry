import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { StatCard } from "@/components/StatCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { listExams, updateExamStatus } from "@/lib/exam.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FileText, Users, BarChart3, Plus, Eye, Copy, CheckCircle, Clock, AlertCircle, Power,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Teacher Dashboard — ExamHub" },
      { name: "description", content: "Manage your exams, view results, and create new tests." },
    ],
  }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: DashboardPage,
});

const statusConfig: Record<string, { label: string; icon: typeof CheckCircle; className: string }> = {
  active: { label: "Active", icon: CheckCircle, className: "bg-success/10 text-success" },
  draft: { label: "Draft", icon: AlertCircle, className: "bg-warning/10 text-warning-foreground" },
  closed: { label: "Closed", icon: Clock, className: "bg-muted text-muted-foreground" },
};

function DashboardPage() {
  const list = useServerFn(listExams);
  const setStatus = useServerFn(updateExamStatus);
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["exams"], queryFn: () => list() });
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const exams = data?.exams ?? [];
  const activeExams = exams.filter((e) => e.status === "active").length;
  const totalSubs = exams.reduce((a, e) => a + e.submission_count, 0);

  const toggle = async (examId: string, current: string) => {
    const next = current === "active" ? "closed" : "active";
    try {
      await setStatus({ data: { exam_id: examId, status: next } });
      toast.success(`Exam ${next}`);
      qc.invalidateQueries({ queryKey: ["exams"] });
    } catch (e) {
      toast.error((e as Error).message);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">Teacher Dashboard</h1>
            <p className="mt-1 text-muted-foreground">
              {data?.profile?.full_name ? `Welcome, ${data.profile.full_name}` : "Manage your exams and view student results"}
            </p>
          </div>
          <Button size="lg" asChild>
            <Link to="/create-exam">
              <Plus className="h-5 w-5" />
              Create New Exam
            </Link>
          </Button>
        </div>

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          <StatCard title="Total Exams" value={exams.length} icon={FileText} description={`${activeExams} active`} />
          <StatCard title="Submissions" value={totalSubs} icon={Users} description="Across all exams" />
          <StatCard title="Active" value={activeExams} icon={BarChart3} description="Currently open" />
        </div>

        <div className="rounded-xl border border-border bg-card shadow-sm">
          <div className="border-b border-border px-6 py-4">
            <h2 className="text-lg font-semibold text-foreground">Your Exams</h2>
          </div>
          <div className="divide-y divide-border">
            {isLoading && <div className="px-6 py-8 text-center text-sm text-muted-foreground">Loading exams…</div>}
            {!isLoading && exams.length === 0 && (
              <div className="px-6 py-12 text-center">
                <p className="text-muted-foreground">No exams yet.</p>
                <Button className="mt-4" asChild><Link to="/create-exam"><Plus className="h-4 w-4" />Create your first exam</Link></Button>
              </div>
            )}
            {exams.map((exam) => {
              const cfg = statusConfig[exam.status] ?? statusConfig.draft;
              const StatusIcon = cfg.icon;
              return (
                <div key={exam.id} className="flex flex-col gap-4 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-foreground">{exam.title}</h3>
                      <Badge variant="outline" className={cfg.className}>
                        <StatusIcon className="mr-1 h-3 w-3" />
                        {cfg.label}
                      </Badge>
                    </div>
                    <div className="mt-1 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span>{exam.subject}</span><span>•</span>
                      <span>{exam.class_name}</span><span>•</span>
                      <span>{exam.question_count} questions</span><span>•</span>
                      <span>{exam.duration_minutes} min</span><span>•</span>
                      <span>{exam.roster_count} students</span><span>•</span>
                      <span>{exam.submission_count} submitted</span>
                    </div>
                    {(exam.opens_at || exam.closes_at) && (
                      <div className="mt-1 text-xs text-muted-foreground">
                        {exam.opens_at && <>Opens {new Date(exam.opens_at).toLocaleString()}</>}
                        {exam.opens_at && exam.closes_at && " • "}
                        {exam.closes_at && <>Closes {new Date(exam.closes_at).toLocaleString()}</>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={() => copyCode(exam.access_code)}>
                      {copiedCode === exam.access_code ? <CheckCircle className="h-4 w-4 text-success" /> : <Copy className="h-4 w-4" />}
                      {exam.access_code}
                    </Button>
                    {exam.status !== "draft" && (
                      <Button variant="outline" size="sm" onClick={() => toggle(exam.id, exam.status)}>
                        <Power className="h-4 w-4" />
                        {exam.status === "active" ? "Close" : "Reopen"}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" asChild>
                      <Link to="/exam-results" search={{ examId: exam.id }}>
                        <Eye className="h-4 w-4" />
                        Results
                      </Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
