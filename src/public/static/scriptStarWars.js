// CORS workaround
document.addEventListener("htmx:configRequest", (evt) => {
	evt.detail.headers = [];
   });
 
	 // JSON raw data to named array (results)
	 htmx.defineExtension('client-side-templates', {
	
		 transformResponse : function(text, xhr, elt) {
			 const requestType = elt.getAttribute('hx-type');
			 if(requestType === 'JSON'){
				 const nunjucksTemplate = htmx.closest(elt, "[nunjucks-template]");
				 if (nunjucksTemplate) {
					 const data = {
						 results: JSON.parse(text)
					 };
					 const templateName = nunjucksTemplate.getAttribute('nunjucks-template');
					 const template = htmx.find('#' + templateName);
					 return nunjucks.renderString(template.innerHTML, data);
				 }
				 return text;
			 }
		 }
	 });