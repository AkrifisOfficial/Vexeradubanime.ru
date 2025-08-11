// Загрузка аниме для выпадающего списка
async function loadAnimeForSelect() {
    try {
        const response = await fetch('/api/anime');
        const animeList = await response.json();
        
        const select = document.getElementById('anime-select');
        select.innerHTML = '<option value="">Выберите аниме</option>';
        
        animeList.forEach(anime => {
            const option = document.createElement('option');
            option.value = anime.id;
            option.textContent = anime.title;
            select.appendChild(option);
        });
    } catch (error) {
        console.error('Ошибка загрузки аниме:', error);
        alert('Не удалось загрузить список аниме');
    }
}

// Загрузка аниме для управления
async function loadAnimeForManagement() {
    try {
        const response = await fetch('/api/anime');
        const animeList = await response.json();
        
        const animeListElement = document.getElementById('anime-list-admin');
        animeListElement.innerHTML = '';

        animeList.forEach(anime => {
            const li = document.createElement('li');
            li.innerHTML = `
                <span>${anime.title} (ID: ${anime.id})</span>
                <button class="delete-btn" data-id="${anime.id}">Удалить</button>
            `;
            animeListElement.appendChild(li);
        });

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('#anime-list-admin .delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const animeId = this.getAttribute('data-id');
                deleteAnime(animeId);
            });
        });

        // Загрузка серий
        loadEpisodesForManagement();
    } catch (error) {
        console.error('Ошибка загрузки аниме:', error);
        alert('Не удалось загрузить список аниме');
    }
}

// Загрузка серий для управления
async function loadEpisodesForManagement() {
    try {
        const response = await fetch('/api/anime');
        const animeList = await response.json();
        
        const episodesListElement = document.getElementById('episodes-list-admin');
        episodesListElement.innerHTML = '';

        // Для каждого аниме загружаем его серии
        for (const anime of animeList) {
            const episodesResponse = await fetch(`/api/anime/${anime.id}/episodes`);
            const episodes = await episodesResponse.json();
            
            episodes.forEach(episode => {
                const li = document.createElement('li');
                li.innerHTML = `
                    <span>${anime.title} - Серия ${episode.number} (ID: ${episode.id})</span>
                    <button class="delete-btn" data-id="${episode.id}">Удалить</button>
                `;
                episodesListElement.appendChild(li);
            });
        }

        // Добавляем обработчики для кнопок удаления
        document.querySelectorAll('#episodes-list-admin .delete-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const episodeId = this.getAttribute('data-id');
                deleteEpisode(episodeId);
            });
        });
    } catch (error) {
        console.error('Ошибка загрузки серий:', error);
        alert('Не удалось загрузить список серий');
    }
}

// Добавление нового аниме
async function addAnime() {
    const form = document.getElementById('add-anime-form');
    const formData = {
        title: form.querySelector('input:nth-of-type(1)').value,
        description: form.querySelector('input:nth-of-type(2)').value,
        poster: form.querySelector('input:nth-of-type(3)').value
    };

    try {
        const response = await fetch('/api/anime', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Ошибка сервера');
        
        alert('Аниме успешно добавлено!');
        form.reset();
        loadAnimeForSelect();
        loadAnimeForManagement();
    } catch (error) {
        console.error('Ошибка добавления аниме:', error);
        alert('Ошибка при добавлении аниме');
    }
}

// Добавление новой серии
async function addEpisode() {
    const form = document.getElementById('add-episodes-form');
    const formData = {
        animeId: form.querySelector('select').value,
        number: form.querySelector('input:nth-of-type(1)').value,
        vkUrl: form.querySelector('input:nth-of-type(2)').value
    };

    try {
        const response = await fetch('/api/episodes', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(formData)
        });
        
        if (!response.ok) throw new Error('Ошибка сервера');
        
        alert('Серия успешно добавлена!');
        form.reset();
        loadEpisodesForManagement();
    } catch (error) {
        console.error('Ошибка добавления серии:', error);
        alert('Ошибка при добавлении серии');
    }
}

// Удаление аниме
async function deleteAnime(id) {
    if (!confirm('Вы уверены, что хотите удалить это аниме и все его серии?')) return;

    try {
        const response = await fetch(`/api/anime/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Ошибка сервера');
        
        alert('Аниме успешно удалено!');
        loadAnimeForSelect();
        loadAnimeForManagement();
    } catch (error) {
        console.error('Ошибка удаления аниме:', error);
        alert('Ошибка при удалении аниме');
    }
}

// Удаление серии
async function deleteEpisode(id) {
    if (!confirm('Вы уверены, что хотите удалить эту серию?')) return;

    try {
        const response = await fetch(`/api/episodes/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Ошибка сервера');
        
        alert('Серия успешно удалена!');
        loadEpisodesForManagement();
    } catch (error) {
        console.error('Ошибка удаления серии:', error);
        alert('Ошибка при удалении серии');
    }
          }
