const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');

// Delete existing lockfiles and node_modules
const toDelete = ['package-lock.json', 'bun.lockb', 'node_modules'];
for (const item of toDelete) {
  const p = path.join(root, item);
  if (fs.existsSync(p)) {
    fs.rmSync(p, { recursive: true, force: true });
    console.log(`Deleted ${item}`);
  }
}

// Run npm install to generate fresh lockfile with ALL dependencies
try {
  execSync('npm install', { cwd: root, stdio: 'inherit' });
  console.log('npm install completed successfully');
} catch (e) {
  console.error('npm install failed:', e.message);
}

// Verify the lockfile includes express
const lockfile = path.join(root, 'package-lock.json');
if (fs.existsSync(lockfile)) {
  const content = fs.readFileSync(lockfile, 'utf8');
  const hasExpress = content.includes('"express"');
  const hasAxios = content.includes('"axios"');
  const hasDotenv = content.includes('"dotenv"');
  console.log(`Lockfile has express: ${hasExpress}`);
  console.log(`Lockfile has axios: ${hasAxios}`);
  console.log(`Lockfile has dotenv: ${hasDotenv}`);
} else {
  console.error('package-lock.json was NOT generated!');
}
