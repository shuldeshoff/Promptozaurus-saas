// src/models/ContextBlock.js
class ContextBlock {
  /**
   * Создает новый блок контекста
   * @param {number} id - Идентификатор блока
   * @param {string} title - Заголовок блока
   * @param {Array} items - Массив элементов контекста
   */
  constructor(id, title = 'Новый контекст', items = []) {
    this.id = id;
    this.title = title;
    
    // Обработка элементов - убедимся, что все имеют поле subItems
    this.items = Array.isArray(items) ? items.map(item => ({
      ...item,
      subItems: Array.isArray(item.subItems) ? item.subItems : []
    })) : [];
    
    console.log(`Создан новый блок контекста: ${title} (id: ${id})`);
  }
  
  /**
   * Добавляет новый элемент контекста
   * @param {string} title - Заголовок элемента
   * @param {string} content - Содержимое элемента
   * @returns {Object} - Новый элемент
   */
  addItem(title = 'Новый элемент', content = '') {
    const id = this.items.length > 0 
      ? Math.max(...this.items.map(item => item.id)) + 1
      : 1;
      
    const item = {
      id,
      title,
      content,
      chars: content.length,
      subItems: [] // Добавляем массив для подэлементов
    };
    
    this.items.push(item);
    
    console.log(`Добавлен новый элемент: ${title} (id: ${id}) в блок ${this.title}`);
    
    return item;
  }
  
  /**
   * Добавляет подэлемент к существующему элементу
   * @param {number} itemId - Идентификатор элемента-родителя
   * @param {string} title - Заголовок подэлемента
   * @param {string} content - Содержимое подэлемента
   * @returns {Object|null} - Новый подэлемент или null при ошибке
   */
  addSubItem(itemId, title = 'Новый подэлемент', content = '') {
    const item = this.items.find(item => item.id === itemId);
    if (!item) {
      console.log(`Ошибка: элемент с id ${itemId} не найден в блоке ${this.title}`);
      return null;
    }
    
    // Если поле subItems не существует, создаем его
    if (!Array.isArray(item.subItems)) {
      item.subItems = [];
    }
    
    const subId = item.subItems.length > 0 
      ? Math.max(...item.subItems.map(subItem => subItem.id)) + 1
      : 1;
      
    const subItem = {
      id: subId,
      title,
      content,
      chars: content.length
    };
    
    item.subItems.push(subItem);
    
    console.log(`Добавлен новый подэлемент: ${title} (id: ${subId}) к элементу ${item.title}`);
    
    return subItem;
  }
  
  /**
   * Обновляет элемент контекста
   * @param {number} itemId - Идентификатор элемента
   * @param {Object} data - Данные для обновления
   * @returns {boolean} - Результат операции
   */
  updateItem(itemId, data) {
    const itemIndex = this.items.findIndex(item => item.id === itemId);
    if (itemIndex === -1) {
      console.log(`Ошибка: элемент с id ${itemId} не найден в блоке ${this.title}`);
      return false;
    }
    
    // Получаем текущий элемент
    const currentItem = this.items[itemIndex];
    
    // Обновляем данные элемента, сохраняя subItems
    this.items[itemIndex] = { 
      ...currentItem, 
      ...data,
      // Пересчитываем количество символов, если обновлено содержимое
      chars: data.content !== undefined ? data.content.length : currentItem.chars,
      // Сохраняем subItems, или используем пустой массив если поле отсутствует
      subItems: data.subItems || currentItem.subItems || []
    };
    
    console.log(`Обновлен элемент с id ${itemId} в блоке ${this.title}`);
    
    return true;
  }
  
  /**
   * Обновляет подэлемент контекста
   * @param {number} itemId - Идентификатор родительского элемента
   * @param {number} subItemId - Идентификатор подэлемента
   * @param {Object} data - Данные для обновления
   * @returns {boolean} - Результат операции
   */
  updateSubItem(itemId, subItemId, data) {
    const item = this.items.find(item => item.id === itemId);
    
    // Проверяем существование элемента и его поля subItems
    if (!item) {
      console.log(`Ошибка: элемент с id ${itemId} не найден`);
      return false;
    }
    
    // Инициализируем subItems, если его нет
    if (!Array.isArray(item.subItems)) {
      item.subItems = [];
      console.log(`Инициализировано поле subItems для элемента ${itemId}`);
      return false; // Подэлемент не может быть обновлен, т.к. его не существует
    }
    
    const subItemIndex = item.subItems.findIndex(subItem => subItem.id === subItemId);
    if (subItemIndex === -1) {
      console.log(`Ошибка: подэлемент с id ${subItemId} не найден в элементе ${item.title}`);
      return false;
    }
    
    // Обновляем данные подэлемента
    item.subItems[subItemIndex] = { 
      ...item.subItems[subItemIndex], 
      ...data,
      // Пересчитываем количество символов, если обновлено содержимое
      chars: data.content !== undefined ? data.content.length : item.subItems[subItemIndex].chars
    };
    
    console.log(`Обновлен подэлемент с id ${subItemId} в элементе ${item.title}`);
    
    return true;
  }
  
  /**
   * Удаляет элемент контекста
   * @param {number} itemId - Идентификатор элемента
   * @returns {boolean} - Результат операции
   */
  removeItem(itemId) {
    const initialLength = this.items.length;
    this.items = this.items.filter(item => item.id !== itemId);
    
    const result = this.items.length !== initialLength;
    
    if (result) {
      console.log(`Удален элемент с id ${itemId} из блока ${this.title}`);
    } else {
      console.log(`Ошибка: элемент с id ${itemId} не найден в блоке ${this.title}`);
    }
    
    return result;
  }
  
  /**
   * Удаляет подэлемент контекста
   * @param {number} itemId - Идентификатор родительского элемента
   * @param {number} subItemId - Идентификатор подэлемента
   * @returns {boolean} - Результат операции
   */
  removeSubItem(itemId, subItemId) {
    const item = this.items.find(item => item.id === itemId);
    
    // Проверяем существование элемента и его поля subItems
    if (!item) {
      console.log(`Ошибка: элемент с id ${itemId} не найден`);
      return false;
    }
    
    if (!Array.isArray(item.subItems)) {
      console.log(`Ошибка: элемент с id ${itemId} не имеет подэлементов`);
      return false;
    }
    
    const initialLength = item.subItems.length;
    item.subItems = item.subItems.filter(subItem => subItem.id !== subItemId);
    
    const result = item.subItems.length !== initialLength;
    
    if (result) {
      console.log(`Удален подэлемент с id ${subItemId} из элемента ${item.title}`);
    } else {
      console.log(`Ошибка: подэлемент с id ${subItemId} не найден в элементе ${item.title}`);
    }
    
    return result;
  }
  
  /**
   * Вычисляет общее количество символов в блоке
   * @returns {number} - Количество символов
   */
  get totalChars() {
    const itemsChars = this.items.reduce((sum, item) => {
      // Символы в содержимом самого элемента
      let itemSum = item.chars || 0;
      
      // Добавляем символы из подэлементов, если они есть
      if (Array.isArray(item.subItems) && item.subItems.length > 0) {
        itemSum += item.subItems.reduce((subSum, subItem) => subSum + (subItem.chars || 0), 0);
      }
      
      return sum + itemSum;
    }, 0);
    
    console.log(`Количество символов в блоке ${this.title}: ${itemsChars}`);
    
    return itemsChars;
  }
  
  /**
   * Меняет местами подэлементы контекста
   * @param {number} itemId - ID родительского элемента
   * @param {number} subItemId1 - ID первого подэлемента
   * @param {number} subItemId2 - ID второго подэлемента
   * @returns {boolean} - Результат операции
   */
  swapSubItems(itemId, subItemId1, subItemId2) {
    const item = this.items.find(item => item.id === itemId);
    
    // Проверяем существование элемента и его поля subItems
    if (!item) {
      console.log(`Ошибка: элемент с id ${itemId} не найден`);
      return false;
    }
    
    if (!Array.isArray(item.subItems) || item.subItems.length < 2) {
      console.log(`Ошибка: элемент с id ${itemId} не имеет достаточного количества подэлементов`);
      return false;
    }
    
    const index1 = item.subItems.findIndex(subItem => subItem.id === subItemId1);
    const index2 = item.subItems.findIndex(subItem => subItem.id === subItemId2);
    
    if (index1 === -1 || index2 === -1) {
      console.log(`Ошибка: один из подэлементов не найден в элементе ${item.title}`);
      return false;
    }
    
    // Меняем местами подэлементы
    [item.subItems[index1], item.subItems[index2]] = [item.subItems[index2], item.subItems[index1]];
    
    console.log(`Подэлементы ${subItemId1} и ${subItemId2} поменяны местами в элементе ${item.title}`);
    
    return true;
  }
  
  /**
   * Перемещает подэлемент вверх в списке
   * @param {number} itemId - ID родительского элемента
   * @param {number} subItemId - ID подэлемента для перемещения
   * @returns {boolean} - Результат операции
   */
  moveSubItemUp(itemId, subItemId) {
    const item = this.items.find(item => item.id === itemId);
    
    // Проверяем существование элемента и его поля subItems
    if (!item) {
      console.log(`Ошибка: элемент с id ${itemId} не найден`);
      return false;
    }
    
    if (!Array.isArray(item.subItems) || item.subItems.length < 2) {
      console.log(`Ошибка: элемент с id ${itemId} не имеет достаточного количества подэлементов`);
      return false;
    }
    
    const index = item.subItems.findIndex(subItem => subItem.id === subItemId);
    if (index === -1) {
      console.log(`Ошибка: подэлемент с id ${subItemId} не найден в элементе ${item.title}`);
      return false;
    }
    
    if (index === 0) {
      console.log(`Подэлемент с id ${subItemId} уже находится на первой позиции`);
      return false;
    }
    
    // Меняем местами с предыдущим элементом
    [item.subItems[index - 1], item.subItems[index]] = [item.subItems[index], item.subItems[index - 1]];
    
    console.log(`Подэлемент с id ${subItemId} перемещен вверх в элементе ${item.title}`);
    
    return true;
  }
  
  /**
   * Перемещает подэлемент вниз в списке
   * @param {number} itemId - ID родительского элемента
   * @param {number} subItemId - ID подэлемента для перемещения
   * @returns {boolean} - Результат операции
   */
  moveSubItemDown(itemId, subItemId) {
    const item = this.items.find(item => item.id === itemId);
    
    // Проверяем существование элемента и его поля subItems
    if (!item) {
      console.log(`Ошибка: элемент с id ${itemId} не найден`);
      return false;
    }
    
    if (!Array.isArray(item.subItems) || item.subItems.length < 2) {
      console.log(`Ошибка: элемент с id ${itemId} не имеет достаточного количества подэлементов`);
      return false;
    }
    
    const index = item.subItems.findIndex(subItem => subItem.id === subItemId);
    if (index === -1) {
      console.log(`Ошибка: подэлемент с id ${subItemId} не найден в элементе ${item.title}`);
      return false;
    }
    
    if (index === item.subItems.length - 1) {
      console.log(`Подэлемент с id ${subItemId} уже находится на последней позиции`);
      return false;
    }
    
    // Меняем местами со следующим элементом
    [item.subItems[index], item.subItems[index + 1]] = [item.subItems[index + 1], item.subItems[index]];
    
    console.log(`Подэлемент с id ${subItemId} перемещен вниз в элементе ${item.title}`);
    
    return true;
  }
}

export default ContextBlock;