const appDb = process.env.MONGO_APP_DB;
const appUser = process.env.MONGO_APP_USER;
const appPassword = process.env.MONGO_APP_PASSWORD;
const appCollection = process.env.MONGO_APP_COLLECTION;

if (!appDb || !appUser || !appPassword || !appCollection) {
    throw new Error('MONGO_APP_DB, MONGO_APP_USER, MONGO_APP_PASSWORD and MONGO_APP_COLLECTION are required');
}

db = db.getSiblingDB(appDb);

db.createUser({
    user: appUser,
    pwd: appPassword,
    roles: [{ role: 'readWrite', db: appDb }],
});

db.createCollection(appCollection);
