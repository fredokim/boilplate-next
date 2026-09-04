"use client";

import { watchForIdle } from "@/core/realtime/idleSuspension";
import { useEffect, useMemo, useState, useSyncExternalStore } from "react";
import { ChatController } from "../realtime/chatController";
import { ChatStore, type ChatStoreOptions } from "../realtime/chatStore";
import type { ChatConnectionState, ChatTransport } from "../realtime/types";

type UseRealtimeChatOptions = {
  roomId: string;
  transport: ChatTransport;
  store?: ChatStoreOptions;
};

export function useRealtimeChat({ roomId, store: storeOptions, transport }: UseRealtimeChatOptions) {
  const store = useMemo(() => new ChatStore(storeOptions), [storeOptions]);
  const controller = useMemo(() => new ChatController({ roomId, transport, store }), [roomId, store, transport]);

  // The server has no stream, so it renders the store's empty snapshot and the client
  // takes over after hydration. getSnapshot is stable, so both sides agree.
  const snapshot = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  const [connectionState, setConnectionState] = useState<ChatConnectionState>(transport.getConnectionState());

  useEffect(() => {
    void controller.start();
    const unsubscribe = transport.subscribeConnection(setConnectionState);
    return () => {
      unsubscribe();
      controller.stop();
    };
  }, [controller, transport]);

  useEffect(() => {
    const onVisibility = () => controller.setHidden(document.hidden);
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, [controller]);


  /**
   * Hands the socket back when nobody is watching. An open socket is continuous
   * traffic, so a forgotten tab keeps a free instance awake all night for the
   * same cost as one in use.
   *
   * `stop()` and `start()` rather than a new pair of methods: stop already
   * disconnects and blocks the reconnect backoff, and start rejoins from the last applied sequence. An abandoned tab therefore stops
   * costing anything, and a returning reader catches up rather than reloading.
   */
  useEffect(() => {
    return watchForIdle({
      onIdle: () => controller.stop(),
      onResume: () => void controller.start(),
    });
  }, [controller]);

  return {
    connectionState,
    messages: snapshot.messages,
    diagnostics: snapshot.diagnostics,
  };
}
