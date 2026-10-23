import './css/style.css'
import { Pane } from 'tweakpane'
import { devMode } from './config.js'
import { metallMaterial, metallMaterial2, softMaterial, softMaterial2, softMaterial3 } from './textures.js'
import { furniture } from './furniture.js'
import { tents } from './tents.js'
import { jumpCamera } from './scene.js'

// index.js ->  Переключает разделы furniture.js и tents.js
// furniture.js и tents.js -> Обрабатывают события своих разделов и обращаются к scene.js и models.js
// models.js -> Собирает модели с текстурами из textures.js
// scene.js -> Собирает всю сцену, камеру, свет, orbitControls, Animate

// ПЕРЕКЛЮЧЕНИЕ РАЗДЕЛОВ

const sections = { // Просто присваиваем импортированные разделы одному объекту, чтоб по ключам обращаться к ним
    'Модульная мебель': furniture,
    'Мобильные шатры': tents
}

let current = furniture // Назначаем переменную для открытого сейчас раздела

tents.exit() // Прячем разметку остальных разделов
furniture.enter() // Вызываем раздел по умолчанию

const productButtons = document.querySelectorAll('#products li') // Вытаскиваем кнопки из DOM

productButtons.forEach(li => { // Вешаем на каждую кнопку в products обработчик событий
    li.addEventListener('click', () => {
        const next = sections[li.textContent.trim()] // Обращаемся к свойству объекта по названию выбранной кнопки
        if (!next || next === current) return // Раздела ещё нет или клик по уже открытому разделу

        productButtons.forEach(other => other.className = 'button') // Переназначаем классы
        li.className = 'active'

        current.exit() // Сначала целиком убираем старый раздел
        current = next // Присваиваем в переменную новый выбранный раздел
        current.enter() // Вызываем функцию этого раздела
        jumpCamera() // enter() запускает плавный полёт к своей модели — заменяем его мгновенным переходом
    })
})

// РЕЖИМ РАЗРАБОТЧИК

if (devMode) {
    const pane = new Pane()
    pane.addBinding(metallMaterial, 'metalness', {min: 0, max: 1, step:.1})
    pane.addBinding(metallMaterial, 'roughness', {min: 0, max: 1, step: .1})
    pane.addBinding(softMaterial, 'metalness', {min: 0, max: 1, step:.1})
    pane.addBinding(softMaterial, 'roughness', {min: 0, max: 1, step: .1})
    pane.addBinding(metallMaterial2, 'metalness', {min: 0, max: 1, step:.1})
    pane.addBinding(metallMaterial2, 'roughness', {min: 0, max: 1, step: .1})
    pane.addBinding(softMaterial2, 'metalness', {min: 0, max: 1, step:.1})
    pane.addBinding(softMaterial2, 'roughness', {min: 0, max: 1, step: .1})
    pane.addBinding(softMaterial3, 'metalness', {min: 0, max: 1, step:.1})
    pane.addBinding(softMaterial3, 'roughness', {min: 0, max: 1, step: .1})
    pane.addBinding(softMaterial3, 'normalScale', {
        x: {min: -2, max: 2, step: .1},
        y: {min: -2, max: 2, step: .1}
    })
}
