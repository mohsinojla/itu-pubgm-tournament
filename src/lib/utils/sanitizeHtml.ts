import sanitizeHtml from "sanitize-html";

/**
 * Sanitizes admin-authored rich text (announcements, rules) before it's stored.
 * Allows basic formatting only — strips <script>, event handlers, iframes, etc.
 * so a compromised or malicious admin account can't inject XSS that runs in
 * every visitor's browser via dangerouslySetInnerHTML.
 */
export function sanitizeRichText(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: [
      "p", "br", "b", "i", "u", "strong", "em", "s", "del",
      "h1", "h2", "h3", "h4",
      "ul", "ol", "li",
      "a", "blockquote", "code", "pre", "span", "div",
    ],
    allowedAttributes: {
      a: ["href", "target", "rel"],
      span: ["style"],
      div: ["style"],
    },
    allowedStyles: {
      "*": {
        color: [/^#[0-9a-fA-F]{3,6}$/, /^rgb\(/],
        "font-weight": [/^bold$/],
        "text-decoration": [/^underline$/],
      },
    },
    allowedSchemes: ["http", "https", "mailto"],
    transformTags: {
      a: sanitizeHtml.simpleTransform("a", { rel: "noopener noreferrer", target: "_blank" }),
    },
  });
}
