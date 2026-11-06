import { showSpecs } from './specs.js'
import { bindGroup } from './buttons.js'
import { metallMaterial, metallMaterial2, metallMaterial3, metallMaterial4,
    softMaterial, softMaterial2, softMaterial3, softMaterial4, softMaterial5, softMaterial6, softMaterial7, softMaterial8} from './textures.js'
import { loadFurniture, setM, state, setT2Tops, setT3Tops, t2TopsM4, t2TopsC1, 
    t3TopsC3, t3TopsC4 } from './models.js'
import { config } from './config.js'
import { scene, turntable, dirLight, dirLight2, setShadowArea, movePointLight,
    pointLightDefault, pointLightFar, setCameraHome, cameraHomeDefault, cameraHomeFar,
    cameraHomeFar2, resetCamera, setMaxPolarAngle, moveDirLight, dirLightDefault } from './scene.js'

// РАЗДЕЛ «МОДУЛЬНАЯ МЕБЕЛЬ»: модели, кнопки и переключение модулей

const models = await loadFurniture() // Код раздела ниже работает с уже загруженными моделями
const { m, m2, m3, t2, t3, t4, t5, a73, a74 } = models

//  ОБРАБОТКА СОБЫТИЙ

// СБОРКА МАТЕРИАЛОВ

// Модели могут быть не в сцене, поэтому обходим их отдельно. Скрытые узлы М traverse тоже обходит
const replaceMaterial = (from, to) => {
    const objects = [scene, m, m2, m3, t2, t3, t4, t5, a73, a74]
    objects.forEach(object => {
        object?.traverse((node) => {
            if (node.isMesh && node.material === from && !node.userData.fixedMaterial) node.material = to
        }) // Проверка означает «это ткань, если сейчас на ней текущая ткань».
    })
}

// ЗАМЕНА МАТЕРИАЛА

// Функция смены текущего материала металла на выбранный
const setMetallMaterial = (to) => {
    replaceMaterial(state.metall, to)
    state.metall = to // Теперь новый материал это каррентМатериал
}

// Функция смены текущего материала ткани на выбранный
const setSoftMaterial = (to) => {
    replaceMaterial(state.soft, to)
    state.soft = to
}

// Вызываем функцию сборщика, не делая доп.переменных для кнопок

bindGroup([ 
    [document.getElementById('zinc'), metallMaterial],
    [document.getElementById('black-lacquer'), metallMaterial2],
    [document.getElementById('brown-lacquer'), metallMaterial3],
    [document.getElementById('white-lacquer'), metallMaterial4]
], setMetallMaterial)

bindGroup([
    [document.getElementById('beige'), softMaterial],
    [document.getElementById('grey'), softMaterial2],
    [document.getElementById('black'), softMaterial3],
    [document.getElementById('white'), softMaterial4],
    [document.getElementById('blue'), softMaterial5],
    [document.getElementById('red'), softMaterial6],
    [document.getElementById('brown'), softMaterial7],
    [document.getElementById('beige-blue'), softMaterial8]
], setSoftMaterial)

// СЛОЖИТЬ / РАЗЛОЖИТЬ, РАЗОБРАТЬ / СОБРАТЬ

const assembly = document.getElementById('assembly') // Присваиваем переменной кнопку по ID из DOM
const assemblyLabel = assembly.querySelector('.assembly-label') // Текст отдельно, чтобы не затирать иконку
const decompose = document.getElementById('decompose')
const decomposeLabel = decompose.querySelector('.assembly-label')

let view = 'assembled' // Вид модели: 'assembled' — обычный, 'folded' — сложена, 'decomposed' — разобрана

// Только состояние и текст кнопок, модели меняют обработчики клика
const setView = (next) => {
    view = next
    assemblyLabel.textContent = view === 'folded' ? 'Разложить' : 'Сложить'
    decomposeLabel.textContent = view === 'decomposed' ? 'Собрать' : 'Разобрать'
}

// Сборка М в каждом виде. Видимые узлы во всех трёх уже выставил setM
const mViews = { assembled: m, folded: m2, decomposed: m3 }
const isMOnScene = () => Object.values(mViews).some(model => model && model.parent === turntable)

// Ставит М в нужный вид, повторный клик по той же кнопке возвращает обычный. Камера, свет и тени у М одни во всех видах
const toggleMView = (next) => {
    const to = view === next ? 'assembled' : next
    if (!mViews[to]) return // Модель не загрузилась
    turntable.remove(mViews[view])
    turntable.add(mViews[to])
    setView(to)
}

// Обработчик «Разобрать»
decompose.addEventListener('click', () => { 
    if (isMOnScene()) toggleMView('decomposed') // Разбирается пока только М
})

assembly.addEventListener('click', () => {
    if (isMOnScene()) return toggleMView('folded')

    // Иначе кнопка работает, только когда на сцене комплект 7.3 в любом из вариантов
    const isComplect = a73 && a74 && (a73.parent === turntable || a74.parent === turntable)
    if (!isComplect) return

    setView(view === 'folded' ? 'assembled' : 'folded')

    if (view === 'folded') {
        turntable.remove(a73)
        turntable.add(a74)
        movePointLight(pointLightDefault) // Сложенный комплект меньше, свет возвращаем на обычное место
        setCameraHome(cameraHomeDefault) // Камера как у С3 и С6
        setShadowArea(config.shadows.areaSmall) // Сложенный комплект помещается в обычную область теней
    } else {
        turntable.remove(a74)
        turntable.add(a73)
        movePointLight(pointLightFar)
        setCameraHome(cameraHomeFar2) // Камера разложенного комплекта 7.3
        setShadowArea(config.shadows.areaLarge)
    }
    resetCamera()
})

// ПЕРЕКЛЮЧЕНИЕ МОДУЛЕЙ

const textile = document.getElementById('textile') // Достаем блок с тканью
const modulesWithoutTextile = ['С1', 'С2', 'С3', 'С4', 'С5', 'С6'] // Достаем кнопки столов (С1–С6)

// Кресла и Столы — одна общая группа: на сцене всегда одна модель, 
// поэтому активна только одна кнопка из обеих, делаем общий querySelector
const moduleButtons = document.querySelectorAll('#chairs li:not(.label), #tables li:not(.label), #tables2 li:not(.label), #complects li:not(.label)')

moduleButtons.forEach(li => {
    li.addEventListener('click', () => { // Один обработчик для всех кнопок
        moduleButtons.forEach(other => other.className = 'button')
        li.className = 'active' // Класс, меняющий фон кнопки

        const name = li.textContent.trim()

        showSpecs(name, 'furniture') // Изменение описания из specs.js

        // Скрываем блок выбора ткани при клике по столам
        textile.style.display = modulesWithoutTextile.includes(name) ? 'none' : '' 

        if (name === '7.3') setCameraHome(cameraHomeFar2) // Положение камеры в зависимости от модели
        else if (name === 'С6' || name === 'С3') setCameraHome(cameraHomeFar)
        else setCameraHome(cameraHomeDefault)

        if (name === '7.3') setShadowArea(config.shadows.areaLarge) // Область тени для большой модели
        else setShadowArea(config.shadows.area)
        movePointLight(name === '7.3' ? pointLightFar : pointLightDefault) // Двигаем свет для большой модели
        resetCamera()

        // Сложенные модели и комплект убираем при любой смене модели, нужная ветка добавит разложенную обратно
        if (a73) turntable.remove(a73)
        if (a74) turntable.remove(a74)
        if (m2) turntable.remove(m2)
        if (m3) turntable.remove(m3)
        setView('assembled') // Новая модель всегда открывается в обычном виде

        if (name === '7.3') {
            if (m) turntable.remove(m)
            if (t2) turntable.remove(t2)
            if (t3) turntable.remove(t3)
            if (t4) turntable.remove(t4)
            if (t5) turntable.remove(t5)
            if (a73) turntable.add(a73) // Модель вращается вместе с группой
            return
        }

        if (name === 'С1' || name === 'С2') {
            if (m) turntable.remove(m)
            if (t3) turntable.remove(t3)
            if (t4) turntable.remove(t4)
            if (t5) turntable.remove(t5)
            if (t2) turntable.add(t2)
            if (name === 'С1') setT2Tops(t2TopsM4, t2TopsC1)
            if (name === 'С2') setT2Tops(t2TopsC1, t2TopsM4)
            return
        }

        if (name === 'С5' || name === 'С4') {
            if (m) turntable.remove(m)
            if (t2) turntable.remove(t2)
            if (t4) turntable.remove(t4)
            if (t5) turntable.remove(t5)
            if (t3) turntable.add(t3)
            if (name === 'С5') setT3Tops(t3TopsC4, t3TopsC3)
            if (name === 'С4') setT3Tops(t3TopsC3, t3TopsC4)
            return
        }

        if (name === 'С6') {
            if (m) turntable.remove(m)
            if (t2) turntable.remove(t2)
            if (t3) turntable.remove(t3)
            if (t5) turntable.remove(t5)
            if (t4) turntable.add(t4)
            return
        }

        if (name === 'С3') {
            if (m) turntable.remove(m)
            if (t2) turntable.remove(t2)
            if (t3) turntable.remove(t3)
            if (t4) turntable.remove(t4)
            if (t5) turntable.add(t5)
            return
        }

        // М1–М4: одна сборка М, кнопка выбирает её видимые узлы
        if (t2) turntable.remove(t2)
        if (t3) turntable.remove(t3)
        if (t4) turntable.remove(t4)
        if (t5) turntable.remove(t5)
        if (m) turntable.add(m)
        setM(name)
    })
})

// ВХОД И ВЫХОД ИЗ РАЗДЕЛА

const section = document.getElementById('furniture') // Вся разметка раздела: кнопки, спецификация, материалы

export const furniture = {
    enter() { // enter срабатывает и выполняет то, что внутри, при открытии furniture
        section.style.display = '' // Показываем разметку раздела
        setMaxPolarAngle(85) // Ниже 5° от горизонта опуститься нельзя
        moveDirLight(dirLightDefault)
        dirLight2.intensity = config.lighting.directionalIntensity2 // Шатры ставят ему свою яркость
        dirLight.intensity = config.lighting.directionalIntensity // Шатры ставят ему свою яркость
        scene.environmentIntensity = config.lighting.environmentIntensity // Шатры ставят своё окружение
        moduleButtons[1].click() // А внутри click по кнопке М2 и её обработчик
    },
    exit() { // При выходе из furniture, убираем всё, что было в сцене, чтобы не мешать другим разделам
        if (m) turntable.remove(m)
        if (m2) turntable.remove(m2)
        if (m3) turntable.remove(m3)
        if (t2) turntable.remove(t2)
        if (t3) turntable.remove(t3)
        if (t4) turntable.remove(t4)
        if (t5) turntable.remove(t5)
        if (a73) turntable.remove(a73)
        if (a74) turntable.remove(a74)
        setView('assembled')
        section.style.display = 'none' // Прячем разметку раздела
    }
}
