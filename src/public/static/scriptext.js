
htmx.defineExtension('client-side-templates', {
    transformResponse: function (text, xhr, elt) {
      var mustacheTemplate = htmx.closest(elt, "[mustache-template]");
      if (mustacheTemplate) {
        var data = JSON.parse(text);
  
        data = { results: data };// works
        console.log('mustache data', data)
        var templateId = mustacheTemplate.getAttribute('mustache-template');
        var template = htmx.find("#" + templateId);
        console.log(template);
        if (template) {
          return Mustache.render(template.innerHTML, data);
        } else {
          throw "Unknown mustache template: " + templateId;
        }
      }
  
  
      var handlebarsTemplate = htmx.closest(elt, "[handlebars-template]");
      if (handlebarsTemplate) {
        var data = JSON.parse(text);
        var templateName = handlebarsTemplate.getAttribute('handlebars-template');
        return Handlebars.partials[templateName]({ "data": data });
      }
   
      var nunjucksTemplate = htmx.closest(elt, "[nunjucks-template]");
      if (nunjucksTemplate) {
        var data = JSON.parse(text);
        data = { results: data };// works
        console.log('data', data)
        var templateName = nunjucksTemplate.getAttribute('nunjucks-template');
        // if (templateName==='tmp')  return text;
        console.log('templateName', templateName)
        var template = htmx.find('#' + templateName);
        console.log('template', template)
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