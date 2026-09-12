"use client";

export type WeightPoint = {
  date: string;
  weightKg: number;
};

export function WeightTrendChart({
  points,
  height = 120,
}: {
  points: WeightPoint[];
  height?: number;
}) {
  if (points.length < 2) {
    return (
      <p className="text-sm text-muted-foreground">
        至少记录 2 个体重后才会出现趋势图。对话说「今天体重 70」即可。
      </p>
    );
  }

  const width = 320;
  const padX = 8;
  const padY = 12;
  const weights = points.map((p) => p.weightKg);
  const min = Math.min(...weights);
  const max = Math.max(...weights);
  const span = Math.max(max - min, 0.5);

  const coords = points.map((p, i) => {
    const x =
      padX + (i / Math.max(points.length - 1, 1)) * (width - padX * 2);
    const y =
      padY + (1 - (p.weightKg - min) / span) * (height - padY * 2);
    return { x, y, ...p };
  });

  const path = coords
    .map((c, i) => `${i === 0 ? "M" : "L"} ${c.x.toFixed(1)} ${c.y.toFixed(1)}`)
    .join(" ");

  const first = points[0].weightKg;
  const last = points[points.length - 1].weightKg;
  const delta = Number((last - first).toFixed(1));

  return (
    <div>
      <div className="mb-2 flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">近两周体重</p>
          <p className="text-xl font-semibold tabular-nums">
            {last}
            <span className="text-sm font-normal text-muted-foreground"> kg</span>
          </p>
        </div>
        <p
          className={`text-sm tabular-nums ${
            delta < 0
              ? "text-primary"
              : delta > 0
                ? "text-muted-foreground"
                : "text-muted-foreground"
          }`}
        >
          {delta === 0 ? "持平" : delta > 0 ? `+${delta} kg` : `${delta} kg`}
        </p>
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="h-auto w-full overflow-visible"
        role="img"
        aria-label="体重趋势"
      >
        <path
          d={path}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className="text-primary"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {coords.map((c) => (
          <circle
            key={c.date}
            cx={c.x}
            cy={c.y}
            r="3"
            className="fill-primary"
          />
        ))}
      </svg>
      <div className="mt-1 flex justify-between text-xs text-muted-foreground">
        <span>{points[0].date.slice(5)}</span>
        <span>{points[points.length - 1].date.slice(5)}</span>
      </div>
    </div>
  );
}
