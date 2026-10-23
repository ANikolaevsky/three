import { showSpecs } from './specs.js'
import { metallMaterial, metallMaterial2, metallMaterial3, metallMaterial4,
    softMaterial, softMaterial2, softMaterial3, softMaterial4, softMaterial5} from './textures.js'
import { loadFurniture, sofa, state, setT2Tops, setT3Tops, t2TopsM4, t2TopsC1, 
    t3TopsC3, t3TopsC4 } from './models.js'
import { config } from './config.js'
import { scene, turntable, dirLight, pointLight3, pointLight4, setShadowArea, movePointLight2, 
    pointLight2Default, pointLight2Far, setCameraHome, cameraHomeDefault, cameraHomeFar,
    cameraHomeFar2, resetCamera, setMaxPolarAngle } from './scene.js'

// РАЗДЕЛ «МОДУЛЬНАЯ МЕБЕЛЬ»: модели, кнопки и переключение модулей

const models = await loadFurniture() // Код раздела ниже работает с уже загруженными моделями
const { mr, mr2, ml, ml2, s1Left, s1Right, s3, s4, t2, t3, t4, t5, a73, a74 } = models

//  ОБРАБОТКА СОБЫТИЙ

// СБОРКА МАТЕРИАЛОВ

// sofa, mr, mr2, ml, ml2, s3, s4, t2 могут быть не в сцене, поэтому обходим их отдельно
const replaceMaterial = (from, to) => {
    const objects = [scene, sofa, mr, mr2, ml, ml2, s3, s4, t2, t3, t4, t5, a73, a74]
    objects.forEach(object => {
        object?.traverse((node) => {
            if (node.isMesh && node.material === from && !node.userData.fixedMaterial) node.material = to
        })
    })
}

// Заменяем текущий материал на выбранный

const setMetallMaterial = (to) => { // Функция смены простая
    replaceMaterial(state.metall, to)
    state.metall = to // Теперь новый материал это каррентМатериал
}

const setSoftMaterial = (to) => {
    replaceMaterial(state.soft, to)
    state.soft = to
    // Условие для softMaterial4. Свет слабее, для остальных тканей — значение из конфига.
    dirLight.intensity = to === softMaterial4 ? 3 : config.lighting.directionalIntensity
}

// Сам сборщик материалов и модулей

const bindGroup = (items, onSelect) => {
    items.forEach(([button, material]) => {
        button.addEventListener('click', () => { 
            onSelect(material)
            items.forEach(([other]) => other.className = 'button')
            button.className = 'active'
        })
    })
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
    [document.getElementById('blue'), softMaterial5]
], setSoftMaterial)

// ПЕРЕКЛЮЧЕНИЕ МОДУЛЕЙ

// Сложить / Разложить: комплект 7.3 меняется на сложенный вариант a74 и обратно

const assembly = document.getElementById('assembly') // Присваиваем переменной кнопку по ID из DOM
const assemblyLabel = assembly.querySelector('.assembly-label') // Текст отдельно, чтобы не затирать иконку

let isFolded = false

// Только состояние и текст кнопки, модели меняет обработчик клика
const setFolded = (folded) => {
    isFolded = folded
    assemblyLabel.textContent = folded ? 'Разложить' : 'Сложить'
}

assembly.addEventListener('click', () => {
    // Кнопка работает только когда на сцене комплект 7.3 в любом из вариантов
    const isComplect = (a73 && a73.parent === turntable) || (a74 && a74.parent === turntable)
    if (!isComplect || !a73 || !a74) return

    setFolded(!isFolded)

    if (isFolded) {
        turntable.remove(a73)
        turntable.add(a74)
        movePointLight2(pointLight2Default) // Сложенный комплект меньше, свет возвращаем на обычное место
        setCameraHome(cameraHomeDefault) // Камера как у С3 и С6
        setShadowArea(config.shadows.areaSmall) // Сложенный комплект помещается в обычную область теней
    } else {
        turntable.remove(a74)
        turntable.add(a73)
        movePointLight2(pointLight2Far)
        setCameraHome(cameraHomeFar2) // Камера разложенного комплекта 7.3
        setShadowArea(config.shadows.areaLarge)
    }
    resetCamera()
})

// У столов (С1–С6) нет подушек, поэтому блок выбора ткани для них скрываем
const textile = document.getElementById('textile')
const modulesWithoutTextile = ['С1', 'С2', 'С3', 'С4', 'С5', 'С6']

// Кресла и Столы — одна общая группа: на сцене всегда одна модель, поэтому активна только одна кнопка из обеих
const moduleButtons = document.querySelectorAll('#chairs li:not(.label), #tables li:not(.label), #tables2 li:not(.label), #complects li:not(.label)')

moduleButtons.forEach(li => {
    li.addEventListener('click', () => { // Один обработчик для всех кнопок
        moduleButtons.forEach(other => other.className = 'button')
        li.className = 'active' // Класс, меняющий фон кнопки

        const name = li.textContent.trim()

        showSpecs(name) // Изменение спецификации из specs.js

        textile.style.display = modulesWithoutTextile.includes(name) ? 'none' : ''

        if (name === '7.3') setCameraHome(cameraHomeFar2)
        else if (name === 'С6' || name === 'С3') setCameraHome(cameraHomeFar)
        else setCameraHome(cameraHomeDefault)

        if (name === '7.3') setShadowArea(config.shadows.areaLarge)
        else setShadowArea(config.shadows.area)
        movePointLight2(name === '7.3' ? pointLight2Far : pointLight2Default)
        resetCamera()

        // У объекта один родитель: scene.add(s1) забирает подушку из sofa, а sofa.add(s1) возвращает её в диван
        if (s1Left) sofa.add(s1Left)
        if (s1Right) sofa.add(s1Right)
        // Комплект и его свет убираем при любой смене модели, ветка 7.3 добавит их обратно
        if (a73) turntable.remove(a73)
        if (a74) turntable.remove(a74)
        scene.remove(pointLight3, pointLight4)
        setFolded(false) // Новая модель всегда открывается разложенной

        if (name === '7.3') {
            turntable.remove(sofa)
            if (t2) turntable.remove(t2)
            if (t3) turntable.remove(t3)
            if (t4) turntable.remove(t4)
            if (t5) turntable.remove(t5)
            if (a73) turntable.add(a73) // Модель вращается вместе с группой
            scene.add(pointLight3, pointLight4) // Свет остаётся неподвижным в сцене
            return
        }

        if (name === 'М4' || name === 'С1' || name === 'С2') {
            turntable.remove(sofa)
            if (t3) turntable.remove(t3)
            if (t4) turntable.remove(t4)
            if (t5) turntable.remove(t5)
            if (t2) turntable.add(t2)
            if (name === 'М4' || name === 'С1') setT2Tops(t2TopsM4, t2TopsC1)
            if (name === 'С2') setT2Tops(t2TopsC1, t2TopsM4)
            if (name === 'М4') {
                if (s1Left) turntable.add(s1Left)
                if (s1Right) turntable.add(s1Right)
            }
            return
        }

        if (name === 'С5' || name === 'С4') {
            turntable.remove(sofa)
            if (t2) turntable.remove(t2)
            if (t4) turntable.remove(t4)
            if (t5) turntable.remove(t5)
            if (t3) turntable.add(t3)
            if (name === 'С5') setT3Tops(t3TopsC4, t3TopsC3)
            if (name === 'С4') setT3Tops(t3TopsC3, t3TopsC4)
            return
        }

        if (name === 'С6') {
            turntable.remove(sofa)
            if (t2) turntable.remove(t2)
            if (t3) turntable.remove(t3)
            if (t5) turntable.remove(t5)
            if (t4) turntable.add(t4)
            return
        }

        if (name === 'С3') {
            turntable.remove(sofa)
            if (t2) turntable.remove(t2)
            if (t3) turntable.remove(t3)
            if (t4) turntable.remove(t4)
            if (t5) turntable.add(t5)
            return
        }

        // М1–М3: возвращаем диван, убираем t2
        turntable.add(sofa)
        if (t2) turntable.remove(t2)
        if (t3) turntable.remove(t3)
        if (t4) turntable.remove(t4)
        if (t5) turntable.remove(t5)

        if (name === 'М2') {
            if (mr2) sofa.remove(mr2)
            if (ml) sofa.remove(ml) // Сброс после М3
            if (s4) sofa.remove(s4)
            if (mr) sofa.add(mr)
            if (s3) sofa.add(s3)
            if (ml2) sofa.add(ml2)
        }

        if (name === 'М3') {
            if (mr2) sofa.remove(mr2)
            if (ml2) sofa.remove(ml2)
            if (mr) sofa.add(mr)
            if (ml) sofa.add(ml)
            if (s3) sofa.add(s3)
            if (s4) sofa.add(s4)
        }

        if (name === 'М1') {
            if (mr) sofa.remove(mr)
            if (mr2) sofa.add(mr2)
            if (s3) sofa.remove(s3)
            if (ml) sofa.remove(ml)
            if (s4) sofa.remove(s4)
            if (ml2) sofa.add(ml2)
        }
    })
})

// ВХОД И ВЫХОД ИЗ РАЗДЕЛА

const section = document.getElementById('furniture') // Вся разметка раздела: кнопки, спецификация, материалы

export const furniture = {
    enter() { // enter срабатывает и выполняет то, что внутри, при открытии furniture
        section.style.display = '' // Показываем разметку раздела
        setMaxPolarAngle(85) // Ниже 5° от горизонта опуститься нельзя
        moduleButtons[1].click() // А внутри click по кнопке М2 и её обработчик
    },
    exit() { // При выходе из furniture, убираем всё, что было в сцене, чтобы не мешать другим разделам
        if (s1Left) sofa.add(s1Left) // Подушки М4 возвращаем в диван
        if (s1Right) sofa.add(s1Right)
        turntable.remove(sofa)
        if (t2) turntable.remove(t2)
        if (t3) turntable.remove(t3)
        if (t4) turntable.remove(t4)
        if (t5) turntable.remove(t5)
        if (a73) turntable.remove(a73)
        if (a74) turntable.remove(a74)
        scene.remove(pointLight3, pointLight4)
        setFolded(false)
        section.style.display = 'none' // Прячем разметку раздела
    }
}
