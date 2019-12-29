/* *****************************************************************************
 *                                  V I E W
 *****************************************************************************/
const SERVER_NICK_NAME = 'WebSocket'; // ник сервера
const USER_SAVE_AVATAR_TYPE = 'userSaveAvatar'; // тип сообщения - сохранение аватара пользователя

// -------------------------------------------------------------------------------------
// Функция добавления элемента-изображения в контейнер пользователя с ником userNickName
// -------------------------------------------------------------------------------------
function pushAvatarElementInContainer(users, userNickName, element) {
    for (const user of users) {
        if (user.nickName === userNickName) {
            user.avatarsContainer.push(element);
        }
    }
}

// ------------------------------------------------------------------------
// Функция возвращающая результат проверки типа последнего сообщения в чате
// ------------------------------------------------------------------------
function getValueHiddenClass(ulList, nickName) {
    const liList = ulList.querySelectorAll('li'); // найдем все сообщения из списка сообщений

    if (liList.length !== 0) {
        const lastMessage = liList[liList.length - 1];
        const dataNick = lastMessage.dataset.nickname;

        if (dataNick === nickName) {

            return true;
        }
    }

    return false;
}

// -----------------------------------------------------------------
// Функция, возвращающая специальный объект для рендеринга сообщения
// -----------------------------------------------------------------
function getDataMessage(message, options = { me: false, hidden: false }) {
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

// ----------------------------------------------------
// Функция загрузки файла и преобразование его в base64
// ----------------------------------------------------
function uploadFile() {
    const file = changeFile(event); // получим файл изображения

    if (file) { // если файл соотвествует необходимым критериям (см. ф-ию changeFile)
        const reader = new FileReader(); // создадим экземпляр чтения файла

        reader.readAsDataURL(file); // прочитать файл как URL (преобразовать в base64)
        // загрузка (преобразование) завершено
        reader.onload = () => {
            const loadphotoIcon = document.querySelector('.loadphoto__icon');

            loadphotoIcon.src = reader.result; // сохраняем в base64 url
        }
    }
}

// -------------------------------------------
// Функция проверки загружаемого файла аватара 
// -------------------------------------------
function changeFile(event) {
    let file = null;

    try {
        file = event.target.files[0]; // если файл получен из диалогового окна
    } catch (error) {
        file = event.dataTransfer.files[0]; // если файл получен методом drag&drop
    }

    if (file) {
        // проверим тип файла, должен быть JPEG
        if (file.type !== 'image/jpeg') {
            alert('Можно загружать только JPG-файлы');

            return;
        }
        // если файл больше 512 Кб
        if (file.size / 1024 > 512) {
            alert('Для загрузки используйте файлы изображений менее 512 Кб');

            return;
        }
    }

    return file;
}


// ----------------------------
// Функция рендеринга сообщения
// ----------------------------
export function renderMessage(message, {fragmentContainer, me, users}) {
    const chatList = document.querySelector('#chatList'); // контейнер сообщений
    const messageTemplate = document.querySelector('#message').textContent; // шаблон сообщения
    const render = Handlebars.compile(messageTemplate); // создадим функцию-рендер html-содержимого

    let hidden = false; // признак скрытия аватарки пользователя

    hidden = getValueHiddenClass(chatList, message.nickName); // определить - стоит ли скрывать аватар в зависимости от последнего сообщения

    fragmentContainer.innerHTML = render(getDataMessage(message,
        {
            me: (message.nickName === me.nickName) ? 'me' : '',
            hidden: hidden
        }
    ));

    chatList.insertAdjacentHTML('beforeend', fragmentContainer.innerHTML);

    if (chatList.children.length !== 0) {
        const imageElement = chatList.lastElementChild.querySelector('.messages__icon'); // елемент для добавления в контейнер аватарок пользователя
        
        pushAvatarElementInContainer(users, message.nickName, imageElement); // запомнить элемент-изображения в контейнере изображений аватара пользователя
    }

    const mainContent = document.querySelector('.main__content');
    mainContent.scrollTop = mainContent.scrollHeight;
}

// ---------------------------------------
// Функция рендеринга списка пользователей
// ---------------------------------------
export function renderUsers({users, me, fragmentContainer}) {
    const memberList = document.getElementById('membersList'); // контейнер пользователей
    const userTemplate = document.querySelector('#members').textContent; // шаблон пользователя
    const render = Handlebars.compile(userTemplate); // создадим функцию-рендер html-содержимого

    // сбросим список пользователей в чате
    memberList.innerHTML = '';

    // переберем список пользователей и этрендерим аватары
    users.forEach(user => {
        if (user.nickName === me.nickName) {
            user.avatar = me.avatar;
        }

        fragmentContainer.innerHTML = render(getDataUser(user));
        memberList.insertAdjacentHTML('beforeend', fragmentContainer.innerHTML);

        // запомним элемент-изображение в контейнер аватарок пользователя
        const imageElement = memberList.lastElementChild.querySelector('.members__icon'); // найдем последний элемент в списке
        
        pushAvatarElementInContainer(users, user.nickName, imageElement);
    });

    // отрисуем количество пользователей в чате
    renderQuantityUsers({fragmentContainer, users});
}

// ------------------------------------------------------------------------
// Функция рендеринга списка найденных пользователей по ключевой строке str
// ------------------------------------------------------------------------
export function renderFindedUsers(str) {
    const memberList = document.getElementById('membersList'); // контейнер пользователей
    const userTemplate = document.querySelector('#members').textContent; // шаблон искомого пользователя
    const render = Handlebars.compile(userTemplate); // создадим функцию-рендер html-содержимого

    // найдем пользователя с ником или фио, соответствующих строке str
    const findedUsers = users.filter(user => isMatching(user.name, str) || isMatching(user.nickName, str));

    // сбросим список пользователей в чате
    memberList.innerHTML = '';

    // добавим найденных пользователей в список
    findedUsers.forEach(user => {
        fragmentContainer.innerHTML = render(getDataUser(user));
        memberList.insertAdjacentHTML('beforeend', fragmentContainer.innerHTML);
    });
}

// -------------------------------------------
// Функция рендеринга количества пользователей
// -------------------------------------------
function renderQuantityUsers({fragmentContainer, users}) {
    const usersQuantity = document.getElementById('usersQuantity'); // контейнер количества пользователей
    const qMembers = document.querySelector('#qmembers').textContent; // шаблон 
    const render = Handlebars.compile(qMembers); // создадим функцию-рендер html-содержимого

    fragmentContainer.innerHTML = render({ usersQuantity: users.length, ending: getEnding(users.length) });
    usersQuantity.innerHTML = fragmentContainer.innerHTML;
}

// ----------------------------------
// Функция рендеринга попапа настроек
// ----------------------------------
export function renderOptionsPopup({me, webSocket}) {
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
            target.classList.contains('fas')) {
            hidePopup(optionsPopup); // скрыть опции
            workWithLoadPhotoPopup({me, webSocket}); // перейти к работе с аватаром пользователя
        }
    });

    optionsWrapper.innerHTML = render({ name: me.name, avatar: me.avatar });

    showPopup(optionsPopup); // показать опции
}

// ------------------------------------------------------
// Функция работы с попапом загрузки аватара пользователя
// ------------------------------------------------------
function workWithLoadPhotoPopup({me, webSocket}) {
    const loadPhotoPopup = document.querySelector('#loadhoto'); // попап загрузки аватара
    const loadPhotoImageContainer = document.getElementById('loadPhotoImage'); // контейнер
    const loadPhotoIconTemplate = document.querySelector('#loadPhotoIcon').textContent;
    const render = Handlebars.compile(loadPhotoIconTemplate); // создадим функцию-рендер html-содержимого

    loadPhotoImageContainer.innerHTML = render({ path: me.avatar });

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

// -------------------------------
// Функция, скрывающая попап popup
// -------------------------------
export function hidePopup(popup) {
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
export function showPopup(popup) {
    if (popup.classList.contains('hidden')) {
        popup.classList.remove('hidden');
        if (!popup.classList.contains('show')) {
            popup.classList.add('show');
        }
    }
}

// -------------------------------------------------------------------
// Функция рендеринга аватарок на всех элементах картинок пользователя
// -------------------------------------------------------------------
export function renderAllAvatars(messageFromServer, {users}) {
    for (const user of users) {
        user.avatar = messageFromServer.users[user.nickName].avatar;
        user.repaintAllAvatars(user.avatar);
    }
}