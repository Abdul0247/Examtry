import { createFileRoute } from "@tanstack/react-router";
import { Link } from "@tanstack/react-router";
import { AppHeader } from "@/components/AppHeader";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  Shield,
  Clock,
  Shuffle,
  Monitor,
  Smartphone,
  ArrowRight,
  CheckCircle,
} from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ExamHub — Computer-Based Testing for Schools" },
      { name: "description", content: "Secure, randomized computer-based testing platform for schools. Create exams, manage students, and get instant results." },
      { property: "og:title", content: "ExamHub — Computer-Based Testing for Schools" },
      { property: "og:description", content: "Secure, randomized CBT platform for schools." },
    ],
  }),
  component: HomePage,
});

const features = [
  {
    icon: Shield,
    title: "Secure Testing",
    description: "Correct answers are never exposed in the browser. Server-side validation ensures exam integrity.",
  },
  {
    icon: Shuffle,
    title: "Randomized Questions",
    description: "Each student gets questions in a unique random order, preventing copying.",
  },
  {
    icon: Clock,
    title: "Timed Exams",
    description: "Set exam duration with auto-submission. Students see a live countdown timer.",
  },
  {
    icon: Monitor,
    title: "Works Everywhere",
    description: "Fully responsive — works on desktops, laptops, tablets, and mobile phones.",
  },
];

function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <AppHeader />

      {/* Hero */}
      <section className="hero-gradient relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,oklch(0.55_0.2_230_/_0.15),transparent_60%)]" />
        <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:py-36">
          <div className="max-w-2xl">
            <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-primary-foreground/10 px-4 py-1.5 text-sm font-medium text-primary-foreground">
              <CheckCircle className="h-4 w-4" />
              Trusted by schools across Nigeria
            </div>
            <h1 className="text-4xl font-extrabold tracking-tight text-primary-foreground sm:text-5xl lg:text-6xl">
              Computer-Based Testing{" "}
              <span className="text-primary-foreground/80">Made Simple</span>
            </h1>
            <p className="mt-5 max-w-lg text-lg text-primary-foreground/70">
              Create secure, randomized exams in minutes. Students take tests on any device.
              Scores are delivered instantly to your inbox.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Button variant="hero" size="xl" asChild className="bg-primary-foreground/15 text-primary-foreground border border-primary-foreground/20 hover:bg-primary-foreground/25">
                <Link to="/dashboard">
                  Get Started as Teacher
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
              <Button variant="heroOutline" size="xl" asChild className="border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/10">
                <Link to="/student-login">
                  <Smartphone className="h-5 w-5" />
                  Take an Exam
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-foreground">
            Everything you need for school exams
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-muted-foreground">
            A complete CBT solution designed for Nigerian schools — from question
            creation to result delivery.
          </p>
        </div>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((f) => (
            <div
              key={f.title}
              className="card-hover rounded-xl border border-border bg-card p-6 shadow-sm"
            >
              <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {f.description}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="border-t border-border bg-muted/30 px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-center text-3xl font-bold text-foreground">
            How It Works
          </h2>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {[
              {
                step: "1",
                title: "Create Your Exam",
                desc: "Add questions, set the time limit, and choose your class. Get a unique access code.",
              },
              {
                step: "2",
                title: "Students Take the Test",
                desc: "Students enter the access code on any device. Questions appear in random order.",
              },
              {
                step: "3",
                title: "Get Instant Results",
                desc: "Scores are calculated server-side and emailed to you immediately after submission.",
              },
            ].map((item) => (
              <div key={item.step} className="text-center">
                <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-2xl font-bold text-primary-foreground">
                  {item.step}
                </div>
                <h3 className="mb-2 text-lg font-semibold text-foreground">
                  {item.title}
                </h3>
                <p className="text-sm text-muted-foreground">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border px-4 py-8 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 sm:flex-row">
          <div className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-primary" />
            <span className="font-semibold text-foreground">ExamHub</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2026 ExamHub. Secure computer-based testing for schools.
          </p>
        </div>
      </footer>
    </div>
  );
}
