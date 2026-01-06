  htmx.logger = function(elt, event, data) {
      if(console) {
          //console.log(event, elt, data);
      }
  }

// document.body.addEventListener('configRequest.htmx', function(evt) {
//     // try to remove x-hx-* headers because gist api complains about CORS
//     Object.keys(evt.detail.headers).forEach(function(key) { 
//       delete evt.detail.headers[key]; 
//     });
// });

htmx.defineExtension('client-side-templates', {
    transformResponse : function(text, xhr, elt) {
      var nunjucksTemplate = htmx.closest(elt, "[nunjucks-template]");
        // if (nunjucksTemplate) {
        //     var data = {
        //       gists: JSON.parse(text).map((item) => {
        //         // parser : https://codepen.io/localhorst/pen/ZEbqVZd
        //         item.parsed = new leptonParser().parse(item.description);
        //         return item; 
        //       })
        //     };

        //     var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
        //     var template = htmx.find('#' + templateName);
        //     console.log(templateName,data);
        //     return nunjucks.renderString(template.innerHTML, data);
        // }
        // return text;
        var nunjucksTemplate = htmx.closest(elt, "[nunjucks-template]");
        if (nunjucksTemplate) {
          var data = JSON.parse(text);
          data = { results: data };// works
          console.log('data', data)
          var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
          // if (templateName==='tmp')  return text;
          console.log('templateName', templateName)
          var template = htmx.find('#' + templateName);
          console.log('template', template ,'inner',template.innerHTML)
          if (template) {
            console.log('nunjucks', nunjucks)
            return nunjucks.renderString(template.innerHTML, data);
    
          } else {
            return nunjucks.render(templateName, { "data": data });
          }
        }
    
        return text;
      }
    });
   