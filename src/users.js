function validateCredentials(username, password) {
  const testUsername = process.env.TEST_USER_USERNAME;
  const testPassword = process.env.TEST_USER_PASSWORD;

  return (
    Boolean(testUsername && testPassword) &&
    username === testUsername &&
    password === testPassword
  );
}

module.exports = { validateCredentials };
