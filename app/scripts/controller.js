import {
    PATH_WS_SERVER,
    TEXT_TYPE, USER_INFO_TYPE, GET_ALL_USERS_TYPE, GET_ALL_MESSAGE_TYPE,
    ENTER_KEY,
    User, sendMessage
} from './model.js';

import {
    renderMessage, renderUsers, renderFindedUsers,
    renderOptionsPopup, hidePopup, showPopup, renderAllAvatars
} from './view.js';

// ----------------------------------------------------------
// Функция обновления информации о списке пользователей
// и добавляющая контейнеры изображений этим же пользователям
// ----------------------------------------------------------
function refreshUsersArray(message) {
    const tempArr = [];

    for (const user in message.users) {
        const nickName = message.users[user].nickName;
        let currUser = users.find(usr => usr.nickName === nickName);

        if (currUser) {
            usersAvatarsContainer.set(nickName, currUser.avatarsContainer || []);
            tempArr.push(currUser);
        } else {
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
    const userMeItem = users.find((user, index) => {
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



/* *****************************************************************************
 *                          C O N T R O L L E R
 *****************************************************************************/

let me = null; // я
let users = []; // список всех пользователей чата
let usersAvatarsContainer = new Map(); // карта соответствия контейнеров элементов-изображений по нику пользователя
let webSocket = null; // вебсокет

let messageFromServer = {}; // сообщение от сервера

// ----------------------------------
// Функция работы с вебсокет-сервером
// ----------------------------------
function workServer() {
    // создание соединения с вебсокет-сервером
    webSocket = new WebSocket(PATH_WS_SERVER);

    // соединение установлено
    webSocket.onopen = () => {
        console.info('[open] Соединение установлено');
        webSocket.send(JSON.stringify(me.getMessageData(USER_INFO_TYPE, ''))); // отправить данные о пользователе на сервер
        hidePopup(authPopup); // скрыть форму авторизации
        document.forms.chatForm.chatInput.focus(); // установить фокус на инпуте чата
    };

    // получены данные от сервера
    webSocket.onmessage = event => {
        console.info('[message]', event.data);

        // преобразуем входящее сообщение в объект
        messageFromServer = { ...JSON.parse(event.data) };

        // обработаем тип сообщения от сервера в зависимости от типа
        switch (messageFromServer.type) {

            // тип - текст
            case TEXT_TYPE:
                renderMessage(messageFromServer, {me, users});
                break;

            // тип - все пользователи
            case GET_ALL_USERS_TYPE:
                // обновить список текущих пользователей
                refreshUsersArray(messageFromServer);
                // отрисовать пользователей и их количество
                renderUsers({users, me});
                // отрендерить все аватарки пользователя
                renderAllAvatars(messageFromServer, {users});
                break;

            // тип - все сообщения
            case GET_ALL_MESSAGE_TYPE:
                // обновить список текущих пользователей
                refreshUsersArray(messageFromServer);
                // отрендерить все сообщения
                for (const message of messageFromServer.logs) {
                    renderMessage(message, {me, users});
                }
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
            console.info('[close] Соединение прервано');
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
export function start() { // ENTRY/MAIN POINT
    showPopup(authPopup);
}

authorizationButton.addEventListener('click', event => {
    const nameUserInput = authorizationForm.nameUser;
    const nickNameUserInput = authorizationForm.nickNameUser;

    event.preventDefault();

    // простая валидация
    if (nameUserInput.value.length === 0 || nickNameUserInput.value.length === 0) { // нет имени или ника
        if (!nameUserInput.classList.contains('error')) {
            nameUserInput.classList.add('error');
        }
        if (!nickNameUserInput.classList.contains('error')) {
            nickNameUserInput.classList.add('error');
        }
    } else { // введены все данные
        authorizationButton.setAttribute('disabled', 'disabled');
        me = new User(authorizationForm.nameUser.value, authorizationForm.nickNameUser.value);
        users.push(me); // добавить пользователя в список всех присутствующих пользвателей чата
        workServer(); // соединяемся и работаем с вебсокет-сервером
    }
});

// ----------------
// поиск участников
// ----------------
const findInput = document.querySelector('#findInput');

findInput.addEventListener('keyup', () => {
    renderFindedUsers({str: findInput.value, users});
});

// --------------------------
// смена собственной аватарки
// --------------------------
const menuButton = document.querySelector('#menuButton');

menuButton.addEventListener('click', event => {
    event.preventDefault();
    renderOptionsPopup({me, webSocket});
});

// --------------------------
// отправка сообщения в чат
// --------------------------
const chatForm = document.forms.chatForm; // форма чата
const chatInput = chatForm.chatInput; // инпут чата
const chatButton = chatForm.chatButton; // кнопка отправки сообщения чата

let isEmptyMessage = true; // проверка на наличия сообщения в инпуте чата

// валидация по ввденным данным в инпуте чата
chatInput.addEventListener('keyup', () => {
    const value = chatInput.value;

    if (value.length === 0) {
        isEmptyMessage = true;
        chatButton.setAttribute('disabled', 'disabled');
    } else {
        isEmptyMessage = false;
        chatButton.removeAttribute('disabled');
    }
});

// отправка сообщения по нажатию клавиши Enter
chatInput.addEventListener('keydown', event => {
    if (event.keyCode === ENTER_KEY) {
        event.preventDefault();
        if (!isEmptyMessage) {
            const value = chatInput.value;

            sendMessage(value, {webSocket, me, chatInput, chatButton});
        }
    }
});

// отправка сообщения на сервер
chatButton.addEventListener('click', () => {
    const value = chatInput.value;

    sendMessage(value, {webSocket, me, chatInput, chatButton});
});