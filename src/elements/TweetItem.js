import { format } from 'date-fns';

export default class TweetItem extends HTMLElement {
  static get observedAttributes() {
    return [
      'tweet'
    ];
  }

  constructor(tweet = null) {
    super();
    this._tweet = tweet;
    const shadowRoot = this.attachShadow({ mode: 'open' });
    const template = document.getElementById('tweet-item-template');
    const instance = template.content.cloneNode(true);
    shadowRoot.append(instance);
    const children = document.getElementById('tweet-template').content.cloneNode(true);
    this.append(children);
    this.setupTweet(tweet);
  }

  get tweet() {
    return this._tweet;
  }

  set tweet(value) {
    this._tweet = value;
    return value;
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'tweet') {
      this.setupTweet(newValue);
    }
  }

  setupTweet(tweet) {
    if (tweet) {
      const { user } = tweet;
      this.querySelector('[slot="name"]').textContent = user.name;
      this.querySelector('[slot="screen-name"]').textContent = user.screen_name;
      this.querySelector('[slot="tweet-body"]').textContent = tweet.text;
      const timestamp = new Date(tweet.created_at);
      const time = this.querySelector('[slot="timestamp"]');
      time.dateTime = timestamp.toISOString();
      time.textContent = format(timestamp, 'YYYY-MM-DD HH:mm:ss');
      this.shadowRoot.querySelector('.author').href = `https://twitter.com/${user.screen_name}`;
    }
  }
}

customElements.define('tweet-item', TweetItem);
