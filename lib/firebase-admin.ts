/**
 * Firebase Admin SDK Configuration
 * 
 * This module initializes the Firebase Admin SDK for server-side operations.
 * It should ONLY be used in:
 * - API routes (app/api/*)
 * - Server components
 * - Server actions
 * 
 * NEVER import this file in client-side code!
 */

import { initializeApp, getApps, cert, App } from 'firebase-admin/app';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getStorage, Storage } from 'firebase-admin/storage';

// Service account credentials
// In production, use environment variables instead of importing the JSON file
const serviceAccount = {
  type: "service_account",
  project_id: process.env.FIREBASE_PROJECT_ID || "warehouse-management-sys-3fdf3",
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID || "19f4e046d67d14c12d800d686ec920bd73685f4f",
  private_key: (process.env.FIREBASE_PRIVATE_KEY || "-----BEGIN PRIVATE KEY-----\nMIIEvQIBADANBgkqhkiG9w0BAQEFAASCBKcwggSjAgEAAoIBAQCuOOZzdKfEyBWN\n5+tzAReTuYiyRtXMRdmU5Kwf81urDDUcrpDzi7qNz3LdTRCChz0OvRU/4rH+xy5u\nS/v1cdaJb3qjXqc79iyDwOEGYjA9DJDcjeV0vcUeBWmGX4OZewtLgJnwcsmL4095\ni0sbyJgJYmlmkqhaOmqFuPwYT+SVsskuP53LmtoYUfQA47KXz3DudS0O2gOD0nGh\nBsWCNyFYuCku77GijwK91dYI/AdKP/QbOMDgfuuxiGZDIPEypZpD8L/L4bwdkpjS\nHVU+PM8mjgWk32PKdZ3yRADn2e40oi3/hKEncqAL5SWyxQSHQ/N3EV1dgcqTOAC/\nJN9R0Kf7AgMBAAECggEAGNqlMEiuu7Pk30mmnSbFZkhMPU09qCvkI7Q7meiYZd5n\n9UoyA4x7dfTnk1/bFcPql0pXgwr5ZDn7YGDBS6fhzdl0IA+ba+0X4fPc0Ob7sA81\nhev4P/SSmlB2Arq9hg0M9Mhz2DQylxzmdEBwMUEnRK91ZIdSMmJYWptOhhQKWBCH\nrr3GfDGLNnnWY91LQHYYj1mvitgroxNSjpW7P3CRRdHF53Qg4pXjBLEIrS7r0njx\nydjjrOf6Sef5ZSOzrCJdXxYKb5nDNsG3p/4xy/ThNpeD+dhnOJiBmaeSqvxxTRRq\ntriRCJpRLjdng5Qm2f0jJgP4M7qyShcqn/RTR9mXgQKBgQDdwlKbWsHaxbIALVOx\nAKYuGq7MX+iAaAOUT3E7NegTDFOPOv4qnieChSiR15zTwjvgM8M5eL8yObpFDazl\nBnhlgQibPdcCBYZ5meQXYHg/5PWHSKtGVgVtoxspG6dgdQaoPx6xxjp5FPHg+k2u\ncMKu02Ex3l63bVRYtG1hx2Ex/QKBgQDJH4vAvnbza5rH7sUv8fVRSBqGPIhV0mF5\n0P36dSrRz5hqPR/iZcU/h7ePmI6P7vyDZhJK7xjBTWSaDyAgxJ5E7npbBIH19Eea\nD8H0bLMc43S3tv2dWr5UnOQpNx6mBYxEdfny2kORMNZXsk4pKPE1qE/7PXzeJvHW\nuWdf2rHHVwKBgHVvfPOMgnBqlTMGzfVEVLzBoKPWfnfRnWOjFmG20GmV84I8SXEk\nQ+QYxD1Ho2N4zuCSSOZcjVP5wizjaxX18Tg/tuEPRJdreaVX27SNf+DGTUgRMbKT\nx1giMjX40RCBqL7cflLCmSCZ+OWdaBni2RZgFm6kRiB5I1u+YNaREWW5AoGAHtUu\nOJM6ayDg7qulIS+HuzlBj7ix8e45sVIfzYiu0tFvfUH3pF6TuaSVuHbbzCcIISDB\nxykWc3Po61FMTJm35btlmJR9U/ZqD61Av7b2UoRwPUXZZYkmypPuyn6/vRX2pfws\nIFXjq9t/0JvuLZMwP1iZQlvvy6LOymtL9L7zKCsCgYEAgEGKTdK8Ai6DX1yRe1Ug\nZ/OF3Bk3WoS38BYfVUeeBMmnHgRIBbFm0Rst0PqtfMB3wByBASttZXu5mD4vBAHV\n0+nN9obhKXBspw949d+zCc1B5YbDxe9WjluhR+aXktQO8sMW6+G/eVnSiol4vi+B\nyv/o+wonDSh+azTGe4T4GdA=\n-----END PRIVATE KEY-----\n").replace(/\\n/g, '\n'),
  client_email: process.env.FIREBASE_CLIENT_EMAIL || "firebase-adminsdk-fbsvc@warehouse-management-sys-3fdf3.iam.gserviceaccount.com",
  client_id: process.env.FIREBASE_CLIENT_ID || "101595711764550948811",
  auth_uri: "https://accounts.google.com/o/oauth2/auth",
  token_uri: "https://oauth2.googleapis.com/token",
  auth_provider_x509_cert_url: "https://www.googleapis.com/oauth2/v1/certs",
  client_x509_cert_url: "https://www.googleapis.com/robot/v1/metadata/x509/firebase-adminsdk-fbsvc%40warehouse-management-sys-3fdf3.iam.gserviceaccount.com",
  universe_domain: "googleapis.com"
};

// Initialize Firebase Admin only if it hasn't been initialized
let adminApp: App;

if (getApps().length === 0) {
  adminApp = initializeApp({
    credential: cert(serviceAccount as any),
    storageBucket: "warehouse-management-sys-3fdf3.firebasestorage.app"
  });
} else {
  adminApp = getApps()[0];
}

// Export Admin SDK services
export const adminAuth: Auth = getAuth(adminApp);
export const adminDb: Firestore = getFirestore(adminApp);
export const adminStorage: Storage = getStorage(adminApp);

export default adminApp;

