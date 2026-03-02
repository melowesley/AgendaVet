import { execSync } from 'child_process';
import { unlinkSync, existsSync } from 'fs';
import { join } from 'path';

const root = join(process.cwd());

// Remove bun.lockb so npm becomes the package manager
const bunLock = join(root, 'bun.lockb');
if (existsSync(bunLock)) {
  unlinkSync(bunLock);
  console.log('Deleted bun.lockb');
}

// Remove node_modules to start fresh
try {
  execSync('rm -rf node_modules', { cwd: root, stdio: 'inherit' });
  console.log('Deleted node_modules');
} catch (e) {
  console.log('No node_modules to delete');
}

// Generate a fresh package-lock.json
try {
  execSync('npm install --package-lock-only --legacy-peer-deps', { cwd: root, stdio: 'inherit' });
  console.log('Generated package-lock.json successfully');
} catch (e) {
  console.error('Failed to generate lockfile:', e.message);
}
