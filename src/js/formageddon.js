const Formageddon = (() => {
	"use strict";

	/** @type {WeakSet<HTMLFormElement>} - Tracks initialised forms to prevent duplication */
	const forms = new WeakSet();

	/** @type {string[]} - HTML form elements to validate */
	const tags = ["INPUT", "TEXTAREA", "SELECT"];

	/** @type {string[]} - Attributes to be validated */
	const attrs = ["accept", "min", "max", "step", "minlength", "maxlength", "pattern", "required", "data-confirm"];

	/** @type {string[]} - events on which to trigger validation */
	const validationEvents = ["input", "change", "blur"];

	/**
	 * Maps validity errors to attributes containing user defined custom error messages or default error messages.
	 * @type {Record<string, {attr: string, default: string}} - 
	 */
	const errors = {
		valueMissing: { attr: "data-required-err", default: "This field is required." },
		typeMismatch: { attr: "data-type-err", default: "The value is not the correct type." },
		patternMismatch: { attr: "data-pattern-err", default: "The value does not match the required pattern." },
		tooLong: { attr: "data-maxlength-err", default: "The value is too long." },
		tooShort: { attr: "data-minlength-err", default: "The value is too short." },
		rangeOverflow: { attr: "data-max-err", default: "The value is too large." },
		rangeUnderflow: { attr: "data-min-err", default: "The value is too small." },
		stepMismatch: { attr: "data-step-err", default: "The value does not match the step interval." },
		badInput: { attr: "data-type-err", default: "The input value is invalid." },
	};

	/**
	* Validates file inputs with the accept attribute.
	* @param {HTMLInputElement} input - The file input element to validate.
	* @returns {boolean} True if all files match the accept attribute, false otherwise.
	*/
	function isValidAccept(input) {
		const accept = input.getAttribute("accept");
		if (!accept || !accept.trim()) return true;

		const acceptedTypes = accept.split(",").map((s) => s.trim().toLowerCase());
		const files = input.files;
		if (!files.length) return true;

		for (const file of files) {
			const fileType = file.type.toLowerCase();
			const fileName = file.name.toLowerCase();

			const matches = acceptedTypes.some((type) => {
				if (type.startsWith(".")) {
					return fileName.endsWith(type);
				} else if (type.endsWith("/*")) {
					return fileType.startsWith(type.slice(0, -1));
				} else {
					return fileType === type;
				}
			});

			if (!matches) return false;
		}
		return true;
	}

	/**
	* Validates form controls with the data-confirm attribute.
	* @param {HTMLInputElement} input - The form control to validate.
	* @returns {boolean} True if all control matches origin, false otherwise.
	*/
	function isValidConfirm(input) {
		const origin = input.getAttribute("data-confirm");
		if (!origin) return true;

		const originEl = document.querySelector(origin);
		if (!originEl) {
			console.warn(`element not found for data-confirm=${origin}`);
			return false;
		}

		if (!input.required && !input.value.trim()) return true;

		return input.value === originEl.value;
	}

	/**
	* Returns a user defined error message if it exists, otherwise a default error message.
	* @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - The form control to check.
	* @returns {string} The error message string.
	*/
	function getError(input) {
		const value = input.value.trim();

		// validate for type=file accept
		if (value && input.type === "file" && input.hasAttribute("accept")) {
			if (!isValidAccept(input)) {
				return input.getAttribute("data-accept-err") || "Invalid file type.";
			}
		}

		// validate for data-confirm
		if (input.hasAttribute("data-confirm")) {
			if (value && !isValidConfirm(input)) {
				return input.getAttribute("data-confirm-err") || "Values do not match.";
			}
			return "";
		}

		// validate all others
		for (const [key, obj] of Object.entries(errors)) {
			if (input.validity[key]) {
				return input.getAttribute(obj.attr) || obj.default;
			}
		}

		return "";
	}

	/**
	* Returns the element associate with the aria-describedby attribued.
	* @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - The invalid form control.
	* @returns {HTMLElement|null} The HTML element referenced by aria-describedby
	*/
	function getMessageElement(input) {
		const id = input.getAttribute("aria-describedby");
		if (!id) return null;

		const el = document.getElementById(id);
		if (!el) console.warn(`element not found for aria-describedby="${id}"`);

		return el;
	}

	/**
	* Handles invalid input by setting aria-invalid=true and updating the associated error/success message container if
	* it exists.
	* @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - The invalid form control.
	*/
	function handleInvalidInput(input) {
		input.setAttribute("aria-invalid", "true");
		const target = getMessageElement(input);
		if (target) {
			target.classList.add("invalid");
			target.classList.remove("valid");
			target.textContent = getError(input);
		}
	}

	/**
	* Handles valid input by setting aria-invalid=false and updating the associated error/success message container if
	* it exists.
	* @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - The valid form control.
	*/
	function handleValidInput(input) {
		input.setAttribute("aria-invalid", "false");
		const target = getMessageElement(input);
		if (target) {
			target.classList.add("valid");
			target.classList.remove("invalid");
			target.textContent = input.getAttribute("data-success") || "";
		}
	}

	/**
	* Clears validation state from the input and clears the associated error/success message container if it exists.
	* @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - The neutral/non-required form controlled.
	*/
	function clearValidation(input) {
		input.removeAttribute("aria-invalid");
		const target = getMessageElement(input);
		if (target) {
			target.classList.remove("invalid", "valid");
			target.textContent = "";
		}
	}

	/**
	* Handles the disabling of the form submit control if it has the data-submit attribute
	 * @param {HTMLFormElement} form - The form the submit control is within
	 * @param {HTMLInputElement|HTMLButtonElement} submit - The submit control to toggle disabled
	 */
	function handleFormSubmitControl(form, submit) {
		if (form.checkValidity() && form.querySelectorAll("[aria-invalid=true]").length === 0) {
			submit.disabled = false;
		} else {
			submit.disabled = true;
		}
	}

	/**
	* Handles form reset events and clears all validation states and messages.
	 * @param {Event & { target: HTMLFormElement }} event - The reset event.
	 */
	function handleFormReset(event) {
		for (const el of event.target.elements) {
			if (tags.includes(el.tagName)) {
				clearValidation(el);
			}
		}
	}

	/**
	* Validates a form control and sets appropriate aria-invalid and error/success messages.
	* @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - The form control to validate.
	*/
	function validateInput(input) {
		if (input.disabled ||
			(input instanceof HTMLInputElement || input instanceof HTMLTextAreaElement) && input.readOnly) return;

		if (!isValidConfirm(input) || !input.validity.valid) {
			handleInvalidInput(input);
		} else if (!input.value.trim()) {
			clearValidation(input);
		} else {
			handleValidInput(input);
		}
	}

	/**
	* Attaches input validation event listeners.
	* @param {HTMLInputElement|HTMLTextAreaElement|HTMLSelectElement} input - The form control to validate.
	*/
	function applyValidator(input) {
		validationEvents.forEach((event) => input.addEventListener(event, () => validateInput(input)));

		if (input.hasAttribute("data-confirm")) {
			const origin = input.getAttribute("data-confirm");
			if (!origin) {
				console.warn("data-confirm attribute set without origin reference");
				return
			}

			const originEl = document.querySelector(origin);
			if (!originEl) {
				console.warn(`element not found for data-confirm=${origin}`);
				return
			}

			validationEvents.forEach((event) => originEl.addEventListener(event, () => validateInput(input)));
		}
	}


	/**
	 * @param {HTMLFormElement} form 
	 * @param {HTMLInputElement|HTMLButtonElement} submit 
	 */
	function applySubmitValidator(form, submit) {
		if (!["INPUT", "BUTTON"].includes(submit.tagName) || submit.type !== "submit") {
			console.warn("submission button expected to be of type input or button with type=submit")
			return
		}

		handleFormSubmitControl(form, submit);
		validationEvents.forEach((event) => form.addEventListener(event, () => handleFormSubmitControl(form, submit)));
	}

	/**
	 * @param {HTMLFormElement} form - The form element to be validated.
	 */
	function initForm(form) {
		for (const el of form.elements) {
			if (tags.includes(el.tagName) && !el.hasAttribute("data-ignore")) {
				if (attrs.some((attr) => el.hasAttribute(attr))) {
					applyValidator(el);
				}
			}

			if (el.hasAttribute("data-submit")) {
				applySubmitValidator(form, el);
			}

			if (el.type === "reset") {
				form.addEventListener("reset", (event) => handleFormReset(event))
			}
		}
	}

	/**
	* Initialises validation on all forms with the data-validate attribute.
	*/
	function initValidators() {
		document.querySelectorAll("form[data-validate]").forEach((form) => {
			if (forms.has(form)) return;
			initForm(form);
			forms.add(form);
		});
	}

	/**
	* @type {MutationObserver} - Watches for form or form control updates in the DOM.
	*/
	const observer = new MutationObserver((mutationList, _) => {
		const formQueue = new Set();

		for (const mutation of mutationList) {
			for (const node of mutation.addedNodes) {
				if (!(node instanceof HTMLElement)) continue;

				node.querySelectorAll("*").forEach((el) => {
					if (el.tagName === "FORM" && el.hasAttribute("data-validate")) {
						formQueue.add(el);
					} else if (tags.includes(el.tagName)) {
						const form = el.closest?.("form");
						if (el && el.hasAttribute("data-validate")) {
							formQueue.add(form);
						}
					}
				})
			}
		}

		for (const form of formQueue) {
			initForm(form);
		}
	});

	// start listening baby!
	document.addEventListener("DOMContentLoaded", () => {
		initValidators();
		observer.observe(document.body, { childList: true, subtree: true });
	}, { once: true });

	return {
		initForm,
	}
})();