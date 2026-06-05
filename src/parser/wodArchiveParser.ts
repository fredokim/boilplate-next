import type { WodArchiveEntry, WodInput, WorkoutKind } from "@/types/wod";
import { parseWod } from "./wodParser";

type ImportOptions = {
  fallbackDate: string;
  workoutKind: WorkoutKind;
};

const datePattern = /(\d{6}|\d{4}[./-]\d{1,2}[./-]\d{1,2}|\d{1,2}[./-]\d{1,2})/;

export function parseWodArchiveText(rawText: string, options: ImportOptions): WodArchiveEntry[] {
  return splitWodBlocks(rawText).map((block, index) => {
    const firstLine = block.split("\n").map((line) => line.trim()).find(Boolean);
    const date = inferDate(firstLine ?? "", options.fallbackDate);
    const input: WodInput = {
      date,
      title: inferTitle(firstLine, index),
      workoutKind: options.workoutKind,
      rawText: block,
    };
    const parsed = parseWod(input);

    return {
      ...parsed,
      id: createArchiveId(date, block),
      source: "manual-import",
      importedAt: new Date().toISOString(),
    };
  });
}

function splitWodBlocks(rawText: string): string[] {
  const cleanedLines = rawText
    .split(/\r?\n/g)
    .map((line) => line.replace(/\u200b/g, "").trim())
    .filter(Boolean);
  const blocks: string[] = [];
  let currentBlock: string[] = [];

  for (const line of cleanedLines) {
    const isDateHeader = datePattern.test(line) && line.replace(datePattern, "").trim().length === 0;

    if (isDateHeader && currentBlock.length > 0) {
      blocks.push(currentBlock.join("\n"));
      currentBlock = [];
    }

    currentBlock.push(line);
  }

  if (currentBlock.length > 0) {
    blocks.push(currentBlock.join("\n"));
  }

  return blocks.length > 0 ? blocks : rawText.split(/\n\s*\n/g).map((block) => block.trim()).filter(Boolean);
}

function inferDate(line: string, fallbackDate: string): string {
  const match = line.match(datePattern);

  if (!match?.[1]) {
    return fallbackDate;
  }

  const normalized = match[1].replaceAll(".", "-").replaceAll("/", "-");

  if (/^\d{6}$/.test(normalized)) {
    const year = `20${normalized.slice(0, 2)}`;
    const month = normalized.slice(2, 4);
    const day = normalized.slice(4, 6);
    return `${year}-${month}-${day}`;
  }

  const parts = normalized.split("-");

  if (parts.length === 3) {
    const [year, month, day] = parts;
    return `${year}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`;
  }

  const fallbackYear = fallbackDate.slice(0, 4);
  const [month, day] = parts;
  return `${fallbackYear}-${month?.padStart(2, "0")}-${day?.padStart(2, "0")}`;
}

function inferTitle(firstLine: string | undefined, index: number): string {
  if (!firstLine) {
    return `Imported WOD ${index + 1}`;
  }

  return firstLine.replace(datePattern, "").replace(/[-:|]/g, " ").replace(/\s+/g, " ").trim() || firstLine;
}

function createArchiveId(date: string, rawText: string): string {
  let hash = 0;

  for (const char of rawText) {
    hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  }

  return `${date}-${hash.toString(16)}`;
}
