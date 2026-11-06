document.addEventListener('DOMContentLoaded', function() {
    // Menu toggle functionality
    const menuToggle = document.querySelector('.menu-toggle');
    const nav = document.querySelector('.nav');
    const contactForm = document.getElementById('contact-form');

    if (menuToggle && nav) {
        menuToggle.addEventListener('click', function() {
            nav.classList.toggle('open');
        });
    }

    // Project carousel functionality
    const projectCarousel = document.querySelector('.project-carousel');

    if (projectCarousel) {
        projectCarousel.addEventListener('click', function(e) {
            console.log('Carousel clicked', e.target);
        });

        const track = projectCarousel.querySelector('.carousel-track');
        const slides = Array.from(projectCarousel.querySelectorAll('.carousel-slide'));
        const prevButton = projectCarousel.querySelector('.carousel-btn.prev');
        const nextButton = projectCarousel.querySelector('.carousel-btn.next');
        let currentSlide = 0;

        function showSlide(index) {
            currentSlide = (index + slides.length) % slides.length;
            track.style.transform = `translateX(-${currentSlide * 100}%)`;

            slides.forEach((slide, slideIndex) => {
                slide.classList.toggle('is-active', slideIndex === currentSlide);
            });
        }

        prevButton?.addEventListener('click', () => showSlide(currentSlide - 1));
        nextButton?.addEventListener('click', () => showSlide(currentSlide + 1));

        showSlide(0);
    }

    // The resume and contact pages are live now, so nothing blocks those links.

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