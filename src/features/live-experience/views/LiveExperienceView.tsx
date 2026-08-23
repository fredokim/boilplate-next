import type { ChatMessage } from "../chat/model/chatMessage";
import type { RealtimeConnectionState } from "../chat/realtime/realtimeChatAdapter";
import { RealtimeChat } from "../chat/components/RealtimeChat";
import type { VideoSource } from "../player/model/player";
import { VideoPlayer } from "../player/components/VideoPlayer";
import styles from "./LiveExperience.module.scss";

type LiveExperienceViewProps = {
  chatMessages: readonly ChatMessage[];
  connectionState: RealtimeConnectionState;
  videoSource: VideoSource;
};

export function LiveExperienceView({ chatMessages, connectionState, videoSource }: LiveExperienceViewProps) {
  return (
    <div className={styles.page}>
      <div className={styles.heading}>
        <div>
          <h1 className={styles.title}>Live Streaming Lab</h1>
          <p className={styles.subtitle}>A baseline for measuring streaming and realtime rendering behavior.</p>
        </div>
      </div>
      <div className={styles.layout}>
        <VideoPlayer source={videoSource} title="Summer Stage · Live rehearsal" />
        <RealtimeChat connectionState={connectionState} messages={chatMessages} />
      </div>
    </div>
  );
}
