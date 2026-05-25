import { simpleGit } from 'simple-git';
import path from 'path';
import fs from 'fs';
import os from 'os';
export async function commitAndPush(slug, message) {
    const token = process.env.GITHUB_TOKEN;
    const repoUrl = process.env.GITHUB_REPO_URL;
    const userName = process.env.GIT_USER_NAME || 'CMS Bot';
    const userEmail = process.env.GIT_USER_EMAIL || 'cms-bot@example.com';
    if (!token || !repoUrl) {
        console.warn('Skipping git workflow: GITHUB_TOKEN or GITHUB_REPO_URL environment variables are not set.');
        return;
    }
    let authenticatedUrl = repoUrl;
    if (repoUrl.startsWith('https://')) {
        authenticatedUrl = repoUrl.replace('https://', `https://x-access-token:${token}@`);
    }
    else {
        authenticatedUrl = `https://x-access-token:${token}@github.com/${repoUrl}.git`;
    }
    // Determine working directory: move up from backend/ to repo root
    let workingDir = path.join(process.cwd(), '..');
    // If no parent .git exists but backend .git exists, use process.cwd()
    if (!fs.existsSync(path.join(workingDir, '.git')) && fs.existsSync(path.join(process.cwd(), '.git'))) {
        workingDir = process.cwd();
    }
    const useTempClone = process.env.USE_TEMP_CLONE === 'true';
    if (useTempClone) {
        const tempDir = path.join(os.tmpdir(), 'my-blog-clone');
        console.log(`Cloning repository to writeable temp space: ${tempDir}`);
        if (fs.existsSync(tempDir)) {
            try {
                fs.rmSync(tempDir, { recursive: true, force: true });
            }
            catch (rmErr) {
                console.warn('Could not clean up temp clone directory:', rmErr);
            }
        }
        const baseGit = simpleGit();
        await baseGit.clone(authenticatedUrl, tempDir);
        // Sync content/posts from current runtime folder to cloned folder
        const srcPostsDir = path.join(process.cwd(), 'content', 'posts');
        const destPostsDir = path.join(tempDir, 'backend', 'content', 'posts');
        if (fs.existsSync(srcPostsDir)) {
            if (!fs.existsSync(destPostsDir)) {
                fs.mkdirSync(destPostsDir, { recursive: true });
            }
            const files = fs.readdirSync(srcPostsDir);
            for (const file of files) {
                fs.copyFileSync(path.join(srcPostsDir, file), path.join(destPostsDir, file));
            }
        }
        workingDir = tempDir;
    }
    const git = simpleGit(workingDir);
    await git.addConfig('user.name', userName);
    await git.addConfig('user.email', userEmail);
    // Stage changes: we want to stage backend/content/posts/* and backend/public/images/posts/*
    const filesToStage = [];
    const relativeExists = (relPath) => fs.existsSync(path.join(workingDir, relPath));
    if (relativeExists('backend/content/posts')) {
        filesToStage.push('backend/content/posts/*');
    }
    else if (relativeExists('content/posts')) {
        filesToStage.push('content/posts/*');
    }
    const backendImgDir = 'backend/public/images/posts';
    const rootImgDir = 'public/images/posts';
    if (relativeExists(backendImgDir)) {
        try {
            if (fs.readdirSync(path.join(workingDir, backendImgDir)).length > 0) {
                filesToStage.push('backend/public/images/posts/*');
            }
        }
        catch { }
    }
    else if (relativeExists(rootImgDir)) {
        try {
            if (fs.readdirSync(path.join(workingDir, rootImgDir)).length > 0) {
                filesToStage.push('public/images/posts/*');
            }
        }
        catch { }
    }
    if (filesToStage.length === 0) {
        console.log('No files matching git stage patterns.');
        return;
    }
    await git.add(filesToStage);
    const status = await git.status();
    if (status.files.length === 0) {
        console.log('No local post changes detected to commit.');
        return;
    }
    await git.commit(message);
    const branchResult = await git.branch();
    const currentBranch = branchResult.current || 'main';
    await git.push(authenticatedUrl, currentBranch);
    console.log(`Successfully committed and pushed changes for slug: ${slug} on branch ${currentBranch}`);
}
