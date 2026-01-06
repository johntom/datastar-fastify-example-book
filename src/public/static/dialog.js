;
var data = 3;
   
//printing default value of data that is 0 in h2 tag
document.getElementById("counting").innerText = data;
  
//creation of increment function
function increment() {
    data = data + 1;
    document.getElementById("counting").innerText = data;
}
//creation of decrement function
function decrement() {
    data = data - 1;
    document.getElementById("counting").innerText = data;
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
