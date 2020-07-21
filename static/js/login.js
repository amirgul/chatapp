window.onload = init1;
function init1(){
  // Prevent submitting login credentials on pressing enter
  document.querySelector('#login-form').onkeypress = function(e) {
    var key = e.charCode || e.keyCode || 0;
    if (key == 13) {
      e.preventDefault();
    }
  }
  if ( ("username" in localStorage) && ("chname" in localStorage) ){
    document.querySelector('#username').value = localStorage.getItem('username');
    document.querySelector('#channelname').value = localStorage.getItem('chname');
    console.log("submitting EXISTING data.", localStorage.getItem('username'),localStorage.getItem('chname'));
    console.log("automatically logging in because there is data in localStorage");
    document.querySelector('#login-form').submit();
  }
}

function submitForm(){
  var n_uname = document.querySelector('#username').value;
  var n_chname = document.querySelector('#channelname').value;

  // OPTIONAL: Verify that this user does noet exist yet, so all users are unique
  if(n_uname=="javier"){
    var error_msg = "error: <span style='color:#d39a5a;'>username already exists</span>";
    document.querySelector('#login-error-container').innerHTML = error_msg;
    console.log("user exists. No submit and localStorage is empty", n_uname,n_chname);
  }
  else{
    localStorage.setItem('username',n_uname);
    localStorage.setItem('chname', n_chname);
    console.log("submitting new username!");
    document.querySelector('#login-form').submit();
  }
}
