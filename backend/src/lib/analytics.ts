import { getDb } from './mongodb.js';

/**
 * Records a page view for a blog post and returns the updated count.
 */
export async function recordPostView(slug: string): Promise<number> {
  const db = await getDb();
  const collection = db.collection('post_views');

  const result = await collection.findOneAndUpdate(
    { slug },
    {
      $inc: { views: 1 },
      $set: { lastViewedAt: new Date() },
      $setOnInsert: { createdAt: new Date() },
    },
    { upsert: true, returnDocument: 'after' }
  );

  return result?.views ?? 1;
}

/**
 * Gets the view count for a specific post.
 */
export async function getPostViews(slug: string): Promise<number> {
  const db = await getDb();
  const collection = db.collection('post_views');

  const doc = await collection.findOne({ slug });
  return doc?.views ?? 0;
}

/**
 * Gets view counts for all posts.
 */
export async function getAllPostViews(): Promise<Record<string, number>> {
  const db = await getDb();
  const collection = db.collection('post_views');

  const docs = await collection.find({}).toArray();
  const viewsMap: Record<string, number> = {};
  for (const doc of docs) {
    viewsMap[doc.slug] = doc.views;
  }
  return viewsMap;
}
