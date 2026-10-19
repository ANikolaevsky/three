import './css/style.css'
import { Pane } from 'tweakpane'
import { showSpecs } from './specs.js'
import {
    metallMaterial, metallMaterial2, metallMaterial3, metallMaterial4,
    softMaterial, softMaterial2, softMaterial3, softMaterial4, softMaterial5
} from './textures.js'
import { models, sofa, state, setT2Tops, setT3Tops, t2TopsM4, t2TopsM5, t3TopsM7, t3TopsM8 } from './models.js'
import { devMode, config } from './config.js'

import {
    scene, dirLight, pointLight3, pointLight4,
    setShadowArea, movePointLight2, pointLight2Default, pointLight2Far,
    setCameraHome, cameraHomeDefault, cameraHomeFar, cameraHomeFar2, resetCamera
} from './scene.js'

// Цепочка строго: config.js  ←  scene.js  ←  index.js  →  models.js  →  textures.js


// СОЕДИНЕНИЕ scene.js, models.js, textures.js и config.js

const { mr, mr2, ml, ml2, s1Left, s1Right, s3, s4, t2, t3, t4, t5, a73, a74 } = models
scene.add(sofa) 

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

// Заменяем текущий материал, какой бы ни был выбран

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
        button.addEventListener('click', () => { // Сам обработчик очень простой
            onSelect(material)
            resetCamera()
            items.forEach(([other]) => other.className = 'button')
            button.className = 'active'
        })
    })
}

// Вытаскиваем кнопку и сразу присваиваем ей материал, не делая доп.переменные

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
    const isComplect = (a73 && a73.parent === scene) || (a74 && a74.parent === scene)
    if (!isComplect || !a73 || !a74) return

    setFolded(!isFolded)

    if (isFolded) {
        scene.remove(a73)
        scene.add(a74)
        movePointLight2(pointLight2Default) // Сложенный комплект меньше, свет возвращаем на обычное место
        setCameraHome(cameraHomeDefault) // Камера как у М7 и М10
        setShadowArea(config.shadows.areaSmall) // Сложенный комплект помещается в обычную область теней
    } else {
        scene.remove(a74)
        scene.add(a73)
        movePointLight2(pointLight2Far)
        setCameraHome(cameraHomeFar2) // Камера разложенного комплекта 7.3
        setShadowArea(config.shadows.areaLarge)
    }
    resetCamera()
})

// У столов (М5–М10) нет подушек, поэтому блок выбора ткани для них скрываем
const textile = document.getElementById('textile')
const modulesWithoutTextile = ['М5', 'М6', 'М7', 'М8', 'М9', 'М10']

// Кресла и Столы — одна общая группа: на сцене всегда одна модель, поэтому активна только одна кнопка из обеих
const moduleButtons = document.querySelectorAll('#chairs li:not(.label), #tables li:not(.label), #tables2 li:not(.label), #complects li:not(.label)')

showSpecs('М1') // Спецификация модели по дефолту

moduleButtons.forEach(li => {
    li.addEventListener('click', () => { // Один обработчик для всех кнопок
        moduleButtons.forEach(other => other.className = 'button')
        li.className = 'active' // Класс, меняющий фон кнопки

        const name = li.textContent.trim()

        showSpecs(name) // Изменение спецификации из specs.js

        textile.style.display = modulesWithoutTextile.includes(name) ? 'none' : ''

        if (name === '7.3') setCameraHome(cameraHomeFar2)
        else if (name === 'М10' || name === 'М7') setCameraHome(cameraHomeFar)
        else setCameraHome(cameraHomeDefault)

        setShadowArea(name === '7.3' ? config.shadows.areaLarge : config.shadows.area)
        movePointLight2(name === '7.3' ? pointLight2Far : pointLight2Default)
        resetCamera()

        // У объекта один родитель: scene.add(s1) забирает подушку из sofa, а sofa.add(s1) возвращает её в диван
        if (s1Left) sofa.add(s1Left)
        if (s1Right) sofa.add(s1Right)
        // Комплект и его свет убираем при любой смене модели, ветка 7.3 добавит их обратно
        if (a73) scene.remove(a73)
        if (a74) scene.remove(a74)
        scene.remove(pointLight3, pointLight4)
        setFolded(false) // Новая модель всегда открывается разложенной

        if (name === '7.3') {
            scene.remove(sofa)
            if (t2) scene.remove(t2)
            if (t3) scene.remove(t3)
            if (t4) scene.remove(t4)
            if (t5) scene.remove(t5)
            if (a73) scene.add(a73, pointLight3, pointLight4)
            return
        }

        if (name === 'М4' || name === 'М5' || name === 'М6') {
            scene.remove(sofa)
            if (t3) scene.remove(t3)
            if (t4) scene.remove(t4)
            if (t5) scene.remove(t5)
            if (t2) scene.add(t2)
            if (name === 'М4' || name === 'М5') setT2Tops(t2TopsM4, t2TopsM5)
            if (name === 'М6') setT2Tops(t2TopsM5, t2TopsM4)
            if (name === 'М4') {
                if (s1Left) scene.add(s1Left)
                if (s1Right) scene.add(s1Right)
            }
            return
        }

        if (name === 'М9' || name === 'М8') {
            scene.remove(sofa)
            if (t2) scene.remove(t2)
            if (t4) scene.remove(t4)
            if (t5) scene.remove(t5)
            if (t3) scene.add(t3)
            if (name === 'М9') setT3Tops(t3TopsM8, t3TopsM7)
            if (name === 'М8') setT3Tops(t3TopsM7, t3TopsM8)
            return
        }

        if (name === 'М10') {
            scene.remove(sofa)
            if (t2) scene.remove(t2)
            if (t3) scene.remove(t3)
            if (t5) scene.remove(t5)
            if (t4) scene.add(t4)
            return
        }

        if (name === 'М7') {
            scene.remove(sofa)
            if (t2) scene.remove(t2)
            if (t3) scene.remove(t3)
            if (t4) scene.remove(t4)
            if (t5) scene.add(t5)
            return
        }

        if (name === 'М10') {
            scene.remove(sofa)
            if (t2) scene.remove(t2)
            if (t3) scene.remove(t3)
            if (t5) scene.remove(t5)
            if (t4) scene.add(t4)
            return
        }

        // М1–М3: возвращаем диван, убираем t2
        scene.add(sofa)
        if (t2) scene.remove(t2)
        if (t3) scene.remove(t3)
        if (t4) scene.remove(t4)
        if (t5) scene.remove(t5)

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