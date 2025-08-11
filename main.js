document.addEventListener('DOMContentLoaded', function() {
    // Загрузка аниме с сервера
    loadAnime();

    // Поиск
    document.getElementById('search-btn').addEventListener('click', function() {
        const searchTerm = document.getElementById('search-input').value.toLowerCase();
        searchAnime(searchTerm);
    });
});

// Загрузка списка аниме
async function loadAnime() {
    try {
        const response = await fetch('/api/anime');
        if (!response.ok) throw new Error('Ошибка сервера');
        
        const animeList = await response.json();
        displayAnime(animeList);
    } catch (error) {
        console.error('Ошибка загрузки аниме:', error);
        displayAnime([]);
    }
}

// Отображение аниме на странице
function displayAnime(animeList) {
    const animeGrid = document.getElementById('anime-grid');
    animeGrid.innerHTML = '';

    if (animeList.length === 0) {
        animeGrid.innerHTML = '<p>Аниме не найдено</p>';
        return;
    }

    animeList.forEach(anime => {
        const animeCard = document.createElement('div');
        animeCard.className = 'anime-card';
        animeCard.innerHTML = `
            <img src="${anime.poster_url || 'https://via.placeholder.com/200x300'}" alt="${anime.title}">
            <h3>${anime.title}</h3>
            <p>${anime.episodes_count || 0} серий</p>
        `;
        animeCard.addEventListener('click', () => {
            window.location.href = `anime.html?id=${anime.id}`;
        });
        animeGrid.appendChild(animeCard);
    });
}

// Поиск аниме
async function searchAnime(term) {
    try {
        const response = await fetch('/api/anime');
        if (!response.ok) throw new Error('Ошибка сервера');
        
        const allAnime = await response.json();
        const filteredAnime = allAnime.filter(anime => 
            anime.title.toLowerCase().includes(term) || 
            (anime.description && anime.description.toLowerCase().includes(term))
        );
        
        displayAnime(filteredAnime);
    } catch (error) {
        console.error('Ошибка поиска:', error);
        displayAnime([]);
    }
}
