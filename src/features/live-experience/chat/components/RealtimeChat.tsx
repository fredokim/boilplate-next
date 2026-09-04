"use client";

import { memo, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useVirtualizer } from "@tanstack/react-virtual";
import type { ChatMessage } from "../model/chatMessage";
import type { ChatConnectionState, ChatDiagnostics } from "../realtime/types";
import { ChatProfileImage } from "./ChatProfileImage";
import styles from "../../views/LiveExperience.module.scss";

type RealtimeChatProps = {
  connectionState: ChatConnectionState;
  messages: readonly ChatMessage[];
  diagnostics: ChatDiagnostics;
};

const timeFormatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });

/** Treat "within this many pixels of the bottom" as still pinned to live. */
const PIN_THRESHOLD_PX = 24;

/** Matches the .messages height in the stylesheet. */
const CHAT_VIEWPORT_HEIGHT_PX = 420;

const statusClass: Record<ChatConnectionState, string | undefined> = {
  idle: undefined,
  connecting: styles.statusConnecting,
  reconnecting: styles.statusConnecting,
  connected: styles.statusConnected,
  disconnected: styles.statusOffline,
  error: styles.statusOffline,
};

export const RealtimeChat = memo(function RealtimeChat({
  connectionState,
  diagnostics,
  messages,
}: RealtimeChatProps) {
  const [scrollElement, setScrollElement] = useState<HTMLDivElement | null>(null);
  const [pinned, setPinned] = useState(true);
  const pinnedRef = useRef(pinned);
  pinnedRef.current = pinned;

  const virtualizer = useVirtualizer({
    count: messages.length,
    estimateSize: () => 64,
    getItemKey: (index) => messages[index]?.id ?? index,
    getScrollElement: () => scrollElement,
    // jsdom reports no element size, and a real browser reports none until the first
    // measurement, so give the virtualiser the viewport height the stylesheet fixes.
    initialRect: { width: 320, height: CHAT_VIEWPORT_HEIGHT_PX },
    observeElementRect: (instance, callback) => {
      const element = instance.scrollElement;
      const measure = () =>
        callback({
          width: element && element.clientWidth > 0 ? element.clientWidth : 320,
          height: element && element.clientHeight > 0 ? element.clientHeight : CHAT_VIEWPORT_HEIGHT_PX,
        });
      measure();
      if (!element || typeof ResizeObserver === "undefined") return () => undefined;
      const observer = new ResizeObserver(measure);
      observer.observe(element);
      return () => observer.disconnect();
    },
    overscan: 6,
  });

  // Following the stream means staying at the bottom as messages land. Once the reader
  // scrolls up they are reading history, so new messages must not yank them back.
  useLayoutEffect(() => {
    if (pinnedRef.current && scrollElement) scrollElement.scrollTop = scrollElement.scrollHeight;
  }, [messages.length, scrollElement]);

  useEffect(() => {
    if (!scrollElement) return undefined;
    const onScroll = () => {
      const distanceFromBottom = scrollElement.scrollHeight - scrollElement.scrollTop - scrollElement.clientHeight;
      setPinned(distanceFromBottom <= PIN_THRESHOLD_PX);
    };
    scrollElement.addEventListener("scroll", onScroll, { passive: true });
    return () => scrollElement.removeEventListener("scroll", onScroll);
  }, [scrollElement]);

  const virtualItems = virtualizer.getVirtualItems();

  return (
    <section aria-label="Realtime chat" className={styles.chat}>
      <header className={styles.chatHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Live chat</h2>
          <p className={styles.sectionHint}>Buffered, de-duplicated, and capped at {messages.length} shown</p>
        </div>
        <span className={[styles.status, statusClass[connectionState] ?? ""].join(" ")}>{connectionState}</span>
      </header>

      <div className={styles.viewport}>
        <div aria-live="polite" className={styles.messages} ref={setScrollElement}>
          {messages.length === 0 ? (
            <p className={styles.emptyMessages}>Waiting for the first message…</p>
          ) : (
            <div className={styles.spacer} style={{ height: virtualizer.getTotalSize() }}>
              {virtualItems.map((virtualItem) => {
                const message = messages[virtualItem.index];
                if (!message) return null;
                return (
                  <article
                    className={styles.message}
                    data-index={virtualItem.index}
                    key={virtualItem.key}
                    ref={(element) => virtualizer.measureElement(element)}
                    style={{ transform: `translateY(${String(virtualItem.start)}px)` }}
                  >
                    <ChatProfileImage displayName={message.displayName} src={message.profileImageUrl} />
                    <div className={styles.messageBody}>
                      <div className={styles.messageMeta}>
                        <strong className={styles.messageAuthor}>{message.displayName}</strong>
                        <time className={styles.messageTime} dateTime={message.timestamp}>
                          {timeFormatter.format(new Date(message.timestamp))}
                        </time>
                      </div>
                      <p className={styles.messageText}>{message.message}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {!pinned && messages.length > 0 ? (
          <button
            className={styles.jump}
            onClick={() => {
              setPinned(true);
              if (scrollElement) scrollElement.scrollTop = scrollElement.scrollHeight;
            }}
            type="button"
          >
            Jump to latest
          </button>
        ) : null}
      </div>

      <footer aria-label="Chat debug information" className={styles.chatDebug}>
        <span>Shown: {messages.length}</span>
        <span>Rendered: {virtualItems.length}</span>
        <span>Dropped: {diagnostics.droppedByCapacity + diagnostics.droppedTooOld}</span>
        <span>Connection: {connectionState}</span>
      </footer>
    </section>
  );
});
