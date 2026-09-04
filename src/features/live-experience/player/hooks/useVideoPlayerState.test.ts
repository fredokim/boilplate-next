import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { initialPlayerState } from "../model/player";
import { useVideoPlayerState } from "./useVideoPlayerState";

function videoElement(currentTime: number, duration: number, seekable: [number, number] | null = null) {
  const ranges = seekable
    ? ({ length: 1, start: () => seekable[0], end: () => seekable[1] } as unknown as TimeRanges)
    : ({ length: 0, start: () => 0, end: () => 0 } as unknown as TimeRanges);
  return { currentTime, duration, seekable: ranges } as HTMLVideoElement;
}

describe("useVideoPlayerState", () => {
  it("starts idle with no timing", () => {
    const { result } = renderHook(() => useVideoPlayerState());

    expect(result.current.playerState).toEqual(initialPlayerState);
  });

  it("keeps timing when the playback state changes", () => {
    const { result } = renderHook(() => useVideoPlayerState());

    act(() => result.current.updateTiming(videoElement(12.5, 60)));
    act(() => result.current.setPlaybackState("playing"));

    expect(result.current.playerState).toMatchObject({ playbackState: "playing", currentTime: 12.5, duration: 60 });
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
