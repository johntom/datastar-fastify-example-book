;document.body.addEventListener("book-updated",
    function (evt) {
        alert("book updated")
    })
 document.body.addEventListener('sse:book_complete', function (evt) {
  alert("book_complete updated")
        //* If a JSON string was sent, leave it as it is 
        evt.detail.elt.setAttribute("hx-vals", evt.detail.data);

        //* if not
        //var msg = {};
        //msg.orderId = evt.detail.data;   
        //evt.detail.elt.setAttribute("hx-vals", JSON.stringify(msg));
    });
    function closeModal() {
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
      }(function () {
        const modal = new bootstrap.Modal(document.getElementById("modal"))
      
        htmx.on("htmx:afterSwap", (e) => {
          // Response targeting #dialog => show the modal
          if (e.detail.target.id == "dialog") {
            modal.show()
          }
        })
      })
      
        htmx.on("htmx:beforeSwap", (e) => {
          // Empty response targeting #dialog => hide the modal
          if (e.detail.target.id == "dialog" && !e.detail.xhr.response) {
            modal.hide()
            e.detail.shouldSwap = false
          }
        })
      
        // Remove dialog content after hiding
        htmx.on("hidden.bs.modal", () => {
          // document.getElementById("dialog").innerHTML = ""
        })
      
      
      ()