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

    form.addEventListener('submit', function (event) {
        const firstInvalid = fields.find(function (field) {
            return !field.checkValidity();
        });

        if (firstInvalid) {
            event.preventDefault();
            fields.forEach(function (field) {
                field.setAttribute('aria-invalid', String(!field.checkValidity()));
            });
            status.textContent = 'Check the highlighted fields and send again.';
            firstInvalid.focus();
            return;
        }

        /* No endpoint configured yet. Say so plainly rather than accepting a
           message that would go nowhere — a visitor who thinks they have
           reached out and hasn't is worse than no form at all. */
        if (!form.getAttribute('action')) {
            event.preventDefault();
            status.textContent =
                'This form is not connected yet. Please email me directly ' +
                'using the address on the left, and I will reply from there.';
            status.focus();
            return;
        }

        /* Valid and wired up: let the browser post it, but stop a second
           click from sending the message twice. */
        const submitButton = form.querySelector('button[type="submit"]');

        if (submitButton) {
            submitButton.disabled = true;
            submitButton.textContent = 'Sending…';
        }
    });
});
