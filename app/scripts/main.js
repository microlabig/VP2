/******************************************************************************
 *                               M O D E L
 *****************************************************************************/
const PATH_WS_SERVER        = 'ws://localhost:3030';

const TEXT_TYPE             = 'userText';
const USER_INFO_TYPE        = 'userInfo';
const USER_SAVE_AVATAR_TYPE = 'userSaveAvatar';
const GET_ALL_USERS_TYPE    = 'getAllUsers';

const DEFAULT_AVATAR_SRC    = './images/photo_no-image.png';

// ------------------
// Класс пользователя
// ------------------
class User {
    constructor(name, nickName) {
        this.name = name;
        this.nickName = nickName;
        this.avatar = DEFAULT_AVATAR_SRC;
        this.text = '';
    }

    /* getFullName() {
        //const nameArr = this.name.split(' ');
        return `${nameArr[0]} ${this.nickName} ${nameArr[1]}`;
    } */

    setMessageData(type, text) {
        return {
            name: this.name,
            nickName: this.nickName,
            avatar: this.avatar,
            date: new Date(),
            type: type,
            text: text
        }
    }
}

// ----------------------------------------------------
// Функция, возвращающая окончание для существительного 
// в зависимости от количества пользователей
// ----------------------------------------------------
function getEnding(length) {
    const rest = length % 10;
    let dozen = Math.floor(length / 10);
    
    while (dozen > 10) {
        dozen = Math.floor(dozen / 10);
    }

    if ((rest >= 5 && rest <= 9) || rest === 0) {
        return 'ов';
    } else if (rest >= 2 && rest <= 4 && (dozen >= 2 || dozen === 0)) {
        return 'а';
    } else if (rest >= 1 && dozen === 1) {
        return 'ов';
    }

    return '';
}

// ---------------------------------------------------
// Функция преобразования строки даты в строку времени
// ---------------------------------------------------
function dateToTime(date) {
    const currDate = new Date(Date.parse(date));
    let hours = currDate.getHours() 
    let minutes = currDate.getMinutes(); 

    hours = (hours < 10) ? ('0' + hours) : ('' + hours);
    minutes = (minutes < 10) ? ('0' + minutes) : ('' + minutes);

    return `${hours}:${minutes}`;
}

// ------------------------------------------------------------------------
// Функция возвращающая результат проверки типа последнего сообщения в чате
// ------------------------------------------------------------------------
function getValueHiddenClass(ulList, isMyMessage) {
    const liList = ulList.querySelectorAll('li'); // найдем все сообщения из списка сообщений
    
    if (liList) { // если сообщения есть
        const lastLi = liList[liList.length - 1]; // проверим последнее сообщение
        if (isMyMessage) { // если текущее сообщение - мое
            if (lastLi && lastLi.classList.contains('me')) { // если последнее сообщение в чате - мое (содержит класс 'me')
                return true; // скрывать аватар у схожих последующих сообщений
            }
        } else { // если текущее сообщение от другого пользователя
            if (lastLi && !lastLi.classList.contains('me')) { // если последнее сообщение в чате не мое
                return true; // также скрывать аватар у схожих последующих сообщений
            }
        }
    }

    return false;
}

// -----------------------------------------------------------------
// Функция, возвращающая специальный объект для рендеринга сообщения
// -----------------------------------------------------------------
function getDataMessage(message, options = {me: false, hidden: false}) { 
    // me - сообщение собственное (me=true) или чужое (me=false) 
    // hidden - скрыть аватар в сообщении или нет
    return { 
            text: message.users.text,
            name: message.users.name,
            date: dateToTime(message.users.date),
            path: message.users.avatar,
            me: options.me ? 'me' : '',
            hidden: options.hidden ? 'hidden' : ''
        }
}

// ---------------------------------------------------------------------
// Функция проверяет - встречается ли подстрока chunk в строке full
// ---------------------------------------------------------------------
function isMatching(full, chunk) {
    let fullStr = full.toLowerCase(),
        chunkStr = chunk.toLowerCase();

    return fullStr.indexOf(chunkStr) !== -1 ? true : false;
}

// ----------------------------------------------------------------------------
// Функция, возвращающая специальный объект для рендеринга списка пользователей
// ----------------------------------------------------------------------------
function getDataUser(user) {
    return {
        text: user.text,
        name: user.name,
        date: dateToTime(user.date),
        path: user.avatar
    }
}

// -----------------------------------------------------------------------------------------
// Функция, проверяющая существование ранее добавленного пользователя в списке пользователей
// -----------------------------------------------------------------------------------------
function isUserExist(user) {
    for (let userComparing of users) {
        if (user.nickName === userComparing.nickName) {
            return true;
        }
    }
    return false;
}

/******************************************************************************
 *                                  V I E W
 *****************************************************************************/
function pushAvatarElementInContainer(userNickName, element) {
    avatarContainers.set(userNickName, element);
}
// ----------------------------
// Функция рендеринга сообщения
// ----------------------------
function renderMessage(message, options = {}) {
    const chatList = document.querySelector('#chatList'); // контейнер сообщений
    const messageTemplate = document.querySelector('#message').textContent; // шаблон сообщения
    const render = Handlebars.compile(messageTemplate); // создадим функцию-рендер html-содержимого

    let hidden = false;

    const imageElement = chatList.querySelector('.messages__icon'); // елемент для добавления в контейнер аватарок пользователя

    if (options.type && options.type === 'me') {
        hidden = getValueHiddenClass(chatList, true);
        fragmentContainer.innerHTML = render(getDataMessage(message, {me: true, hidden: hidden}));
        pushAvatarElementInContainer(me.nickName, imageElement);
    } else {
        hidden = getValueHiddenClass(chatList, false);
        fragmentContainer.innerHTML = render(getDataMessage(message, {me: false, hidden: hidden}));
        pushAvatarElementInContainer(message.users.nickName, imageElement);
    }
    chatList.insertAdjacentHTML("beforeend", fragmentContainer.innerHTML);
}

// ---------------------------------------
// Функция рендеринга списка пользователей
// ---------------------------------------
function renderUser(message) {
    const memberList = document.getElementById('membersList'); // контейнер пользователей
    const userTemplate = document.querySelector('#members').textContent; // шаблон пользователя
    const render = Handlebars.compile(userTemplate); // создадим функцию-рендер html-содержимого

    for (const user in message.users) {
        const currUser = message.users[user]
        if (!isUserExist(currUser)) {
            const newUser = new User(currUser.name, currUser.nickName) ;
            users.push(newUser);
        }
    }

    memberList.innerHTML = '';

    users.forEach( user => {
        fragmentContainer.innerHTML = render(getDataUser(user));
        memberList.insertAdjacentHTML("beforeend", fragmentContainer.innerHTML);

        const imageElement = memberList.lastElementChild.querySelector('.members__icon'); // найдем последний элемент в списке
        pushAvatarElementInContainer(user.nickName, imageElement);
    });

    renderQuantityUsers(users);
}

// ------------------------------------------------------------------------
// Функция рендеринга списка найденных пользователей по ключевой строке str
// ------------------------------------------------------------------------
function renderFindedUsers(str) {
    const memberList = document.getElementById('membersList'); // контейнер пользователей
    const userTemplate = document.querySelector('#members').textContent; // шаблон искомого пользователя
    const render = Handlebars.compile(userTemplate); // создадим функцию-рендер html-содержимого

    const findedUsers = users.filter( user => isMatching(user.name, str) || isMatching(user.nickName, str));

    // сбросим список пользователей в чате
    memberList.innerHTML = '';

    // добавим найденных пользователей в список
    findedUsers.forEach( user => {
        fragmentContainer.innerHTML = render(getDataUser(user));
        memberList.insertAdjacentHTML("beforeend", fragmentContainer.innerHTML);
    });
}

// -------------------------------------------
// Функция рендеринга количества пользователей
// -------------------------------------------
function renderQuantityUsers() {
    const usersQuantity = document.getElementById('usersQuantity'); // контейнер количества пользователей
    const qMembers = document.querySelector('#qmembers').textContent; // шаблон 
    const render = Handlebars.compile(qMembers); // создадим функцию-рендер html-содержимого

    fragmentContainer.innerHTML = render({usersQuantity: users.length, ending: getEnding(users.length)});
    usersQuantity.innerHTML = fragmentContainer.innerHTML;
}

// ----------------------------------
// Функция рендеринга попапа настроек
// ----------------------------------
function renderOptionsPopup() {
    const optionsPopup = document.getElementById('options');
    const optionsWrapper = document.getElementById('options__wrapper'); // контейнер
    const optionsPhotoTemplate = document.querySelector('#optionsPhoto').textContent; 
    const render = Handlebars.compile(optionsPhotoTemplate); // создадим функцию-рендер html-содержимого

    optionsPopup.addEventListener('click', event => {
        const target = event.target;

        event.preventDefault();
        if (target.classList.contains('options__close') || 
            target.classList.contains('options__button') ||
            target.classList.contains('container')) {
            hidePopup(optionsPopup);
        }
        if (target.classList.contains('options__left') || 
            target.classList.contains('options__avatar') ||
            target.classList.contains('fas'))  {
            workWithLoadPhotoPopup(optionsPopup);
        }
    });

    optionsWrapper.innerHTML = render({name: me.name, avatar: me.avatar});
    
    showPopup(optionsPopup);
}


function workWithLoadPhotoPopup(optionsPopup) {
    const loadPhotoPopup = document.querySelector('#loadhoto');
    const loadPhotoImageContainer = document.getElementById('loadPhotoImage'); // контейнер
    const loadPhotoIconTemplate = document.querySelector('#loadPhotoIcon').textContent; 
    const render = Handlebars.compile(loadPhotoIconTemplate); // создадим функцию-рендер html-содержимого

    loadPhotoImageContainer.innerHTML = render({path: me.avatar});
    
    hidePopup(optionsPopup);
    showPopup(loadPhotoPopup);

    const applyButton = loadPhotoPopup.querySelector('.apply');
    const dragContainer = loadPhotoPopup.querySelector('#dragContainer');
    //const loadPhotoImage = loadPhotoPopup.querySelector('.loadphoto__image');

    loadPhotoPopup.addEventListener('click', event => {
        const target = event.target;
        if (target.classList.contains('cancel') ||
            target.classList.contains('container')) {
                hidePopup(loadPhotoPopup);   
            }
    });

    dragContainer.addEventListener('change', event => {
        event.preventDefault();
        uploadFile();
    });

    dragContainer.addEventListener('dragover', event => {
        event.preventDefault();
    });
    
    dragContainer.addEventListener('dragleave', event => {
        event.preventDefault();
    });

    dragContainer.addEventListener('drop', event => {
        event.preventDefault();
        uploadFile();
    });

    applyButton.addEventListener('click', event => {
        event.preventDefault();
        const loadphotoIcon = loadPhotoPopup.querySelector('.loadphoto__icon');
        me.avatar = loadphotoIcon.src; // сохраняем base64 url в аватар пользователя
        hidePopup(loadPhotoPopup);
        repaintAllAvatarsOfUser(me, me.avatar);
    });
}

function uploadFile() {
    const file = changeFile(event); // получим файл изображения

    if (file) {
        const reader = new FileReader(); // создадим экземпляр чтения файла

        reader.readAsDataURL(file);
        reader.onloadend = () => {
            const loadphotoIcon = document.querySelector('.loadphoto__icon');
            loadphotoIcon.src = reader.result; // сохраняем в base64 url
        }
    }
}

function changeFile(event, isDragged = false) {
    let file = null;
    
    try {
        file = event.target.files[0];
    } catch (error) {
        file = event.dataTransfer.files[0];
    }
    
    if (file) {
        // проверим тип файла
        if (file.type !== "image/jpeg") {
            alert("Можно загружать только JPG-файлы");

            return;
        }
        // если файл больше 512 Кб
        if (file.size / 1024 > 512) {
            alert("Для загрузки используйте файлы изображений менее 512 Кб");
            
            return;
        }
    }

    return file;
}

function repaintAllAvatarsOfUser(user, src) {
    for (const nickName of avatarContainers.keys()) {
        if (nickName === user.nickName) {
            const element = avatarContainers.get(nickName);
            element.src = src;
        }
    }
}

// -------------------------------
// Функция, скрывающая попап popup
// -------------------------------
function hidePopup(popup) {
    if (!popup.classList.contains('hidden')) {
        popup.classList.add('hidden');
        if (popup.classList.contains('show')) {
            popup.classList.remove('show');
        }
    }
}

// ---------------------------------
// Функция, показывающая попап popup
// ---------------------------------
function showPopup(popup) {
    if (popup.classList.contains('hidden') ) {
        popup.classList.remove('hidden');
        if (!popup.classList.contains('show')) {
            popup.classList.add('show');
        }
    }
}

/******************************************************************************
 *                          C O N T R O L L E R
 *****************************************************************************/

let me = null; // я
let users = [];
let avatarContainers = new Map();
let webSocket = null; // вебсокет

const fragmentContainer = new DocumentFragment(); // фрагмент 

let messageFromServer = {}; // сообщение от сервера

// ----------------------------------
// Функция работы с вебсокет-сервером
// ----------------------------------
function workServer() {
    // создание соединения с вебсокет-сервером
    webSocket = new WebSocket(PATH_WS_SERVER);
    
    // соединение установлено
    webSocket.onopen = () => {
        console.info(`[open] Соединение установлено`);
        webSocket.send(JSON.stringify(me.setMessageData(USER_INFO_TYPE, '')));
        hidePopup(authPopup);
    };
    
    // получены данные от сервера
    webSocket.onmessage = event => {
        console.info('[message]', event.data);
        messageFromServer = {...JSON.parse(event.data)};
        switch (messageFromServer.type) {
            case TEXT_TYPE:
                renderMessage(messageFromServer);
                break;
            case GET_ALL_USERS_TYPE:
                users = [];
                renderUser(messageFromServer, users);
                break;
            default:
                break;
        }
    };

    // ошибка
    webSocket.onerror = event => {
        throw new Error(`[error] Ошибка: ${event.message}`);
    };

    // соединение закрыто
    webSocket.onclose = event => {
        if (event.wasClean) {
            console.info(`[close] Соединение закрыто чисто, код=${event.code} причина=${event.reason}`);
        } else {
            console.info(`[close] Соединение прервано`);
        }
    };
}

 // -----------
 // авторизация
 // -----------
const authPopup = document.querySelector('#auth'); // попап авторизации
const authorizationForm = document.forms.authorizationForm; // форма авторизации
const authorizationButton = authorizationForm.authorizationButton;

showPopup(authPopup);

authorizationButton.addEventListener('click', event => {
    event.preventDefault();
    me = new User(authorizationForm.nameUser.value, authorizationForm.nickNameUser.value);
    users.push(me); // добавить пользователя в список всех присутствующих пользвателей чата
    workServer(); // соединяемся и работаем с вебсокет-сервером
});


// ----------------
// поиск участников
// ----------------
const findInput = document.querySelector('#findInput');
findInput.addEventListener('keyup', event => {
    renderFindedUsers(findInput.value);
});

// --------------
// смена аватарки
// --------------
const menuButton = document.querySelector('#menuButton');

menuButton.addEventListener('click', event => {
    event.preventDefault();
    renderOptionsPopup();
});
