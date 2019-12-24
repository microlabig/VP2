/************************************
 *              MODEL
 ************************************/
const PATH_WS_SERVER        = 'ws://localhost:3030';

const TEXT_TYPE             = 'userText';
const USER_INFO_TYPE        = 'userInfo';
const USER_SAVE_AVATAR_TYPE = 'userSaveAvatar';

const GET_ALL_USERS_TYPE    = 'getAllUsers';


const DEFAULT_AVATAR_SRC    = './images/photo_no-image.png';

class User {
    constructor(name, nickName) {
        this.name = name;
        this.nickName = nickName;
        this.avatar = DEFAULT_AVATAR_SRC;
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

function textdateToTime(date) {
    const currDate = new Date(Date.parse(date));
    let hours = currDate.getHours() 
    let minutes = currDate.getMinutes(); 

    hours = (hours < 10) ? ('0' + hours) : ('' + hours);
    minutes = (minutes < 10) ? ('0' + minutes) : ('' + minutes);

    return `${hours}:${minutes}`;
}

/************************************
 *              VIEW
 ************************************/

function renderMessage(message) {
    //const fragmentMessage = document.createDocumentFragment(); // сообщение
    const chatList = document.querySelector('#chatList'); // контейнер сообщений
    
    const messageTemplate = document.querySelector('#message').textContent; // шаблон сообщения
    const render = Handlebars.compile(messageTemplate);

    const html = render({ 
        text: message.users.text,
        date: textdateToTime(message.users.date),
        path: message.users.avatar
    });

    chatList.innerHTML = html;
}

/* Handlebars.registerHelper("avatar", function(url) {
    url = Handlebars.escapeExpression(url);  //экранирование выражения
    return new Handlebars.SafeString(`img(class='messages__icon' src='${url}' alt='Аватар')`);
}); */


/************************************
 *           CONTROLLER
 ************************************/

let me = null; // я
let webSocket = null; // вебсокет

let messageFromServer = {}; // сообщение от сервера

 // авторизация
const authPopup = document.querySelector('#auth'); // форма авторизации
const authorizationForm = document.forms.authorizationForm; // форма авторизации
const authorizationButton = authorizationForm.authorizationButton;

authorizationButton.addEventListener('click', event => {
    event.preventDefault();
    me = new User(authorizationForm.nameUser.value, authorizationForm.nickNameUser.value);
    if (!authPopup.classList.contains('hidden')) {
        authPopup.classList.add('hidden');
    }
    workWithServer(); // соединяемся и работаем с вебсокет-сервером
});

/************************************
 *              M A I N
 ************************************/

// ----------------------------------
// Функция работы с вебсокет-сервером
// ----------------------------------
function workWithServer() {
    // создание соединения с вебсокет-сервером
    webSocket = new WebSocket(PATH_WS_SERVER);

    // соединение установлено
    webSocket.onopen = event => {
        console.info(`[open] Соединение установлено`);
        webSocket.send(JSON.stringify(me.setMessageData(USER_INFO_TYPE, '')));
    };
    
    // получены данные от сервера
    webSocket.onmessage = event => {
        console.log('[message]', event.data);
        messageFromServer = {...JSON.parse(event.data)};
        switch (messageFromServer.type) {
            case TEXT_TYPE:
                renderMessage(messageFromServer);
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