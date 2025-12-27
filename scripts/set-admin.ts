#!/usr/bin/env tsx
/**
 * Script to set admin custom claims for a user
 * 
 * Usage: npx tsx scripts/set-admin.ts <user-email-or-uid>
 * 
 * Example: npx tsx scripts/set-admin.ts admin@example.com
 */

// Load environment variables from .env.local
import { config } from 'dotenv';
config({ path: '.env.local' });

import { initAdmin } from '../lib/auth/firebase-admin';

async function setAdmin(emailOrUid: string) {
    try {
        const adminAuth = initAdmin();

        // Get user by email or UID
        let user;
        if (emailOrUid.includes('@')) {
            user = await adminAuth.getUserByEmail(emailOrUid);
        } else {
            user = await adminAuth.getUser(emailOrUid);
        }

        // Set admin custom claim
        await adminAuth.setCustomUserClaims(user.uid, { role: 'admin' });

        console.log('✅ Admin role set successfully!');
        console.log(`User: ${user.email} (${user.uid})`);
        console.log('Custom claims:', { role: 'admin' });
        console.log('\n⚠️  User must sign out and sign back in for changes to take effect');

        process.exit(0);
    } catch (error: any) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
}

const emailOrUid = process.argv[2];

if (!emailOrUid) {
    console.error('Usage: npx tsx scripts/set-admin.ts <user-email-or-uid>');
    process.exit(1);
}

setAdmin(emailOrUid);
