import type { ChatMessage } from "../model/chatMessage";
import type { RealtimeConnectionState } from "../realtime/realtimeChatAdapter";
import { ChatProfileImage } from "./ChatProfileImage";
import styles from "../../views/LiveExperience.module.scss";

type RealtimeChatProps = {
  connectionState: RealtimeConnectionState;
  messages: readonly ChatMessage[];
};

const timeFormatter = new Intl.DateTimeFormat("en", { hour: "2-digit", minute: "2-digit" });

const statusClass: Record<RealtimeConnectionState, string | undefined> = {
  idle: undefined,
  connecting: styles.statusConnecting,
  connected: styles.statusConnected,
  disconnected: styles.statusOffline,
  error: styles.statusOffline,
};

export function RealtimeChat({ connectionState, messages }: RealtimeChatProps) {
  return (
    <section aria-label="Realtime chat" className={styles.chat}>
      <header className={styles.chatHeader}>
        <div>
          <h2 className={styles.sectionTitle}>Live chat</h2>
          <p className={styles.sectionHint}>Messages from the mock realtime adapter</p>
        </div>
        <span className={[styles.status, statusClass[connectionState] ?? ""].join(" ")}>{connectionState}</span>
      </header>
      <div aria-live="polite" className={styles.messages}>
        {messages.length === 0 ? (
          <p className={styles.emptyMessages}>Waiting for the first message…</p>
        ) : (
          messages.map((message) => (
            <article className={styles.message} key={message.id}>
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
          ))
        )}
      </div>
      <footer aria-label="Chat debug information" className={styles.chatDebug}>
        <span>Messages: {messages.length}</span>
        <span>Connection: {connectionState}</span>
      </footer>
    </section>
  );
}
