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
        ...(hashes && { zipSHA256: hashes.sha256 })
      };

      console.log(`  Added ${packageName}@${version}${hashes ? ' (hashed)' : ''}`);
    }

    // Store GitHub repo info separately (not in VPM format)
    // The VPM format only expects { versions: { ... } } for each package
  }

  return packages;
}

/**
 * Main build function
 */
async function build() {
  console.log('Building VPM index.json...\n');

  const packages = await buildPackages();
  
  // Create VPM-compliant format (only versions, no extra metadata)
  const vpmPackages = {};
  for (const [name, pkg] of Object.entries(packages)) {
    vpmPackages[name] = {
      versions: pkg.versions
    };
  }

  const index = {
    name: vpmConfig.name,
    id: vpmConfig.id,
    url: vpmConfig.url,
    author: vpmConfig.author?.name || vpmConfig.author,
    packages: vpmPackages
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
