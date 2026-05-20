import { createFileRoute } from "@tanstack/react-router";
import { ExamTimer } from "@/components/ExamTimer";
import { Button } from "@/components/ui/button";
import { useState, useCallback, useEffect } from "react";
import { BookOpen, ChevronLeft, ChevronRight, Send, AlertTriangle, Loader2 } from "lucide-react";
import { studentGetExam, studentSubmitExam } from "@/lib/exam.functions";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { z } from "zod";

export const Route = createFileRoute("/exam")({
  head: () => ({
    meta: [
      { title: "Exam in Progress — ExamHub" },
      { name: "robots", content: "noindex" },
    ],
  }),
  validateSearch: (s: Record<string, unknown>) => z.object({ sid: z.string() }).parse(s),
  component: ExamPage,
});

function ExamPage() {
  const { sid } = Route.useSearch();
  const getExam = useServerFn(studentGetExam);
  const submitFn = useServerFn(studentSubmitExam);

  const { data, isLoading, error } = useQuery({
    queryKey: ["exam", sid],
    queryFn: () => getExam({ data: { submission_id: sid } }),
    retry: false,
    refetchOnWindowFocus: false,
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(null);

  const handleSubmit = useCallback(async () => {
    if (!data || submitted || submitting) return;
    setSubmitting(true);
    setShowConfirm(false);
    try {
      const payload = data.questions.map((q) => ({
        question_id: q.id,
        selected_option_id: answers[q.id] ?? null,
      }));
      const r = await submitFn({ data: { submission_id: sid, answers: payload } });
      setResult(r);
      setSubmitted(true);
    } catch (e) {
      alert((e as Error).message);
      setSubmitting(false);
    }
  }, [data, answers, sid, submitFn, submitted, submitting]);

  const handleTimeUp = useCallback(() => { if (!submitted) handleSubmit(); }, [submitted, handleSubmit]);

  // Persist answers to localStorage so refresh doesn't lose progress
  useEffect(() => {
    const saved = localStorage.getItem(`exam-${sid}`);
    if (saved) setAnswers(JSON.parse(saved));
  }, [sid]);
  useEffect(() => {
    localStorage.setItem(`exam-${sid}`, JSON.stringify(answers));
  }, [sid, answers]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="flex min-h-screen items-center justify-center px-4">
        <div className="max-w-md text-center">
          <AlertTriangle className="mx-auto mb-3 h-10 w-10 text-destructive" />
          <h1 className="text-xl font-semibold text-foreground">Cannot load exam</h1>
          <p className="mt-2 text-sm text-muted-foreground">{(error as Error)?.message ?? "Unknown error"}</p>
          <Button className="mt-6" asChild><a href="/student-login">Try again</a></Button>
        </div>
      </div>
    );
  }

  if (submitted && result) {
    const pct = result.total ? Math.round((result.score / result.total) * 100) : 0;
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-success/10">
            <Send className="h-10 w-10 text-success" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">Exam Submitted!</h1>
          <p className="mt-3 text-muted-foreground">
            You scored <strong className="text-foreground">{result.score}</strong> out of{" "}
            <strong className="text-foreground">{result.total}</strong> ({pct}%)
          </p>
          <p className="mt-2 text-sm text-muted-foreground">Your teacher will receive the results.</p>
          <Button className="mt-8" asChild><a href="/">Return Home</a></Button>
        </div>
      </div>
    );
  }

  const questions = data.questions;
  const currentQ = questions[currentIndex];
  const answeredCount = Object.keys(answers).length;
  const totalQuestions = questions.length;

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-4xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-5 w-5 shrink-0 text-primary" />
            <span className="truncate font-semibold text-foreground">{data.exam.title}</span>
          </div>
          <ExamTimer totalSeconds={data.remaining_seconds} onTimeUp={handleTimeUp} />
        </div>
        <div className="border-t border-border bg-card px-4 py-2 text-xs text-muted-foreground">
          <div className="mx-auto max-w-4xl">Signed in as <strong className="text-foreground">{data.student_name}</strong></div>
        </div>
      </header>

      <div className="border-b border-border bg-card px-4 py-3">
        <div className="mx-auto flex max-w-4xl flex-wrap gap-2">
          {questions.map((q, i) => (
            <button
              key={q.id}
              onClick={() => setCurrentIndex(i)}
              className={`flex h-8 w-8 items-center justify-center rounded-lg text-xs font-medium transition-all ${
                i === currentIndex
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : answers[q.id]
                    ? "bg-success/15 text-success"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {i + 1}
            </button>
          ))}
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-8">
        <div className="mb-2 text-sm font-medium text-muted-foreground">
          Question {currentIndex + 1} of {totalQuestions}
        </div>
        <h2 className="mb-4 whitespace-pre-wrap text-xl font-semibold text-foreground sm:text-2xl">
          {currentQ.text}
        </h2>
        {currentQ.image_url && (
          <img src={currentQ.image_url} alt="" className="mb-6 max-h-72 rounded-lg border border-border" />
        )}

        <div className="space-y-3">
          {currentQ.options.map((option, oi) => {
            const selected = answers[currentQ.id] === option.id;
            return (
              <button
                key={option.id}
                onClick={() => setAnswers((p) => ({ ...p, [currentQ.id]: option.id }))}
                className={`flex w-full items-start gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  selected ? "border-primary bg-primary/5 shadow-sm" : "border-border bg-card hover:border-primary/30"
                }`}
              >
                <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-semibold ${
                  selected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                }`}>
                  {String.fromCharCode(65 + oi)}
                </span>
                <div className="flex-1">
                  {option.text && <span className="text-foreground whitespace-pre-wrap">{option.text}</span>}
                  {option.image_url && (
                    <img src={option.image_url} alt="" className="mt-2 max-h-40 rounded border border-border" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div className="mt-8 flex items-center justify-between">
          <Button variant="outline" onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))} disabled={currentIndex === 0}>
            <ChevronLeft className="h-4 w-4" />Previous
          </Button>
          {currentIndex === totalQuestions - 1 ? (
            <Button variant="success" size="lg" onClick={() => setShowConfirm(true)} disabled={submitting}>
              <Send className="h-5 w-5" />Submit Exam
            </Button>
          ) : (
            <Button onClick={() => setCurrentIndex((i) => Math.min(totalQuestions - 1, i + 1))}>
              Next<ChevronRight className="h-4 w-4" />
            </Button>
          )}
        </div>

        <div className="mt-6 rounded-lg bg-muted/50 p-4 text-center text-sm text-muted-foreground">
          {answeredCount} of {totalQuestions} answered
          {answeredCount < totalQuestions && (
            <span className="ml-1 text-warning-foreground">({totalQuestions - answeredCount} unanswered)</span>
          )}
        </div>
      </div>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 px-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-xl border border-border bg-card p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <AlertTriangle className="h-6 w-6 text-warning" />
              <h3 className="text-lg font-semibold text-foreground">Submit Exam?</h3>
            </div>
            <p className="mb-2 text-sm text-muted-foreground">
              You answered <strong>{answeredCount}</strong> of <strong>{totalQuestions}</strong>.
            </p>
            {answeredCount < totalQuestions && (
              <p className="mb-4 text-sm text-destructive">
                {totalQuestions - answeredCount} unanswered!
              </p>
            )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowConfirm(false)}>Go Back</Button>
              <Button variant="success" onClick={handleSubmit} disabled={submitting}>
                {submitting ? "Submitting…" : "Confirm Submit"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
