import * as React from "react";
import { Plus, Trash2, GripVertical, Check, ImagePlus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface QBOption {
  text: string;
  image_url: string | null;
}
export interface QBQuestion {
  id: string;
  text: string;
  image_url: string | null;
  options: QBOption[];
  correctIndex: number;
}

interface Props {
  questions: QBQuestion[];
  onChange: (q: QBQuestion[]) => void;
  userId: string;
}

async function uploadImage(file: File, userId: string): Promise<string> {
  const ext = file.name.split(".").pop() || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("exam-media").upload(path, file, {
    cacheControl: "3600",
    upsert: false,
  });
  if (error) throw error;
  const { data } = supabase.storage.from("exam-media").getPublicUrl(path);
  return data.publicUrl;
}

function ImageField({
  url,
  onChange,
  userId,
}: {
  url: string | null;
  onChange: (u: string | null) => void;
  userId: string;
}) {
  const [busy, setBusy] = React.useState(false);
  const inputRef = React.useRef<HTMLInputElement>(null);
  const handle = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setBusy(true);
    try {
      const u = await uploadImage(f, userId);
      onChange(u);
    } catch (err) {
      toast.error("Upload failed: " + (err as Error).message);
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  if (url) {
    return (
      <div className="relative inline-block">
        <img src={url} alt="" className="max-h-32 rounded-md border border-border" />
        <button
          type="button"
          onClick={() => onChange(null)}
          className="absolute -right-2 -top-2 rounded-full bg-destructive p-1 text-destructive-foreground"
          aria-label="Remove image"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
    );
  }
  return (
    <>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handle}
      />
      <Button
        type="button"
        variant="outline"
        size="sm"
        disabled={busy}
        onClick={() => inputRef.current?.click()}
      >
        <ImagePlus className="h-4 w-4" />
        {busy ? "Uploading…" : "Add image"}
      </Button>
    </>
  );
}

export function QuestionBuilder({ questions, onChange, userId }: Props) {
  const addQuestion = () => {
    onChange([
      ...questions,
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
  };

  const updateQuestion = (idx: number, patch: Partial<QBQuestion>) => {
    const next = [...questions];
    next[idx] = { ...next[idx], ...patch };
    onChange(next);
  };
  const updateOption = (qi: number, oi: number, patch: Partial<QBOption>) => {
    const next = [...questions];
    const opts = [...next[qi].options];
    opts[oi] = { ...opts[oi], ...patch };
    next[qi] = { ...next[qi], options: opts };
    onChange(next);
  };
  const removeQuestion = (idx: number) => onChange(questions.filter((_, i) => i !== idx));

  return (
    <div className="space-y-6">
      {questions.map((q, qi) => (
        <div key={q.id} className="rounded-xl border border-border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GripVertical className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-semibold text-primary">Question {qi + 1}</span>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => removeQuestion(qi)}
              className="text-destructive hover:text-destructive"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>

          <div className="mb-3">
            <Label className="text-sm text-muted-foreground">Question</Label>
            <Textarea
              className="mt-1"
              placeholder="Enter the question text. Math like 2x + 5 = 15 is fine in plain text."
              value={q.text}
              onChange={(e) => updateQuestion(qi, { text: e.target.value })}
              rows={2}
            />
          </div>
          <div className="mb-4">
            <Label className="text-sm text-muted-foreground">Diagram / Image (optional)</Label>
            <div className="mt-1">
              <ImageField
                url={q.image_url}
                onChange={(u) => updateQuestion(qi, { image_url: u })}
                userId={userId}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-sm text-muted-foreground">
              Options — click the circle to mark the correct answer
            </Label>
            {q.options.map((opt, oi) => (
              <div key={oi} className="rounded-lg border border-border/60 p-2">
                <div className="flex items-start gap-2">
                  <button
                    type="button"
                    onClick={() => updateQuestion(qi, { correctIndex: oi })}
                    className={`mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 transition-all ${
                      q.correctIndex === oi
                        ? "border-success bg-success text-success-foreground"
                        : "border-border hover:border-primary/50"
                    }`}
                    aria-label="Mark correct"
                  >
                    {q.correctIndex === oi && <Check className="h-4 w-4" />}
                  </button>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder={`Option ${String.fromCharCode(65 + oi)}`}
                      value={opt.text}
                      onChange={(e) => updateOption(qi, oi, { text: e.target.value })}
                    />
                    <ImageField
                      url={opt.image_url}
                      onChange={(u) => updateOption(qi, oi, { image_url: u })}
                      userId={userId}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      <Button variant="outline" className="w-full border-dashed" onClick={addQuestion}>
        <Plus className="h-4 w-4" />
        Add Question
      </Button>
    </div>
  );
}
