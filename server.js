const webSocket = require('ws');
const port = 3030;
const server = new webSocket.Server({
  port: port,
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

// ---------------------------------------------
// Обработчик установки соединения с сервером
// ---------------------------------------------
server.on('connection', ws => {
    let user = {};

    // если пришло сообщение от пользователя
    ws.on('message', message => {
        const msgObject = JSON.parse(message);
        const nickName = msgObject.nickName.toLowerCase();

        switch (msgObject.type) {
            case 'userInfo':
                user = {...msgObject};
                // проверим, зашел ли пользователь в первый раз
                if (!clients.getClient(nickName)) { // нет такого пользователя с ником в текущем списке клиентов
                    clients.saveClient(nickName, user); // сохранить клиента
                }
                sendAllUsers();
                break;

            case 'userSaveAvatar':
                clients.saveClientAvatar(nickName, msgObject.path);
                sendAllUsers();
                break;
        
            default:
                sendMessage(message);
                break;
        }

        //console.log('[message]',message);
        //console.log('---', clients.getAllClients());
    });

    // если пользователь закрыл соединение
    ws.on('close', () => {
        clients.removeClient(user.nickName.toLowerCase());        
        sendAllUsers();
    });

    // приветствие
    ws.send(JSON.stringify({
        type: 'userText',
        users: {
            name: 'Node.JS Server',
            nickName: 'WebSocket',
            avatar: './images/nodejs-logo.png',
            text: 'Добро пожаловать!',
            date: new Date()
        }
    }));
});

// ---------------------------------------------
// функция отправки сообщений всем пользователям
// ---------------------------------------------
function sendMessage(message) {
    server.clients.forEach( client => {
        if (client.readyState === webSocket.OPEN) {
            client.send(message);
        }
    });
}

// ------------------------------------------
// функция отправки списка всех пользователей
// ------------------------------------------
function sendAllUsers() {
    server.clients.forEach( client => {
        if (client.readyState === webSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'getAllUsers',
                users: clients.getAllClients()
            }));
        }
    });
}




//-------------------------------
//-------------------------------
console.info(`
    Добро пожаловать на мой сервер
    Путь: ws://localhost:${port}
`);
//-------------------------------
//-------------------------------