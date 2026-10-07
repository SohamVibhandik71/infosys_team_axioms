import { registerUser, loginUser } from '../src/services/authService.js';

async function testAuth() {
  console.log('Testing user registration...');
  const regResult = await registerUser({
    name: 'Alex Vance',
    email: 'alex@example.com',
    password: 'password123'
  });
  console.log('Registration success! User ID:', regResult.user.id);
  console.log('Token generated:', !!regResult.token);

  console.log('Testing user login...');
  const loginResult = await loginUser({
    email: 'alex@example.com',
    password: 'password123'
  });
  console.log('Login success! User:', loginResult.user.name);
  console.log('Token generated:', !!loginResult.token);
}

testAuth().catch(err => {
  console.error('Auth test failed:', err);
  process.exit(1);
});
