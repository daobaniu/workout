"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type ExerciseGuideItem = {
  exerciseId?: string;
  name: string;
  sets: number;
  reps: string;
  weightKg?: number | null;
  howTo?: string;
  cautions?: string[];
  notes?: string;
  imageUrl?: string;
  videoUrl?: string;
};

export function ExerciseGuideList({
  exercises,
  idPrefix,
}: {
  exercises: ExerciseGuideItem[];
  idPrefix: string;
}) {
  if (!exercises.length) {
    return <p className="text-xs text-muted-foreground">暂无动作</p>;
  }

  return (
    <Accordion className="rounded-lg border border-border/70 bg-background/60 px-1.5">
      {exercises.map((ex, index) => (
        <AccordionItem
          key={`${ex.exerciseId ?? ex.name}-${index}`}
          value={`${idPrefix}-${index}`}
          className="border-border/70"
        >
          <AccordionTrigger className="py-2 text-left text-xs hover:no-underline">
            <span className="flex min-w-0 flex-col gap-0.5 pr-2">
              <span className="font-medium text-foreground">{ex.name}</span>
              <span className="font-normal text-muted-foreground">
                {ex.sets}×{ex.reps}
                {ex.weightKg != null && ex.weightKg > 0
                  ? ` · 建议 ${ex.weightKg}kg`
                  : ""}
                {ex.notes?.includes("上次")
                  ? " · 有超负荷建议"
                  : ex.howTo
                    ? " · 点开看做法"
                    : ""}
              </span>
            </span>
          </AccordionTrigger>
          <AccordionContent className="space-y-2 pb-3 text-xs leading-relaxed">
            {ex.howTo ? (
              <div>
                <p className="mb-0.5 font-medium text-foreground">怎么做</p>
                <p className="text-muted-foreground">{ex.howTo}</p>
              </div>
            ) : null}

            {ex.cautions && ex.cautions.length > 0 ? (
              <div>
                <p className="mb-0.5 font-medium text-amber-800">注意 / 易伤点</p>
                <ul className="list-disc space-y-0.5 pl-4 text-amber-900/80">
                  {ex.cautions.map((c) => (
                    <li key={c}>{c}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {ex.notes ? (
              <p className="text-muted-foreground">提示：{ex.notes}</p>
            ) : null}

            {/* 媒体预留：有资源时再展示 */}
            {ex.imageUrl || ex.videoUrl ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {ex.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={ex.imageUrl}
                    alt={ex.name}
                    className="h-24 w-auto rounded-md border border-border object-cover"
                  />
                ) : null}
                {ex.videoUrl ? (
                  <a
                    href={ex.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-primary underline"
                  >
                    观看示范视频
                  </a>
                ) : null}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground/80">
                图文/视频示范后续补充
              </p>
            )}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
