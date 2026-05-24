const wait = (ms = 350) => new Promise((resolve) => setTimeout(resolve, ms));

export async function loginUser({ email, password }) {
  await wait();

  if (!email || !password) {
    throw new Error('Email and password are required.');
  }

  return {
    token: 'mock-jwt-token',
    user: {
      id: 'u-1001',
      username: 'acecaptain',
      email,
      gamerTag: 'AceCaptain',
      role: 'player',
    },
  };
}

export async function registerUser(payload) {
  await wait();

  const { username, email, password, gamerTag } = payload;

  if (!username || !email || !password || !gamerTag) {
    throw new Error('All registration fields are required.');
  }

  return {
    id: 'u-1002',
    username,
    email,
    gamerTag,
    role: 'player',
  };
}
