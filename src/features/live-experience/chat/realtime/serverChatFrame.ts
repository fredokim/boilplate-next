import { plainToInstance } from "class-transformer";
import { validateSync } from "class-validator";
import { ChatMessageResponseDto } from "./serverChat.dto";
import type { ServerChatMessage } from "./serverChatTransport";

/**
 * What arrived on the socket, once it has been checked.
 *
 * Every HTTP response in this app is validated against a DTO before a component sees
 * it, and there is a failure vocabulary for a server that answers in a shape the
 * page cannot read. The socket carried the same domain objects and was trusted:
 * `parsed as ServerFrame`, and whatever came through went into the store.
 *
 * `ChatMessageResponseDto` already describes this exact object for the history
 * endpoint. Reusing it here is the point — one description, both paths, so the
 * two cannot drift into disagreeing about the same message.
 */
export type ParsedChatFrame =
  | { kind: "message"; message: ServerChatMessage }
  | { kind: "deleted"; messageId: string; sequence: number }
  | { kind: "error" }
  /**
   * Dropped. A frame this client does not understand is not a reason to tear
   * down a working stream — a server that has learned a new frame type is ahead,
   * not broken — and a malformed one is not a reason to trust it either.
   */
  | { kind: "ignored"; reason: "not-json" | "not-an-object" | "unknown-type" | "invalid-payload" };

const ignored = (reason: Extract<ParsedChatFrame, { kind: "ignored" }>["reason"]): ParsedChatFrame => ({
  kind: "ignored",
  reason,
});

/**
 * Synchronous on purpose.
 *
 * `validate()` returns a promise, and awaiting one per frame would let two
 * frames finish out of the order they arrived in. Ordering is the one thing the
 * store cannot repair on its own.
 */
function validateMessage(payload: unknown): ServerChatMessage | null {
  if (typeof payload !== "object" || payload === null) return null;

  const instance = plainToInstance(ChatMessageResponseDto, payload);

  if (validateSync(instance, { forbidUnknownValues: true, whitelist: true }).length > 0) return null;

  /**
   * The instance, not the payload it was built from. Validating one object and
   * handing on another lets a message missing a field pass — the DTO's
   * initialiser fills the default on the copy — and then delivers an object
   * without the field its own type promises.
   */
  return instance as ServerChatMessage;
}

export function parseServerChatFrame(raw: unknown): ParsedChatFrame {
  if (typeof raw !== "string") return ignored("not-json");

  let parsed: unknown;

  try {
    parsed = JSON.parse(raw);
  } catch {
    return ignored("not-json");
  }

  if (typeof parsed !== "object" || parsed === null) return ignored("not-an-object");

  const frame = parsed as { type?: unknown; message?: unknown; messageId?: unknown; sequence?: unknown };

  if (frame.type === "message") {
    const message = validateMessage(frame.message);

    return message ? { kind: "message", message } : ignored("invalid-payload");
  }

  /**
   * A tombstone rather than a silent removal: clients that already received the
   * message need to be told to drop it, and that is what makes them converge
   * without refetching history.
   *
   * Both fields are required. A missing `sequence` used to arrive as `undefined`
   * and reach the store, where it is neither an order nor a refusal.
   */
  if (frame.type === "deleted") {
    const validId = typeof frame.messageId === "string" && frame.messageId !== "";
    const validSequence = typeof frame.sequence === "number" && Number.isInteger(frame.sequence);

    return validId && validSequence
      ? { kind: "deleted", messageId: frame.messageId as string, sequence: frame.sequence as number }
      : ignored("invalid-payload");
  }

  if (frame.type === "error") return { kind: "error" };

  // `ready`, `joined`, `pong` and `heartbeat` are understood and carry nothing
  // this transport acts on. They are not failures, and neither is a frame type
  // this client has never heard of.
  return ignored("unknown-type");
}
