if (tailwind) {
    tailwind.config.darkMode = 'class'
}

const themeActivation = () => {
    document.documentElement.classList.toggle('dark');
    lightIcon.classList.toggle('hidden');
    darkIcon.classList.toggle('hidden');

    if (document.documentElement.classList.contains('dark')) {
        localStorage.setItem('dark-mode', 'enabled');
    } else {
        localStorage.setItem('dark-mode', 'disabled');
    }
}

const loadTheme = () => {
    // Check for saved user preference in localStorage
    if (localStorage.getItem('dark-mode') === 'enabled') {
        document.documentElement.classList.add('dark');
        darkIcon.classList.add('visible');
        lightIcon.classList.remove('visible');
        lightIcon.classList.remove('hidden');
        darkIcon.classList.add('hidden');
    }
    else {
        lightIcon.classList.add('visible');
        darkIcon.classList.remove('visible');
        darkIcon.classList.remove('hidden');
        lightIcon.classList.add('hidden');
    }
}