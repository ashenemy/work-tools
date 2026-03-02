export function getMongoCollectionToken(collectionName: string): string {
    return `MONGO_COLLECTION:${collectionName.toUpperCase()}`;
}