
;function closeModal() {
	var container = document.getElementById("modals-here")
	var backdrop = document.getElementById("modal-backdrop")
	var modal = document.getElementById("modal")

	modal.classList.remove("show")
	backdrop.classList.remove("show")

	setTimeout(function() {
		container.removeChild(backdrop)
		container.removeChild(modal)
	}, 200)
}

  function closeModal2() {
	var container = document.getElementById("modals-here2")
	var backdrop = document.getElementById("modal-backdrop")
	var modal = document.getElementById("modal")

	modal.classList.remove("show")
	backdrop.classList.remove("show")

	setTimeout(function() {
		container.removeChild(backdrop)
		container.removeChild(modal)
	}, 200)
}

window.document.getElementById("showButton").addEventListener("htmx:afterOnLoad", function() {
	setTimeout(function(){
		window.document.getElementById("modal").classList.add("uk-open")
	}, 10)
})


// This triggers the fade-out animation when the modal is closed.
window.document.getElementById("cancelButton").addEventListener("click", function() {
	window.document.getElementById("modal").classList.remove("uk-open")
	setTimeout(function(){
		window.document.getElementById("modals-here").innerHTML = ""
		,200
	})
})
UIkit.util.on('#js-modal-dialog', 'click', function (e) {
       e.preventDefault();
       e.target.blur();
       UIkit.modal.dialog('<p class="uk-modal-body">UIkit dialog!</p>');
   });

   UIkit.util.on('#js-modal-alert', 'click', function (e) {
       e.preventDefault();
       e.target.blur();
       UIkit.modal.alert('UIkit alert!').then(function () {
           console.log('Alert closed.')
       });
   });

   UIkit.util.on('#js-modal-confirm', 'click', function (e) {
       e.preventDefault();
       e.target.blur();
       UIkit.modal.confirm('UIkit confirm!').then(function () {
           console.log('Confirmed.')
       }, function () {
           console.log('Rejected.')
       });
   });

   UIkit.util.on('#js-modal-prompt', 'click', function (e) {
       e.preventDefault();
       e.target.blur();
       UIkit.modal.prompt('Name:', 'Your name').then(function (name) {
           console.log('Prompted:', name)
       });
   });

   document.body.addEventListener('configRequest.htmx', function(evt) {
    // try to remove x-hx-* headers because gist api complains about CORS
    Object.keys(evt.detail.headers).forEach(function(key) {
      delete evt.detail.headers[key];
    });
  });
document.body.addEventListener('htmx:configRequest', e => {
  Object.keys(e.detail.headers).forEach(function (key) {
    delete e.detail.headers[key];
  });
})()
