(function () {
    var current = location.pathname.split('/')[1];
    if (current === "") return;
    var menuItems = document.querySelectorAll('.nav-item a');
    for (var i = 0, len = menuItems.length; i < len; i++) {
        if (menuItems[i].getAttribute("href").indexOf(current) !== -1) {
            menuItems[i].className += "is-active";
        }
    }
})();
//* <li class="nav-item">
//<a href="#">Home</a>
//</li> */}
// var navItems = document.querySelectorAll(".nav-item");
//             for (var i = 0; i < navItems.length; i++) {
//                 console.log('i ', i)
//                 // this.classList.delete("active");
//                 //     var elements = navItems[i].querySelector(".active");
//                 // console.log('elements ',elements) if(elements !==null){ elements.classList.remove("active"); } var element =
//                 // navItems[i].classList.getElementById("active"); ,navItems[i]
//                 // navItems[i].classList.remove("nav-item.active"); navItems[i].removeEventListener("click", active)
//                 navItems[i].addEventListener("click", function () { // console.log('ii ',i)
//                     this.classList.add("active");
//                 });
//             }