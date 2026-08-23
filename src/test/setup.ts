import "reflect-metadata";
import "@testing-library/jest-dom/vitest";
import { afterAll, afterEach, beforeAll, vi } from "vitest";
import { server } from "./msw/server";

HTMLCanvasElement.prototype.getContext = vi.fn();

// The client API layer calls fetch with absolute-less paths, which need an origin in jsdom.
beforeAll(() => server.listen({ onUnhandledRequest: "bypass" }));
afterEach(() => server.resetHandlers());
afterAll(() => server.close());
