// КНОПКИ МАТЕРИАЛОВ

// Теперь эта функция вынесена для всех, чтоб не делать ее копию в каждом разделе.
// Связывает кнопки с их значениями: по клику вызывает onSelect(значение, функция)
// items — массив пар [кнопка, значение], например [кнопка «Серая», softMaterial2]
export const bindGroup = (items, onSelect) => {
    items.forEach(([button, value]) => {
        button.addEventListener('click', () => {
            onSelect(value) // То самое присваивание материала в переменной value в функцию из аргумента onSelect 
            items.forEach(([other]) => other.classList.toggle('active', other === button))
        })
    })
}
