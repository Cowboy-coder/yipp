import createHTTPClient, { UserType } from './generated';

(async () => {
  const api = createHTTPClient({
    baseURL: 'http://localhost:3000/',
  });

  try {
    const start = new Date().getTime();
    console.log('health', (await api.health()).data);
    const login = (
      await api.login({
        body: {
          username: 'admin',
          password: 'password',
        },
      })
    ).data;
    console.log('login', login);
    console.log('Users.getUser', (await api.Users.getUser(1)).data);
    console.log(
      'updateUser',
      (
        await api.Users.updateUser(1, {
          headers: {
            authorization: `Bearer ${login.token}`,
          },
          body: {
            username: 'changed-to-f',
            age: 99,
            isCool: undefined,
          },
        })
      ).data,
    );
    console.log(
      'Users.getUsers',
      (
        await api.Users.getUsers({
          headers: {
            authorization: `Bearer ${login.token}`,
          },
          query: {
            q: 'username_8',
          },
        })
      ).data,
    );
    console.log(
      'Users.createUser',
      (
        await api.Users.createUser({
          headers: {
            authorization: `Bearer ${login.token}`,
          },
          body: {
            username: 'Test!',
            age: 99,
            type: UserType.user,
            isCool: false,
          },
        })
      ).data,
    );
    console.log('getFeed', (await api.getFeed()).data);
    console.log('logout', (await api.logout()).data);
    console.log('completed in', new Date().getTime() - start, 'ms');
  } catch (err) {
    console.log(err);
  }
})();
