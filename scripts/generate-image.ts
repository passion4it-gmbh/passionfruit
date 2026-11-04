#!/usr/bin/env tsx
/**
 * CLI script to generate images using OpenAI's GPT Image models.
 *
 * Usage:
 *   tsx scripts/generate-image.ts <prompt> [options]
 *
 * Options:
 *   --output, -o      Output file path (default: generated-image.png)
 *   --model, -m       Model: gpt-image-2, gpt-image-1.5, gpt-image-1, gpt-image-1-mini (default: gpt-image-2)
 *   --size, -s        Size: 1024x1024, 1536x1024, 1024x1536, auto (default: auto)
 *   --quality, -q     Quality: low, medium, high, auto (default: high)
 *   --background, -b  Background: transparent, opaque, auto (default: opaque)
 *   --format, -f      Format: png, jpeg, webp (default: png)
 *   --compression     Compression 0-100 for jpeg/webp (default: 80)
 *   --n               Number of images (default: 1)
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT_DIR = join(__dirname, "..");

// Load .env from repo root
function loadEnv(): void {
  const envPath = join(ROOT_DIR, ".env");
  if (!existsSync(envPath)) return;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx);
    const value = trimmed.slice(eqIdx + 1);
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
}

loadEnv();

type Model =
  "gpt-image-2" | "gpt-image-1.5" | "gpt-image-1" | "gpt-image-1-mini";
type Size = "1024x1024" | "1536x1024" | "1024x1536" | "auto";
type Quality = "low" | "medium" | "high" | "auto";
type Background = "transparent" | "opaque" | "auto";
type Format = "png" | "jpeg" | "webp";

interface Options {
  prompt: string;
  output: string;
  model: Model;
  size: Size;
  quality: Quality;
  background: Background;
  format: Format;
  compression: number;
  n: number;
}

function printUsage(): void {
  console.log(`
Usage: tsx scripts/generate-image.ts <prompt> [options]

Options:
  --output, -o      Output file path (default: generated-image.png)
  --model, -m       Model: gpt-image-2, gpt-image-1.5, gpt-image-1, gpt-image-1-mini (default: gpt-image-2)
  --size, -s        Size: 1024x1024, 1536x1024, 1024x1536, auto (default: auto)
  --quality, -q     Quality: low, medium, high, auto (default: high)
  --background, -b  Background: transparent, opaque, auto (default: opaque)
  --format, -f      Format: png, jpeg, webp (default: png)
  --compression     Compression 0-100 for jpeg/webp (default: 80)
  --n               Number of images (default: 1)

Examples:
  tsx scripts/generate-image.ts "A futuristic cityscape at sunset" -o hero.png
  tsx scripts/generate-image.ts "Abstract geometric logo" -o logo.png -q high -b transparent
  tsx scripts/generate-image.ts "Product photo of a coffee mug" --n 3 -o mug.png
`);
}

function parseArgs(): Options | null {
  const args = process.argv.slice(2);
  if (args.length === 0 || args.includes("--help") || args.includes("-h")) {
    printUsage();
    return null;
  }

  const options: Options = {
    prompt: "",
    output: "generated-image.png",
    model: "gpt-image-2",
    size: "auto",
    quality: "high",
    background: "opaque",
    format: "png",
    compression: 80,
    n: 1,
  };

  let i = 0;
  while (i < args.length) {
    const arg = args[i];

    if (arg === "--output" || arg === "-o") {
      options.output = args[++i];
    } else if (arg === "--model" || arg === "-m") {
      options.model = args[++i] as Model;
    } else if (arg === "--size" || arg === "-s") {
      options.size = args[++i] as Size;
    } else if (arg === "--quality" || arg === "-q") {
      options.quality = args[++i] as Quality;
    } else if (arg === "--background" || arg === "-b") {
      options.background = args[++i] as Background;
    } else if (arg === "--format" || arg === "-f") {
      options.format = args[++i] as Format;
    } else if (arg === "--compression") {
      options.compression = Number.parseInt(args[++i], 10);
    } else if (arg === "--n") {
      options.n = Number.parseInt(args[++i], 10);
    } else if (!arg.startsWith("-")) {
      options.prompt = arg;
    } else {
      console.error(`Unknown option: ${arg}`);
      printUsage();
      return null;
    }
    i++;
  }

  if (!options.prompt) {
    console.error("Error: Prompt is required");
    printUsage();
    return null;
  }

  // Validate options
  const validModels = [
    "gpt-image-2",
    "gpt-image-1.5",
    "gpt-image-1",
    "gpt-image-1-mini",
  ];
  if (!validModels.includes(options.model)) {
    console.error(
      `Invalid model: ${options.model}. Valid: ${validModels.join(", ")}`,
    );
    return null;
  }

  const validSizes = ["1024x1024", "1536x1024", "1024x1536", "auto"];
  if (!validSizes.includes(options.size)) {
    console.error(
      `Invalid size: ${options.size}. Valid: ${validSizes.join(", ")}`,
    );
    return null;
  }

  const validQualities = ["low", "medium", "high", "auto"];
  if (!validQualities.includes(options.quality)) {
    console.error(
      `Invalid quality: ${options.quality}. Valid: ${validQualities.join(", ")}`,
    );
    return null;
  }

  const validBackgrounds = ["transparent", "opaque", "auto"];
  if (!validBackgrounds.includes(options.background)) {
    console.error(
      `Invalid background: ${options.background}. Valid: ${validBackgrounds.join(", ")}`,
    );
    return null;
  }

  const validFormats = ["png", "jpeg", "webp"];
  if (!validFormats.includes(options.format)) {
    console.error(
      `Invalid format: ${options.format}. Valid: ${validFormats.join(", ")}`,
    );
    return null;
  }

  if (options.compression < 0 || options.compression > 100) {
    console.error("Compression must be between 0 and 100");
    return null;
  }

  if (options.n < 1 || options.n > 10) {
    console.error("Number of images must be between 1 and 10");
    return null;
  }

  // Transparent backgrounds only work with png/webp
  if (options.background === "transparent" && options.format === "jpeg") {
    console.error("Transparent background requires png or webp format");
    return null;
  }

  // gpt-image-2 does not support transparent backgrounds (per OpenAI docs)
  if (options.background === "transparent" && options.model === "gpt-image-2") {
    console.error(
      "Transparent background is not supported by gpt-image-2. Use --model gpt-image-1.5 or gpt-image-1.",
    );
    return null;
  }

  return options;
}

interface ImageGenerateResponse {
  data: Array<{
    b64_json?: string;
    revised_prompt?: string;
  }>;
}

async function generateImage(options: Options): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error(
      "Error: OPENAI_API_KEY not found in environment or .env file",
    );
    process.exit(1);
  }

  console.log(`Generating ${options.n} image(s) with ${options.model}...`);
  console.log(`Prompt: "${options.prompt}"`);
  console.log(
    `Settings: size=${options.size}, quality=${options.quality}, background=${options.background}, format=${options.format}`,
  );

  const body: Record<string, unknown> = {
    model: options.model,
    prompt: options.prompt,
    n: options.n,
    // GPT Image models always return base64, no response_format needed
  };

  // Only add non-default values
  if (options.size !== "auto") {
    body.size = options.size;
  }
  if (options.quality !== "auto") {
    body.quality = options.quality;
  }
  if (options.background !== "auto") {
    body.background = options.background;
  }
  if (options.format !== "png") {
    body.output_format = options.format;
  }
  if (
    (options.format === "jpeg" || options.format === "webp") &&
    options.compression !== 80
  ) {
    body.output_compression = options.compression;
  }

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const error = await response.text();
    console.error(`API Error (${response.status}): ${error}`);
    process.exit(1);
  }

  const result = (await response.json()) as ImageGenerateResponse;

  if (!result.data || result.data.length === 0) {
    console.error("No images returned from API");
    process.exit(1);
  }

  // Determine output path and extension
  const outputPath = resolve(options.output);
  const outputDir = dirname(outputPath);
  const outputExt = extname(outputPath) || `.${options.format}`;
  const outputBase = outputPath.replace(/\.[^.]+$/, "") || outputPath;

  // Create output directory if needed
  if (!existsSync(outputDir)) {
    mkdirSync(outputDir, { recursive: true });
  }

  // Save images
  for (let i = 0; i < result.data.length; i++) {
    const imageData = result.data[i];
    if (!imageData.b64_json) {
      console.error(`Image ${i + 1} has no data`);
      continue;
    }

    const buffer = Buffer.from(imageData.b64_json, "base64");
    const filename =
      result.data.length === 1
        ? `${outputBase}${outputExt}`
        : `${outputBase}-${i + 1}${outputExt}`;

    writeFileSync(filename, buffer);
    console.log(`Saved: ${filename}`);

    if (imageData.revised_prompt) {
      console.log(`Revised prompt: "${imageData.revised_prompt}"`);
    }
  }

  console.log("Done!");
}

async function main(): Promise<void> {
  const options = parseArgs();
  if (!options) {
    process.exit(1);
  }

  await generateImage(options);
}

main().catch((err: Error) => {
  console.error(`Error: ${err.message}`);
  process.exit(1);
});
