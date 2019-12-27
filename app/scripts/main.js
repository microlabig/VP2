/******************************************************************************
 *                               M O D E L
 *****************************************************************************/
const PATH_WS_SERVER        = 'ws://localhost:3030'; // адрес вебсокет-сервера
const SERVER_NICK_NAME      = 'WebSocket';

const TEXT_TYPE             = 'userText'; // тип сообщения - текст
const USER_INFO_TYPE        = 'userInfo'; // тип сообщения - инфо о пользователе
const USER_SAVE_AVATAR_TYPE = 'userSaveAvatar'; // тип сообщения - сохранение аватара пользователя
const GET_ALL_USERS_TYPE    = 'getAllUsers'; // тип сообщения - список и настройки пользователей

const DEFAULT_AVATAR_SRC    = './images/photo_no-image.png'; // аватар по-умолчанию

const ENTER_KEY             = 13; // код клавиши <ENTER>

// ------------------
// Класс пользователя
// ------------------
class User {
    // конструктор
    constructor(name, nickName) {
        this.name = name;
        this.nickName = nickName;
        this.avatar = DEFAULT_AVATAR_SRC;
        this.text = '';
        this.avatarsContainer = []; // контейнер для хранения элементов-изображений пользователя
    }

    /* getFullName() {
        //const nameArr = this.name.split(' ');
        return `${nameArr[0]} ${this.nickName} ${nameArr[1]}`;
    } */

    // метод, упаковывающий данные пользователя для последующей отправки на сервер
    getMessageData(type, textMessage) {
        return {
            name: this.name,
            nickName: this.nickName,
            avatar: this.avatar,
            date: new Date(),
            type: type,
            text: textMessage
        }
    }

    // метод, копирующий параметры свойства аватара
    copyAvatar(user) {
        this.avatar = user.avatar;
    }

    // метод, перерисовывающий все присутствующие на странице изображения аватара пользователя
    repaintAllAvatars(src) {
        this.avatarsContainer.forEach( avatar => {
            avatar.src = src;
        });
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
            text: message.text,
            name: message.name,
            nickName: message.nickName === SERVER_NICK_NAME ? 'Сервер' : message.nickName,
            date: dateToTime(message.date),
            path: message.avatar,
            me: options.me ? 'me' : '',
            hidden: options.hidden ? 'hidden' : ''
        }
}

// -----------------------------------------------------------------------------------
// Функция проверяет - встречается ли подстрока chunk в строке full без учета регистра
// -----------------------------------------------------------------------------------
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
        if (userComparing.nickName === user.nickName) {
            return true;
        }
    }
    return false;
}

// ---------------------------------------------------------------------
// Функция поиска пользователя по нику и возвращающя его в случае успеха
// ---------------------------------------------------------------------
function findUser(nickName) {
    for (const user in users) {
        if (user.nickName === nickName) {
            return user;
        }
    }
}

/******************************************************************************
 *                                  V I E W
 *****************************************************************************/
// -------------------------------------------------------------------------------------
// Функция добавления элемента-изображения в контейнер пользователя с ником userNickName
// -------------------------------------------------------------------------------------
function pushAvatarElementInContainer(userNickName, element) {
    for (const user of users) {
        if (user.nickName === userNickName) {
            //debugger;
            user.avatarsContainer.push(element);
        }
    }
}

// ----------------------------
// Функция рендеринга сообщения
// ----------------------------
function renderMessage(message, options = {}) {
    const chatList = document.querySelector('#chatList'); // контейнер сообщений
    const messageTemplate = document.querySelector('#message').textContent; // шаблон сообщения
    const render = Handlebars.compile(messageTemplate); // создадим функцию-рендер html-содержимого

    let hidden = false; // признак скрытия аватарки пользователя

    if (options.type && options.type === 'me') { // если собственное сообщение
        hidden = getValueHiddenClass(chatList, true); // определить - стоит ли скрывать аватар в зависимости от последнего сообщения
        fragmentContainer.innerHTML = render(getDataMessage(message, {me: true, hidden: hidden}));
    } else {
        hidden = getValueHiddenClass(chatList, false); // определить - стоит ли скрывать аватар в зависимости от последнего сообщения
        fragmentContainer.innerHTML = render(getDataMessage(message, {me: false, hidden: hidden}));
    }

    chatList.insertAdjacentHTML("beforeend", fragmentContainer.innerHTML); 

    if (chatList.children.length !== 0) {
        const imageElement = chatList.lastElementChild.querySelector('.messages__icon'); // елемент для добавления в контейнер аватарок пользователя
        pushAvatarElementInContainer(message.nickName, imageElement); // запомнить элемент-изображения в контейнере изображений аватара пользователя
    }
}

// ---------------------------------------
// Функция рендеринга списка пользователей
// ---------------------------------------
function renderUsers(message) {
    const memberList = document.getElementById('membersList'); // контейнер пользователей
    const userTemplate = document.querySelector('#members').textContent; // шаблон пользователя
    const render = Handlebars.compile(userTemplate); // создадим функцию-рендер html-содержимого

    // сбросим список пользователей в чате
    memberList.innerHTML = '';

    // переберем список пользователей и этрендерим аватары
    users.forEach( user => { 
        if (user.nickName === me.nickName) { 
            user.avatar = me.avatar;
        } 

        fragmentContainer.innerHTML = render(getDataUser(user));
        memberList.insertAdjacentHTML("beforeend", fragmentContainer.innerHTML);

        // запомним элемент-изображение в контейнер аватарок пользователя
        const imageElement = memberList.lastElementChild.querySelector('.members__icon'); // найдем последний элемент в списке
        pushAvatarElementInContainer(user.nickName, imageElement);
    });
    //console.log('-|-',users);

    // отрисуем количество пользователей в чате
    renderQuantityUsers(users);
}

// ------------------------------------------------------------------------
// Функция рендеринга списка найденных пользователей по ключевой строке str
// ------------------------------------------------------------------------
function renderFindedUsers(str) {
    const memberList = document.getElementById('membersList'); // контейнер пользователей
    const userTemplate = document.querySelector('#members').textContent; // шаблон искомого пользователя
    const render = Handlebars.compile(userTemplate); // создадим функцию-рендер html-содержимого

    // найдем пользователя с ником или фио, соответствующих строке str
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
    const optionsPopup = document.getElementById('options'); // попап опций
    const optionsWrapper = document.getElementById('options__wrapper'); // контейнер
    const optionsPhotoTemplate = document.querySelector('#optionsPhoto').textContent; 
    const render = Handlebars.compile(optionsPhotoTemplate); // создадим функцию-рендер html-содержимого

    optionsPopup.addEventListener('click', event => {
        const target = event.target;

        event.preventDefault();

        if (target.classList.contains('options__close') || // кнопка закрытия опций
            target.classList.contains('options__button') || 
            target.classList.contains('container')) { // контейнер по периметру попапа
            hidePopup(optionsPopup); // скрыть опции
        }

        if (target.classList.contains('options__left') || // кнопка выбора аватара пользователя
            target.classList.contains('options__avatar') || // аватар пользователя
            target.classList.contains('fas'))  {
                hidePopup(optionsPopup); // скрыть опции
                workWithLoadPhotoPopup(); // перейти к работе с аватаром пользователя
        }
    });

    optionsWrapper.innerHTML = render({name: me.name, avatar: me.avatar});
    
    showPopup(optionsPopup); // показать опции
}

// ------------------------------------------------------
// Функция работы с попапом загрузки аватара пользователя
// ------------------------------------------------------
function workWithLoadPhotoPopup() {
    const loadPhotoPopup = document.querySelector('#loadhoto'); // попап загрузки аватара
    const loadPhotoImageContainer = document.getElementById('loadPhotoImage'); // контейнер
    const loadPhotoIconTemplate = document.querySelector('#loadPhotoIcon').textContent; 
    const render = Handlebars.compile(loadPhotoIconTemplate); // создадим функцию-рендер html-содержимого

    loadPhotoImageContainer.innerHTML = render({path: me.avatar});
    
    showPopup(loadPhotoPopup); // показать попап работы с загрузкой аватара пользователя

    const applyButton = loadPhotoPopup.querySelector('.apply'); // кнопка сохранения аватара
    const dragContainer = loadPhotoPopup.querySelector('#dragContainer'); // контейнер для drag&drop изображения

    loadPhotoPopup.addEventListener('click', event => {
        const target = event.target;
        if (target.classList.contains('cancel') || // кнопка отмены
            target.classList.contains('container')) { // контейнер по периметру попапа
                hidePopup(loadPhotoPopup); // скрыть попап
            }
    });

    // обработчик работы с файлом изображении при открытии диалогового окна с файловой системой
    dragContainer.addEventListener('change', event => {
        event.preventDefault(); 
        uploadFile(); // загрузить изображение
    });
    
    // DRAG & DROP
    // обработчик dragover
    dragContainer.addEventListener('dragover', event => {
        if (!dragContainer.classList.contains('draggable')) {
            dragContainer.classList.add('draggable');
        }
        event.preventDefault();
    });
    
    // обработчик dragleave - перемещаемое изображение не над контейнером
    dragContainer.addEventListener('dragleave', event => {
        event.preventDefault();
        if (dragContainer.classList.contains('draggable')) {
            dragContainer.classList.remove('draggable');
        }
    });

    // обработчик сброса изображения на контейнере drag&drop
    dragContainer.addEventListener('drop', event => {
        event.preventDefault();
        if (dragContainer.classList.contains('draggable')) {
            dragContainer.classList.remove('draggable');
        }
        uploadFile(); // загрузить изображение
    });

    // обработчик применения настроек
    applyButton.addEventListener('click', event => {
        const loadphotoIcon = loadPhotoPopup.querySelector('.loadphoto__icon'); // найдем изображение аватара в попапе

        event.preventDefault();
        me.avatar = loadphotoIcon.src; // сохраняем base64 url в аватар пользователя
        hidePopup(loadPhotoPopup); // скрыть попап
        me.repaintAllAvatars(me.avatar); // перерисуем собственные аватарки
        webSocket.send(JSON.stringify(me.getMessageData(USER_SAVE_AVATAR_TYPE, ''))); // отправим сообщение на сервер о смене аватарки
    });
}

// ----------------------------------------------------
// Функция загрузки файла и преобразование его в base64
// ----------------------------------------------------
function uploadFile() {
    const file = changeFile(event); // получим файл изображения

    if (file) { // если файл соотвествует необходимым критериям (см. ф-ию changeFile)
        const reader = new FileReader(); // создадим экземпляр чтения файла

        reader.readAsDataURL(file); // прочитать файл как URL (преобразовать в base64)
        // загрузка (преобразование) завершено
        reader.onloadend = () => {
            const loadphotoIcon = document.querySelector('.loadphoto__icon');
            loadphotoIcon.src = reader.result; // сохраняем в base64 url
        }
    }
}

// ------------------------------
// Функция проверки файла аватара 
// ------------------------------
function changeFile(event) {
    let file = null;
    
    try {
        file = event.target.files[0]; // если файл получен из диалогового окна
    } catch (error) {
        file = event.dataTransfer.files[0]; // если файл получен методом drag&drop
    }
    
    if (file) {
        // проверим тип файла, должен быть JPEG
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

function refreshUsersArray(message) {
    const tempArr = [];

    for (const user in message.users) {
        const nickName = message.users[user].nickName;
        let currUser = users.find( usr => usr.nickName === nickName);

        if (currUser) {
            usersAvatarsContainer.set(nickName, currUser.avatarsContainer || []);
            tempArr.push(currUser);
        } else {
            // переберем всех пользователей в принятом сообщении от сервера
            currUser = message.users[nickName]; // возьмем текущего пользователя (по нику)

            const newUser = new User(currUser.name, currUser.nickName); // создадим пользователя

            if (me.nickName === nickName) { // если я уже регистрировался в чате ранее
                me.copyAvatar(currUser); // скопировать аватар, пришедший от сервера
            } 

            if (usersAvatarsContainer.has(currUser.nickName)) {
                newUser.avatarsContainer = [...usersAvatarsContainer.get(currUser.nickName)];
            }

            tempArr.push(newUser); // и добавим в список пользователей
        }
    }
    // обнулим массив пользователей
    users.length = 0; 
    // скопируем обновленную информацию о текущих пользователях
    users = [...tempArr];
    
    // переместим себя в начало списка
    let indexMe = -1;
    const userMeItem = users.find( (user, index) => {
        indexMe = index;
        return (user.nickName === me.nickName);
    });
    users.splice(indexMe, 1);
    users.unshift(userMeItem);
    
    // возвратим старые значения контейнера аватарок пользователям в списке
    for (const user of users) {
        const container = usersAvatarsContainer.get(user.nickName);

        if (container) {
            user.avatarsContainer = [...container];
        } 
    }
}

/******************************************************************************
 *                          C O N T R O L L E R
 *****************************************************************************/

let me = null; // я
let users = []; // список всех пользователей чата
let usersAvatarsContainer = new Map(); // карта соответствия контейнеров элементов-изображений по нику пользователя
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
        webSocket.send(JSON.stringify(me.getMessageData(USER_INFO_TYPE, '')));
        hidePopup(authPopup);
    };
    
    // получены данные от сервера
    webSocket.onmessage = event => {
        //console.info('[message]', event.data);
        
        // преобразуем входящее сообщение в объект
        messageFromServer = {...JSON.parse(event.data)};

        // обработаем тип сообщения от сервера в зависимости от типа
        switch (messageFromServer.type) {
            // тип - текст
            case TEXT_TYPE:
                if (messageFromServer.nickName === me.nickName) {
                    renderMessage(messageFromServer, {type: 'me'}); // отрендерить собственное сообщение в чате
                } else {
                    renderMessage(messageFromServer); // отрендерить сообщение в чате
                }
                break;
            // тип - все пользователи
            case GET_ALL_USERS_TYPE:

                refreshUsersArray(messageFromServer);

                renderUsers(messageFromServer); // отрендерить список пользователей
                
                // отрендерить все аватарки пользователя
                for (const user of users) {
                    const avatarMessages = messageFromServer.users[user.nickName].avatar;
                    user.avatar = avatarMessages;
                    user.repaintAllAvatars(user.avatar);
                }

                break;
                
            /* case USER_SAVE_AVATAR_TYPE: 
                repaintAllAvatarsOfUser(messageFromServer.nickName, messageFromServer.avatar);
                break; */
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

// показать логин-попап
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

// --------------------------
// смена собственной аватарки
// --------------------------
const menuButton = document.querySelector('#menuButton');

menuButton.addEventListener('click', event => {
    event.preventDefault();
    renderOptionsPopup();
});

// отправка сообщения в чат
const chatForm = document.forms.chatForm;
const chatInput = chatForm.chatInput;
const chatButton = chatForm.chatButton;

let isEmptyMessage = true;

chatInput.addEventListener('keyup', event => {
    const value = chatInput.value;

    if (value.length === 0) {
        isEmptyMessage = true;
        chatButton.setAttribute('disabled','disabled');
    } else {
        isEmptyMessage = false;
        chatButton.removeAttribute('disabled');
    }
});

chatInput.addEventListener('keydown', event => {
    if (event.keyCode === ENTER_KEY) {
        event.preventDefault();
        if (!isEmptyMessage) {
            const value = chatInput.value;
            sendMessage(value);
        }
    }
})

chatButton.addEventListener('click', event => {
    const value = chatInput.value;
    sendMessage(value);
});

function sendMessage(text) {
    webSocket.send(JSON.stringify(me.getMessageData(TEXT_TYPE, text)));
    chatInput.value = '';
    chatButton.setAttribute('disabled','disabled');
}