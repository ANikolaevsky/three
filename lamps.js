import * as THREE from 'three'
import { RectAreaLightUniformsLib } from 'three/examples/jsm/lights/RectAreaLightUniformsLib.js'

// ЛИНЕЙНЫЕ ЛАМПЫ ШАТРА
// Под каждым шпилем — крестовина из четырёх ламп под балками каркаса. Каждая лампа — светящаяся модель (видно саму лампу) + RectAreaLight (свет от неё)

RectAreaLightUniformsLib.init() // Без этого RectAreaLight не светит

const LAMP_LENGTH = .7 // м
const LAMP_LENGTH_SMALL = .5 // м
const LAMP_FROM_CENTER = .1 // Отступ лампы от центрального узла каркаса, м
const BEAM_BOTTOM = 2.296 // Низ балок крестовины в модели каркаса, м. Одинаков под всеми шпилями
const BEAM_BOTTOM_SMALL = 2.186 // То же для шатров шириной 3,0 м: их каркас на 11 см ниже
const LAMP_TILT = 10 // Наклон лампы вдоль балки, градусы. Балки в модели горизонтальные; больше 0 — внешний конец выше
const LAMP_INTENSITY = 400 // Яркость света от одной лампы
const MAX_SPIRES = 3 // Больше всего шпилей у 4,0x8,0 и 3,0x6,0

// Длина лампы и высота балок для шатров шириной 4,0 и 3,0 м
const LAMP_SIZES = {
    large: { length: LAMP_LENGTH, beamBottom: BEAM_BOTTOM },
    small: { length: LAMP_LENGTH_SMALL, beamBottom: BEAM_BOTTOM_SMALL }
}

const lampSize = { width: LAMP_LENGTH, height: .06, depth: .06 } // Корпус лампы: длина × толщина × ширина
const lampMaterial = new THREE.MeshStandardMaterial({ color: 'white', emissive: 'white', emissiveIntensity: 10 })
const lampGeometry = new THREE.BoxGeometry(lampSize.width, lampSize.height, lampSize.depth)

// Ставит лампу под балку и задаёт ей длину. Геометрию не пересоздаём, а растягиваем корпус по длине
const placeLamp = (lamp, { length, beamBottom }) => {
    const [body, light] = lamp.children
    lamp.position.set(LAMP_FROM_CENTER + length / 2, beamBottom - lampSize.height / 2, 0) // Висит вплотную под балкой
    body.scale.x = length / lampSize.width
    light.width = length
}

const crosses = [] // Крестовины ламп, по одной под шпиль
export const lamps = new THREE.Group()

for (let i = 0; i < MAX_SPIRES; i++) {
    const cross = new THREE.Group()
    cross.userData = { lamps: [], bodies: [], lights: [], used: i === 0 }

    // Балки идут вдоль +x, +z, −x, −z — каждую лампу поворачиваем на свою четверть круга
    for (let quarter = 0; quarter < 4; quarter++) {
        const arm = new THREE.Group() // Лампа на одной балке. В её системе координат балка идёт вдоль +x
        arm.rotation.y = quarter * Math.PI / 2

        const lamp = new THREE.Group()
        lamp.rotation.z = THREE.MathUtils.degToRad(LAMP_TILT)

        const body = new THREE.Mesh(lampGeometry, lampMaterial)
        body.castShadow = false // Тонкая лампа под тентом — её тень не нужна

        const light = new THREE.RectAreaLight('rgb(255, 244, 229)', 0, lampSize.width, lampSize.depth) // Тёплый белый, по умолчанию выключен
        light.position.y = -lampSize.height / 2 // Светящаяся грань — низ корпуса
        light.rotation.x = -Math.PI / 2 // RectAreaLight светит вдоль своей −z — поворачиваем вниз

        lamp.add(body, light)
        placeLamp(lamp, LAMP_SIZES.large)
        arm.add(lamp)
        cross.add(arm)
        cross.userData.lamps.push(lamp)
        cross.userData.bodies.push(body)
        cross.userData.lights.push(light)
    }

    lamps.add(cross)
    crosses.push(cross)
}

let lampsOn = false

// Включает и выключает лампы. Свет не убираем из сцены, а гасим яркостью: иначе three.js перекомпилирует шейдеры и клик подтормаживает
export const setLampsOn = (on) => {
    lampsOn = on
    crosses.forEach(({ userData: { bodies, lights, used } }) => {
        lights.forEach(light => light.intensity = on && used ? LAMP_INTENSITY : 0)
        bodies.forEach(body => body.visible = on && used) // Корпуса ламп видны только во включённом состоянии
    })
}

// Ставит крестовины под шпили шатра: spires — x каждого шпиля, м; small — шатёр шириной 3,0 м.
// Лишние крестовины гасим, а не убираем — по той же причине
export const setLampSpires = (spires, small = false) => {
    const size = small ? LAMP_SIZES.small : LAMP_SIZES.large
    crosses.forEach((cross, i) => {
        cross.position.x = spires[i] ?? 0
        cross.userData.used = i < spires.length
        cross.userData.lamps.forEach(lamp => placeLamp(lamp, size))
    })
    setLampsOn(lampsOn)
}

setLampsOn(false)
