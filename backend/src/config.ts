const mongoUri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB_NAME || 'Salon';
const port = Number(process.env.API_PORT || 4000);
const jwtSecret = process.env.JWT_SECRET;

if (!mongoUri) {
  throw new Error('Missing MONGODB_URI in environment.');
}

if (!jwtSecret) {
  throw new Error('Missing JWT_SECRET in environment.');
}

export const config = {
  mongoUri,
  dbName,
  port,
  jwtSecret,
};
