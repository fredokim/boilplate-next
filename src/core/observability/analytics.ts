export type AnalyticsEvent = {
  name: string;
  properties?: Record<string, string | number | boolean | null>;
};

export type AnalyticsAdapter = {
  track: (event: AnalyticsEvent) => void;
  page: (path: string) => void;
};

let adapter: AnalyticsAdapter = {
  track: () => undefined,
  page: () => undefined,
};

export function setAnalyticsAdapter(nextAdapter: AnalyticsAdapter) {
  adapter = nextAdapter;
}

export const analytics = {
  track: (event: AnalyticsEvent) => adapter.track(event),
  page: (path: string) => adapter.page(path),
};
