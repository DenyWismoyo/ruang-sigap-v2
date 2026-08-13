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
};

// Revert to original behavior: export modules without 'dev_' prefix
for (const [key, value] of Object.entries(allModules)) {
    exports[key] = value;
}
