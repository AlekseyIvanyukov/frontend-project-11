import i18next from 'i18next';
import * as yup from 'yup';
import axios from 'axios';
import watch from './view.js';
import translations from './locales/index.js';
import getParsingData from './parser.js';

const defaultLanguage = 'ru';

const getLoadingProcessError = (error) => {
  switch (true) {
    case error.isParsingError:
      return 'notRSS';
    case error.isAxiosError:
      return 'network';
    default:
      return 'unknown';
  }
};

const addProxy = (newURL) => {
  const proxyUrl = new URL('/get', 'https://allorigins.hexlet.app');
  proxyUrl.searchParams.set('url', newURL);
  proxyUrl.searchParams.set('disableCache', 'true');
  return proxyUrl.toString();
};

const getUniqueId = () => `${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;

const readRss = (watchedState, url) => {
  watchedState.loadingProcess = { status: 'loading', error: null };

  return axios
    .get(addProxy(url))
    .then((response) => {
      const { title, decsription, items } = getParsingData(response.data.contents);
      
      const feed = {
        id: getUniqueId(), 
        url,
        title,
        decsription,
      };

      const posts = items.map((item) => ({
        ...item,
        channelId: feed.id,
        id: getUniqueId(),
      }));

      watchedState.loadingProcess = { status: 'success', error: null };
      watchedState.feeds.unshift(feed);
      watchedState.posts.unshift(...posts);
    })
    .catch((error) => {
      watchedState.loadingProcess = { status: 'failed', error: getLoadingProcessError(error) };
    });
};

const validateUrl = (url, feeds) => {
  const feedUrls = feeds.map((feed) => feed.url);
  const schema = yup.string().url().required();

  return schema
    .notOneOf(feedUrls)
    .validate(url)
    .then(() => null)
    .catch((error) => error.message);
};

const app = () => {
  const initialState = {
    form: {
      isValid: false,
      error: null,
    },
    loadingProcess: {
      status: 'success',
      error: null,
    },
    feeds: [],
    posts: [],
    watchedPosts: new Set(),
    modal: {
      postId: '',
    },
  };

  const elements = {
    form: document.querySelector('.rss-form'),
    input: document.querySelector('.form-control'),
    submit: document.querySelector('.rss-form button[type="submit"]'),
    feedback: document.querySelector('.feedback'),
    feedsCards: document.querySelector('.feeds'),
    postsCards: document.querySelector('.posts'),
  };

  const locale = {
    string: {
      url: () => ({ key: 'notURL' }),
    },
    mixed: {
      notOneOf: () => ({ key: 'exists' }),
    },
  };

  const i18n = i18next.createInstance();

  i18n
    .init({
      lng: defaultLanguage,
      debug: false,
      resources: translations,
    })
    .then(() => {
      yup.setLocale(locale);
      const watchedState = watch(elements, initialState, i18n);

      elements.form.addEventListener('submit', (e) => {
        e.preventDefault();
        const data = new FormData(e.target);
        const url = data.get('rss');

        validateUrl(url, watchedState.feeds)
          .then((error) => {
            if (!error) {
              watchedState.form = { isValid: true, error: null };
               readRss(watchedState, url);
            } else {
              watchedState.form = { isValid: false, error: error.key };
            }
          });
      });
    });
};

export default app;