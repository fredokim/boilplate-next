import { act } from "react";
import { hydrateRoot } from "react-dom/client";
import { renderToString } from "react-dom/server";
import { fireEvent, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const storageKey = "wod-planner:v1";
const savedTitle = "STORED-WOD-FIXTURE";

async function importWodPlanner() {
  vi.resetModules();
  const { WodPlanner } = await import("./WodPlanner.client");

  return WodPlanner;
}

// Renders on the "server", replays that HTML into the document, then hydrates it exactly the way
// the App Router does, collecting anything React reports as a recoverable (hydration) error.
async function renderAndHydrate() {
  const WodPlanner = await importWodPlanner();
  const html = renderToString(<WodPlanner />);

  const container = document.createElement("div");
  container.innerHTML = html;
  document.body.appendChild(container);

  const recoverableErrors: string[] = [];

  await act(async () => {
    hydrateRoot(container, <WodPlanner />, {
      onRecoverableError: (error) => {
        recoverableErrors.push(error instanceof Error ? error.message : String(error));
      },
    });
  });

  return { html, container, recoverableErrors };
}

describe("WodPlanner hydration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T09:00:00Z"));
    window.localStorage.clear();
  });

  afterEach(() => {
    document.body.innerHTML = "";
    vi.useRealTimers();
  });

  it("hydrates without a mismatch when nothing is stored", async () => {
    const { recoverableErrors } = await renderAndHydrate();

    expect(recoverableErrors).toEqual([]);
  });

  it("keeps the server markup free of stored state and applies it after hydration", async () => {
    window.localStorage.setItem(
      storageKey,
      JSON.stringify({ today: { date: "2026-01-02", title: savedTitle, workoutKind: "crossfit", rawText: "row" } }),
    );

    const { html, recoverableErrors } = await renderAndHydrate();

    // The server snapshot must not read localStorage, or hydration would diverge from the prerendered HTML.
    expect(html).not.toContain(savedTitle);
    expect(recoverableErrors).toEqual([]);
    expect(screen.getByDisplayValue(savedTitle)).toBeInTheDocument();
  });

  it("persists edits back to localStorage", async () => {
    const { container } = await renderAndHydrate();

    const titleInput = [...container.querySelectorAll("input")].find((input) => input.value === "오늘 WOD");
    expect(titleInput).toBeDefined();

    await act(async () => {
      fireEvent.change(titleInput as HTMLInputElement, { target: { value: "수정된 WOD" } });
    });

    expect(JSON.parse(window.localStorage.getItem(storageKey) ?? "{}").today.title).toBe("수정된 WOD");
  });
});
