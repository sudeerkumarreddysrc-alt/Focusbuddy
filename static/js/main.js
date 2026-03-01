document.addEventListener('DOMContentLoaded', () => {
    // Add interactive feedback to buttons
    const buttons = document.querySelectorAll('.card-btn');

    buttons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            // Redirect smoothly to the dashboard portal when any action button is clicked
            window.location.href = '/dashboard';
        });
    });

    // Animate cards on scroll or on load
    const cards = document.querySelectorAll('.card');
    cards.forEach((card, index) => {
        // Initial state before entry
        card.style.opacity = '0';
        card.style.transform = 'translateY(50px)';

        // Trigger animation
        setTimeout(() => {
            card.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
            card.style.opacity = '1';
            card.style.transform = 'translateY(0)';

            // Re-apply hover transition after initial animation is complete
            setTimeout(() => {
                card.style.transition = 'transform 0.4s ease, box-shadow 0.4s ease';
            }, 600);

        }, 150 * (index + 1) + 200); // Staggered animation matching the layout order
    });
});
