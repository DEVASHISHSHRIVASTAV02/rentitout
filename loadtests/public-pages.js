import http from "k6/http";
import { check, sleep } from "k6";

const baseUrl = __ENV.BASE_URL || "http://127.0.0.1:3000";
const profileName = __ENV.PROFILE || "smoke";

const pages = [
  { name: "home", path: "/" },
  { name: "browse", path: "/browse" },
  { name: "rentals", path: "/rentals" },
  { name: "faqs", path: "/faqs" },
  { name: "about", path: "/about-us" },
  { name: "why-choose-us", path: "/why-choose-us" },
  { name: "careers", path: "/careers" },
  { name: "rental-agreement-templates", path: "/rental-agreement-templates" },
  { name: "privacy-policy", path: "/privacy-policy" },
  { name: "terms", path: "/terms-and-conditions" },
  { name: "sign-in", path: "/auth/sign-in" },
  { name: "sign-up", path: "/auth/sign-up" },
  { name: "list-your-appliance", path: "/list-your-appliance" },
  { name: "robots", path: "/robots.txt" },
  { name: "sitemap", path: "/sitemap.xml" },
];

/** VU targets for home-max: step up every 30s until thresholds abort the run. */
function buildHomeMaxStages() {
  const targets = [5, 10, 20, 40, 60, 80, 100, 125, 150, 175, 200, 250, 300, 350, 400, 450, 500];
  return targets.map((target) => ({ duration: "30s", target }));
}

/** VU targets for browse-max: start at 50, then +10 every 10s. */
function buildBrowseMaxStages() {
  const stages = [];
  for (let target = 50; target <= 500; target += 10) {
    stages.push({ duration: "10s", target });
  }
  return stages;
}

const scenarios = {
  smoke: {
    executor: "constant-vus",
    vus: 2,
    duration: "20s",
  },
  browse: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "30s", target: 10 },
      { duration: "30s", target: 25 },
      { duration: "30s", target: 50 },
      { duration: "30s", target: 50 },
      { duration: "20s", target: 0 },
    ],
    gracefulRampDown: "10s",
  },
  capacity: {
    executor: "ramping-vus",
    startVUs: 0,
    stages: [
      { duration: "20s", target: 5 },
      { duration: "20s", target: 10 },
      { duration: "20s", target: 20 },
      { duration: "20s", target: 40 },
      { duration: "20s", target: 60 },
      { duration: "20s", target: 80 },
      { duration: "20s", target: 100 },
    ],
    gracefulRampDown: "15s",
  },
  "home-max": {
    executor: "ramping-vus",
    startVUs: 0,
    stages: buildHomeMaxStages(),
    gracefulRampDown: "15s",
  },
  "browse-max": {
    executor: "ramping-vus",
    startVUs: 0,
    stages: buildBrowseMaxStages(),
    gracefulRampDown: "15s",
  },
};

const scenario = scenarios[profileName] || scenarios.smoke;
const abortOnLimit =
  profileName === "capacity" ||
  profileName === "browse" ||
  profileName === "home-max" ||
  profileName === "browse-max";
const singlePageByProfile = {
  "home-max": pages.find((page) => page.name === "home"),
  "browse-max": pages.find((page) => page.name === "browse"),
};
const fixedPage = singlePageByProfile[profileName] || null;
const noThinkTime = profileName === "capacity" || profileName === "home-max" || profileName === "browse-max";

export const options = {
  discardResponseBodies: true,
  scenarios: { public_pages: scenario },
  thresholds: {
    http_req_failed: [
      {
        threshold: "rate<0.01",
        abortOnFail: abortOnLimit,
        // browse-max starts at 50 VUs quickly; evaluate after the first hold.
        delayAbortEval: profileName === "browse-max" ? "15s" : "20s",
      },
    ],
    http_req_duration: [
      {
        threshold: "p(99)<1000",
        abortOnFail: abortOnLimit,
        delayAbortEval: profileName === "browse-max" ? "15s" : "20s",
      },
    ],
  },
  summaryTrendStats: ["avg", "med", "p(95)", "p(99)", "max"],
};

export default function () {
  const page = fixedPage || pages[Math.floor(Math.random() * pages.length)];
  const response = http.get(`${baseUrl}${page.path}`, {
    headers: { "Accept-Encoding": "br, gzip" },
    tags: { name: page.name },
    redirects: 5,
  });

  check(response, {
    "status is ok": (result) => result.status >= 200 && result.status < 400,
  });

  if (!noThinkTime) {
    sleep(0.5);
  }
}
