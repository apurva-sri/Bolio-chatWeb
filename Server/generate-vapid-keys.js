// Run ONCE to generate your VAPID keys:
// node generate-vapid-keys.js
//
// Then paste the output into your .env file

const webpush = require("web-push");
const keys    = webpush.generateVAPIDKeys();

console.log("\n=== VAPID Keys (add to your .env) ===\n");
console.log(`VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log(`VAPID_PRIVATE_KEY=${keys.privateKey}`);
console.log(`VAPID_EMAIL=your@email.com`);
console.log("\n=== Add to client/.env ===\n");
console.log(`VITE_VAPID_PUBLIC_KEY=${keys.publicKey}`);
console.log("\nNever share VAPID_PRIVATE_KEY publicly!\n");
