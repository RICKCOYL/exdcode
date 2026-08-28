document.addEventListener('DOMContentLoaded', function() {
    // Menu toggle functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    const contactForm = document.getElementById('contact-form');

    menuToggle.addEventListener('click', function() {
        nav.classList.toggle('open');
    });

    // disable the resume and contact link using aria-disabled attribute
    const resumeLink = document.querySelector('a[href="./resume.html"]'); /* this selects the resume link element so i can disable it */
    const contactLink = document.querySelector('a[href="./contact.html"]'); /* this selects the contact link element so i can disable it */

    if (resumeLink) {
        // addEvent listen waits for an action to be performed on the element. 
        resumeLink.addEventListener('click', function(e) {
            if (resumeLink.getAttribute('aria-disabled') === 'true') {
                e.preventDefault();
                alert('Sorry, the resume page is currently unavailable.');
            }
        });
    }

    if (contactLink) {
        contactLink.addEventListener('click', function(e) {
            if (contactLink.getAttribute('aria-disabled') === 'true') {
                e.preventDefault();
                alert('Sorry, the contact page is currently unavailable.');
            }
        });
    }


     // form validation
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const message = document.getElementById('message').value;

            if (!email || !message) {
                e.preventDefault();
                alert('Please fill in both your email and message before submitting.');
            }
        });
    }


    // save form data to local storage when form is submitted with required fields filled in
    if (contactForm) {
        contactForm.addEventListener('submit', function(e) {
            const email = document.getElementById('email').value;
            const name = document.getElementById('name').value;
            const message = document.getElementById('message').value;

            if (email && message) {
                const formData = {
                    email: email,
                    name: name,
                    message: message
                };
                localStorage.setItem('contactFormData', JSON.stringify(formData));
                    alert('Your message has been saved locally. Thank you for contacting us!');
            } else {
                e.preventDefault();
                alert('Please fill in all required fields before submitting.');
            }
        });
    }
} );