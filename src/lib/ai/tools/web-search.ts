export type SearchResultItem = {
  title: string;
  url: string;
  snippet: string;
};

export async function searchWeb(
  query: string,
  maxResults = 5,
): Promise<{ ok: true; results: SearchResultItem[] } | { ok: false; error: string }> {
  const apiKey = process.env.TAVILY_API_KEY;
  if (!apiKey) {
    return {
      ok: false,
      error: "未配置 TAVILY_API_KEY，联网搜索暂不可用。本地记餐/推练/推餐仍可正常使用。",
    };
  }

  try {
    const res = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        query,
        search_depth: "basic",
        include_answer: false,
        max_results: maxResults,
      }),
    });

    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Tavily 请求失败 (${res.status}): ${text.slice(0, 200)}` };
    }

    const data = (await res.json()) as {
      results?: Array<{ title?: string; url?: string; content?: string }>;
    };

    const results: SearchResultItem[] = (data.results ?? [])
      .slice(0, maxResults)
      .map((r) => ({
        title: r.title ?? "无标题",
        url: r.url ?? "",
        snippet: r.content ?? "",
      }))
      .filter((r) => r.url);

    return { ok: true, results };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "联网搜索异常",
    };
  }
}
