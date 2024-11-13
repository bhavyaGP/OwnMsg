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

// Request notification permission when the page loads
if (Notification.permission === 'default') {
    Notification.requestPermission();
}

// Function to show a notification
function showNotification(title, body) {
    if (Notification.permission === 'granted') {
        new Notification(title, { body });
    }
}

const autoScroll = () => {
    const $newMessage = $messages.lastElementChild;

    const newMessageStyle = getComputedStyle($newMessage);
    const newMessageMargin = parseInt(newMessageStyle.marginBottom);
    const newMessageHeight = $newMessage.offsetHeight + newMessageMargin;

    const visibleHeight = $messages.offsetHeight;
    const containerHeight = $messages.scrollHeight;
    const scrollOffset = $messages.scrollTop + visibleHeight;

    if (containerHeight - newMessageHeight <= scrollOffset) {
        $messages.scrollTop = $messages.scrollHeight;
    }
};

socket.on('message', (message) => {
    console.log(message.text);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createdAt: moment(message.createdAt).format('kk:mm a'),
    });
    const htmlObject = document.createElement('div');
    htmlObject.innerHTML = html;
    htmlObject.setAttribute('class', 'message');
    $messages.insertAdjacentElement('beforeend', htmlObject);
    
    // Show a notification for a new message
    showNotification(message.username, message.text);

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
    
    // Show a notification for location sharing
    showNotification(urlOb.username, 'Shared a location');

    autoScroll();
});

socket.on('roomData', ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, { room, users });
    $sidebar.innerHTML = html;
});

$messageForm.addEventListener('submit', (e) => {
    e.preventDefault();
    $messageFormButton.setAttribute('disabled', 'disabled');

    const message = e.target.elements.message.value;

    socket.emit('sendMessage', message, (error) => {
        $messageFormButton.removeAttribute('disabled');
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return console.log(error);
        }
        console.log("Message delivered!!");
    });
});

$locationButton.addEventListener('click', () => {
    $locationButton.setAttribute("disabled", "disabled");

    if (!navigator.geolocation) {
        return alert("Your browser does not support location sharing!");
    }

    navigator.geolocation.getCurrentPosition((position) => {
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
    });
});

socket.emit('join', { username, room }, (error) => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
