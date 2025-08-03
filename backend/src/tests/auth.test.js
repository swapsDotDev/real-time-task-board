import request from 'supertest';
import jwt from 'jsonwebtoken';
import User from '../models/User.js';
import Task from '../models/Task.js';

// This is a basic test file for the auth endpoint
// To run: npm test

describe('Authentication Endpoints', () => {
  let testUser;
  let authToken;

  beforeAll(async () => {
    // Create a test user
    testUser = new User({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPass123',
      role: 'member'
    });
    await testUser.save();
    
    // Generate auth token for testing
    authToken = jwt.sign(
      { userId: testUser._id },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
  });

  afterAll(async () => {
    // Clean up test data
    await User.findByIdAndDelete(testUser._id);
  });

  test('POST /api/auth/register should create a new user', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'New User',
        email: 'newuser@example.com',
        password: 'NewPass123'
      });

    expect(response.status).toBe(201);
    expect(response.body.message).toBe('User registered successfully');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('newuser@example.com');
    
    // Clean up
    await User.findOneAndDelete({ email: 'newuser@example.com' });
  });

  test('POST /api/auth/login should authenticate user', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'test@example.com',
        password: 'TestPass123'
      });

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Login successful');
    expect(response.body.token).toBeDefined();
    expect(response.body.user.email).toBe('test@example.com');
  });

  test('GET /api/auth/me should return user profile', async () => {
    const response = await request(app)
      .get('/api/auth/me')
      .set('Authorization', `Bearer ${authToken}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('test@example.com');
  });
});
