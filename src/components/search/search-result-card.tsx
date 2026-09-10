"use client";

type SearchItem = {
  title: string;
  url: string;
  snippet: string;
};

export function SearchResultCard({
  results,
  error,
}: {
  results?: SearchItem[];
  error?: string;
}) {
  if (error) {
    return (
      <div className="rounded-xl border border-amber-300/60 bg-amber-50 px-4 py-3 text-sm text-amber-900">
        搜索不可用：{error}
      </div>
    );
  }

  if (!results?.length) {
    return (
      <div className="rounded-xl border border-border bg-card px-4 py-3 text-sm text-muted-foreground">
        未找到相关网页结果
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
      <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">联网来源</p>
      <ul className="space-y-3">
        {results.map((item) => (
          <li key={item.url} className="text-sm">
            <a
              href={item.url}
              target="_blank"
              rel="noreferrer"
              className="font-medium text-primary underline-offset-2 hover:underline"
            >
              {item.title}
            </a>
            <p className="mt-1 line-clamp-2 text-muted-foreground">{item.snippet}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
