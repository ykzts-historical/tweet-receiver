import TweetItem from './elements/TweetItem';
import TweetReceiver from './TweetReceiver';

function success(tweet) {
  const tweetList = document.getElementById('tweets');
  const tweetItem = new TweetItem(tweet);
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
