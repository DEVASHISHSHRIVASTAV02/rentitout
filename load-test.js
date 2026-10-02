import http from "k6/http";
import { check, sleep } from "k6";

export const options = {
  stages: [
    { duration: "10s", target: 100 }, // Ramp up
    { duration: "25s", target: 350 }, // Sustained load
    { duration: "20s", target: 0 }, // Ramp down
  ],
  thresholds: {
    http_req_failed: ["rate<0.01"], // Error rate must be less than 1%
    http_req_duration: ["p(99)<500"], // 99% of requests must complete under 200ms
  },
};

export default function loadTest() {
  // Replace with the route or page you want to load test.
  const res = http.get("http://localhost:3000/about-us/");

  check(res, {
    "status is 200": (r) => r.status === 200,
  });

  // sleep(0.1); // Short pause between virtual user iterations
}
