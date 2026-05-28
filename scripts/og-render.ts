/**
 * Render layer for the OG image generator.
 *
 * Pure transform: (props + fonts) -> PNG Buffer. No file I/O, no font loading,
 * no top-level side effects. Fonts are loaded once by the CLI and threaded
 * through `RenderInput.fonts`.
 *
 * Pipeline: Satori turns the JSX template into an SVG string, then resvg
 * rasterises the SVG to a 1200-wide PNG.
 */

import { Resvg } from "@resvg/resvg-js";
import satori, { type SatoriOptions } from "satori";

import { OgTemplate, type OgTemplateProps } from "./og-template.tsx";

export interface RenderInput {
  props: OgTemplateProps;
  fonts: SatoriOptions["fonts"];
}

const WIDTH = 1200;
const HEIGHT = 630;

export async function renderOg(input: RenderInput): Promise<Buffer> {
  const svg = await satori(OgTemplate(input.props), {
    width: WIDTH,
    height: HEIGHT,
    fonts: input.fonts,
  });

  const resvg = new Resvg(svg, {
    fitTo: { mode: "width", value: WIDTH },
  });

  return resvg.render().asPng();
}
