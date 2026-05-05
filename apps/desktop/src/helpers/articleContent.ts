interface ProcessOptions {
  baseUrl?: string;
}

/**
 * Pick the richer content between `content` and `description`.
 * Falls back to the optional `fallback` string when both are empty.
 */
export function pickArticleContent(
  content: string | undefined | null,
  description: string | undefined | null,
  fallback?: string | null,
): string {
  if (content && description) {
    return content.length > description.length ? content : description;
  }
  if (content || description) {
    return content || description || "";
  }
  return fallback?.trim() || "";
}

/**
 * Pre-process raw article HTML before sanitisation:
 * 1. Ensures every `<a>` has `target="_blank"`.
 * 2. When `options.baseUrl` is provided, converts relative image `src`
 *    attributes to absolute URLs.
 *
 * Does NOT run DOMPurify — the caller (or ContentRender) is responsible
 * for the final sanitisation step.
 */
export function processArticleHtml(
  html: string,
  options?: ProcessOptions,
): string {
  let result = html;

  result = result.replace(/<a[^>]+>/gi, (a: string) => {
    if (!/\starget\s*=/gi.test(a)) {
      return a.replace(/^<a\s/, '<a target="_blank"');
    }
    return a;
  });

  if (options?.baseUrl) {
    result = result.replace(
      /<img\s+(?:[^>]*?\s+)?src="([^"]*)"[^>]*>/g,
      (match, src) => {
        try {
          const absoluteUrl = new URL(src, options.baseUrl!).href;
          return `<img src="${absoluteUrl}" />`;
        } catch {
          return match;
        }
      },
    );
  }

  return result;
}
