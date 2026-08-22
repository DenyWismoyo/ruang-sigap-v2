import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";

// Inisialisasi Sentry seawal mungkin
Sentry.init({
  dsn: process.env.SENTRY_DSN,
  integrations: [
    nodeProfilingIntegration(),
  ],
  // Tracing
  tracesSampleRate: 1.0, 
  // Profiling
  profilesSampleRate: 1.0,
});

import * as api from "./api";
import * as triggers from "./triggers";
import * as cron from "./cron";

// Module lainnya
import * as aiFunctions from "./aiFunctions";
import * as agregasiSummaries from "./agregasiSummaries";
import * as masterDataAggregator from "./masterDataAggregator";
import * as taskWorkers from "./taskWorkers";
import * as autoHeal from "./autoHeal";
import * as backupFunction from "./backupFunction";

import * as manualMigrateOpd from "./manualMigrateOpd";
import * as lintasOpd from "./lintasOpd";
import * as migrateSubcollections from "./migrateSubcollections";
import * as compressPdf from "./compressPdf";

const allModules = {
    ...api,
    ...triggers,
    ...cron,
    ...aiFunctions,
    ...agregasiSummaries,
    ...masterDataAggregator,
    ...taskWorkers,
    ...autoHeal,
    ...backupFunction,
    ...manualMigrateOpd,
    ...lintasOpd,
    ...migrateSubcollections,
    ...compressPdf,
};

// Revert to original behavior: export modules without 'dev_' prefix
for (const [key, value] of Object.entries(allModules)) {
    exports[key] = value;
}

import { dailyKinerjaAggregator } from "./cron/dailyKinerjaAggregator";
exports.dailyKinerjaAggregator = dailyKinerjaAggregator;

import { backfillKinerjaAgregat } from "./backfillKinerjaAgregat";
exports.backfillKinerjaAgregat = backfillKinerjaAgregat;

import { recordUserSession } from "./triggers/sessionTriggers";
exports.recordUserSession = recordUserSession;

import { aggregateHealthScore } from "./cron/aggregateHealthScore";
exports.aggregateHealthScore = aggregateHealthScore;
