const chatForm = document.getElementById('chat-form');
const chatMessages = document.querySelector('.chat-messages');
const roomName = document.getElementById('room-name');
const userList = document.getElementById('users');
var mark=0;
let timeOut;
var word;
const MAX_WAITING=60000;
var i=0;
var m=0;
var timer;
var timeset;


const socket = io();

// Get username and room from URL
const { username, rooms } = Qs.parse(location.search, {
  ignoreQueryPrefix: true
});

// Join chatroom
socket.emit('joinRoom', { username, rooms });

// Get room and users
socket.on('roomUsers', ({ rooms, users }) => {
  outputRoomName(rooms);
  outputUsers(users);
});

socket.on('start_timer',()=>{
  clearInterval(timeset);
 countdown();
});


//timer
function startTimer(duration, display) {
    timer = duration;
    var  seconds;
 timeset= setInterval(function () {
        //minutes = parseInt(timer / 60, 10)
        seconds = parseInt(timer % 60, 10);

       // minutes = minutes < 10 ? "0" + minutes : minutes;
        seconds = seconds < 10 ? "0" + seconds : seconds;

        display.textContent =  seconds;

        if (--timer < 0) {
            timer = duration;
        }
    }, 1000);
}


function countdown() {
    Minutes = 59 * 1,
        display = document.getElementById("timer-display");
    startTimer(Minutes, display);
};

//next_turn
function next_turn(){
if(i==0){
  socket.emit('score', 0 );
  socket.emit('servermsg', 'New game begins');
}

i++;

//timer
socket.emit('set_time');

if(i!=6)
{
  var quote=[
 "injection", "jackfruit", "furniture", "pumpkin", "knife", "parrot", "cough", "rabbit", "serial", "hammer", 
 "window", "remote", "platinum", "speaker", "book", "candle", "cylinder", "medicine", "handbag","lab",  
 "magic", "karate", "horse", "dance", "keyboard", "matchbox", "balloon", "rain", "breakfast", "hut", 
 "river", "stick", "mirror", "zoo", "watchman", "telephone", "guitar", "tubelight", "grinder", "stumps", 
 "football", "mustache", "clock", "camera", "tree", "restaurant", "bridge", "key", "star", "mountain",
 "police", "top", "tap", "subway", "stadium", "hibiscus", "certificate", "fingerprint", "treadmill", "captain",
 "cupboard", "waterfall", "umpire", "house", "temple", "school", "towel", "theatre", "park", "election",
  "pilot", "atm", "agriculture", "sanitizer", "radio"
    ]
  var randomnumber= Math.floor(Math.random()*(quote.length));
  word=quote[randomnumber];
  document.getElementById("word-display").innerHTML=word;
}

      triggerTimeout();
}

function triggerTimeout(){
     timeOut = setTimeout(()=>{
              if(i!=6)
              {
                  next_turn();
              }

              },MAX_WAITING);
             if(i==6)
             {
                 
                  socket.emit('score', 'Winning Percentage '+m+'%');
                  word="###";
                  setTimeout(()=>{
                     location.reload();
                     socket.emit('score', 0 );
                  },15000);
             }
    
}

  

//send button
socket.on('send_button',()=>{

var btnn=document.createElement("button");
btnn.innerHTML="Send";
btnn.className="send";
var body=document.getElementById("send_button");
body.appendChild(btnn);

});

//word display button
socket.on('button',()=>{

var btn=document.createElement("button");
btn.innerHTML="Start/Skip";
btn.className="chat-button";
var body=document.getElementById("chat-button");
body.appendChild(btn);

btn.addEventListener( 'click', function( e ) {
e.preventDefault(); // prevent page reloading
if(i!=6)
{
   clearTimeout(timeOut);
   next_turn();
}
if(i==6)
{
  
   socket.emit('score', 'Winning Percentage '+m+'%');
   word="###";
   setTimeout(()=>{
       location.reload();
       socket.emit('score', 0);
     },15000);
}


});
});

// Message submit



chatForm.addEventListener('submit', e => {
  e.preventDefault();

  // Get message text
 const msg = e.target.elements.msg.value;
 //restricting player(one who acts) to reveal the answer
if(msg==word)
{
 socket.emit('no');
}


else{
// Emit message to server
 socket.emit('chatMessage', msg);}
  // Clear input
  e.target.elements.msg.value = '';
  e.target.elements.msg.focus();
});
//markdisplay
socket.on('mark', mark => {

  document.getElementById("mark-display").innerHTML=mark;
});




// Message from server
socket.on('message', message => {
if(message.text==word)
{
socket.emit('servermsg', 'correct answer...next word triggered');
word="###";
mark++;
m=(mark/5)*100;
socket.emit('score', mark);
if(i!=6)
{
   clearTimeout(timeOut);
   next_turn();
}
if(i==6)
{
  
socket.emit('score', 'Winning Percentage '+m+'%');
word="###";
setTimeout(()=>{
       location.reload();
       socket.emit('score', 0);
      },15000);
}

}
else
{
  console.log(message);
  outputMessage(message);
}

  // Scroll down
  chatMessages.scrollTop = chatMessages.scrollHeight;
});


// Output message to DOM
function outputMessage(message) {
  const div = document.createElement('div');
  div.classList.add('message');
  div.innerHTML = `<p class="meta">${message.username} </p>
  <p class="text">
    ${message.text}
  </p>`;
  document.querySelector('.chat-messages').appendChild(div);
}

// Add room name to DOM
function outputRoomName(rooms) {
  roomName.innerText = rooms;
}

// Add users to DOM
function outputUsers(users) {
  userList.innerHTML = `
    ${users.map(user => `<li>${user.username}</li>`).join('')}
  `;
}


//video code goes here

if (!location.hash) {
//assigning roomname to location.hash
  location.hash = rooms;
}
const roomHash = location.hash;

// TODO: Replace with your own channel ID
const drone = new ScaleDrone('2xmbUiTsqTzukyf7');
// Room name needs to be prefixed with 'observable-'
const roomname = 'observable-' + roomHash ;
const configuration = {
  iceServers: [{
    urls: 'stun:stun.l.google.com:19302'
  }]
};
let room;
let pc;


function onSuccess() {};
function onError(error) {
  console.error(error);
};

drone.on('open', error => {
  if (error) {
    return console.error(error);
  }
  room = drone.subscribe(roomname);
  room.on('open', error => {
    if (error) {
      onError(error);
    }
  });
// players connected to the room and received an array of 'members' connected to the room (including us).
// Signaling server is ready.
  room.on('members', members => {
    console.log('MEMBERS', members);
// If we are the second player to connect to the room we will be creating the offer
    const isOfferer = members.length === 2;
    startWebRTC(isOfferer);
  });
});

// Send signaling data via Scaledrone
function sendMessage(message) {
  drone.publish({
    room: roomname,
    message
  });
}

function startWebRTC(isOfferer) {
  pc = new RTCPeerConnection(configuration);

  // 'onicecandidate' notifies us whenever an ICE agent needs to deliver a
  // message to the other peer through the signaling server
  pc.onicecandidate = event => {
    if (event.candidate) {
      sendMessage({'candidate': event.candidate});
    }
  };

  // If user is offerer let the 'negotiationneeded' event create the offer
  if (isOfferer) {
    pc.onnegotiationneeded = () => {
      pc.createOffer().then(localDescCreated).catch(onError);
    }
  }

  // When a remote stream arrives display it in the #remoteVideo element
  pc.onaddstream = event => {
    remoteVideo.srcObject = event.stream;
  };

  navigator.mediaDevices.getUserMedia({
    audio: true,
    video: true,
  }).then(stream => {
    // Display your local video in #localVideo element
    localVideo.srcObject = stream;
    // Add your stream to be sent to the conneting peer
    pc.addStream(stream);
  }, onError);

  // Listen to signaling data from Scaledrone
  room.on('data', (message, client) => {
    // Message was sent by us
    if (client.id === drone.clientId) {
      return;
    }

    if (message.sdp) {
      // This is called after receiving an offer or answer from another peer
      pc.setRemoteDescription(new RTCSessionDescription(message.sdp), () => {
        // When receiving an offer lets answer it
        if (pc.remoteDescription.type === 'offer') {
          pc.createAnswer().then(localDescCreated).catch(onError);
        }
      }, onError);
    } else if (message.candidate) {
      // Add the new ICE candidate to our connections remote description
      pc.addIceCandidate(
        new RTCIceCandidate(message.candidate), onSuccess, onError
      );
    }
  });
}

function localDescCreated(desc) {
  pc.setLocalDescription(
    desc,
    () => sendMessage({'sdp': pc.localDescription}),
    onError
  );
}
