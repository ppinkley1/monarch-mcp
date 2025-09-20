#!/usr/bin/env node

import * as readline from 'readline';
import { MonarchMoneyAPI } from './monarch-api.js';

async function question(
  rl: readline.Interface,
  prompt: string
): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, resolve);
  });
}

async function login() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  try {
    console.log('Monarch Money Login Tool');
    console.log('=======================\n');

    const email = await question(rl, 'Email: ');
    const password = await question(rl, 'Password: ');
    const mfaCode = await question(rl, 'Enter MFA code: ');

    const result = await MonarchMoneyAPI.login(email, password, mfaCode);

    console.log('\n✅ Login successful!');
    console.log(`\n🔑 Your authentication token:`);
    console.log(`MONARCH_TOKEN=${result.token}`);
    console.log('\n📝 Add this to your .env file to avoid re-authentication:');
    console.log(`echo "MONARCH_TOKEN=${result.token}" >> .env`);

    // Test the token by getting account count
    const api = new MonarchMoneyAPI(result.token);
    const accounts = await api.getAccounts();
    console.log(`\n✅ Token validated - found ${accounts.length} accounts`);
  } catch (error) {
    console.error(
      '\n❌ Login failed:',
      error instanceof Error ? error.message : 'Unknown error'
    );
    process.exit(1);
  } finally {
    rl.close();
  }
}

login();
