module.exports = {
  ci: {
    collect: {
      numberOfRuns: 1,
      settings: {
        // Headless, and not only for CI: a windowed Chrome that loses focus
        // paints nothing and Lighthouse reports NO_FCP rather than a score.
        chromeFlags: "--no-sandbox --headless=new",
      },
      // This one serves itself: `next start` runs the built app, so there is
      // no static directory to point at and no SPA fallback question.
      startServerCommand: "npm run start -- --hostname 127.0.0.1 --port 3000",
      startServerReadyPattern: "Ready in",
      url: ["http://127.0.0.1:3000/", "http://127.0.0.1:3000/login"],
    },
    assert: {
      assertions: {
        // Errors, not warnings. Every assertion here used to be a warning,
        // which meant the run could not fail and the numbers were decoration.
        // Measured 0.94-1.00 and 1.00 respectively, so 0.9 is a floor rather
        // than a target.
        "categories:accessibility": ["error", { minScore: 0.9 }],
        "categories:best-practices": ["error", { minScore: 0.9 }],
        // Deliberately still a warning. This is wall-clock timing on a shared
        // runner, and a flaky gate gets disabled rather than investigated.
        // Bundle size, which is the part under this project's control, is
        // asserted deterministically by `check:bundle`.
        "categories:performance": ["warn", { minScore: 0.75 }],
      },
    },
    upload: {
      target: "filesystem",
      outputDir: "./reports/lighthouse",
    },
  },
};

