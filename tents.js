import { scene, backgroundDefault, backgroundNight, turntable, setCameraHome, cameraHomeRoof, cameraTargetRoof, setShadowArea, 
    resetCamera, setMaxPolarAngle, dirLight, dirLightTents, moveDirLight, pointLight, dirLight2 } from './scene.js'
import { config } from './config.js'
import { loadTent } from './models.js'
import { showSpecs } from './specs.js'
import { bindGroup } from './buttons.js'
import { tentFabricsById, setFabricGlow, velcroOf } from './textures.js'
import { lamps, setLampsOn, setLampSpires } from './lamps.js'

// РАЗДЕЛ «МОБИЛЬНЫЕ ШАТРЫ»

const section = document.getElementById('tents') // Вся разметка контейнера (слева,справа, внизу)

let selected = null // Переменная для названия выбранного размера
let shownTent = null // Шатёр, который сейчас в сцене

// Функция уборки со сцены текущего шатра
const removeTent = () => {
    if (shownTent) turntable.remove(shownTent)
    shownTent = null
}

// Цепляем кнопки из DOM
const sizeButtons = document.querySelectorAll('#dimentins li:not(.label)')
const wallButtons = document.querySelectorAll('#walls li:not(.label)')

// ПЕРЕКЛЮЧЕНИЕ МОДЕЛЕЙ ШАТРА

// Шпили каркаса по x, м: под каждым висит крестовина ламп. Шатры вытянуты вдоль x, шпили на z = 0
// small — шатры шириной 3,0 м: лампы короче и висят ниже
const LAMP_LAYOUTS = {
    '3,0x3,0': { spires: [0], small: true },
    '3,0x4,5': { spires: [-.75, .75], small: true },
    '3,0x6,0': { spires: [-1.5, 0, 1.5], small: true },
    '4,0x4,0': { spires: [0] },
    '4,0x6,0': { spires: [-1, 1] },
    '4,0x8,0': { spires: [-2, 0, 2] }
}

sizeButtons.forEach(li => {
    li.addEventListener('click', async () => {
        sizeButtons.forEach(other => other.className = 'button')
        li.className = 'active'

        const name = li.textContent.trim() // Вытаскиваем строку с названием
        selected = name
        showSpecs(name, 'tents') // Показываем спеки размера из specs.js
        removeTent() // Убираем прошлый тент
        setWalls(null) // При смене размера стены выбирают заново
        setLampSpires(LAMP_LAYOUTS[name]?.spires ?? [], LAMP_LAYOUTS[name]?.small) // Лампы переезжают под шпили нового размера сразу, не дожидаясь модели

        resetCamera() // Если пользователь покрутил камеру, при смене размера она возвращается домой

        const tent = await loadTent(name) // Подгружам модели name из loadTent 
        // Пока модель грузилась, пользователь мог выбрать другой размер или уйти из раздела
        if (!tent || selected !== name) return

        shownTent = tent // Присваиваем в переменную shownTent выбранный тент 
        paintFabric(tent) // Модель могла загрузиться или остаться в кэше со старой тканью
        showWalls() // Стены — часть модели. В кэше они могли остаться включёнными, прячем
        turntable.add(tent) // Добавляем в сцену модель в нужном цвете 
    })
})

// СТЕНЫ

// Стены — узлы модели шатра, их не грузим, а показываем и прячем. Кнопка → какие стены видны
const WALL_SETS = {
    'Одна': ['Wall_Back'],
    'Две': ['Wall_Back', 'Wall_Right'],
    'Три': ['Wall_Back', 'Wall_Left', 'Wall_Right'],
    'Четыре': ['Wall_Back', 'Wall_Left', 'Wall_Right', 'Wall_Front']
}
const ALL_WALLS = WALL_SETS['Четыре']

let wallsChoice = null // Нажатая кнопка стен. null — стен нет

// Показывает в шатре стены выбранной кнопки, остальные прячет, и подсвечивает кнопку
const showWalls = () => {
    ALL_WALLS.forEach(name => {
        const wall = shownTent?.getObjectByName(name)
        if (wall) wall.visible = WALL_SETS[wallsChoice]?.includes(name) ?? false
    })
    wallButtons.forEach(li => li.className = li.textContent.trim() === wallsChoice ? 'active' : 'button')
}

const setWalls = (choice) => {
    wallsChoice = choice
    showWalls()
}

wallButtons.forEach(li => {
    li.addEventListener('click', () => {
        const choice = li.textContent.trim()
        setWalls(wallsChoice === choice ? null : choice) // Повторный клик по выбранной кнопке убирает стены
        resetCamera() // Камера и модель возвращаются в исходное положение, как в мебели
    })
})

// ЦВЕТА КРЫШИ И СТЕН

let fabric = tentFabricsById['tent-blue'] // Выбранная ткань

// Красит ткань модели выбранным материалом. 
// Ткань помечена при загрузке (fabric: true в models.js), каркас без метки не трогаем
const paintFabric = (object) => {
    object?.traverse((node) => {
        if (node.isMesh && node.userData.fabric) node.material = node.userData.velcro ? velcroOf.get(fabric) : fabric 
        // Помеченный материал node.userData.fabric красится
    })
}

const setFabric = (to) => {
    fabric = to
    paintFabric(shownTent)
}

bindGroup(Object.entries(tentFabricsById).map(([id, material]) => [document.getElementById(id), material]), setFabric)

// МОДУЛЬНЫЙ СВЕТ

const lampsButton = [...document.querySelectorAll('#tent-options li')].find(li => li.textContent.trim() === 'Модульный свет')

const switchLamps = (on) => {
    lampsButton.className = on ? 'active' : 'button'
    setLampsOn(on) // Вызов самой функции включения ламп
    setFabricGlow(on) // Вызов свечения ткани крыши и стен изнутри
    scene.background.copy(on ? backgroundNight : backgroundDefault) // С лампами — тёмный фон, будто вечер
    document.body.classList.toggle('night', on) // Меняем туглом переменные в css
    dirLight.intensity = on ? config.lighting.directionalIntensityLamps : config.lighting.directionalIntensityTents // С лампами основной свет приглушаем
    dirLight2.intensity = on ? config.lighting.directionalIntensityLamps : config.lighting.directionalIntensityTents2
}

// Сам обработчик клика света. Повторный клик выключает
lampsButton.addEventListener('click', () => {
    switchLamps(lampsButton.className !== 'active')
    resetCamera() // Камера и модель возвращаются в исходное положение, как в мебели
}) 

// ВХОД И ВЫХОД ИЗ РАЗДЕЛА

export const tents = {
    enter() {
        section.style.display = '' // Показываем разметку раздела
        setMaxPolarAngle(91) // Под шатёр можно заглянуть немного снизу
        setCameraHome(cameraHomeRoof, cameraTargetRoof) // Шатры большие — камера дальше, чем у мебели
        setShadowArea(config.shadows.areaRoof)
        moveDirLight(dirLightTents)
        dirLight.intensity = config.lighting.directionalIntensityTents // Мебель могла оставить яркость под свою ткань
        dirLight2.intensity = config.lighting.directionalIntensityTents2
        scene.environmentIntensity = config.lighting.environmentIntensityTents // Окружение в шатрах своё, мебель вернёт общее
        scene.remove(pointLight) // Точечный свет нужен только для бликов на металле мебели
        turntable.add(lamps) // Лампы в сцене весь раздел, но выключены, пока не нажата кнопка. Вращаются вместе с шатром
        const first = [...sizeButtons].find(li => li.textContent.trim() === '4,0x4,0')
        first.click() // Раздел открывается с шатра 4,0x4,0 — это пока единственная модель. Клик по размеру заодно убирает стены
    },
    exit() { // Убираем ровно то, что добавил enter()
        selected = null // Если модель ещё грузится, она не появится в чужом разделе
        removeTent()
        setWalls(null)
        switchLamps(false) // Фон точно светлый для мебели
        turntable.remove(lamps)
        scene.add(pointLight) // Возвращаем общий свет, который убрал enter()
        section.style.display = 'none' // Прячем разметку раздела
    }
}
