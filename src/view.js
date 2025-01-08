import onChange from 'on-change';
import { find } from 'lodash';

export default (elements, state, i18n) => {

  const handleForm = (state) => {
    const { input, feedback } = elements;
    const { isValid, error } = state.form;
    
    if (isValid) {
      input.classList.remove('is-invalid');
      feedback.classList.add('text-success');
      feedback.textContent = '';
    } else {
      input.classList.add('is-invalid');
      feedback.classList.add('text-danger');
      feedback.textContent = i18n.t([`errors.${error}`, 'errors.unknown']);
    }
  };
  
  const handleLoadingProcess = (state) => {
    const { submit, input, feedback } = elements;
    feedback.classList.remove('text-success');
    feedback.classList.remove('text-danger');
  
    switch (state.loadingProcess.status) {
      case 'failed':
        submit.disabled = false;
        input.removeAttribute('readonly');
        feedback.classList.add('text-danger');
        feedback.textContent = i18n.t([`errors.${state.loadingProcess.error}`, 'errors.unknown']);
        break;
      case 'success':
        submit.disabled = false;
        input.removeAttribute('readonly');
        input.value = '';
        feedback.classList.add('text-success');
        feedback.textContent = i18n.t('loading.success');
        input.focus();
        break;
      case 'loading':
        submit.disabled = true;
        input.setAttribute('readonly', true);
        feedback.innerHTML = i18n.t('loading.loading');
        break;
      default:
        throw new Error(`Unknown loadingProcess status: '${state.loadingProcess.status}'`);
    }
  };

  const handleFeeds = (state) => {
    const { feedsCards } = elements;

    const feedsFragment = document.createElement('div');
    feedsFragment.classList.add('card', 'border-0');
    feedsFragment.innerHTML = '<div class="card-body"></div>';

    const feedsTitile = document.createElement('h2');
    feedsTitile.classList.add('card-title', 'h4');
    feedsTitile.textContent = i18n.t('feeds');
    feedsFragment.querySelector('.card-body').appendChild(feedsTitile);

    const feedsList = document.createElement('ul');
    feedsList.classList.add('list-group', 'border-0', 'rounded-0');

    const feedsItems = state.feeds.map((feed) => {
      const element = elements.feedTemplate.content.cloneNode(true);
      const title = element.querySelector('h3');
      title.textContent = feed.title;
      const description = element.querySelector('p');
      description.textContent = feed.description;

      return element;
    });

    feedsList.append(...feedsItems);
    feedsFragment.appendChild(feedsList);
    feedsCards.innerHTML = '';
    feedsCards.appendChild(feedsFragment);
  };

  const handlePosts = (state) => {
    const { postsCards } = elements;
    const { posts, watchedPosts } = state;

    const postsFragment = document.createElement('div');
    postsFragment.classList.add('card', 'border-0');
    postsFragment.innerHTML = '<div class="card-body"></div>';

    const postsTitile = document.createElement('h2');
    postsTitile.classList.add('card-title', 'h4');
    postsTitile.textContent = i18n.t('posts');
    postsFragment.querySelector('.card-body').appendChild(postsTitile);

    const postsList = document.createElement('ul');
    postsList.classList.add('list-group', 'border-0', 'rounded-0');

    const postsListItems = posts.map((post) => {
      const element = elements.postTemplate.content.cloneNode(true);
      const link = element.querySelector('a');
      const className = watchedPosts.has(post.id) ? ['fw-normal', 'link-secondary'] : ['fw-bold'];
      link.classList.add(...className);
      link.setAttribute('href', post.link);
      link.dataset.id = post.id;
      link.textContent = post.title;

      const button = element.querySelector('button');
      button.dataset.id = post.id;
      button.dataset.bsToggle = 'modal';
      button.dataset.bsTarget = '#modal';
      button.textContent = i18n.t('preview');
      return element;
    });

    postsList.append(...postsListItems);
    postsFragment.appendChild(postsList);
    postsCards.innerHTML = '';
    postsCards.appendChild(postsFragment);
  };

  const handleModal = (state) => {
    const { modalTemplate } = elements;
    const { posts, modal } = state;

    const post = find(posts, { id: modal.postId });
    const title = modalTemplate.querySelector('.modal-title');
    title.textContent = post.title;
    const body = modalTemplate.querySelector('.modal-body');
    body.textContent = post.description;

    const readButton = modalTemplate.querySelector('[data-action="readFull"]');
    readButton.textContent = i18n.t('readFull');
    readButton.href = post.link;

    const closeButton = modalTemplate.querySelector('[data-action="close"]');
    closeButton.textContent = i18n.t('close');
  };

  const handlers = {
    'form': handleForm,
    'loadingProcess': handleLoadingProcess,
    'feeds': handleFeeds,
    'posts': handlePosts,
    'modal.postId': handleModal,
    'ui.watchedPosts': handlePosts,
  };

  const watchedState = onChange(state, (path) => {
    const handler = handlers[path];
    if (handler) {
      handler(state);
    }
  });
  
  return watchedState;
};