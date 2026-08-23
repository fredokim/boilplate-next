import type { VideoSource } from "../model/player";
import { useVideoPlayerState } from "../hooks/useVideoPlayerState";
import styles from "../../views/LiveExperience.module.scss";

type VideoPlayerProps = {
  source: VideoSource;
  title: string;
};

function formatTime(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = Math.floor(seconds % 60);
  return `${String(minutes)}:${String(remainingSeconds).padStart(2, "0")}`;
}

export function VideoPlayer({ source, title }: VideoPlayerProps) {
  const { playerState, setPlaybackState, updateTiming } = useVideoPlayerState();

  return (
    <section aria-label="Video player" className={styles.player}>
      <div className={styles.viewport}>
        <video
          className={styles.media}
          controls
          onCanPlay={() => setPlaybackState("paused")}
          onEnded={() => setPlaybackState("ended")}
          onError={() => setPlaybackState("error")}
          onLoadStart={() => setPlaybackState("loading")}
          onLoadedMetadata={(event) => updateTiming(event.currentTarget)}
          onPause={() => setPlaybackState("paused")}
          onPlay={() => setPlaybackState("playing")}
          onTimeUpdate={(event) => updateTiming(event.currentTarget)}
          onWaiting={() => setPlaybackState("buffering")}
          playsInline
          preload="metadata"
        >
          <source src={source.src} type={source.mimeType} />
        </video>
      </div>
      <div className={styles.playerDetails}>
        <div>
          <h2 className={styles.sectionTitle}>{title}</h2>
          <p className={styles.sectionNote}>Progressive test source · HLS integration point prepared</p>
        </div>
        <div aria-label="Player debug information" className={styles.debug}>
          <span>{playerState.playbackState}</span>
          <span>
            {formatTime(playerState.currentTime)} / {formatTime(playerState.duration)}
          </span>
        </div>
      </div>
    </section>
  );
}
