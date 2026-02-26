import type { UserData } from '../pages/AutomationExercisePage.js';

export function buildRandomUser(): UserData {
  const ts = Date.now();
  const suffix = Math.floor(1000 + Math.random() * 8999);
  const runId = `${ts}-${suffix}`;

  const firstName = `User${suffix}`;
  const lastName = `QA`;
  const name = `${firstName}`;
  const emailPrefix = process.env.EMAIL_PREFIX || 'asaf.qa';
  const email = `${emailPrefix}+${runId}@example.com`;
  const password = `Pw@${suffix}12345`;

  const countries = ['India', 'United States', 'Canada', 'Australia', 'Israel', 'New Zealand', 'Singapore'];
  const country = countries[Math.floor(Math.random() * countries.length)];

  return {
    runId,
    name,
    email,
    password,
    firstName,
    lastName,
    company: `Company-${suffix}`,
    address: `Street ${Math.floor(10 + Math.random() * 90)}`,
    country,
    state: `State-${suffix}`,
    city: `City-${suffix}`,
    zipcode: `${Math.floor(10000 + Math.random() * 89999)}`,
    mobile: `05${Math.floor(10000000 + Math.random() * 89999999)}`
  };
}