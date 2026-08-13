const admin = require('firebase-admin');
const serviceAccount = require('./serviceAccountKey.json'); // assuming it exists or we can use ADC
admin.initializeApp();
const auth = admin.auth();

async function reset() {
  const listUsersResult = await auth.listUsers(1000);
  for (const user of listUsersResult.users) {
    if (user.customClaims && user.customClaims.nip === 'super.admin') {
      console.log('Found user:', user.email);
      await auth.updateUser(user.uid, {
        password: 'Password123!',
      });
      console.log('Password reset successfully to: Password123!');
      
      // Unlink google.com provider if it exists
      const providers = user.providerData.map(p => p.providerId);
      if (providers.includes('google.com')) {
        await auth.updateUser(user.uid, {
          providerToUnlink: ['google.com']
        });
        console.log('Unlinked google.com provider');
      }
      return;
    }
  }
  console.log('User super.admin not found');
}
reset().catch(console.error);
