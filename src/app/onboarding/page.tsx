"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import {
  estimateFatLossCalorieGoal,
  type ActivityLevel,
  type Sex,
} from "@/lib/fitness/calories";

export default function OnboardingPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [manualBudget, setManualBudget] = useState(false);
  const [form, setForm] = useState({
    heightCm: "170",
    weightKg: "70",
    targetWeightKg: "65",
    sex: "male" as Sex,
    age: "28",
    activityLevel: "light" as ActivityLevel,
    dailyCalorieGoal: "",
    trainingPlace: "home",
    daysPerWeek: "3",
    notes: "",
  });

  const estimate = useMemo(() => {
    const heightCm = Number(form.heightCm);
    const weightKg = Number(form.weightKg);
    const age = Number(form.age);
    if (!heightCm || !weightKg || !age) return null;
    return estimateFatLossCalorieGoal({
      sex: form.sex,
      heightCm,
      weightKg,
      age,
      activityLevel: form.activityLevel,
    });
  }, [form.heightCm, form.weightKg, form.age, form.sex, form.activityLevel]);

  const budgetToSave = manualBudget
    ? Number(form.dailyCalorieGoal)
    : (estimate?.dailyCalorieGoal ?? 1800);

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
    <div className="mx-auto flex min-h-full w-full max-w-lg flex-col gap-6 px-4 py-10">
      <div>
        <Link
          href="/"
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          ← 返回对话
        </Link>
        <h1 className="mt-3 font-(family-name:--font-display) text-4xl text-foreground">
          建立档案
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          填身体数据和活动量即可，热量预算会自动估算，不用自己算。
        </p>
      </div>

      <form
        onSubmit={onSubmit}
        className="space-y-4 rounded-2xl border border-border bg-panel p-5 shadow-sm"
      >
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="sex">性别</Label>
            <Select
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
                <SelectItem value="male">男</SelectItem>
                <SelectItem value="female">女</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
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

        {(
          [
            ["heightCm", "身高 (cm)"],
            ["weightKg", "当前体重 (kg)"],
            ["targetWeightKg", "目标体重 (kg)"],
            ["daysPerWeek", "每周可练天数"],
          ] as const
        ).map(([key, label]) => (
          <div key={key} className="space-y-2">
            <Label htmlFor={key}>{label}</Label>
            <Input
              id={key}
              type="number"
              required
              className="h-10"
              value={form[key]}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
            />
          </div>
        ))}

        <div className="space-y-2">
          <Label htmlFor="activityLevel">日常活动量</Label>
          <Select
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
              <SelectItem value="sedentary">久坐（很少运动）</SelectItem>
              <SelectItem value="light">轻度（每周练 1–3 次）</SelectItem>
              <SelectItem value="moderate">中度（每周练 3–5 次）</SelectItem>
              <SelectItem value="active">较高（几乎每天动）</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="trainingPlace">训练场所</Label>
          <Select
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
              <SelectItem value="home">居家</SelectItem>
              <SelectItem value="gym">健身房</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {estimate ? (
          <div className="rounded-xl bg-card p-4 text-sm ring-1 ring-border">
            <p className="text-xs uppercase tracking-wide text-muted-foreground">
              自动估算的每日热量预算
            </p>
            <p className="mt-1 text-3xl font-semibold tabular-nums text-foreground">
              {budgetToSave}
              <span className="ml-1 text-base font-normal text-muted-foreground">
                kcal
              </span>
            </p>
            <p className="mt-2 leading-relaxed text-muted-foreground">
              意思是：建议你一天吃大概这么多，便于慢慢减脂。 维持约需{" "}
              {estimate.tdee} kcal，这里按约 {estimate.deficit} kcal
              缺口估算（粗略参考，非医疗建议）。
            </p>
            <Button
              type="button"
              variant="link"
              className="mt-2 h-auto px-0 text-xs"
              onClick={() => {
                setManualBudget((v) => !v);
                if (!manualBudget) {
                  setForm((f) => ({
                    ...f,
                    dailyCalorieGoal: String(estimate.dailyCalorieGoal),
                  }));
                }
              }}
            >
              {manualBudget ? "改回自动估算" : "我想手动改这个数字"}
            </Button>
            {manualBudget ? (
              <Input
                type="number"
                required
                min={1000}
                max={5000}
                className="mt-2 h-10"
                value={form.dailyCalorieGoal}
                onChange={(e) =>
                  setForm((f) => ({ ...f, dailyCalorieGoal: e.target.value }))
                }
              />
            ) : null}
          </div>
        ) : null}

        <div className="space-y-2">
          <Label htmlFor="notes">备注（可选）</Label>
          <Textarea
            id="notes"
            value={form.notes}
            onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
            rows={3}
            placeholder="如：膝盖不适避免跳跃、少油等"
          />
        </div>

        {error ? <p className="text-sm text-destructive">{error}</p> : null}

        <Button type="submit" className="h-11 w-full" disabled={saving}>
          {saving ? "保存中…" : "保存并开始"}
        </Button>
      </form>
    </div>
  );
}
