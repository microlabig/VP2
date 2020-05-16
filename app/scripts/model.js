/* *****************************************************************************
 *                               M O D E L
 *****************************************************************************/
export const TEXT_TYPE = 'userText'; // тип сообщения - текст
export const USER_INFO_TYPE = 'userInfo'; // тип сообщения - инфо о пользователе
export const GET_ALL_USERS_TYPE = 'getAllUsers'; // тип сообщения - список и настройки пользователей
export const GET_ALL_MESSAGE_TYPE = 'getAllMessages'; // тип сообщения - все сообщения

export const PATH_WS_SERVER = 'ws://microlabig-wschat.herokuapp.com/'; // адрес вебсокет-сервера
export const ENTER_KEY = 13; // код клавиши <ENTER>

const DEFAULT_AVATAR_SRC = './images/photo_no-image.png'; // аватар по-умолчанию

// ------------------
// Класс пользователя
// ------------------
export class User {
    // конструктор
    constructor(name, nickName) {
        this.name = name;
        this.nickName = nickName;
        this.avatar = DEFAULT_AVATAR_SRC;
        this.text = '';
        this.avatarsContainer = []; // контейнер для хранения элементов-изображений пользователя
    }

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
        this.avatarsContainer.forEach(avatar => {
            avatar.src = src;
        });
    }
}

// -----------------------------------------------
// Функция отправки текстового сообщения на сервер
// -----------------------------------------------
export function sendMessage(text, {webSocket, me, chatInput, chatButton}) {
    webSocket.send(JSON.stringify(me.getMessageData(TEXT_TYPE, text))); // отправить сообщение
    chatInput.value = ''; // обнулить инпут чата
    chatButton.setAttribute('disabled', 'disabled'); // задисаблить кнопку отправки сообщения
}
