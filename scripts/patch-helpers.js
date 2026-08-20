const fs = require('fs');
let content = fs.readFileSync('functions/src/utils/helpers.ts', 'utf8');

content = content.replace(
  'export const sendFcmMessageByUid = async (uid: string, title: string, body: string, link: string, tag: string, nip?: string) => {',
  'export const sendFcmMessageByUid = async (uid: string, title: string, body: string, link: string, tag: string, nip?: string, prefKey?: "pushSuratMasuk" | "pushDisposisi" | "pushTugas") => {'
);

const tokenCheckTarget = `    if (!tokens || tokens.length === 0) {
      logger.log(\`[ScheduledFn] User \${uid} has no FCM tokens. Skipping.\`);
      return;
    }`;

const preferenceCheck = `
    if (prefKey && userProfile.notificationPreferences) {
      if (userProfile.notificationPreferences[prefKey] === false) {
        logger.log(\`[ScheduledFn] User \${uid} disabled \${prefKey} notifications. Skipping.\`);
        return;
      }
    }`;

content = content.replace(tokenCheckTarget, tokenCheckTarget + preferenceCheck);

fs.writeFileSync('functions/src/utils/helpers.ts', content);
console.log('Patch success');
