/* Behaviour for resume.html and contact.html.
   Everything here is progressive enhancement: both pages are fully readable
   and the form is fully usable with this file blocked. */

document.addEventListener('DOMContentLoaded', function () {

    /* ------------------------------------------------------------------
       Keep the menu button's state readable to screen readers.
       index.js toggles the class; it runs first, so by the time this
       listener fires the class already reflects the new state.
       ------------------------------------------------------------------ */
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function () {
            menuToggle.setAttribute('aria-expanded', nav.classList.contains('open'));
        });
    }

    /* ------------------------------------------------------------------
       Resume: hand the page to the browser's print dialog, which is also
       how you save it as a PDF. Print styles live in pages.css.
       ------------------------------------------------------------------ */
    const printButton = document.getElementById('print-resume');

    if (printButton) {
        printButton.addEventListener('click', function () {
            window.print();
        });
    }

    /* ------------------------------------------------------------------
       Contact form.

       Validation timing follows the rule that avoids nagging: clear errors
       while the user types, check when they leave a field, and only block
       on submit — where focus moves to the first field that needs work.
       ------------------------------------------------------------------ */
    const form = document.getElementById('contact-page-form');

    if (!form) {
        return;
    }

    const status = document.getElementById('cp-status');
    const fields = Array.from(form.querySelectorAll('input, textarea'));

    const query = new URLSearchParams(window.location.search);
    if (query.get('sent') === '1') {
        status.textContent = 'Thanks for reaching out. Your message has been sent.';
        status.classList.add('is-success');
        window.history.replaceState({}, document.title, window.location.pathname);
    } else if (query.get('sent') === '0') {
        status.textContent = 'The message could not be sent. Please try again or email me directly.';
        status.classList.add('is-error');
        window.history.replaceState({}, document.title, window.location.pathname);
    }

    /* Validate a field once the user has moved on from it. Setting the
       attribute mirrors the :user-invalid styling into the accessibility
       tree, so the border and the screen reader agree. */
    fields.forEach(function (field) {
        field.addEventListener('blur', function () {
            field.setAttribute('aria-invalid', String(!field.checkValidity()));
        });

        field.addEventListener('input', function () {
            if (field.checkValidity()) {
                field.removeAttribute('aria-invalid');
            }
        });
    });

    form.addEventListener('submit', async function (event) {
        const firstInvalid = fields.find(function (field) {
            return !field.checkValidity();
        });

        if (firstInvalid) {
            event.preventDefault();
            fields.forEach(function (field) {
                field.setAttribute('aria-invalid', String(!field.checkValidity()));
            });
            status.textContent = 'Check the highlighted fields and send again.';
            status.className = 'form-status is-error';
            firstInvalid.focus();
            return;
        }

        event.preventDefault();
        const submitButton = form.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending…';
        }

        status.textContent = '';
        status.className = 'form-status';

        try {
            const response = await fetch(form.action, {
                method: 'POST',
                headers: {
                    'Accept': 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(Object.fromEntries(new FormData(form)))
            });
            const result = await response.json();

            if (!response.ok || !result.ok) {
                throw new Error(result.error || 'The message could not be sent.');
            }

            status.textContent = 'Thanks for reaching out. Your message has been sent.';
            status.classList.add('is-success');
            form.reset();
            if (submitButton) {
                submitButton.textContent = 'Message sent';
            }
        } catch (error) {
            status.textContent = error.message ||
                'The message could not be sent. Please try again or email me directly.';
            status.classList.add('is-error');
            if (submitButton) {
                submitButton.disabled = false;
                submitButton.textContent = 'Send message';
            }
        }

        status.focus();
    });
});
