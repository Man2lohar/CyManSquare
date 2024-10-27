window.addEventListener('load', () => {
    const logoC = document.getElementById('logoC');
    const logoM = document.getElementById('logoM');

    // Show C first
    setTimeout(() => {
        logoC.classList.add('show');
    }, 300); // Adjust timing for C

    // Show M shortly after C
    setTimeout(() => {
        logoM.classList.add('show');
    }, 700); // Adjust timing for M
});
