import http from 'http';
import url from 'url';
import { HappyCutsBot } from './bot.js';

const happyCutsBot = new HappyCutsBot();


const server = http.createServer((req, res) => {
  const { pathname, query } = url.parse(req.url, true);
  if (pathname === '/api/bot') {
    let messageData = {};
    try {
      messageData = JSON.parse(query.data);
    }
    catch (e) {}

    // sendResponse(res, 200, messageData);
    sendResponse(res, 200, happyCutsBot.handleUserMessage('001', 'цена'));
  }
  else {
    sendResponse(res, 404);
  }
});


function sendResponse(res, status, data){
  if (status === 200) {
    res.statusCode = 200;
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(data, 0, 2));
  }
  else {
    res.statusCode = 404;
    res.setHeader('Content-Type', 'text/plain');
    res.end('Not found');
  }
}


server.listen(3000, '127.0.0.1', () => {
  console.log('Bot server running', process.argv);
});
