export const opsDictionary = {
  ko: {
    title: "Global Ops Console",
    subtitle: "B2B 운영, 실시간 상태, 성능 지표를 한 화면에서 추적합니다.",
    metrics: "운영 지표",
    incidents: "실시간 이벤트",
    releases: "배포 파이프라인",
    service: "서비스",
    severity: "상태",
    message: "메시지",
    region: "지역",
    version: "버전",
    environment: "환경",
    duration: "소요 시간",
    live: "Live",
    locale: "언어",
  },
  en: {
    title: "Global Ops Console",
    subtitle: "Track B2B operations, live status, and performance signals in one surface.",
    metrics: "Operational metrics",
    incidents: "Live events",
    releases: "Release pipeline",
    service: "Service",
    severity: "Status",
    message: "Message",
    region: "Region",
    version: "Version",
    environment: "Environment",
    duration: "Duration",
    live: "Live",
    locale: "Locale",
  },
} as const;

export type OpsLocale = keyof typeof opsDictionary;
export type OpsMessages = (typeof opsDictionary)[OpsLocale];
