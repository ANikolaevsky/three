import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

// ЛИНЕЙНЫЕ ЛАМПЫ ШАТРА 4,0x4,0
// Четыре лампы крестом под балками каркаса. Каждая — светящаяся модель (видно саму лампу) + RectAreaLight (свет от неё)

RectAreaLightUniformsLib.init() // Без этого RectAreaLight не светит

const LAMP_LENGTH = .7 // м
const LAMP_FROM_CENTER = .1 // Отступ лампы от центрального узла каркаса, м
const BEAM_BOTTOM = 2.296 // Низ балок крестовины в модели каркаса, м
const LAMP_TILT = 10 // Наклон лампы вдоль балки, градусы. Балки в модели горизонтальные; больше 0 — внешний конец выше
const LAMP_INTENSITY = 400 // Яркость света от одной лампы

const lampSize = { width: LAMP_LENGTH, height: .06, depth: .06 } // Корпус лампы: длина × толщина × ширина
const lampMaterial = new THREE.MeshStandardMaterial({ color: 'white', emissive: 'white', emissiveIntensity: 10 })
const lampGeometry = new THREE.BoxGeometry(lampSize.width, lampSize.height, lampSize.depth)

const bodies = []
const lights = []
export const lamps = new THREE.Group()

// Балки идут вдоль +x, +z, −x, −z — каждую лампу поворачиваем на свою четверть круга
for (let quarter = 0; quarter < 4; quarter++) {
    const arm = new THREE.Group() // Лампа на одной балке. В её системе координат балка идёт вдоль +x
    arm.rotation.y = quarter * Math.PI / 2

    const lamp = new THREE.Group()
    lamp.position.set(LAMP_FROM_CENTER + LAMP_LENGTH / 2, BEAM_BOTTOM - lampSize.height / 2, 0) // Висит вплотную под балкой
    lamp.rotation.z = THREE.MathUtils.degToRad(LAMP_TILT)

    const body = new THREE.Mesh(lampGeometry, lampMaterial)
    body.castShadow = false // Тонкая лампа под тентом — её тень не нужна

    const light = new THREE.RectAreaLight('rgb(255, 244, 229)', 0, lampSize.width, lampSize.depth) // Тёплый белый, по умолчанию выключен
    light.position.y = -lampSize.height / 2 // Светящаяся грань — низ корпуса
    light.rotation.x = -Math.PI / 2 // RectAreaLight светит вдоль своей −z — поворачиваем вниз

    lamp.add(body, light)
    arm.add(lamp)
    lamps.add(arm)
    bodies.push(body)
    lights.push(light)
}

// Включает и выключает лампы. Свет не убираем из сцены, а гасим яркостью: иначе three.js перекомпилирует шейдеры и клик подтормаживает
export const setLampsOn = (on) => {
    lights.forEach(light => light.intensity = on ? LAMP_INTENSITY : 0)
    bodies.forEach(body => body.visible = on) // Корпуса ламп видны только во включённом состоянии
}

setLampsOn(false)
