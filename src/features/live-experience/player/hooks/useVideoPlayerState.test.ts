import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useVideoPlayerState } from "./useVideoPlayerState";

function videoElement(currentTime: number, duration: number) {
  return { currentTime, duration } as HTMLVideoElement;
}

describe("useVideoPlayerState", () => {
  it("starts idle with no timing", () => {
    const { result } = renderHook(() => useVideoPlayerState());

    expect(result.current.playerState).toEqual({ playbackState: "idle", currentTime: 0, duration: 0 });
  });

  it("keeps timing when the playback state changes", () => {
    const { result } = renderHook(() => useVideoPlayerState());

    act(() => result.current.updateTiming(videoElement(12.5, 60)));
    act(() => result.current.setPlaybackState("playing"));

    expect(result.current.playerState).toEqual({ playbackState: "playing", currentTime: 12.5, duration: 60 });
  });

  it("treats a non-finite duration as unknown", () => {
    const { result } = renderHook(() => useVideoPlayerState());

    act(() => result.current.updateTiming(videoElement(4, Number.POSITIVE_INFINITY)));

    // Live streams report Infinity until the manifest ends; the UI formats 0 instead of "Infinity:NaN".
    expect(result.current.playerState.duration).toBe(0);
    expect(result.current.playerState.currentTime).toBe(4);
  });

  it("treats NaN duration as unknown", () => {
    const { result } = renderHook(() => useVideoPlayerState());

    act(() => result.current.updateTiming(videoElement(0, Number.NaN)));

    expect(result.current.playerState.duration).toBe(0);
  });
});
