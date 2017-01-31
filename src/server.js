import 'babel-polyfill';
import express from 'express';
import expressSession from 'express-session';
import http from 'http';
import morgan from 'morgan';
import passport from 'passport';
import { Strategy as TwitterStrategy } from 'passport-twitter';
import process from 'process';
import Twitter from 'twitter';
import { Server as WebSocketServer } from 'ws';

const app = express();
const server = http.createServer(app);
const sessionParser = expressSession({
  resave: true,
  saveUninitialized: true,
  secret: 'test',
});
const twitterStrategy = new TwitterStrategy(
  {
    callbackURL: 'http://localhost:8080/auth/twitter/callback',
    consumerKey: process.env.TWITTER_CONSUMER_KEY,
    consumerSecret: process.env.TWITTER_CONSUMER_SECRET,
  },
  (token, tokenSecret, profile, done) => {
    passport.session.id = profile.id;
    Object.assign(profile, { token, token_secret: tokenSecret });
    setImmediate(() => done(null, profile));
  },
);

passport.serializeUser((user, done) => done(null, user));
passport.deserializeUser((user, done) => done(null, user));
passport.use(twitterStrategy);

app.set('trust proxy');
app.use(morgan('combined'));
app.use(passport.initialize());
app.use(passport.session());
app.use(sessionParser);

app.get('/', (req, res) => {
  res.send(`<!doctype html>
<title>login</title>
<style>
[aria-hidden]:not([aria-hidden=false]) {
  display: none;
}
</style>
<p aria-hidden>
  <a href=/auth/twitter role=button>Login</a>
</p>
<ul id=tweets>
</ul>
<template id=tweet-template>
  <li class=tweet>
    <a href="">@<span class=user-name></span></a>
    <span class=text></span>
  </li>
</template>
<script>
(() => {
  class TweetReceiver {
    constructor(successCallback = (() => {}), failureCallback = (() => {})) {
      this.successCallback = successCallback;
      this.failureCallback = failureCallback;
      const socket = new WebSocket('ws://localhost:8080/');
      socket.addEventListener('error', this);
      socket.addEventListener('message', this);
      socket.addEventListener('close', this);
    }

    handleEvent(event) {
      const { type } = event;
      const methodName = \`handle\${type[0].toUpperCase()}\${type.slice(1)}\`;
      return (this[methodName] || (() => {})).call(this, event);
    }

    handleError(event) {
      this.failureCallback(event);
    }

    handleMessage({ data }) {
      const response = JSON.parse(data);
      const { type } = response;
      if (type === 'error') {
        return this.handleError(response);
      }
      return this.receiveTweet(response);
    }

    handleClose() {}

    receiveTweet(tweet) {
      this.successCallback(tweet);
    }
  }

  function createTweetItem(tweet) {
    console.log(tweet);
    const template = document.getElementById('tweet-template').content;
    template.querySelector('.user-name').textContent = tweet.user.screen_name;
    template.querySelector('.user-name').parentNode.setAttribute('href', \`https://twitter.com/\${tweet.user.screen_name}\`);
    template.querySelector('.text').textContent = tweet.text;
    return document.importNode(template, true);
  }

  function success(tweet) {
    const tweetList = document.getElementById('tweets');
    const tweetItem = createTweetItem(tweet);
    tweetList.prepend(tweetItem);
  }

  function failure() {
    const element = document.querySelector('[aria-hidden]:not([aria-hidden="false"])');
    element.setAttribute('aria-hidden', 'false');
  }

  function main() {
    new TweetReceiver(success, failure);
  }

  main();
})();
</script>
`);
});
app.get('/auth/twitter', passport.authenticate('twitter'));
app.get('/auth/twitter/callback', passport.authenticate('twitter', {
  failureRedirect: '/',
  successRedirect: '/',
}));

const webSocketServer = new WebSocketServer({ server });
webSocketServer.on('connection', (socket) => {
  const { upgradeReq: request } = socket;
  sessionParser(request, {}, () => {
    const { session } = request;
    const { user } = session.passport || {};
    const { token, token_secret: tokenSecret } = user || {};
    if (!token || !tokenSecret) {
      socket.send(JSON.stringify({
        type: 'error',
      }));
    } else {
      const client = new Twitter({
        access_token_key: token,
        access_token_secret: tokenSecret,
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      });
      client.stream('user', (stream) => {
        stream.on('error', (error) => {
          console.error(error);
        });
        socket.on('close', () => {
          stream.destroy();
        });
        stream.on('data', (data = {}) => {
          Object.assign(data, { type: 'tweet' });
          socket.send(JSON.stringify(data));
        });
      });
    }
  });
});

server.listen(8080);

export default server;
