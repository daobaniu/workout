"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  estimateCalorieGoal,
  type ActivityLevel,
  type Sex,
} from "@/lib/fitness/calories";
import {
  EXPERIENCE_OPTIONS,
  type ExperienceLevel,
} from "@/lib/fitness/experience";
import {
  GOAL_MODE_OPTIONS,
  type GoalMode,
} from "@/lib/fitness/goal-mode";
import { estimateDailyProteinGoal } from "@/lib/fitness/protein";

export type OnboardingFormValues = {
  heightCm: string;
  weightKg: string;
  targetWeightKg: string;
  sex: Sex;
  age: string;
  activityLevel: ActivityLevel;
  goalMode: GoalMode;
  dailyCalorieGoal: string;
  dailyProteinGoal: string;
  trainingPlace: string;
  daysPerWeek: string;
  experienceLevel: ExperienceLevel;
  dietRestrictions: string;
  injuryNotes: string;
  equipmentPref: string;
  notes: string;
};

const sexOptions = [
  { label: "男", value: "male" },
  { label: "女", value: "female" },
];

const activityLevelOptions = [
  { label: "久坐（很少运动）", value: "sedentary" },
  { label: "轻度（每周练 1–3 次）", value: "light" },
  { label: "中度（每周练 3–5 次）", value: "moderate" },
  { label: "较高（几乎每天动）", value: "active" },
];

const trainingPlaceOptions = [
  { label: "居家", value: "home" },
  { label: "健身房", value: "gym" },
];

const experienceOptions = EXPERIENCE_OPTIONS.map((o) => ({
  label: o.label,
  value: o.value,
}));

const goalModeOptions = GOAL_MODE_OPTIONS.map((o) => ({
  label: o.label,
  value: o.value,
}));

export function OnboardingForm({
  initialForm,
  hasExistingProfile,
}: {
  initialForm: OnboardingFormValues;
  hasExistingProfile: boolean;
}) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBudget, setManualBudget] = useState(
    Boolean(initialForm.dailyCalorieGoal),
  );
  const [manualProtein, setManualProtein] = useState(
    Boolean(initialForm.dailyProteinGoal),
  );
  const [form, setForm] = useState(initialForm);

  const estimate = useMemo(() => {
    const heightCm = Number(form.heightCm);
    const weightKg = Number(form.weightKg);
    const age = Number(form.age);
    if (!heightCm || !weightKg || !age) return null;
    return estimateCalorieGoal({
      sex: form.sex,
      heightCm,
      weightKg,
      age,
      activityLevel: form.activityLevel,
      goalMode: form.goalMode,
    });
  }, [
    form.heightCm,
    form.weightKg,
    form.age,
    form.sex,
    form.activityLevel,
    form.goalMode,
  ]);

  const proteinEstimate = useMemo(() => {
    const weightKg = Number(form.weightKg);
    if (!weightKg) return null;
    return estimateDailyProteinGoal({
      weightKg,
      experienceLevel: form.experienceLevel,
      goalMode: form.goalMode,
    });
  }, [form.weightKg, form.experienceLevel, form.goalMode]);

  const budgetToSave = manualBudget
    ? Number(form.dailyCalorieGoal)
    : (estimate?.dailyCalorieGoal ?? 1800);

  const proteinToSave = manualProtein
    ? Number(form.dailyProteinGoal)
    : (proteinEstimate?.dailyProteinGoal ?? 120);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          dailyCalorieGoal: budgetToSave,
          dailyProteinGoal: proteinToSave,
        }),
      });
      if (!res.ok) {
        throw new Error("保存失败");
      }
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "保存失败");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex w-full flex-col gap-4 px-3 py-4">
      <div>
        <p className="text-xs tracking-[0.2em] text-muted-foreground">PROFILE</p>
        <h1 className="mt-1 font-heading text-2xl text-foreground">
          {hasExistingProfile ? "我的档案" : "建立档案"}
        </h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          {hasExistingProfile
            ? "已载入你上次保存的档案，改完保存即可。"
            : "填身体数据和活动量即可，热量与蛋白目标会自动估算，不用自己算。"}
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-3 rounded-2xl border border-border bg-panel p-4 shadow-sm sm:p-5"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="sex">性别</Label>
            <Select
              items={sexOptions}
              value={form.sex}
              onValueChange={(value) => {
                if (value === "male" || value === "female") {
                  setForm((f) => ({ ...f, sex: value }));
                }
              }}
            >
              <SelectTrigger id="sex" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  {sexOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="age">年龄</Label>
            <Input
              id="age"
              type="number"
              required
              min={14}
              max={80}
              className="h-10"
              value={form.age}
              onChange={(e) => setForm((f) => ({ ...f, age: e.target.value }))}
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="heightCm">身高 (cm)</Label>
            <Input
              id="heightCm"
              type="number"
              required
              className="h-10"
              value={form.heightCm}
              onChange={(e) =>
                setForm((f) => ({ ...f, heightCm: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="daysPerWeek">每周可练</Label>
            <Input
              id="daysPerWeek"
              type="number"
              required
              min={1}
              max={7}
              className="h-10"
              value={form.daysPerWeek}
              onChange={(e) =>
                setForm((f) => ({ ...f, daysPerWeek: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="weightKg">当前体重 (kg)</Label>
            <Input
              id="weightKg"
              type="number"
              required
              className="h-10"
              value={form.weightKg}
              onChange={(e) =>
                setForm((f) => ({ ...f, weightKg: e.target.value }))
              }
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="targetWeightKg">目标体重 (kg)</Label>
            <Input
              id="targetWeightKg"
              type="number"
              required
              className="h-10"
              value={form.targetWeightKg}
              onChange={(e) =>
                setForm((f) => ({ ...f, targetWeightKg: e.target.value }))
              }
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="goalMode">目标模式</Label>
            <Select
              items={goalModeOptions}
              value={form.goalMode}
              onValueChange={(value) => {
                if (value === "cut" || value === "maintain" || value === "bulk") {
                  setForm((f) => ({ ...f, goalMode: value }));
                  setManualBudget(false);
                  setManualProtein(false);
                }
              }}
            >
              <SelectTrigger id="goalMode" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {goalModeOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="activityLevel">日常活动量</Label>
            <Select
              items={activityLevelOptions}
              value={form.activityLevel}
              onValueChange={(value) => {
                if (
                  value === "sedentary" ||
                  value === "light" ||
                  value === "moderate" ||
                  value === "active"
                ) {
                  setForm((f) => ({ ...f, activityLevel: value }));
                }
              }}
            >
              <SelectTrigger id="activityLevel" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {activityLevelOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {GOAL_MODE_OPTIONS.find((o) => o.value === form.goalMode)?.hint}
        </p>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="trainingPlace">训练场所</Label>
            <Select
              items={trainingPlaceOptions}
              value={form.trainingPlace}
              onValueChange={(value) => {
                if (typeof value === "string") {
                  setForm((f) => ({ ...f, trainingPlace: value }));
                }
              }}
            >
              <SelectTrigger id="trainingPlace" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {trainingPlaceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="experienceLevel">训练经验</Label>
            <Select
              items={experienceOptions}
              value={form.experienceLevel}
              onValueChange={(value) => {
                if (value === "beginner" || value === "intermediate") {
                  setForm((f) => ({ ...f, experienceLevel: value }));
                }
              }}
            >
              <SelectTrigger id="experienceLevel" className="h-10 w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {experienceOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {
            EXPERIENCE_OPTIONS.find((o) => o.value === form.experienceLevel)
              ?.hint
          }
        </p>

        {estimate || proteinEstimate ? (
          <div className="space-y-3 rounded-xl bg-card p-3 text-sm ring-1 ring-border sm:p-4">
            <div className="grid grid-cols-2 gap-3">
              {estimate ? (
                <div>
                  <p className="text-xs text-muted-foreground">每日热量</p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
                    {budgetToSave}
                    <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                      kcal
                    </span>
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="mt-1 h-auto px-0 text-xs"
                    onClick={() => {
                      setManualBudget((v) => !v);
                      if (!manualBudget) {
                        setForm((f) => ({
                          ...f,
                          dailyCalorieGoal: String(
                            form.dailyCalorieGoal || estimate.dailyCalorieGoal,
                          ),
                        }));
                      }
                    }}
                  >
                    {manualBudget ? "改回自动" : "手动改"}
                  </Button>
                  {manualBudget ? (
                    <Input
                      type="number"
                      required
                      min={1000}
                      max={5000}
                      className="mt-1.5 h-9"
                      value={form.dailyCalorieGoal}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dailyCalorieGoal: e.target.value,
                        }))
                      }
                    />
                  ) : null}
                </div>
              ) : null}
              {proteinEstimate ? (
                <div>
                  <p className="text-xs text-muted-foreground">每日蛋白</p>
                  <p className="mt-0.5 text-2xl font-semibold tabular-nums text-foreground">
                    {proteinToSave}
                    <span className="ml-0.5 text-sm font-normal text-muted-foreground">
                      g
                    </span>
                  </p>
                  <Button
                    type="button"
                    variant="link"
                    className="mt-1 h-auto px-0 text-xs"
                    onClick={() => {
                      setManualProtein((v) => !v);
                      if (!manualProtein) {
                        setForm((f) => ({
                          ...f,
                          dailyProteinGoal: String(
                            form.dailyProteinGoal ||
                              proteinEstimate.dailyProteinGoal,
                          ),
                        }));
                      }
                    }}
                  >
                    {manualProtein ? "改回自动" : "手动改"}
                  </Button>
                  {manualProtein ? (
                    <Input
                      type="number"
                      required
                      min={60}
                      max={250}
                      className="mt-1.5 h-9"
                      value={form.dailyProteinGoal}
                      onChange={(e) =>
                        setForm((f) => ({
                          ...f,
                          dailyProteinGoal: e.target.value,
                        }))
                      }
                    />
                  ) : null}
                </div>
              ) : null}
            </div>
            {estimate ? (
              <p className="text-xs leading-relaxed text-muted-foreground">
                {estimate.strategyNote}（粗略参考）。蛋白按约{" "}
                {proteinEstimate?.gramsPerKg ?? "—"} g/kg 估算。
              </p>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="dietRestrictions">忌口</Label>
            <Input
              id="dietRestrictions"
              value={form.dietRestrictions}
              onChange={(e) =>
                setForm((f) => ({ ...f, dietRestrictions: e.target.value }))
              }
              placeholder="不吃牛肉、海鲜过敏"
              className="h-10"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="injuryNotes">伤病规避</Label>
            <Input
              id="injuryNotes"
              value={form.injuryNotes}
              onChange={(e) =>
                setForm((f) => ({ ...f, injuryNotes: e.target.value }))
              }
              placeholder="膝盖不适避免跳跃"
              className="h-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="equipmentPref">器械偏好</Label>
          <Input
            id="equipmentPref"
            value={form.equipmentPref}
            onChange={(e) =>
              setForm((f) => ({ ...f, equipmentPref: e.target.value }))
            }
            placeholder="只有哑铃、偏好器械、徒手为主"
            className="h-10"
          />
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="notes">其他备注（可选）</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={2}
            placeholder="其他想让教练知道的"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="h-11 w-full" disabled={saving}>
          {saving ? "保存中…" : hasExistingProfile ? "保存修改" : "保存并开始"}
        </Button>
      </form>
    </div>
  );
}
