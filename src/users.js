const TEST_USER = {
  username: 'testuser',
  password: 'test-password',
};

function validateCredentials(username, password) {
  return username === TEST_USER.username && password === TEST_USER.password;
}

module.exports = { validateCredentials };
