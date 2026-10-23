import {
    turntable, setCameraHome, cameraHomeDefault, cameraHomeRoof, cameraTargetRoof,
    setShadowArea, movePointLight2, pointLight2Default, resetCamera, setMaxPolarAngle
} from './scene.js'
import { config } from './config.js'
import { loadTent } from './models.js'

// РАЗДЕЛ «МОБИЛЬНЫЕ ШАТРЫ»

const section = document.getElementById('tents') // Вся разметка раздела

let selected = null // Название выбранного размера
let shownTent = null // Шатёр, который сейчас в сцене

// Убираем со сцены текущий шатёр
const removeTent = () => {
    if (shownTent) turntable.remove(shownTent)
    shownTent = null
}

const sizeButtons = document.querySelectorAll('#dimentins li:not(.label)')

sizeButtons.forEach(li => {
    li.addEventListener('click', async () => {
        sizeButtons.forEach(other => other.className = 'button')
        li.className = 'active'

        const name = li.textContent.trim()
        selected = name
        removeTent()

        setCameraHome(cameraHomeRoof, cameraTargetRoof) // Шатры большие — камера дальше, чем у мебели
        setShadowArea(config.shadows.areaRoof)
        movePointLight2(pointLight2Default)
        resetCamera()

        const tent = await loadTent(name) // Подгрузка модели name из loadTent 
        // Пока модель грузилась, пользователь мог выбрать другой размер или уйти из раздела
        if (!tent || selected !== name) return
        shownTent = tent
        turntable.add(tent)
    })
})

// ВХОД И ВЫХОД ИЗ РАЗДЕЛА

export const tents = {
    enter() {
        section.style.display = '' // Показываем разметку раздела
        setMaxPolarAngle(91) // Под шатёр можно заглянуть снизу
        const first = [...sizeButtons].find(li => li.textContent.trim() === '4,0x4,0')
        first.click() // Раздел открывается с шатра 4,0x4,0 — это пока единственная модель
    },
    exit() { // Убираем ровно то, что добавил enter()
        selected = null // Если модель ещё грузится, она не появится в чужом разделе
        removeTent()
        setCameraHome(cameraHomeDefault) // Возвращаем мебельную точку обзора
        section.style.display = 'none' // Прячем разметку раздела
    }
}
