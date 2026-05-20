// Cron-triggered: closes expired exams and emails teacher a summary CSV via Resend.
// Called every 5 minutes from pg_cron. Uses anon apikey header (Lovable public route bypass).
import { createFileRoute } from "@tanstack/react-router";
import { supabaseAdmin } from "@/integrations/supabase/client.server";

export const Route = createFileRoute("/api/public/hooks/exam-summary")({
  server: {
    handlers: {
      POST: async () => {
        const RESEND_API_KEY = process.env.RESEND_API_KEY;
        const LOVABLE_API_KEY = process.env.LOVABLE_API_KEY;

        if (!RESEND_API_KEY || !LOVABLE_API_KEY) {
          return new Response(JSON.stringify({ error: "Missing API keys" }), { status: 500 });
        }

        // Find closed exams not yet emailed
        const { data: exams } = await supabaseAdmin
          .from("exams")
          .select("*")
          .eq("status", "closed")
          .eq("summary_email_sent", false);

        if (!exams || exams.length === 0) {
          return new Response(JSON.stringify({ processed: 0 }), { status: 200 });
        }

        let sent = 0;
        for (const exam of exams) {
          // Get teacher email from auth.users
          const { data: userResp } = await supabaseAdmin.auth.admin.getUserById(exam.teacher_id);
          const teacherEmail = userResp?.user?.email;
          if (!teacherEmail) continue;

          const { data: profile } = await supabaseAdmin
            .from("profiles")
            .select("full_name, school_name")
            .eq("id", exam.teacher_id)
            .maybeSingle();

          const { data: subs } = await supabaseAdmin
            .from("submissions")
            .select("*")
            .eq("exam_id", exam.id)
            .not("submitted_at", "is", null)
            .order("score", { ascending: false });

          const submissions = subs ?? [];
          const total = submissions.length;
          const avg = total
            ? Math.round(
                (submissions.reduce(
                  (a, s) =>
                    a + (s.total_questions ? (s.score ?? 0) / s.total_questions : 0),
                  0,
                ) /
                  total) *
                  100,
              )
            : 0;

          const rows = [
            ["Rank", "Name", "Student #", "Score", "Total", "Percent"],
            ...submissions.map((s, i) => {
              const t = s.total_questions ?? 0;
              const sc = s.score ?? 0;
              const pct = t ? Math.round((sc / t) * 100) : 0;
              return [String(i + 1), s.student_full_name, s.student_number, String(sc), String(t), `${pct}%`];
            }),
          ];
          const csv = rows
            .map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(","))
            .join("\n");
          const csvB64 = btoa(unescape(encodeURIComponent(csv)));

          const html = `
            <h2>${escapeHtml(exam.title)} — Results Summary</h2>
            <p>Hello ${escapeHtml(profile?.full_name ?? "Teacher")},</p>
            <p>Your exam <strong>${escapeHtml(exam.title)}</strong> (${escapeHtml(exam.subject)} — ${escapeHtml(exam.class_name)}) has closed.</p>
            <ul>
              <li>Submissions: <strong>${total}</strong></li>
              <li>Average score: <strong>${avg}%</strong></li>
              <li>Access code: <code>${escapeHtml(exam.access_code)}</code></li>
            </ul>
            <p>Full results are attached as a CSV. You can also view them in your dashboard.</p>
            <p style="color:#888;font-size:12px">${escapeHtml(profile?.school_name ?? "")}</p>
          `;

          const r = await fetch("https://connector-gateway.lovable.dev/resend/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${LOVABLE_API_KEY}`,
              "X-Connection-Api-Key": RESEND_API_KEY,
            },
            body: JSON.stringify({
              from: "ExamHub <onboarding@resend.dev>",
              to: [teacherEmail],
              subject: `Results: ${exam.title} (${total} submissions, avg ${avg}%)`,
              html,
              attachments: [
                { filename: `${exam.title.replace(/\s+/g, "-")}-results.csv`, content: csvB64 },
              ],
            }),
          });
          if (r.ok) {
            await supabaseAdmin
              .from("exams")
              .update({ summary_email_sent: true })
              .eq("id", exam.id);
            sent++;
          } else {
            console.error("Resend failed", await r.text());
          }
        }

        return new Response(JSON.stringify({ processed: exams.length, sent }), { status: 200 });
      },
    },
  },
});

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c] as string,
  );
}
