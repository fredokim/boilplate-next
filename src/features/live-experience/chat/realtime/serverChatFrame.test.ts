import "reflect-metadata";
import { describe, expect, it } from "vitest";
import { parseServerChatFrame } from "./serverChatFrame";

/**
 * Written because the socket was the one door in this app that was not checked.
 *
 * Every HTTP response is validated against a DTO before a component sees it, and
 * there is a failure vocabulary for a server that answers in a shape the page
 * cannot read. The socket carried the same domain objects and was cast:
 * `parsed as { type?: string; message?: ServerChatMessage }`. Whatever arrived
 * went into the store.
 */

const message = {
  id: "m-1",
  clientMessageId: "c-1",
  broadcastId: "b-1",
  sequence: 7,
  authorId: "u-1",
  displayName: "Mina",
  body: "hello",
  sentAt: "2026-01-01T00:00:00.000Z",
  deleted: false,
};

const frame = (value: unknown): string => JSON.stringify(value);

describe("parseServerChatFrame", () => {
  it("accepts a message the server actually sends", () => {
    const parsed = parseServerChatFrame(frame({ type: "message", message }));

    expect(parsed).toEqual({ kind: "message", message });
  });

  it("rejects a message whose fields are not what the DTO describes", () => {
    // `sequence` as a string is what a hand-written mock or a changed server
    // produces, and it used to reach the store and sort as text.
    const parsed = parseServerChatFrame(frame({ type: "message", message: { ...message, sequence: "7" } }));

    expect(parsed).toEqual({ kind: "ignored", reason: "invalid-payload" });
  });

  /**
   * Stricter than the React boilerplate, and the difference has nothing
   * to do with the socket.
   *
   * This DTO declares its fields with definite assignment, so an
   * absent field stays undefined and the decorator rejects it. React declares
   * them with initialisers, so `plainToInstance` fills the default and the same
   * response passes with an empty string.
   *
   * Both repositories validate their HTTP responses through the same helper,
   * which means the two disagree about whether a missing field is an error — on
   * every endpoint, not just this frame. The server marks these fields required,
   * so React is accepting responses its own contract says cannot happen.
   *
   * This test pins what this repository actually does. Making the three agree is
   * a change to how every DTO is declared, and its own piece of work.
   */
  it("rejects a message missing a field the server marks required", () => {
    const withoutBody = { ...message };
    delete (withoutBody as Partial<typeof message>).body;
    const parsed = parseServerChatFrame(frame({ type: "message", message: withoutBody }));

    expect(parsed).toEqual({ kind: "ignored", reason: "invalid-payload" });
  });

  /**
   * The tombstone used to default a missing sequence to 0, which is not a
   * missing value but the earliest possible one: it sorts ahead of every
   * message in the room.
   */
  it("rejects a tombstone with no sequence rather than calling it zero", () => {
    const parsed = parseServerChatFrame(frame({ type: "deleted", messageId: "m-1" }));

    expect(parsed).toEqual({ kind: "ignored", reason: "invalid-payload" });
  });

  it("accepts a tombstone that carries one", () => {
    const parsed = parseServerChatFrame(frame({ type: "deleted", messageId: "m-1", sequence: 9 }));

    expect(parsed).toEqual({ kind: "deleted", messageId: "m-1", sequence: 9 });
  });

  /**
   * A server that has learned a new frame type is ahead of this client, not
   * broken. Dropping the frame is the whole response.
   */
  it("ignores a frame type it has never heard of", () => {
    expect(parseServerChatFrame(frame({ type: "reaction", emoji: "🔥" }))).toEqual({
      kind: "ignored",
      reason: "unknown-type",
    });
  });

  it("ignores the frames it understands but does not act on", () => {
    for (const type of ["ready", "joined", "pong", "heartbeat"]) {
      expect(parseServerChatFrame(frame({ type }))).toEqual({ kind: "ignored", reason: "unknown-type" });
    }
  });

  it("reports an error frame so the transport can show it", () => {
    expect(parseServerChatFrame(frame({ type: "error", code: "AUTH_FORBIDDEN", message: "no" }))).toEqual({
      kind: "error",
    });
  });

  it("survives anything that is not a frame at all", () => {
    expect(parseServerChatFrame("{oh no")).toEqual({ kind: "ignored", reason: "not-json" });
    expect(parseServerChatFrame(frame(null))).toEqual({ kind: "ignored", reason: "not-an-object" });
    expect(parseServerChatFrame(frame([1, 2]))).toEqual({ kind: "ignored", reason: "unknown-type" });
    expect(parseServerChatFrame(new ArrayBuffer(4))).toEqual({ kind: "ignored", reason: "not-json" });
  });
});
