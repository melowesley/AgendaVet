import { unlinkSync } from 'fs';

try {
  unlinkSync('/vercel/share/v0-project/package-lock.json');
  console.log('package-lock.json deleted successfully');
} catch (e) {
  console.log('Error:', e.message);
}
