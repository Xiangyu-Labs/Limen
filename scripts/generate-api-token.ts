import { generateApiToken } from '../src/lib/auth/security';

const { token, hash } = generateApiToken();
console.log('Store the raw token in the API client; it will not be shown again by the server.');
console.log(`API_TOKEN=${token}`);
console.log(`API_TOKEN_HASH=${hash}`);
