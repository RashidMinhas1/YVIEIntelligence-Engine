const url = 'http://localhost:3001/api/auth/login';
fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ password: 'RASHIDMINHAS' })
}).then(async res => {
  console.log(res.status);
  console.log(res.headers.get('set-cookie'));
  console.log(await res.text());
}).catch(console.error);
