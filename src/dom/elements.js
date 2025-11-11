/**
 * Кратчайший селектор элементов (аналог jQuery $)
 * @param {string} selector - CSS-селектор
 * @returns {Element|null}
 */
export const $ = (selector) => document.querySelector(selector);

/**
 * Создаёт HTML-элемент с заданными свойствами и дочерними элементами
 * @param {string} tag - Имя тега (например, 'div')
 * @param {Object} [props={}] - Свойства/атрибуты элемента
 * @param {Array<string|HTMLElement|Text>} [children=[]] - Дочерние узлы
 * @returns {HTMLElement}
 */
export const createElement = (tag, props = {}, children = []) => {
  const element = document.createElement(tag);

  // Обрабатываем свойства
  Object.keys(props).forEach(key => {
    const value = props[key];

    if (key === 'className') {
      element.className = value;
    }
    else if (key === 'style' && typeof value === 'object') {
      // Применяем стили как объект { color: 'red', margin: '10px' }
      Object.assign(element.style, value);
    }
    else if (key.startsWith('on') && typeof value === 'function') {
      // Обработчики событий: onClick → click, onInput → input
      const eventType = key.slice(2).toLowerCase();
      element.addEventListener(eventType, value);
    }
    else if (key === 'dataset' && typeof value === 'object') {
      // dataset: { id: '123', type: 'button' } → data-id="123" data-type="button"
      Object.keys(value).forEach(dataKey => {
        element.setAttribute(`data-${dataKey}`, value[dataKey]);
      });
    }
    else if (key.startsWith('attr:')) {
      // Атрибуты: attr:role="button", attr:aria-label="Close"
      const attrName = key.slice(5); // Убираем 'attr:'
      element.setAttribute(attrName, value);
    }
    else {
      // Остальные свойства (id, title, value и т.п.)
      element[key] = value;
    }
  });

  // Добавляем дочерние элементы
  children.forEach(child => {
    if (typeof child === 'string') {
      element.appendChild(document.createTextNode(child));
    }
    else if (child instanceof HTMLElement || child instanceof Text) {
      element.appendChild(child);
    }
    else {
      console.warn('Недопустимый дочерний элемент:', child);
    }
  });

  return element;
};
