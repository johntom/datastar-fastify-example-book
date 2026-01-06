on('nav li', 'click', event => {
    takeClass(event.target.closest('li'), ['nav-active']);
});

function on(selector, event, cb) {
    document.querySelectorAll(selector).forEach(el => {
        el.addEventListener(event, cb);
    });
}

function takeClass(el, classNames) {
    Array.from(el.parentElement.children).forEach(child => {
        child.classList.remove(classNames);
        child === el && child.classList.add(classNames);
    });
}
