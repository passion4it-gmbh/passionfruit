/** @jsxRuntime automatic */
/** @jsxImportSource react */
/**
 * JSX template for the OG image (Layout B from spec D3).
 *
 * Consumed by Satori in Task 5. Pure, synchronous, side-effect-free.
 *
 * Satori constraints honoured here:
 *   - Only <div> and <img> elements.
 *   - Every multi-child container sets `display: 'flex'`.
 *   - Absolute children sit inside a `position: 'relative'` parent.
 *   - No className / Tailwind / CSS variables; inline style objects only.
 *   - SVG logos are inlined as data URIs (utf8-encoded) on <img src>.
 */

import type { JSX } from "react";

import type { Locale } from "./og-discover.ts";

export interface OgTemplateProps {
  name: string;
  tagline: string;
  /** `#rrggbb` brand accent — used for the radial background glow. */
  accent: string;
  /** `#rrggbb` dark surface colour — outer-container background. */
  surface: string;
  /** `#rrggbb` on-dark text colour — name + tagline foreground. */
  textOnDark: string;
  /** Raw SVG markup, inlined as a data URI on the lockup <img>. */
  logoSvg: string;
  lang: Locale;
}

/**
 * Convert a `#rrggbb` hex string to an `rgba(r, g, b, a)` literal.
 * Falls back to indigo (`#6366f1`) for malformed input rather than throwing —
 * the discovery layer already validates, so this is only defensive.
 */
function hexToRgba(hex: string, alpha: number): string {
  const match = /^#([0-9a-fA-F]{6})$/.exec(hex);
  const hex6 = match ? match[1] : "6366f1";
  const r = parseInt(hex6.slice(0, 2), 16);
  const g = parseInt(hex6.slice(2, 4), 16);
  const b = parseInt(hex6.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

export function OgTemplate(props: OgTemplateProps): JSX.Element {
  const { name, tagline, accent, surface, textOnDark, logoSvg, lang } = props;

  const glowStop = hexToRgba(accent, 0.18);
  const logoDataUri = "data:image/svg+xml;utf8," + encodeURIComponent(logoSvg);

  return (
    <div
      lang={lang}
      style={{
        position: "relative",
        display: "flex",
        flexDirection: "column",
        width: 1200,
        height: 630,
        padding: "64px 96px",
        backgroundColor: surface,
        color: textOnDark,
        fontFamily: "Inter",
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 0,
          left: 0,
          width: 1200,
          height: 630,
          background: `radial-gradient(ellipse at 20% 50%, ${glowStop} 0%, transparent 60%)`,
        }}
      />
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          gap: 20,
          marginBottom: 48,
        }}
      >
        <img src={logoDataUri} width={52} height={52} />
        <div
          style={{
            fontSize: 28,
            fontWeight: 600,
            letterSpacing: "-0.01em",
          }}
        >
          {name}
        </div>
      </div>
      <div
        style={{
          display: "flex",
          fontSize: 72,
          fontWeight: 700,
          lineHeight: 1.08,
          letterSpacing: "-0.02em",
          maxWidth: "92%",
        }}
      >
        {tagline}
      </div>
    </div>
  );
}
