function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export const env = {
  get googleServiceAccountEmail() {
    return required("GOOGLE_SERVICE_ACCOUNT_EMAIL");
  },
  get googleServiceAccountPrivateKey() {
    return required("GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY").replace(/\\n/g, "\n");
  },
  get spreadsheetId() {
    return required("GOOGLE_SHEETS_SPREADSHEET_ID");
  },
  get authSecret() {
    return required("AUTH_SECRET");
  },
};
