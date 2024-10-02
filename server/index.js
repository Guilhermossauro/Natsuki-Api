const jsonServer = require('json-server');
const path = require('path');
const server = jsonServer.create();
const router = jsonServer.router('db.json');
const middlewares = jsonServer.defaults();
const port = 3300;
const host = 'localhost'; // Define o host como 'localhost'

server.use(middlewares);

server.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

server.use(router);

server.listen(port, host, () => {
  console.log(`JSON Server is running on http://${host}:${port}`);
});
