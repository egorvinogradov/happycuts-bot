function $(selector, parent) {
  return (parent || document).querySelector(selector);
}

function $$(selector, parent) {
  return [...(parent || document).querySelectorAll(selector)];
}

function addEvent(selector, eventType, callback){
  $$(selector).forEach(element => element.addEventListener(eventType, callback));
}

function restartMessenger(callback) {
  $('.messenger__list').classList.add('messenger__list--hidden');
  setTimeout(() => {
    showMessageByIndex(0, () => {
      $('.messenger__list').classList.remove('messenger__list--hidden');
      requestAnimationFrame(callback);
    });
  }, 400);
}

function showMessageByIndex(index, callback) {
  const messages = $$('.messenger__item');
  const yShiftValue = messages[index].offsetTop
    + messages[index].offsetHeight
    - $('.messenger').offsetHeight;

  const yShift = yShiftValue > 0 ? -yShiftValue : 0;
  $('.messenger__list').style.top = Math.min(yShift, 0) + 'px';

  messages.slice(index + 1).forEach(message => {
    message.classList.remove('messenger__item--visible');
  });
  setTimeout(() => {
    messages.slice(0, index + 1).forEach(message => {
      message.classList.add('messenger__item--visible');
    });
    requestAnimationFrame(callback);
  }, 400);
}

function animateMessenger(actionIndex) {
  const actions = [
    { timeout: 3000, action: callback => restartMessenger(callback) }, // restart
    { timeout: 1500, action: callback => showMessageByIndex(1, callback) }, // Стрижка
    { timeout: 1500, action: callback => showMessageByIndex(2, callback) }, // Введите улицу и номер дома
    { timeout: 1500, action: callback => showMessageByIndex(3, callback) }, // тверская 7
    { timeout: 1500, action: callback => showMessageByIndex(4, callback) }, // Ищем мастеров
    { timeout: 2000, action: callback => showMessageByIndex(5, callback) }, // Мастер найден
  ];
  actionIndex = actionIndex || 0;
  setTimeout(() => {
    actions[actionIndex].action(() => {
      const nextIndex = (actionIndex + 1) % actions.length;
      animateMessenger(nextIndex);
    });
  }, actions[actionIndex].timeout);
}

animateMessenger(1);

addEvent('.order-mobile__button', 'click', () => {
  const menu = $('.order-mobile__menu');
  menu.hidden = false;
  requestAnimationFrame(() => {
    menu.classList.add('order-mobile__menu--expanded');
  });
});

addEvent('.order-mobile__menu-close', 'click', () => {
  const menu = $('.order-mobile__menu');
  menu.classList.remove('order-mobile__menu--expanded');
  setTimeout(() => {
    menu.hidden = true;
  }, 500);
});

addEvent('.faq__question', 'click', e => {
  if (e.target.classList.contains('faq__question--open')) {
    e.target.classList.remove('faq__question--open');
    e.target.classList.remove('faq__question--expanded');
  }
  else {
    $$('.faq__question').forEach(element => {
      element.classList.remove('faq__question--open');
      element.classList.remove('faq__question--expanded');
    });
    e.target.classList.add('faq__question--open');
    requestAnimationFrame(function () {
      e.target.classList.add('faq__question--expanded');
    });
  }
});

addEvent('.pricing-mobile__service-title', 'click', e => {
  const block = e.target.parentElement;
  const content = $('.pricing-mobile__service-content', e.target.parentElement);
  if (block.classList.contains('pricing-mobile__service--expanded')) {
    block.classList.remove('pricing-mobile__service--expanded');
    setTimeout(() => {
      content.hidden = true;
    }, 300);
  }
  else {
    content.hidden = false;
    requestAnimationFrame(() => {
      block.classList.add('pricing-mobile__service--expanded');
    });
  }
});
