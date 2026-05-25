import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import matter from 'gray-matter';
import multer from 'multer';
import { simpleGit } from 'simple-git';
import { getAllPosts, getPostBySlug, getAllTags } from './lib/posts.js';
import { recordPostView, getPostViews, getAllPostViews } from './lib/analytics.js';
import { commitAndPush } from './lib/git.js';
const app = express();
const PORT = process.env.PORT || 3001;
// Middlewares
app.use(cors({
    origin: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
// Serve uploads static directory
app.use(express.static(path.join(process.cwd(), 'public')));
// Create folders if missing
const postsDir = path.join(process.cwd(), 'content', 'posts');
const imagesDir = path.join(process.cwd(), 'public', 'images', 'posts');
const configPath = path.join(process.cwd(), 'content', 'config.json');
if (!fs.existsSync(postsDir))
    fs.mkdirSync(postsDir, { recursive: true });
if (!fs.existsSync(imagesDir))
    fs.mkdirSync(imagesDir, { recursive: true });
if (!fs.existsSync(path.dirname(configPath)))
    fs.mkdirSync(path.dirname(configPath), { recursive: true });
// Shared API key protection
const authenticateKey = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const apiKey = process.env.BACKEND_API_KEY;
    if (!apiKey) {
        console.error('BACKEND_API_KEY environment variable is missing on the server!');
        return res.status(500).json({ error: 'Server authentication misconfigured.' });
    }
    if (authHeader && authHeader.startsWith('Bearer ') && authHeader.split(' ')[1] === apiKey) {
        return next();
    }
    return res.status(401).json({ error: 'Unauthorized key access' });
};
// --- Posts API Routes ---
// GET: All posts
app.get('/api/posts', (req, res) => {
    const includeDrafts = req.query.includeDrafts === 'true';
    if (includeDrafts) {
        // Authenticate drafts requests
        const authHeader = req.headers['authorization'];
        const apiKey = process.env.BACKEND_API_KEY;
        if (!authHeader || !apiKey || authHeader.split(' ')[1] !== apiKey) {
            return res.status(401).json({ error: 'Unauthorized to view drafts' });
        }
    }
    const posts = getAllPosts(includeDrafts);
    res.json(posts);
});
// GET: Tags list
app.get('/api/tags', (req, res) => {
    const tags = getAllTags();
    res.json(tags);
});
// GET: Single post by slug
app.get('/api/posts/:slug', (req, res) => {
    const { slug } = req.params;
    const post = getPostBySlug(slug);
    if (!post) {
        return res.status(404).json({ error: 'Post not found' });
    }
    res.json(post);
});
// POST: Save/create post (authed)
app.post('/api/posts', authenticateKey, (req, res) => {
    try {
        const { slug: existingSlug, title, tags, summary, draft, content, date: customDate } = req.body;
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }
        const slug = existingSlug || title
            .toLowerCase()
            .trim()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const date = customDate || new Date().toISOString().split('T')[0];
        const fileContents = matter.stringify(content || '', {
            title,
            date,
            tags: tags || [],
            draft: draft === undefined ? true : draft,
            summary: summary || '',
        });
        const filePath = path.join(postsDir, `${slug}.mdx`);
        if (existingSlug && existingSlug !== slug) {
            const oldFilePath = path.join(postsDir, `${existingSlug}.mdx`);
            if (fs.existsSync(oldFilePath)) {
                fs.unlinkSync(oldFilePath);
            }
        }
        fs.writeFileSync(filePath, fileContents, 'utf8');
        // Sync changes to GitHub
        commitAndPush(slug, `CMS: Saved post "${title}"`)
            .then(() => console.log(`Git workflow success for ${slug}`))
            .catch((err) => console.error(`Git workflow error for ${slug}:`, err));
        res.json({ success: true, slug });
    }
    catch (error) {
        console.error('Error saving post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// DELETE: Remove post (authed)
app.delete('/api/posts/:slug', authenticateKey, (req, res) => {
    const { slug } = req.params;
    const filePath = path.join(postsDir, `${slug}.mdx`);
    if (!fs.existsSync(filePath)) {
        return res.status(404).json({ error: 'Post not found' });
    }
    try {
        fs.unlinkSync(filePath);
        // Sync deletions to GitHub
        commitAndPush(slug, `CMS: Deleted post "${slug}"`)
            .then(() => console.log(`Git delete sync success for ${slug}`))
            .catch((err) => console.error(`Git delete sync error for ${slug}:`, err));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// PATCH: Toggle draft (authed)
app.patch('/api/posts/toggle-draft', authenticateKey, (req, res) => {
    try {
        const { slug } = req.body;
        if (!slug) {
            return res.status(400).json({ error: 'Slug is required' });
        }
        const filePath = path.join(postsDir, `${slug}.mdx`);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'Post not found' });
        }
        const fileContent = fs.readFileSync(filePath, 'utf8');
        const parsed = matter(fileContent);
        const newDraftValue = !parsed.data.draft;
        parsed.data.draft = newDraftValue;
        const newContent = matter.stringify(parsed.content, parsed.data);
        fs.writeFileSync(filePath, newContent, 'utf8');
        commitAndPush(slug, `CMS: Toggled draft for "${slug}" to ${newDraftValue}`)
            .then(() => console.log(`Git draft toggle success for ${slug}`))
            .catch((err) => console.error(`Git draft toggle error for ${slug}:`, err));
        res.json({ success: true, draft: newDraftValue });
    }
    catch (error) {
        console.error('Error toggling draft:', error);
        res.status(500).json({ error: 'Failed to toggle draft status' });
    }
});
// --- Upload API Route (authed) ---
const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});
app.post('/api/upload', authenticateKey, upload.single('file'), (req, res) => {
    try {
        const file = req.file;
        if (!file) {
            return res.status(400).json({ error: 'No file provided' });
        }
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml'];
        if (!allowedTypes.includes(file.mimetype)) {
            return res.status(400).json({ error: 'Invalid file type. Only standard images allowed.' });
        }
        const ext = path.extname(file.originalname);
        const baseName = path.basename(file.originalname, ext)
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/(^-|-$)/g, '');
        const uniqueName = `${baseName}-${Date.now()}${ext}`;
        const filePath = path.join(imagesDir, uniqueName);
        fs.writeFileSync(filePath, file.buffer);
        // Sync asset to GitHub
        commitAndPush(uniqueName, `CMS: Uploaded asset "${uniqueName}"`)
            .then(() => console.log(`Git asset sync success for ${uniqueName}`))
            .catch((err) => console.error(`Git asset sync error for ${uniqueName}:`, err));
        res.json({
            success: true,
            url: `/images/posts/${uniqueName}`
        });
    }
    catch (error) {
        console.error('Error uploading file:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});
// --- Views API Routes (public) ---
// GET: All view statistics
app.get('/api/views', async (req, res) => {
    try {
        const views = await getAllPostViews();
        res.json(views);
    }
    catch (error) {
        console.error('Views fetch error:', error);
        res.status(500).json({ error: 'Database views fetch error.' });
    }
});
// GET: Single view count
app.get('/api/views/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const views = await getPostViews(slug);
        res.json({ views });
    }
    catch (error) {
        console.error('Single view fetch error:', error);
        res.status(500).json({ error: 'Database view fetch error.' });
    }
});
// POST: Increment views
app.post('/api/views/:slug', async (req, res) => {
    try {
        const { slug } = req.params;
        const views = await recordPostView(slug);
        res.json({ views });
    }
    catch (error) {
        console.error('Views record error:', error);
        res.status(500).json({ error: 'Database view count increment failed.' });
    }
});
// --- Deploy & Git logs ---
app.get('/api/deploys', authenticateKey, async (req, res) => {
    try {
        let workingDir = path.join(process.cwd(), '..');
        if (!fs.existsSync(path.join(workingDir, '.git')) && fs.existsSync(path.join(process.cwd(), '.git'))) {
            workingDir = process.cwd();
        }
        const git = simpleGit(workingDir);
        const logs = await git.log({ maxCount: 20 });
        res.json(logs.all);
    }
    catch (error) {
        console.error('Error fetching git log:', error);
        res.status(500).json({ error: 'Failed to retrieve deploy logs: ' + error.message });
    }
});
app.get('/api/git/status', authenticateKey, async (req, res) => {
    try {
        let workingDir = path.join(process.cwd(), '..');
        if (!fs.existsSync(path.join(workingDir, '.git')) && fs.existsSync(path.join(process.cwd(), '.git'))) {
            workingDir = process.cwd();
        }
        const git = simpleGit(workingDir);
        const status = await git.status();
        const isConnected = !!process.env.GITHUB_REPO_URL && !!process.env.GITHUB_TOKEN;
        res.json({
            connected: isConnected,
            status: status,
            repoUrl: process.env.GITHUB_REPO_URL || 'Not Configured',
            lastPush: new Date().toISOString()
        });
    }
    catch (error) {
        console.error('Git status error:', error);
        res.status(500).json({ error: 'Failed to check git status: ' + error.message });
    }
});
app.post('/api/deploy/trigger', authenticateKey, async (req, res) => {
    try {
        await commitAndPush('manual-rebuild', 'CMS: Rebuild triggered manually');
        res.json({ success: true });
    }
    catch (error) {
        console.error('Deploy trigger error:', error);
        res.status(500).json({ error: 'Failed to trigger manual deploy: ' + error.message });
    }
});
// --- Settings config ---
app.get('/api/settings', authenticateKey, (req, res) => {
    try {
        if (fs.existsSync(configPath)) {
            const config = fs.readFileSync(configPath, 'utf8');
            res.json(JSON.parse(config));
        }
        else {
            res.json({
                blogName: 'DevBlog',
                blogDescription: 'The Developer Blog',
                authorName: 'Navaneth',
                siteUrl: 'http://localhost:3000',
                socialLinks: { github: '', twitter: '' }
            });
        }
    }
    catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to load settings' });
    }
});
app.post('/api/settings/save', authenticateKey, (req, res) => {
    try {
        const config = req.body;
        fs.writeFileSync(configPath, JSON.stringify(config, null, 2), 'utf8');
        // Also commit config file to git
        commitAndPush('config', 'CMS: Updated settings configuration')
            .then(() => console.log('Git settings sync success'))
            .catch((err) => console.error('Git settings sync error:', err));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});
// --- Tags Management ---
app.post('/api/tags/rename', authenticateKey, (req, res) => {
    try {
        const { oldTag, newTag } = req.body;
        if (!oldTag || !newTag) {
            return res.status(400).json({ error: 'oldTag and newTag are required' });
        }
        const files = fs.readdirSync(postsDir);
        let modifiedCount = 0;
        for (const file of files) {
            if (file.endsWith('.mdx') || file.endsWith('.md')) {
                const filePath = path.join(postsDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const parsed = matter(fileContent);
                let tags = parsed.data.tags || [];
                if (tags.includes(oldTag)) {
                    tags = tags.map(t => t === oldTag ? newTag : t);
                    parsed.data.tags = tags;
                    const newContent = matter.stringify(parsed.content, parsed.data);
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    modifiedCount++;
                }
            }
        }
        if (modifiedCount > 0) {
            commitAndPush('tags', `CMS: Renamed tag "${oldTag}" to "${newTag}" in ${modifiedCount} posts`)
                .then(() => console.log(`Git rename tag success`))
                .catch((err) => console.error(`Git rename tag error:`, err));
        }
        res.json({ success: true, modifiedCount });
    }
    catch (error) {
        console.error('Error renaming tag:', error);
        res.status(500).json({ error: 'Failed to rename tag' });
    }
});
app.post('/api/tags/merge', authenticateKey, (req, res) => {
    try {
        const { oldTag, targetTag } = req.body;
        if (!oldTag || !targetTag) {
            return res.status(400).json({ error: 'oldTag and targetTag are required' });
        }
        const files = fs.readdirSync(postsDir);
        let modifiedCount = 0;
        for (const file of files) {
            if (file.endsWith('.mdx') || file.endsWith('.md')) {
                const filePath = path.join(postsDir, file);
                const fileContent = fs.readFileSync(filePath, 'utf8');
                const parsed = matter(fileContent);
                let tags = parsed.data.tags || [];
                if (tags.includes(oldTag)) {
                    tags = tags.filter(t => t !== oldTag);
                    if (!tags.includes(targetTag)) {
                        tags.push(targetTag);
                    }
                    parsed.data.tags = tags;
                    const newContent = matter.stringify(parsed.content, parsed.data);
                    fs.writeFileSync(filePath, newContent, 'utf8');
                    modifiedCount++;
                }
            }
        }
        if (modifiedCount > 0) {
            commitAndPush('tags', `CMS: Merged tag "${oldTag}" into "${targetTag}" in ${modifiedCount} posts`)
                .then(() => console.log(`Git merge tag success`))
                .catch((err) => console.error(`Git merge tag error:`, err));
        }
        res.json({ success: true, modifiedCount });
    }
    catch (error) {
        console.error('Error merging tags:', error);
        res.status(500).json({ error: 'Failed to merge tags' });
    }
});
// --- Media directory size count ---
app.get('/api/media/stats', authenticateKey, (req, res) => {
    try {
        const files = fs.readdirSync(imagesDir);
        let totalSize = 0;
        const mediaFiles = files.map((file) => {
            const stats = fs.statSync(path.join(imagesDir, file));
            totalSize += stats.size;
            return {
                name: file,
                size: stats.size,
                date: stats.mtime
            };
        });
        res.json({
            files: mediaFiles,
            totalSizeBytes: totalSize,
            formattedTotalSize: `${(totalSize / (1024 * 1024)).toFixed(2)} MB`,
            limitBytes: 50 * 1024 * 1024 // 50MB storage gauge
        });
    }
    catch (error) {
        console.error('Error reading media stats:', error);
        res.status(500).json({ error: 'Failed to read media storage.' });
    }
});
app.delete('/api/media/:filename', authenticateKey, (req, res) => {
    try {
        const { filename } = req.params;
        const filePath = path.join(imagesDir, filename);
        if (!fs.existsSync(filePath)) {
            return res.status(404).json({ error: 'File not found' });
        }
        fs.unlinkSync(filePath);
        commitAndPush(filename, `CMS: Deleted asset "${filename}"`)
            .then(() => console.log(`Git asset delete success for ${filename}`))
            .catch((err) => console.error(`Git asset delete error for ${filename}:`, err));
        res.json({ success: true });
    }
    catch (error) {
        console.error('Error deleting media file:', error);
        res.status(500).json({ error: 'Failed to delete media.' });
    }
});
// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'healthy', timestamp: new Date() });
});
app.listen(PORT, () => {
    console.log(`Backend API Server running at http://localhost:${PORT}`);
});
