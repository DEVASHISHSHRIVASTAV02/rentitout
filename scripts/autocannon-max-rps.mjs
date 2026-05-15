#!/usr/bin/env node

import autocannon from "autocannon";

const HELP_TEXT = `Usage:
  npm run perf:max-rps -- [options]

Options:
  --url <url>               Target URL (default: http://127.0.0.1:3000/)
  --start <n>               Starting concurrent connections (default: 20)
  --max <n>                 Maximum concurrent connections (default: 300)
  --step <n>                Connection increment per run (default: 20)
  --duration <sec>          Duration of each run in seconds (default: 15)
  --pipelining <n>          HTTP pipelining depth (default: 1)
  --lag-ms <ms>             p97.5 latency threshold in ms (default: 500)
  --max-error-pct <pct>     Max allowed failure percentage (errors + non2xx) / (responses + errors) (default: 1)
  --method <verb>           HTTP method (default: GET)
  --help                    Show this help
`;

const defaults = {
  url: "http://127.0.0.1:3000/",
  start: 20,
  max: 300,
  step: 20,
  duration: 15,
  pipelining: 1,
  lagMs: 500,
  maxErrorPct: 1,
  method: "GET",
};

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];

    if (arg === "--help") {
      parsed.help = true;
      continue;
    }

    if (!arg.startsWith("--")) {
      throw new Error(`Unknown argument: ${arg}`);
    }

    const value = argv[index + 1];
    if (value === undefined || value.startsWith("--")) {
      throw new Error(`Missing value for ${arg}`);
    }
    index += 1;

    switch (arg) {
      case "--url":
        parsed.url = value;
        break;
      case "--start":
        parsed.start = toNumber(value, arg);
        break;
      case "--max":
        parsed.max = toNumber(value, arg);
        break;
      case "--step":
        parsed.step = toNumber(value, arg);
        break;
      case "--duration":
        parsed.duration = toNumber(value, arg);
        break;
      case "--pipelining":
        parsed.pipelining = toNumber(value, arg);
        break;
      case "--lag-ms":
        parsed.lagMs = toNumber(value, arg);
        break;
      case "--max-error-pct":
        parsed.maxErrorPct = toNumber(value, arg);
        break;
      case "--method":
        parsed.method = value.toUpperCase();
        break;
      default:
        throw new Error(`Unknown argument: ${arg}`);
    }
  }

  return parsed;
}

function toNumber(rawValue, argName) {
  const numericValue = Number(rawValue);
  if (!Number.isFinite(numericValue)) {
    throw new Error(`Invalid number for ${argName}: ${rawValue}`);
  }
  return numericValue;
}

function validateOptions(options) {
  if (options.start <= 0 || options.max <= 0 || options.step <= 0) {
    throw new Error("--start, --max and --step must be > 0");
  }

  if (options.max < options.start) {
    throw new Error("--max must be >= --start");
  }

  if (options.duration <= 0) {
    throw new Error("--duration must be > 0");
  }

  if (options.pipelining <= 0) {
    throw new Error("--pipelining must be > 0");
  }

  if (options.lagMs <= 0) {
    throw new Error("--lag-ms must be > 0");
  }

  if (options.maxErrorPct < 0) {
    throw new Error("--max-error-pct must be >= 0");
  }
}

function runAutocannon(options) {
  return new Promise((resolve, reject) => {
    autocannon(
      {
        url: options.url,
        connections: options.connections,
        duration: options.duration,
        pipelining: options.pipelining,
        method: options.method,
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }
        resolve(result);
      },
    );
  });
}

function formatNumber(value, digits = 2) {
  if (!Number.isFinite(value)) {
    return "n/a";
  }
  return value.toFixed(digits);
}

async function main() {
  const parsed = parseArgs(process.argv.slice(2));
  if (parsed.help) {
    console.log(HELP_TEXT);
    return;
  }

  const options = { ...defaults, ...parsed };
  validateOptions(options);

  console.log(
    `Running ramp test on ${options.url}\n` +
      `connections: ${options.start} -> ${options.max} (step ${options.step}), ` +
      `duration: ${options.duration}s, lag threshold: p97.5 > ${options.lagMs}ms, ` +
      `max error pct: ${options.maxErrorPct}%\n`,
  );

  const rows = [];
  let bestStable = null;
  let firstLagPoint = null;

  for (
    let connections = options.start;
    connections <= options.max;
    connections += options.step
  ) {
    console.log(`Testing ${connections} connections...`);
    const result = await runAutocannon({
      ...options,
      connections,
    });

    const reqPerSec = result.requests?.average ?? 0;
    const p90 = result.latency?.p90 ?? 0;
    const p97_5 = result.latency?.p97_5 ?? 0;
    const p99 = result.latency?.p99 ?? 0;
    const responseCount = Math.max(result.requests?.total ?? 0, 0);
    const errorCount = Math.max(result.errors ?? 0, 0);
    const non2xxCount = Math.max(result.non2xx ?? 0, 0);
    const attemptedRequests = responseCount + errorCount;
    const errorPct = attemptedRequests > 0 ? ((errorCount + non2xxCount) / attemptedRequests) * 100 : 0;
    const isLagging = p97_5 > options.lagMs || errorPct > options.maxErrorPct;

    const row = {
      connections,
      reqPerSec: Number(formatNumber(reqPerSec)),
      p90ms: Number(formatNumber(p90)),
      p97_5ms: Number(formatNumber(p97_5)),
      p99ms: Number(formatNumber(p99)),
      errorPct: Number(formatNumber(errorPct)),
      responses: responseCount,
      errors: errorCount,
      non2xx: non2xxCount,
      lagging: isLagging ? "yes" : "no",
    };
    rows.push(row);

    if (!isLagging) {
      bestStable = row;
      continue;
    }

    firstLagPoint = row;
    break;
  }

  console.log("\nResults:");
  console.table(rows);

  if (bestStable) {
    console.log(
      `Best stable point: ${bestStable.reqPerSec} req/s at ${bestStable.connections} connections ` +
        `(p97.5: ${bestStable.p97_5ms}ms, error: ${bestStable.errorPct}%).`,
    );
  } else {
    console.log("No stable point found with current thresholds.");
  }

  if (firstLagPoint) {
    console.log(
      `Lag threshold crossed at ${firstLagPoint.connections} connections ` +
        `(${firstLagPoint.reqPerSec} req/s, p97.5: ${firstLagPoint.p97_5ms}ms, error: ${firstLagPoint.errorPct}%).`,
    );
  } else {
    console.log("Lag threshold not crossed in tested range.");
  }
}

main().catch((error) => {
  console.error("Load test failed:", error.message);
  process.exitCode = 1;
});
