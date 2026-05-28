/**
 * Render layer for the OG image generator.
 *
 * Pure transform: (props + fonts) -> PNG Buffer. No file I/O, no font loading,
 * no top-level side effects. Fonts are loaded once by the CLI and threaded
 * through `RenderInput.fonts`.
 *
 * Pipeline: Satori turns the JSX template into an SVG string, then resvg
 * rasterises the SVG to a PNG.
 */

import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";

import { OgTemplate, type OgTemplateProps } from "./og-template.tsx";

export interface RenderInput {
  props: OgTemplateProps;
  fonts: SatoriOptions["fonts"];
}

export async function renderOg(input: RenderInput): Promise<Buffer> {
  const svg = await satori(OgTemplate(input.props), {
    width: 1200,
    height: 630,
    fonts: input.fonts,
  });

  return new Resvg(svg).render().asPng();
}
