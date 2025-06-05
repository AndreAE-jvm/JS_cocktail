document.addEventListener('DOMContentLoaded', () => {
  const getCocktailsBtn = document.getElementById('get-cocktails-btn');
  const cocktailsContainer = document.getElementById('cocktails-container');
  const spinner = document.getElementById('spinner');

  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');
  const resetSearchBtn = document.getElementById('resetSearchBtn');

  // Обработчики для новых кнопок
  searchBtn.addEventListener('click', searchCocktails);
  resetSearchBtn.addEventListener('click', resetSearch);
  searchInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') searchCocktails();
  });

  // Новая функция поиска
  async function searchCocktails() {
    const searchTerm = searchInput.value.trim();
    if (!searchTerm) return;

    try {
      toggleLoading(true);
      cocktailsContainer.innerHTML = '';

      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/search.php?s=${encodeURIComponent(searchTerm)}`);
      const data = await response.json();

      if (data.drinks && data.drinks.length > 0) {
        data.drinks.slice(0, 12).forEach(drink => {
          fetchCocktailDetails(drink.idDrink)
            .then(cocktail => {
              if (cocktail) cocktailsContainer.appendChild(createCocktailCard(cocktail));
            });
        });
      } else {
        showError('Коктейли не найдены');
      }
    } catch (error) {
      showError('Ошибка при поиске');
      console.error('Ошибка:', error);
    } finally {
      toggleLoading(false);
    }
  }

  // Функция сброса поиска
  function resetSearch() {
    searchInput.value = '';
    loadCocktails(); // Возвращаем стандартный список
  }





  getCocktailsBtn.addEventListener('click', loadCocktails);

  // Функция загрузки коктейлей
  async function loadCocktails() {
    try {
      toggleLoading(true);
      cocktailsContainer.innerHTML = '';

      // Используем запрос, который всегда возвращает результаты
      const response = await fetch('https://www.thecocktaildb.com/api/json/v1/1/filter.php?c=Cocktail');
      const data = await response.json();

      if (data.drinks && data.drinks.length > 0) {
        // Берем первые 12 коктейлей
        const cocktails = data.drinks.slice(0, 12);

        // Для каждого коктейля создаем карточку
        cocktails.forEach(drink => {
          fetchCocktailDetails(drink.idDrink)
            .then(cocktail => {
              if (cocktail) {
                cocktailsContainer.appendChild(createCocktailCard(cocktail));
              }
            });
        });
      } else {
        showError('Коктейли не найдены');
      }
    } catch (error) {
      showError('Ошибка при загрузке');
      console.error('Ошибка:', error);
    } finally {
      toggleLoading(false);
    }
  }

  // Функция получения деталей коктейля
  async function fetchCocktailDetails(id) {
    try {
      const response = await fetch(`https://www.thecocktaildb.com/api/json/v1/1/lookup.php?i=${id}`);
      const data = await response.json();
      return data.drinks ? data.drinks[0] : null;
    } catch (error) {
      console.error('Ошибка загрузки деталей:', error);
      return null;
    }
  }

  // Функция создания карточки
  function createCocktailCard(cocktail) {
    const template = document.getElementById('cocktail-template').content;
    const card = template.cloneNode(true);

    // Заполняем основные данные
    card.querySelector('.cocktail-name').textContent = cocktail.strDrink;
    card.querySelector('.cocktail-img').src = cocktail.strDrinkThumb || 'https://via.placeholder.com/300x200?text=No+Image';

    // Обработчик кнопки "Подробнее"
    card.querySelector('.btn-details').addEventListener('click', (e) => {
      e.preventDefault();
      console.log('Открываем детали для:', cocktail.strDrink); // Логирование для отладки
      showCocktailDetails(cocktail);
    });

    return card;
  }

  // Глобальная переменная для хранения экземпляра модального окна

  let currentModal = null;

  function showCocktailDetails(cocktail) {
    // Уничтожаем предыдущее модальное окно
    if (currentModal) {
      currentModal.hide(); // Сначала скрываем
      currentModal.dispose(); // Затем уничтожаем
      resetBodyScroll(); // Принудительно восстанавливаем прокрутку
    }

    // Обновляем содержимое модального окна
    document.getElementById('cocktailModalTitle').textContent = cocktail.strDrink || 'Без названия';
    document.getElementById('cocktailModalBody').innerHTML = `
        <div class="row">
            <div class="col-md-6 mb-3">
                <img src="${cocktail.strDrinkThumb || 'https://via.placeholder.com/400x300?text=No+Image'}" 
                     class="img-fluid rounded" alt="${cocktail.strDrink || ''}">
            </div>
            <div class="col-md-6">
                <h5>Ингредиенты:</h5>
                <ul class="mb-3">
                    ${getIngredientsList(cocktail)}
                </ul>
            </div>
        </div>
        <div class="row">
            <div class="col-12">
                <h5>Инструкция:</h5>
                <div class="bg-light p-3 rounded">
                    ${cocktail.strInstructions || 'Инструкция не предоставлена'}
                </div>
            </div>
        </div>
    `;

    // Создаем новый экземпляр модального окна
    const modalElement = document.getElementById('cocktailModal');
    currentModal = new bootstrap.Modal(modalElement, {
      backdrop: true,
      keyboard: true
    });

    // Обработчик закрытия с восстановлением прокрутки
    modalElement.addEventListener('hidden.bs.modal', () => {
      resetBodyScroll();
      currentModal.dispose();
      currentModal = null;
    }, { once: true });

    // Перед открытием сбрасываем возможные блокировки
    resetBodyScroll();
    currentModal.show();
  }

  // Функция принудительного восстановления прокрутки
  function resetBodyScroll() {
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '0';
    document.body.style.position = 'static';
    document.body.style.top = '';
    document.documentElement.style.overflow = 'auto';
    document.documentElement.style.paddingRight = '0';

    // Удаляем все inline-стили, которые мог добавить Bootstrap
    document.body.removeAttribute('style');
    document.documentElement.removeAttribute('style');
  }


  function getIngredientsList(cocktail) {
    let ingredients = '';
    for (let i = 1; i <= 15; i++) {
      const ingredient = cocktail[`strIngredient${i}`];
      if (ingredient) {
        const measure = cocktail[`strMeasure${i}`] || '';
        ingredients += `<li>${measure} ${ingredient}</li>`;
      }
    }
    return ingredients || '<li>Ингредиенты не указаны</li>';
  }

  // Вспомогательные функции
  function toggleLoading(loading) {
    spinner.classList.toggle('d-none', !loading);
    getCocktailsBtn.disabled = loading;
  }

  function showError(message) {
    const errorElement = document.getElementById('error-message');
    errorElement.textContent = message;
    errorElement.classList.remove('d-none');
  }
});