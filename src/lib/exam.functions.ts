// Server functions for ExamHub. Teacher fns use the user's session (RLS).
// Student fns use the admin client because students don't sign in to Supabase.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

function genCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let s = "";
  for (let i = 0; i < 6; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

// ============ TEACHER ============

const QuestionInput = z.object({
  text: z.string().min(1),
  image_url: z.string().nullable().optional(),
  options: z
    .array(
      z.object({
        text: z.string().min(1),
        image_url: z.string().nullable().optional(),
        is_correct: z.boolean(),
      }),
    )
    .min(2)
    .max(8),
});

const CreateExamInput = z.object({
  title: z.string().min(1),
  subject: z.string().min(1),
  class_name: z.string().min(1),
  duration_minutes: z.number().int().min(1).max(360),
  opens_at: z.string().nullable().optional(),
  closes_at: z.string().nullable().optional(),
  status: z.enum(["draft", "active"]).default("draft"),
  roster: z
    .array(z.object({ full_name: z.string().min(1), student_number: z.string().min(1) }))
    .default([]),
  questions: z.array(QuestionInput).min(1),
});

export const createExam = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => CreateExamInput.parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;

    // Generate unique access code (retry a few times)
    let code = genCode();
    for (let i = 0; i < 5; i++) {
      const { data: existing } = await supabase
        .from("exams")
        .select("id")
        .eq("access_code", code)
        .maybeSingle();
      if (!existing) break;
      code = genCode();
    }

    const { data: exam, error: examErr } = await supabase
      .from("exams")
      .insert({
        teacher_id: userId,
        title: data.title,
        subject: data.subject,
        class_name: data.class_name,
        duration_minutes: data.duration_minutes,
        access_code: code,
        status: data.status,
        opens_at: data.opens_at ?? null,
        closes_at: data.closes_at ?? null,
      })
      .select()
      .single();
    if (examErr || !exam) throw new Error(examErr?.message ?? "Failed to create exam");

    // Insert questions + options
    for (let qi = 0; qi < data.questions.length; qi++) {
      const q = data.questions[qi];
      const { data: question, error: qErr } = await supabase
        .from("questions")
        .insert({
          exam_id: exam.id,
          text: q.text,
          image_url: q.image_url ?? null,
          position: qi,
        })
        .select()
        .single();
      if (qErr || !question) throw new Error(qErr?.message ?? "Failed to add question");
      const optRows = q.options.map((o, oi) => ({
        question_id: question.id,
        text: o.text,
        image_url: o.image_url ?? null,
        is_correct: o.is_correct,
        position: oi,
      }));
      const { error: oErr } = await supabase.from("options").insert(optRows);
      if (oErr) throw new Error(oErr.message);
    }

    if (data.roster.length > 0) {
      const rows = data.roster.map((r) => ({
        exam_id: exam.id,
        full_name: r.full_name,
        student_number: r.student_number,
      }));
      const { error: rErr } = await supabase.from("roster_students").insert(rows);
      if (rErr) throw new Error(rErr.message);
    }

    return { id: exam.id, access_code: exam.access_code };
  });

export const listExams = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabase } = context;
    const { data: exams, error } = await supabase
      .from("exams")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    // counts
    const enriched = await Promise.all(
      (exams ?? []).map(async (e) => {
        const [{ count: qc }, { count: sc }, { count: rc }] = await Promise.all([
          supabase.from("questions").select("id", { count: "exact", head: true }).eq("exam_id", e.id),
          supabase
            .from("submissions")
            .select("id", { count: "exact", head: true })
            .eq("exam_id", e.id)
            .not("submitted_at", "is", null),
          supabase.from("roster_students").select("id", { count: "exact", head: true }).eq("exam_id", e.id),
        ]);
        return { ...e, question_count: qc ?? 0, submission_count: sc ?? 0, roster_count: rc ?? 0 };
      }),
    );

    const { data: profile } = await supabase.from("profiles").select("*").maybeSingle();
    return { exams: enriched, profile };
  });

export const getExamResults = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ exam_id: z.string().uuid() }).parse(d))
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { data: exam, error: ee } = await supabase
      .from("exams")
      .select("*")
      .eq("id", data.exam_id)
      .single();
    if (ee || !exam) throw new Error("Exam not found");
    const { data: subs } = await supabase
      .from("submissions")
      .select("*")
      .eq("exam_id", data.exam_id)
      .not("submitted_at", "is", null)
      .order("score", { ascending: false });
    return { exam, submissions: subs ?? [] };
  });

export const updateExamStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) =>
    z.object({ exam_id: z.string().uuid(), status: z.enum(["draft", "active", "closed"]) }).parse(d),
  )
  .handler(async ({ context, data }) => {
    const { supabase } = context;
    const { error } = await supabase
      .from("exams")
      .update({ status: data.status })
      .eq("id", data.exam_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ============ STUDENT (no auth) ============

export const studentStartExam = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        access_code: z.string().min(1),
        student_number: z.string().min(1),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const code = data.access_code.trim().toUpperCase();
    const studentNum = data.student_number.trim();

    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("*")
      .eq("access_code", code)
      .maybeSingle();
    if (!exam) throw new Error("Invalid access code");
    if (exam.status !== "active") throw new Error("This exam is not active");

    const now = new Date();
    if (exam.opens_at && new Date(exam.opens_at) > now) {
      throw new Error(`Exam opens at ${new Date(exam.opens_at).toLocaleString()}`);
    }
    if (exam.closes_at && new Date(exam.closes_at) < now) {
      throw new Error("This exam has ended");
    }

    const { data: roster } = await supabaseAdmin
      .from("roster_students")
      .select("*")
      .eq("exam_id", exam.id)
      .eq("student_number", studentNum)
      .maybeSingle();
    if (!roster) throw new Error("Student number not found in roster");

    // Get or create submission
    let { data: submission } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("exam_id", exam.id)
      .eq("roster_student_id", roster.id)
      .maybeSingle();

    if (submission && submission.submitted_at) {
      throw new Error("You have already submitted this exam");
    }

    if (!submission) {
      const { data: created, error } = await supabaseAdmin
        .from("submissions")
        .insert({
          exam_id: exam.id,
          roster_student_id: roster.id,
          student_full_name: roster.full_name,
          student_number: roster.student_number,
        })
        .select()
        .single();
      if (error || !created) throw new Error(error?.message ?? "Failed to start");
      submission = created;
    }

    return { submission_id: submission!.id, exam_id: exam.id, exam_title: exam.title };
  });

export const studentGetExam = createServerFn({ method: "GET" })
  .inputValidator((d: unknown) => z.object({ submission_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const { data: sub } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (!sub) throw new Error("Submission not found");
    if (sub.submitted_at) throw new Error("Exam already submitted");

    const { data: exam } = await supabaseAdmin
      .from("exams")
      .select("*")
      .eq("id", sub.exam_id)
      .single();
    if (!exam) throw new Error("Exam not found");

    const now = new Date();
    if (exam.closes_at && new Date(exam.closes_at) < now) {
      throw new Error("This exam has ended");
    }

    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("id, text, image_url, position, options(id, text, image_url, position)")
      .eq("exam_id", exam.id)
      .order("position");

    // STRIP is_correct - never sent to client. (We selected only safe columns.)
    // Shuffle deterministically per submission so students get different orders but stable across page reloads.
    const seed = sub.id;
    const seededShuffle = <T,>(arr: T[], salt: string): T[] => {
      const items = arr.map((v, i) => ({
        v,
        k: hashStr(seed + salt + i),
      }));
      items.sort((a, b) => a.k - b.k);
      return items.map((x) => x.v);
    };

    const shuffledQs = seededShuffle(questions ?? [], "q").map((q) => ({
      id: q.id,
      text: q.text,
      image_url: q.image_url,
      options: seededShuffle(q.options ?? [], "o:" + q.id).map((o) => ({
        id: o.id,
        text: o.text,
        image_url: o.image_url,
      })),
    }));

    const startedAt = new Date(sub.started_at).getTime();
    const durationMs = exam.duration_minutes * 60_000;
    const closesAtMs = exam.closes_at ? new Date(exam.closes_at).getTime() : Infinity;
    const endsAt = Math.min(startedAt + durationMs, closesAtMs);
    const remaining_seconds = Math.max(0, Math.floor((endsAt - Date.now()) / 1000));

    return {
      exam: { id: exam.id, title: exam.title, subject: exam.subject },
      student_name: sub.student_full_name,
      questions: shuffledQs,
      remaining_seconds,
    };
  });

function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export const studentSubmitExam = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) =>
    z
      .object({
        submission_id: z.string().uuid(),
        answers: z.array(
          z.object({
            question_id: z.string().uuid(),
            selected_option_id: z.string().uuid().nullable(),
          }),
        ),
      })
      .parse(d),
  )
  .handler(async ({ data }) => {
    const { data: sub } = await supabaseAdmin
      .from("submissions")
      .select("*")
      .eq("id", data.submission_id)
      .maybeSingle();
    if (!sub) throw new Error("Submission not found");
    if (sub.submitted_at) throw new Error("Already submitted");

    // Load all questions+correct options for this exam (server-side only)
    const { data: questions } = await supabaseAdmin
      .from("questions")
      .select("id, options(id, is_correct)")
      .eq("exam_id", sub.exam_id);
    const totalQ = questions?.length ?? 0;

    const correctMap = new Map<string, Set<string>>();
    for (const q of questions ?? []) {
      const set = new Set<string>();
      for (const o of q.options ?? []) if (o.is_correct) set.add(o.id);
      correctMap.set(q.id, set);
    }

    let score = 0;
    const answerRows: Array<{
      submission_id: string;
      question_id: string;
      selected_option_id: string | null;
      is_correct: boolean;
    }> = [];
    const seen = new Set<string>();
    for (const a of data.answers) {
      if (seen.has(a.question_id)) continue;
      seen.add(a.question_id);
      const correctSet = correctMap.get(a.question_id);
      const isCorrect = !!(a.selected_option_id && correctSet?.has(a.selected_option_id));
      if (isCorrect) score++;
      answerRows.push({
        submission_id: sub.id,
        question_id: a.question_id,
        selected_option_id: a.selected_option_id,
        is_correct: isCorrect,
      });
    }

    if (answerRows.length > 0) {
      await supabaseAdmin.from("answers").insert(answerRows);
    }

    const submittedAt = new Date();
    const timeTaken = Math.floor(
      (submittedAt.getTime() - new Date(sub.started_at).getTime()) / 1000,
    );

    await supabaseAdmin
      .from("submissions")
      .update({
        submitted_at: submittedAt.toISOString(),
        score,
        total_questions: totalQ,
        time_taken_seconds: timeTaken,
      })
      .eq("id", sub.id);

    return { score, total: totalQ };
  });
