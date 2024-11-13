const socket = io();

// Elements
const $messageForm = document.querySelector('#message-form');
const $messageFormInput = $messageForm.querySelector('input');
const $messageFormButton = $messageForm.querySelector('#submitButton');
const $locationButton = document.querySelector('#send-location');
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// Templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector("#location-message-template").innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {ignoreQueryPrefix: true});

const autoScroll = () => {
    // New message content
    const $newMessage = $messages.lastElementChild

    // height of new message
    const newMessageStyle = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyle.marginBottom)
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    // visible height
    const visibleHeight = $messages.offsetHeight;

    // container height
    const containerHeight = $messages.scrollHeight;

    // how far have I scrolled?
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset){
        $messages.scrollTop = $messages.scrollHeight
    }
}


socket.on('message', (message) => {
    console.log(message.text);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('kk:mm a'),
    });
    const htmlObject = document.createElement('div');
    htmlObject.innerHTML = html
    htmlObject.setAttribute('class', 'message');
    $messages.insertAdjacentElement('beforeend', htmlObject);
    autoScroll();
});

socket.on('locationMessage', (urlOb) => {
    console.log(urlOb);
    const locationLink = Mustache.render(locationMessageTemplate, {
        username: urlOb.username,
        url: urlOb.url,
        createdAt: moment(urlOb.createdAt).format('kk:mm a'),
    });
    const urlObject = document.createElement('div');
    urlObject.innerHTML = locationLink;
    urlObject.setAttribute('class', 'message');
    $messages.insertAdjacentElement('beforeend', urlObject);
    autoScroll();
});

socket.on('roomData', ({ room, users}) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    })
    const htmlOb = document.createElement('div');
    htmlOb.innerHTML = html;
    // $sidebar.insertAdjacentElement()
    $sidebar.innerHTML = html;
})


$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();

    $messageFormButton.setAttribute('disabled', 'disabled');
    const message = e.target.elements.message.value;
    // console.log(message);
    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log("message delivered!!");
    });
});

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute("disabled", "disabled");
    if (!navigator.geolocation) {
        return alert("Does not Support Location Your Browser!!");
    }

    navigator.geolocation.getCurrentPosition((position) => {
        // console.log(position.coords.latitude);
        socket.emit('sendLocation', {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
        }, (error) => {
            $locationButton.removeAttribute('disabled');
            if (error) {
                return console.log(error);
            }

            console.log("Location shared!");
        });
        // socket.emit('sendLocation', position);
    });
});

socket.emit('join', { username, room}, (error) => {
    if (error){
        alert(error);
        location.href = "/";
    }
});