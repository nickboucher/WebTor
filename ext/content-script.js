
function sendGET(target) {
  var xhr = new XMLHttpRequest();
  xhr.open("GET", target, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      return xhr.responseText;
    }
  }
  xhr.send();
}

function sendPOST(target, data) {
  var xhr = new XMLHttpRequest();
  xhr.open("POST", target, true);
  xhr.onreadystatechange = function() {
    if (xhr.readyState == 4) {
      return xhr.responseText;
    }
  }
  xhr.send(data);
}

function init() {
  window.addEventListener("message", function(event) {
    // We only accept messages from ourselves
    if (event.source != window)
      return;

    if (event.data.type && (event.data.type == "FROM_PAGE")) {
      //window.postMessage({ type: "FROM_EXTENSION", text: "Hello from the extension content_script!" }, "*");
      console.log("Extension got message from page.")
      window.postMessage({ type: "FROM_EXTENSION", text: "Hello from the extension!" }, "*");
    }
  }, false);
}

init();
