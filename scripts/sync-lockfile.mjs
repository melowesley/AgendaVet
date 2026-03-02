import { execSync } from 'child_process';

try {
  console.log('Removing bun.lockb to avoid conflicts...');
  try {
    execSync('rm -f /vercel/share/v0-project/bun.lockb');
  } catch(e) {
    console.log('No bun.lockb to remove');
  }
  
  console.log('Running npm install to generate fresh package-lock.json...');
  const result = execSync('cd /vercel/share/v0-project && npm install --package-lock-only', { 
    encoding: 'utf-8',
    timeout: 120000
  });
  console.log(result);
  console.log('Done! package-lock.json should now be in sync.');
} catch (error) {
  console.error('Error:', error.message);
  if (error.stdout) console.log('stdout:', error.stdout);
  if (error.stderr) console.log('stderr:', error.stderr);
}
