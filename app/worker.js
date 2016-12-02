
function sendClientMessage(message) {
  self.clients.matchAll().then(function(clients) {
          clients.forEach(function(client) {
              client.postMessage({
                  "type": "FROM_WORKER",
                  "message": message
              });
          })
      });
}

self.addEventListener('install', function(event) {
  // We don't have anything special to install;
  // nothing will actually be cached with this
  // EventWorker, we are just using it to
  // intercept packets

  // No need to wait for the client to refresh
  // before activating
  return self.skipWaiting();
});

self.addEventListener('fetch', function(event) {
  // Log request which we have the ability to redirect
  console.log("Logged Intercepted Request: " + event.request.url);
  // If the requested file has a non-standard port, let's let it pass
  // without going through the anonymizing network. This will temporarily
  // be used to prevent the page from intercepting itself loading.
  // REMOVE THIS BEFORE PRODUCTION, CHANGING TO IGNORE LOCALHOST INSTEAD

  var client = "";

  clients.matchAll({includeUncontrolled : false, type : "window"}).then(function(clients) {
    console.log("Num clients: " + clients.length);
    for(var i = 0 ; i < clients.length ; i++) {
      client = clients[i].url;
    }
  });
  console.log("Client:" + client);

  var regex_index = new RegExp(":[0-9]{1,6}\/?$");
  var regex_js = new RegExp(".js");
  var regex_css = new RegExp(".css");
  if (regex_index.test(event.request.url) || regex_js.test(event.request.url) || regex_css.test(event.request.url)) {
    event.respondWith(
      fetch(event.request)
    );
  } else {

    sendClientMessage("A message from the worker...");

    event.respondWith(
      new Response('<h2>Success</h2><p>The ServiceWorker successfully intercepted the web request - this page can be routed through the Tor-like network.</p>', {
        headers: { 'Content-Type': 'text/html' }
      })
    );

  }
});

self.addEventListener('message', function(event) {
  console.log("Worker got messsage from page.");
});
