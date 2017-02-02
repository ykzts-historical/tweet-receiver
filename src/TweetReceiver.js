export default class TweetReceiver {
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
