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
      const methodName = `handle${type[0].toUpperCase()}${type.slice(1)}`;
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
    template.querySelector('.user-name').parentNode.setAttribute('href', `https://twitter.com/${tweet.user.screen_name}`);
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
