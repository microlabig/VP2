const PORT                          = 3030; // порт 3030

const DEFAULT_AVATAR_SERVER_SRC     = './images/nodejs-logo.png';
const WELCOME__MESSAGE              = 'Добро пожаловать в чат!';

const SERVER__NAME                  = 'Node.JS Server';
const SERVER_NICK_NAME              = 'WebSocket';

const TEXT_TYPE                     = 'userText'; // тип сообщения - текст
const USER_INFO_TYPE                = 'userInfo'; // тип сообщения - инфо о пользователе
const USER_SAVE_AVATAR_TYPE         = 'userSaveAvatar'; // тип сообщения - сохранение аватара пользователя
const GET_ALL_USERS_TYPE            = 'getAllUsers'; // тип сообщения - список и настройки пользователей
const GET_ALL_MESSAGE_TYPE          = 'getAllMessages';

const webSocket = require('ws'); // загружаем веб-сокет
const server = new webSocket.Server({ // создаем новый вебсокет-сервер
  port: PORT,
  clientTracking: true
});

// ---------------------------------------------
// Класс работы с пользователями
// ---------------------------------------------
class Clients {
    constructor() {
        this.clientsOnlineList = {};
        this.clientsOfflineList = {};
    }

    // сохранение аватара клиента
    saveClientAvatar(userNickName, src) {
        this.clientsOnlineList[userNickName].avatar = src;
    }

    // вернуть список всех пользователей
    getAllClients() {
        return this.clientsOnlineList;
    }

    // возвратить текущего пользователя из списка онлайн-пользователей
    getClient(userNickName) {
        if (this.clientsOfflineList[userNickName]) {
            this.clientsOnlineList[userNickName] = this.clientsOfflineList[userNickName];
            delete this.clientsOfflineList[userNickName];
        }
        return this.clientsOnlineList[userNickName];
    }

    // записать инфу о пользователе
    saveClient(userNickName, user) {
        this.clientsOnlineList[userNickName] = user;
    }

    // удаление пользователя из списка онлайн-пользователей
    removeClient(userNickName) {
        this.clientsOfflineList[userNickName] = this.clientsOnlineList[userNickName];
        delete this.clientsOnlineList[userNickName];
    }
}

const clients = new Clients();
let logs = [];

// ---------------------------------------------
// Обработчик установки соединения с сервером
// ---------------------------------------------
server.on('connection', ws => {
    let user = {};

    // если пришло сообщение от пользователя
    ws.on('message', message => {
        const msgObject = JSON.parse(message);
        const nickName = msgObject.nickName.toLowerCase();

        // обработаем тип сообщения от клиента в зависимости от типа
        switch (msgObject.type) {

            // тип - информация о подключенном пользователе
            case USER_INFO_TYPE:
                user = {...msgObject};
                // проверим, зашел ли пользователь в первый раз
                if (!clients.getClient(nickName)) { // нет такого пользователя с ником в текущем списке клиентов
                    clients.saveClient(nickName, user); // сохранить клиента
                }
                // отправим все предыдущие сообщения текущему пользователю
                sendMessagesFromLog(ws); 
                // отправить информацию о пользователях всем клиентам
                sendAllUsers();
                break;

            // тип - сохранение аватара
            case USER_SAVE_AVATAR_TYPE:
                clients.saveClientAvatar(nickName, msgObject.avatar);
                // обновим аватарки в логе сообщений у пользователя
                logs = logs.map(msg => {
                    msg.avatar = clients.getClient(msg.nickName).avatar;
                    return msg;
                });
                sendAllUsers();
                break;
        
            // по-умолчанию - текстовое сообщение
            default:
                saveMessageToLog(msgObject);
                sendMessage(message);
                break;
        }
    });

    // если пользователь закрыл соединение
    ws.on('close', () => {
        clients.removeClient(user.nickName.toLowerCase());        
        sendAllUsers();
    });

    // приветствие
    ws.send(JSON.stringify({
        type: TEXT_TYPE,
        name: SERVER__NAME,
        nickName: SERVER_NICK_NAME,
        avatar: DEFAULT_AVATAR_SERVER_SRC,
        text: WELCOME__MESSAGE,
        date: new Date()
    }));
});

// ------------------------------------------------------------------
// Функция, записывающая все входящие сообщения в контейнер сообщений
// ------------------------------------------------------------------
function saveMessageToLog(message) {
    logs.push(message);
}

// -------------------------------------------------------
// Функция отправки всех сообщений из контейнера сообщений
// -------------------------------------------------------
function sendMessagesFromLog(clientWebsocket) {
    clientWebsocket.send(JSON.stringify(
        {
            type: GET_ALL_MESSAGE_TYPE,
            users: clients.getAllClients(),
            logs: logs
        }
    ));
}

// ---------------------------------------------
// Функция отправки сообщений всем пользователям
// ---------------------------------------------
function sendMessage(message) {
    server.clients.forEach( client => {
        if (client.readyState === webSocket.OPEN) {
            client.send(message); 
        }
    });
}

// ------------------------------------------
// Функция отправки списка всех пользователей
// ------------------------------------------
function sendAllUsers() {
    server.clients.forEach( client => {
        if (client.readyState === webSocket.OPEN) {
            client.send(JSON.stringify({
                type: GET_ALL_USERS_TYPE,
                users: clients.getAllClients()
            }));
        }
    });
}

/* //-------------------------------
//-------------------------------
console.info(`
    Добро пожаловать на сервер
    Путь: ws://localhost:${PORT}

    <CTRL> + <C> для выхода
`);
//-------------------------------
//------------------------------- */