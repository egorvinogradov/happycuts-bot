const EMPLOYEES = [
  {
    id: 'employee1',
    firstName: 'Екатерина',
    lastName: 'Иванова',
    photoUrl: 'https://s9.stc.all.kpcdn.net/share/i/4/1851017/inx960x640.jpg222',
    gender: 'female',
  },
  {
    id: 'employee2',
    firstName: 'Анна',
    lastName: 'Петрова',
    photoUrl: 'https://www.lestelle.ru/f/news/2018/10/_5bc44de8034ee3.jpg',
    gender: 'female',
  },
  {
    id: 'employee3',
    firstName: 'Борис',
    lastName: 'Смирнов',
    photoUrl: 'https://beauty.firmika.ru/data/specialists/thumbs/medium/727b4a678e5bbf41855f017b2231607f.jpg',
    gender: 'male',
  },
];


const $messages = document.querySelector('.messages');
const $textarea = document.querySelector('textarea');

const $debug = document.querySelector('.debug');
const $debugUserSelect = document.querySelector('.debugUserSelect');
const $debugUserData = document.querySelector('.debugUserData');
const $debugResetSession = document.querySelector('.debugResetSession');
const $debugEmployeeSelect = document.querySelector('.debugEmployeeSelect');
const $debugEmployeeWaitTime = document.querySelector('.debugEmployeeWaitTime');
const $debugEmployeeAssign = document.querySelector('.debugEmployeeAssign');

window.USER_ID = $debugUserSelect.value;

const bot = new HCBot();

bot.subscribeToBotMessages((userId, text, imageUrl) => {
  if (imageUrl) {
    appendImage(imageUrl, 'bot');
  }
  else {
    appendMessage(text, 'bot');
  }
  updateDebugData();
});

if (bot.getUserDataById(window.USER_ID).stage === 'SELECT_SERVICE') {
  bot.sendStartMessage(window.USER_ID);
}

updateDebugData();

function appendMessage(text, type = 'user'){
  let message = document.createElement('p');
  message.classList.add(type);
  message.innerText = text;
  $messages.appendChild(message);
  $messages.scrollTop = $messages.scrollHeight;
}

function appendImage(imageUrl, type = 'user'){
  let image = document.createElement('img');
  image.classList.add(type);
  image.src = imageUrl;
  $messages.appendChild(image);
  $messages.scrollTop = $messages.scrollHeight;
}

function updateDebugData(){
  const userData = bot.getUserDataById(window.USER_ID);
  $debugUserData.innerHTML = JSON.stringify(userData, 0 ,2);
  if (userData.stage === 'STARTED_SEARCHING_EMPLOYEES') {
    $debug.classList.add('selectingEmployee');
  }
  else {
    $debug.classList.remove('selectingEmployee');
  }
}

$textarea.addEventListener('keypress', e => {
  if (e.key === 'Enter') {
    const text = $textarea.value;
    e.preventDefault();
    appendMessage(text, 'user');
    $textarea.value = '';
    bot.handleUserMessage(window.USER_ID, text);
  }
});

$debugUserSelect.addEventListener('change', () => {
  window.USER_ID = $debugUserSelect.value;
  $messages.innerHTML = '';
  updateDebugData();
});

$debugResetSession.addEventListener('click', () => {
  localStorage.removeItem(window.USER_ID);
  $messages.innerHTML = '';
  updateDebugData();
  bot.sendStartMessage(window.USER_ID);
});

$debugEmployeeAssign.addEventListener('click', () => {
  let waitTimeMinutes = +$debugEmployeeWaitTime.value.trim();
  if (!waitTimeMinutes) {
    $debugEmployeeWaitTime.value = 30;
    waitTimeMinutes = 30;
  }
  const employeeId = $debugEmployeeSelect.value;
  const employee = EMPLOYEES.filter(employee => employee.id === employeeId)[0];
  if (employee) {
    bot.handleBackendTrigger(window.USER_ID, 'employeeFound', { employee, waitTimeMinutes });
  }
});
