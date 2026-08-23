import { setupServer } from "msw/node";
import { defaultHandlers } from "./scenarios";

export const server = setupServer(...defaultHandlers);
