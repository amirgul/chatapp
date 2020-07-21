window.onresize = refreshPage;
var colors = ["#d39a5a","#ef616d","#d565dd", "#aaada5","#4eaceb"];
var current_section = "messages"; // channels users
const socket = io({transports: ['websocket'] });
socket.connect(location.protocol + '//' + document.domain + ':' + location.port);

// on reconnection, reset the transports option, as the Websocket
// connection may have failed (caused by proxy, firewall, browser, ...)
socket.on('reconnect_attempt', () => {
  socket.io.opts.transports = ['polling', 'websocket'];
});

//io.connect(location.protocol + '//' + document.domain + ':' + location.port); //ONLINE 'http://' + document.domain + ':' + location.port); // ORIGINAL EDX(location.protocol + '//' + document.domain + ':' + location.port);
// When connected, configure buttons
// socket.on('connect', () => {
//   socket.emit('mano shake', {'message': `${localStorage.getItem('username')} IS CONNECTED!`});
// });
// When a new message is announced, add to the unordered list
socket.on('emit messages', data => {
  let ech = data["emitCH"];
  let emsg = data["emitMSG"];
  if(localStorage.getItem('chname')==ech ){
    update_msg_list(emsg);
    loadUsersOfChannel(emsg);
}
});
// When a new cahnnel is announced/deleted, update the list of channels
socket.on('emit channels', data => {
  document.querySelector('#channel-list-predef').innerHTML = "";
  document.querySelector('#channel-list-usr').innerHTML = "";
  data.forEach(add_channel);
});


document.addEventListener('DOMContentLoaded', () => {
    document.title = localStorage.getItem('username')+"@flack";
    document.querySelector('#navbar-uname').innerHTML = localStorage.getItem('username');
    document.querySelector('#navbar-chname').innerHTML = localStorage.getItem('chname');
    $('[data-toggle="tooltip"]').tooltip();
    refreshPage();
    loadChannels();
    setMessageListener();
    load_channel_messages(localStorage.getItem('chname'));
});
function setMessageListener(){
  document.querySelector('#message-input').onkeyup = function(e){
    if(e.keyCode==13){
      sendMessage();
    }
  };
}

function sendMessage(){
  const newMessage = document.querySelector('#message-input').value;
  if(newMessage.length>1){
      let chname = localStorage.getItem('chname');
      let emitCH   = localStorage.getItem('chname');
      let emitUsr  = localStorage.getItem('username');
      let emitMSG = {'msgText':newMessage, 'msgUser':emitUsr};
      socket.emit('submit message', {"emitCH":emitCH, "emitMSG":emitMSG});
    }
  document.querySelector('#message-input').value = "";
}
function create_channel(){
  var nch_name = document.querySelector('#newchname').value;
  var error_msg = "";
  var channelExist = false;
  const request = new XMLHttpRequest();
  request.open('POST', '/channels');
  request.onload = () => {
      var received = JSON.parse(request.responseText);
      for (ch_i of received){
        if(ch_i.chname==nch_name){
          channelExist = true;
        }
      }
      if(channelExist){
        document.querySelector('#newcherror').innerHTML = "channel already exists";
        return;
      }
      else{
        let uname  = localStorage.getItem('username');
        var ch_i = {"chname":nch_name, "chtype":"usr", "chauth":uname};
        // add_channel(ch_i);
        document.querySelector('#collapseOne').classList.remove("show");
        document.querySelector('#newchname').value = "";
        document.querySelector('#newcherror').innerHTML = "";
        socket.emit('submit channel', ch_i);
      }
  };
  const data = new FormData();
  request.send(data);
  return;
}
function loadChannels(){
  document.querySelector('#channel-list-predef').innerHTML = "";
  document.querySelector('#channel-list-usr').innerHTML = "";
  // Open new request to get new posts.
  const request = new XMLHttpRequest();
  request.open('POST', '/channels');
  request.onload = () => {
      const data = JSON.parse(request.responseText);
      data.forEach(add_channel);
  };
  const data = new FormData();
  request.send(data);
  return;
}
function add_channel(ch_i) {
    const ch = document.createElement('div');
    ch.className = 'channel-item-div';

    const s1 = document.createElement('span');
    s1.innerHTML = ch_i.chname;
    s1.id = "channel-"+ch_i.chname;
    s1.className = 'channel-item';
    s1.classList.add(`channel-list-${ch_i.chtype}`);
    let cname = localStorage.getItem('chname');
    if(ch_i.chname==cname){
      s1.classList.add(`channel-selected`);
      document.querySelector('#navbar-chname').innerHTML=ch_i.chname;
    }

    ch.append(s1);
    let uname = localStorage.getItem('username');
    if(ch_i.chauth==uname){
      const s2 = document.createElement('span');
      s2.setAttribute("data-toggle","tooltip");
      s2.setAttribute("data-placement", "top");
      s2.setAttribute("data-original-title", "delete channel");
      s2.setAttribute("title", "");
      s2.setAttribute("class", "chtooltip");
      // s2.style.paddingRight = "0.5em"
      s2.style.paddingLeft = "0.5em"

      const a = document.createElement('a');
      const b = document.createElement('button');
      b.className = 'btn btn-outline-dark';
      b.style.color = 'white';
      b.innerHTML = '-';
      b.value = ch_i.chname;
      del_ch_clickable(b); // Add event listener to delete channel on click
      ch.classList.add("channel-item-div-deletable");
      a.append(b);
      s2.append(a);
      ch.append(s2);
    }
    ch_clickable(s1);
    // Insert at the top of the list
    let usrchls = document.querySelector(`#channel-list-${ch_i.chtype}`);
    usrchls.insertBefore(ch, usrchls.childNodes[0]);
    $('[data-toggle="tooltip"]').tooltip();
    // ch.click();
};
function ch_clickable(ch){
  ch.addEventListener('click', function (event) {
        // Clear the messages list                        // ADDED may22; 0:27
        document.querySelector('#messages-list').innerHTML = "";
        cname = event.currentTarget.innerHTML;
        console.log("clicking: ", event.currentTarget);

        localStorage.setItem('chname', cname);
        document.querySelector('#navbar-chname').innerHTML=cname;
        document.querySelectorAll('.channel-item').forEach(function(ch_i){
          ch_i.classList.remove(`channel-selected`);
        });
        event.currentTarget.classList.add(`channel-selected`);
        load_channel_messages(localStorage.getItem('chname'));
        var window_w = window.innerWidth;
        if(window_w<550){
          messagesSection();
        }
    });
}
function del_ch_clickable(b_i){
  b_i.addEventListener('click', function (event) {
        const ch_to_delete = event.currentTarget.value;
        console.log("DEL click: ", event.currentTarget);
        socket.emit('delete channel', ch_to_delete);
        localStorage.setItem('chname', 'Default');
        // refreshPage();
        loadChannels();
        // setMessageListener();
        load_channel_messages(localStorage.getItem('chname'));

    });
}

function load_channel_messages(ch_name){
  // Open new request to get channel messages
  const request = new XMLHttpRequest();
  request.open('POST', '/get_messages');
  request.onload = () => {
      const data = JSON.parse(request.responseText);
      update_msg_list(data);
      loadUsersOfChannel(data);
  };
  const data = new FormData();
  data.append('chnl', ch_name);
  request.send(data);
}




function update_msg_list(msgList){
  document.querySelector('#messages-list').innerHTML = "";
  //************************************* Get list of users in message list
  var users = [];
  var uname = localStorage.getItem('username');
  // Get list of users in currentchannel given a list of all messages
  for (msg of msgList){
    if(!(users.includes(msg.msgUser)) && msg.msgUser!=uname ){
      users.push(msg.msgUser);
    }
  }
  //*************************************
  for (m_i of msgList){
    addMessage(m_i, users);
  }
  var msglst = document.querySelector('#msg-list-wrapper');
  msglst.scrollTop = msglst.scrollHeight;
}

function addMessage(m_i, users){
  let uname  = localStorage.getItem('username');
  const msg_class = (m_i.msgUser==uname ? 'mine': 'theirs');
  const msg_uname = (m_i.msgUser==uname ? 'me': m_i.msgUser);
  const uname_color = (m_i.msgUser==uname ? '#8fee00': colors[users.indexOf(m_i.msgUser)%colors.length]);
  let the_date = new Date(m_i.msgTime+' UTC');
  the_date = (the_date.getMonth()+1).toString()+"/"+the_date.getDate()+" "+the_date.getHours()+":"+the_date.getMinutes();
  document.querySelector('#messages-list').innerHTML += `<div class='message-item message-${msg_class}'><span class="msg-usrn" style='color:${uname_color};'>${msg_uname} </span><br><span class='msg_content'>${m_i.msgText}</span><br><span class="msg-time"> ${the_date}</span></div>`;
}

function loadUsersOfChannel(data){
  //************************************* Get list of users in message list
  var users = [];
  var uname = localStorage.getItem('username');
  // Get list of users in currentchannel given a list of all messages
  for (msg of data){
    if(!(users.includes(msg.msgUser))){
      users.push(msg.msgUser);
    }
  }
  //*************************************
  document.querySelector('#users-list').innerHTML = "";
  for (u_i of users){
    if(u_i==uname){
      document.querySelector('#users-list').innerHTML += `<span class="msg-usrn" style='color:#aab1c0;'>${uname} (me)</span><br>`;
    }
    else{
    const uname_color = "#aab1c0"; //colors[users.indexOf(u_i)%colors.length];
    document.querySelector('#users-list').innerHTML += `<span class="msg-usrn" style='color:${uname_color};'>${u_i}</span><br>`;
  }
  }
}
function refreshPage(){
  adjustHeights();
  var window_w = window.innerWidth;
  if(window_w<550){
    messagesSection();
  }
  else{
    document.querySelector('#channels-containers').style.display = "block";
    document.querySelector('#conversation-container').style.display = "block";
    document.querySelector('#users-container').style.display = "block";
  }
}
function adjustHeights(){
  var nav_h = document.querySelector('#home-navigation').offsetHeight;
  document.querySelector('#content-container').style.height = (window.innerHeight-nav_h)+"px"; //maxHeight
  var msi_h = document.querySelector('#message-input-area').offsetHeight;
  document.querySelector('#msg-list-wrapper').style.height = (window.innerHeight-nav_h-msi_h)+"px"; //maxHeight
  var msglst = document.querySelector('#msg-list-wrapper');
  msglst.scrollTop = msglst.scrollHeight;
}

function leftClicked(){
  if(current_section=="messages"){
    channelsSection();
  }
  else if(current_section=="users"){
    messagesSection();
  }
  console.log("current section", current_section);
}
function rightClicked(){
  if(current_section=="messages"){
    usersSection();
  }
  console.log("current section", current_section);
}
function channelsSection(){
  current_section = "channels";
  hideLarrow();
  hideRarrow();
  document.querySelector('#channels-containers').style.display = "block";
  document.querySelector('#conversation-container').style.display = "none";
  document.querySelector('#users-container').style.display = "none";
}
function messagesSection(){
  current_section = "messages";
  showRarrow();
  showLarrow();
  document.querySelector('#channels-containers').style.display = "none";
  document.querySelector('#conversation-container').style.display = "block";
  document.querySelector('#users-container').style.display = "none";
}
function usersSection(){
  current_section = "users";
  showLarrow();
  hideRarrow();
  document.querySelector('#channels-containers').style.display = "none";
  document.querySelector('#conversation-container').style.display = "none";
  document.querySelector('#users-container').style.display = "block";
}


function showLarrow(){
  document.querySelector('#left-arrow').style.visibility="visible";
}
function hideLarrow(){
  document.querySelector('#left-arrow').style.visibility="hidden";
}
function showRarrow(){
  document.querySelector('#right-arrow').style.visibility="visible";
}
function hideRarrow(){
  document.querySelector('#right-arrow').style.visibility="hidden";
}
