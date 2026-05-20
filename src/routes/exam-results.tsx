import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Download, Trophy, Medal } from "lucide-react";
import { getExamResults } from "@/lib/exam.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/exam-results")({
  head: () => ({
    meta: [
      { title: "Exam Results — ExamHub" },
      { name: "description", content: "View detailed results for your exam." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => ({ examId: (s.examId as string) || "" }),
  beforeLoad: async () => {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw redirect({ to: "/auth" });
  },
  component: ExamResultsPage,
});

function ExamResultsPage() {
  const { examId } = Route.useSearch();
  const fn = useServerFn(getExamResults);
  const { data, isLoading } = useQuery({
    queryKey: ["exam-results", examId],
    queryFn: () => fn({ data: { exam_id: examId } }),
    enabled: !!examId,
  });

  const exportCsv = () => {
    if (!data) return;
    const rows = [["Rank","Name","Student Number","Score","Total","Percentage","Time (sec)","Submitted"]];
    data.submissions.forEach((r, i) => {
      const score = r.score ?? 0;
      const total = r.total_questions ?? 0;
      const pct = total ? Math.round((score / total) * 100) : 0;
      rows.push([
        String(i + 1), r.student_full_name, r.student_number,
        String(score), String(total), `${pct}%`,
        String(r.time_taken_seconds ?? 0),
        r.submitted_at ?? "",
      ]);
    });
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${data.exam.title.replace(/\s+/g, "-")}-results.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) return <div className="p-8 text-center text-muted-foreground">Loading…</div>;
  if (!data) return <div className="p-8 text-center text-muted-foreground">Exam not found.</div>;

  const sorted = [...data.submissions].sort((a, b) => (b.score ?? 0) - (a.score ?? 0));

  return (
    <div className="min-h-screen bg-background">
      <AppHeader />
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-4 w-4" />Back to Dashboard</Link>
          </Button>
        </div>
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h1 className="text-2xl font-bold text-foreground sm:text-3xl">{data.exam.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {data.exam.subject} • {data.exam.class_name} • code <span className="font-mono">{data.exam.access_code}</span>
            </p>
          </div>
          <Button variant="outline" onClick={exportCsv} disabled={!sorted.length}>
            <Download className="h-4 w-4" />Export CSV
          </Button>
        </div>

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
          {sorted.length === 0 ? (
            <div className="p-12 text-center text-muted-foreground">No submissions yet.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/30">
                    <th className="px-4 py-3 text-left text-sm font-semibold">Rank</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Student</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Number</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">Score</th>
                    <th className="px-4 py-3 text-center text-sm font-semibold">%</th>
                    <th className="hidden px-4 py-3 text-center text-sm font-semibold sm:table-cell">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {sorted.map((r, i) => {
                    const total = r.total_questions ?? 0;
                    const score = r.score ?? 0;
                    const pct = total ? Math.round((score / total) * 100) : 0;
                    const min = Math.floor((r.time_taken_seconds ?? 0) / 60);
                    return (
                      <tr key={r.id} className="hover:bg-muted/20">
                        <td className="px-4 py-3">
                          {i === 0 ? <Trophy className="h-5 w-5 text-warning" />
                            : i <= 2 ? <Medal className="h-5 w-5 text-muted-foreground" />
                            : <span className="text-sm text-muted-foreground">{i + 1}</span>}
                        </td>
                        <td className="px-4 py-3 font-medium text-foreground">{r.student_full_name}</td>
                        <td className="px-4 py-3 font-mono text-sm text-muted-foreground">{r.student_number}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-semibold">{score}</span><span className="text-muted-foreground">/{total}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex rounded-full px-2.5 py-0.5 text-sm font-semibold ${
                            pct >= 70 ? "bg-success/10 text-success"
                            : pct >= 50 ? "bg-warning/10 text-warning-foreground"
                            : "bg-destructive/10 text-destructive"
                          }`}>{pct}%</span>
                        </td>
                        <td className="hidden px-4 py-3 text-center text-sm text-muted-foreground sm:table-cell">{min} min</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
