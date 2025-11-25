// src/models/Project.js
class Project {
    /**
     * Создает новый проект
     * @param {string} name - Имя проекта
     * @param {string} template - Имя шаблона
     * @param {Array} contextBlocks - Массив блоков контекста
     * @param {Array} promptBlocks - Массив блоков промптов
     * @param {string|null} path - Путь к файлу проекта (null для новых проектов)
     */
    constructor(name = 'New Project', template = 'Базовый', contextBlocks = [], promptBlocks = [], path = null) {
      this.name = name;
      this.template = template;
      this.contextBlocks = contextBlocks;
      this.promptBlocks = promptBlocks;
      this.path = path;
      this.modified = false;
      this.createdAt = new Date().toISOString();
      this.updatedAt = this.createdAt;
      
      console.log(`Создан новый проект: ${name}`);
    }
    
    /**
     * Сериализует проект для сохранения в файл
     * @returns {Object} - Объект для сохранения
     */
    serialize() {
      console.log(`Сериализация проекта: ${this.name}`);
      
      return {
        name: this.name,
        template: this.template,
        contextBlocks: this.contextBlocks.map(block => {
          // Копируем блок, но без вычисляемых свойств
          const { ...serializedBlock } = block;
          return serializedBlock;
        }),
        promptBlocks: this.promptBlocks,
        createdAt: this.createdAt,
        updatedAt: new Date().toISOString()
      };
    }
    
    /**
     * Создает экземпляр проекта из сохраненных данных
     * @param {Object} data - Данные проекта
     * @param {string|null} path - Путь к файлу проекта
     * @returns {Project} - Экземпляр проекта
     */
    static fromSerialized(data, path = null) {
      console.log(`Десериализация проекта: ${data.name}`);
      
      const project = new Project(
        data.name,
        data.template,
        data.contextBlocks,
        data.promptBlocks,
        path
      );
      
      if (data.createdAt) {
        project.createdAt = data.createdAt;
      }
      
      if (data.updatedAt) {
        project.updatedAt = data.updatedAt;
      }
      
      return project;
    }
    
    /**
     * Вычисляет общее количество символов в проекте
     * @returns {number} - Общее количество символов
     */
    getTotalChars() {
      const total = this.contextBlocks.reduce((sum, block) => {
        return sum + block.items.reduce((blockSum, item) => blockSum + item.chars, 0);
      }, 0);
      
      console.log(`Общее количество символов в проекте: ${total}`);
      
      return total;
    }
  }
  
  export default Project;