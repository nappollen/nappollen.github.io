#!/usr/bin/env node
/**
 * Build VPM index.json from GitHub releases
 * No dependencies - uses native fetch
 */

import { readFileSync, writeFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { createHash } from 'crypto';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');

// Read source.json config
const source = JSON.parse(readFileSync(join(ROOT, 'source.json'), 'utf-8'));
const vpmConfig = source.vpm;

/**
 * Fetch all releases from a GitHub repo
 */
async function fetchReleases(repo) {
  const url = `https://api.github.com/repos/${repo}/releases`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VPM-Builder'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`Failed to fetch releases for ${repo}: ${res.status}`);
    return [];
  }
  return res.json();
}

/**
 * Fetch repository info from GitHub
 */
async function fetchRepoInfo(repo) {
  const url = `https://api.github.com/repos/${repo}`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VPM-Builder'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.warn(`Failed to fetch repo info for ${repo}: ${res.status}`);
    return null;
  }
  return res.json();
}

/**
 * Fetch languages from GitHub repo
 */
async function fetchLanguages(repo) {
  const url = `https://api.github.com/repos/${repo}/languages`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VPM-Builder'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) return {};
  return res.json();
}

/**
 * Fetch contributors from GitHub repo
 */
async function fetchContributors(repo) {
  const url = `https://api.github.com/repos/${repo}/contributors?per_page=10`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VPM-Builder'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  return data.map(c => ({
    login: c.login,
    avatar_url: c.avatar_url,
    url: c.html_url,
    contributions: c.contributions
  }));
}

/**
 * Fetch commit activity from GitHub repo (last 52 weeks)
 */
async function fetchCommitActivity(repo) {
  const url = `https://api.github.com/repos/${repo}/stats/commit_activity`;
  const headers = {
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'VPM-Builder'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(url, { headers });
  if (!res.ok) return [];
  const data = await res.json();
  // Return array of { week: timestamp, total: commits }
  if (!Array.isArray(data)) return [];
  return data.map(w => ({
    week: w.week,
    total: w.total
  }));
}

/**
 * Calculate multiple hashes of a zip file from URL
 */
async function calculateZipHashes(url) {
  const headers = {
    'User-Agent': 'VPM-Builder'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  try {
    const res = await fetch(url, { headers });
    if (!res.ok) return null;
    
    const buffer = Buffer.from(await res.arrayBuffer());
    
    return {
      md5: createHash('md5').update(buffer).digest('hex'),
      sha1: createHash('sha1').update(buffer).digest('hex'),
      sha256: createHash('sha256').update(buffer).digest('hex'),
      sha512: createHash('sha512').update(buffer).digest('hex')
    };
  } catch {
    return null;
  }
}

/**
 * Find package.json asset in a release
 */
function findPackageJson(release) {
  return release.assets?.find(a => a.name === 'package.json');
}

/**
 * Find zip asset in a release
 */
function findZipAsset(release) {
  return release.assets?.find(a => a.name.endsWith('.zip'));
}

/**
 * Fetch package.json content from release asset
 */
async function fetchPackageJson(asset) {
  const headers = {
    'Accept': 'application/octet-stream',
    'User-Agent': 'VPM-Builder'
  };
  
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `token ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(asset.url, { headers });
  if (!res.ok) return null;
  
  const text = await res.text();
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/**
 * Build packages object from GitHub repos
 */
async function buildPackages() {
  const packages = {};
  const repos = vpmConfig.githubRepos || [];

  for (const repo of repos) {
    console.log(`Processing ${repo}...`);
    
    // Fetch repo info, releases, languages, contributors, and commit activity in parallel
    const [repoInfo, releases, languages, contributors, commitActivity] = await Promise.all([
      fetchRepoInfo(repo),
      fetchReleases(repo),
      fetchLanguages(repo),
      fetchContributors(repo),
      fetchCommitActivity(repo)
    ]);

    let currentPackageName = null;

    for (const release of releases) {
      if (release.draft || release.prerelease) continue;

      const packageJsonAsset = findPackageJson(release);
      const zipAsset = findZipAsset(release);

      if (!zipAsset) {
        console.log(`  Skipping ${release.tag_name}: no zip asset`);
        continue;
      }

      let packageData;
      
      if (packageJsonAsset) {
        // Fetch package.json from release assets
        packageData = await fetchPackageJson(packageJsonAsset);
      }

      if (!packageData) {
        // Fallback: create minimal package data from release info
        const version = release.tag_name.replace(/^v/, '');
        packageData = {
          name: `com.${repo.replace('/', '.')}`,
          displayName: repo.split('/')[1],
          version: version,
          description: release.body?.split('\n')[0] || '',
        };
      }

      const packageName = packageData.name;
      const version = packageData.version;

      if (!packageName || !version) {
        console.log(`  Skipping ${release.tag_name}: invalid package data`);
        continue;
      }

      currentPackageName = packageName;

      // Initialize package entry with GitHub info
      if (!packages[packageName]) {
        packages[packageName] = { 
          versions: {} 
        };
      }

      // Calculate hashes of zip file
      const hashes = await calculateZipHashes(zipAsset.browser_download_url);

      // Add version entry
      packages[packageName].versions[version] = {
        ...packageData,
        url: zipAsset.browser_download_url,
        ...(hashes && { 
          zipSHA256: hashes.sha256,
          hash: hashes 
        })
      };

      console.log(`  Added ${packageName}@${version}${hashes ? ' (hashed)' : ''}`);
    }

    // Add GitHub repo info to package level
    if (currentPackageName && packages[currentPackageName] && repoInfo) {
      const baseUrl = repoInfo.html_url;
      const branch = repoInfo.default_branch;
      
      // Build URLs for common files
      const readmeUrl = `${baseUrl}/blob/${branch}/README.md`;
      const licenseUrl = repoInfo.license ? `${baseUrl}/blob/${branch}/LICENSE` : null;
      const changelogUrl = `${baseUrl}/blob/${branch}/CHANGELOG.md`;
      
      packages[currentPackageName] = {
        owner: {
          login: repoInfo.owner?.login,
          avatar_url: repoInfo.owner?.avatar_url,
          url: repoInfo.owner?.html_url
        },
        name: repoInfo.name,
        full_name: repoInfo.full_name,
        description: repoInfo.description,
        url: repoInfo.html_url,
        clone_url: repoInfo.clone_url,
        language: repoInfo.language,
        languages: languages,
        size: repoInfo.size,
        stars: repoInfo.stargazers_count,
        watchers: repoInfo.watchers_count,
        forks: repoInfo.forks_count,
        open_issues: repoInfo.open_issues_count,
        license: repoInfo.license?.spdx_id,
        license_url: licenseUrl,
        readme_url: readmeUrl,
        changelog_url: changelogUrl,
        topics: repoInfo.topics,
        default_branch: branch,
        archived: repoInfo.archived,
        disabled: repoInfo.disabled,
        has_issues: repoInfo.has_issues,
        has_wiki: repoInfo.has_wiki,
        has_discussions: repoInfo.has_discussions,
        contributors: contributors,
        commit_activity: commitActivity,
        created_at: repoInfo.created_at ? Math.floor(new Date(repoInfo.created_at).getTime() / 1000) : null,
        updated_at: repoInfo.updated_at ? Math.floor(new Date(repoInfo.updated_at).getTime() / 1000) : null,
        pushed_at: repoInfo.pushed_at ? Math.floor(new Date(repoInfo.pushed_at).getTime() / 1000) : null,
        ...packages[currentPackageName]
      };
    }
  }

  return packages;
}

/**
 * Main build function
 */
async function build() {
  console.log('Building VPM index.json...\n');

  const packages = await buildPackages();

  const index = {
    name: vpmConfig.name,
    id: vpmConfig.id,
    url: vpmConfig.url,
    author: vpmConfig.author,
    packages
  };

  // Output directory
  const outDir = join(ROOT, 'out');
  mkdirSync(outDir, { recursive: true });

  // Write vpm.json
  const outputPath = join(outDir, 'vpm.json');
  writeFileSync(outputPath, JSON.stringify(index, null, 2));
  
  console.log(`\nGenerated ${outputPath}`);
  console.log(`Total packages: ${Object.keys(packages).length}`);
  
  // Count total versions
  const totalVersions = Object.values(packages).reduce(
    (sum, pkg) => sum + Object.keys(pkg.versions).length, 0
  );
  console.log(`Total versions: ${totalVersions}`);
}

build().catch(err => {
  console.error('Build failed:', err);
  process.exit(1);
});
