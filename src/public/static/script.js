(function(){
	htmx.defineExtension('bs-tabs', {
		onEvent: function (name, evt) {
			if (name === "htmx:beforeRequest") {
				if(evt.detail.target.hasChildNodes()){
					// stop request
					return false;
				}
			}

			if (name === "htmx:afterProcessNode") {
				let allLinks = htmx.findAll(htmx.find('[hx-ext="bs-tabs"]'), '.nav-link');
				allLinks.forEach(triggerEl => {
					if(!triggerEl.hasAttribute('data-bs-target')){
						triggerEl.setAttribute('data-bs-target', triggerEl.getAttribute('hx-target'));
					}
					triggerEl.setAttribute('data-bs-toggle', 'tab');
				});
			}
			return true;
		}
	});
})();