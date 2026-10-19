import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { devMode, config } from './config.js'

// СЦЕНА

export const scene = new THREE.Scene()
scene.background = new THREE.Color('rgb(240, 240, 240)')
const canvas = document.querySelector('canvas');

// ОСИ И СЕТКИ

const axisHelper = new THREE.AxesHelper(10)
scene.add(axisHelper)

const gridHelper = new THREE.GridHelper(2, 6)
scene.add(gridHelper)

// СВЕТ

export const dirLight = new THREE.DirectionalLight('rgb(252, 250, 243)', config.lighting.directionalIntensity)
dirLight.position.set(1, 6, 1)
dirLight.castShadow = true // Отбрасывание тени от этого источника
dirLight.shadow.mapSize = new THREE.Vector2(config.shadows.resolution, config.shadows.resolution) 
dirLight.shadow.normalBias = config.shadows.normalBias // Улучшение нормалей от теней
// dirLight.shadow.radius = 1 // Скругление границ тени. Не работает с текущим shadowMap.

dirLight.shadow.camera.near = config.camera.near
dirLight.shadow.camera.far = config.camera.far
scene.add(dirLight)

const dirLightHelper = new THREE.DirectionalLightHelper (dirLight, 2)
scene.add(dirLightHelper)

const shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera)
scene.add(shadowHelper)

// По умолчанию тени считаются в квадрате 10×10, а сцена ~1.5 м — сужаем, чтобы тень стала детальнее
// Чем меньше area, тем чётче тень, но модель должна целиком помещаться в область
export const setShadowArea = (area) => {
    const cam = dirLight.shadow.camera
    cam.left = cam.bottom = -area
    cam.right = cam.top = area
    cam.updateProjectionMatrix() // ЧТО ЭТО? Без этого новые границы не применятся
    shadowHelper.update() // Рамка в devMode тоже должна показать новую область
}
setShadowArea(config.shadows.area)

const pointLight = new THREE.PointLight('rgb(238, 238, 236)', 10, 10)
pointLight.position.set(2, 1, 2)
// scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight, .1)
scene.add(pointLightHelper)

const pointLight2 = new THREE.PointLight('rgb(225, 225, 225)', 15, 100)
pointLight2.position.set(-1.5, .5, -1.5) // Совпадает с pointLight2Default ниже
scene.add(pointLight2)

const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, .1)
scene.add(pointLightHelper2)

export const pointLight3 = new THREE.PointLight('rgb(225, 225, 225)', 5, 100)
pointLight3.position.set(-2.8, .5, 1)

const pointLightHelper3 = new THREE.PointLightHelper(pointLight3, .1)
scene.add(pointLightHelper3)

export const pointLight4 = new THREE.PointLight('rgb(225, 225, 225)', 10, 100)
pointLight4.position.set(2.8, .5, -2.8)

const pointLightHelper4 = new THREE.PointLightHelper(pointLight4, .1)
scene.add(pointLightHelper4)

// Позиции pointLight2 для комплекта 7.3 
export const pointLight2Default = new THREE.Vector3(-1.5, .5, -1.5)
export const pointLight2Far = new THREE.Vector3(-2.8, .8, -2.6)

// Плавный переход pointLight2 на новую позицию (та же кривая, что у камеры)
const lightTween = {
    active: false,
    duration: 1, // мс, как у камеры, чтобы двигались вместе (изменен)
    startTime: 0,
    from: new THREE.Vector3(),
    to: new THREE.Vector3()
}

export const movePointLight2 = (position) => {
    lightTween.from.copy(pointLight2.position)
    lightTween.to.copy(position)
    lightTween.startTime = performance.now()
    lightTween.active = true
}

const updateLightTween = () => {
    if (!lightTween.active) return
    const t = Math.min((performance.now() - lightTween.startTime) / lightTween.duration, 1)
    const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic: мягко трогается и мягко тормозит
    pointLight2.position.lerpVectors(lightTween.from, lightTween.to, eased)
    if (t === 1) lightTween.active = false
}

// КАМЕРА

const camera = new THREE.PerspectiveCamera(
    config.camera.fov, 
    config.sizes.width / config.sizes.height
)
camera.position.set(-4, 3.2, 10)

// ORBIT CONTROLS

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true // Плавность, инерция
controls.dampingFactor = .05 // Степень плавности
controls.screenSpacePanning = false
controls.enableZoom = false // Отключение зума
controls.minPolarAngle = 0 // Можно смотреть строго сверху (+90°)
controls.maxPolarAngle = THREE.MathUtils.degToRad(85) // Ниже 5° от горизонта опуститься нельзя

// Блокируем зум страницы браузером
window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) event.preventDefault() // Щипок на трекпаде браузер тоже передаёт как wheel с ctrlKey
}, { passive: false })

const preventGesture = (event) => event.preventDefault() // Safari на Mac и iOS шлёт щипок отдельными событиями
document.addEventListener('gesturestart', preventGesture)
document.addEventListener('gesturechange', preventGesture)
document.addEventListener('gestureend', preventGesture)

controls.target.set(0, .3, 0) // Чтоб модель была чуть ниже на экране. Камера не сдвинута, но смотрит чуть выше модели

// Плавный возврат камеры в изначальное положение (МАГИЯ)
// Двигаем камеру не по прямой, а по дуге вокруг цели (сферические координаты):

const cameraHome = {
    target: controls.target.clone(),
    spherical: new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)) // (-4, 3.1, 12) относительно цели
}

// Куда возвращать камеру: М9 (T4) шире остальных моделей, поэтому для неё камера дальше
export const setCameraHome = (position) => {
cameraHome.spherical.setFromVector3(new THREE.Vector3().copy(position).sub(cameraHome.target))
}

export const cameraHomeDefault = new THREE.Vector3(-4, 3.2, 10)
export const cameraHomeFar = new THREE.Vector3(-4.5, 3.5, 11)
export const cameraHomeFar2 = new THREE.Vector3(-5, 11, 11)

const cameraTween = {
    active: false,
    duration: 1100, // мс
    startTime: 0,
    fromTarget: new THREE.Vector3(),
    fromSpherical: new THREE.Spherical(),
    spherical: new THREE.Spherical(), // Промежуточное значение на каждом кадре
    offset: new THREE.Vector3()
}

export const resetCamera = () => {
    cameraTween.fromTarget.copy(controls.target)
    cameraTween.fromSpherical.setFromVector3(cameraTween.offset.copy(camera.position).sub(controls.target))

    // Поворачиваем по короткой стороне, а не через полный оборот
    const dTheta = cameraHome.spherical.theta - cameraTween.fromSpherical.theta
    cameraTween.fromSpherical.theta += Math.round(dTheta / (Math.PI * 2)) * Math.PI * 2
    cameraTween.startTime = performance.now()
    cameraTween.active = true
}

const updateCameraTween = () => {
    if (!cameraTween.active) return
    const t = Math.min((performance.now() - cameraTween.startTime) / cameraTween.duration, 1)
    const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic: мягко трогается и мягко тормозит
    const from = cameraTween.fromSpherical
    const to = cameraHome.spherical
    cameraTween.spherical.set(
        THREE.MathUtils.lerp(from.radius, to.radius, eased),
        THREE.MathUtils.lerp(from.phi, to.phi, eased),
        THREE.MathUtils.lerp(from.theta, to.theta, eased)
    )
    controls.target.lerpVectors(cameraTween.fromTarget, cameraHome.target, eased)
    camera.position.setFromSpherical(cameraTween.spherical).add(controls.target)
    if (t === 1) cameraTween.active = false
}

controls.addEventListener('start', () => { cameraTween.active = false }) // Пользователь схватил камеру — отменяем возврат

// Плоскость

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20), // Размер должен покрывать область, куда падают тени
    new THREE.ShadowMaterial({
        opacity: .2 // Плоскость невидима, виден только сам оттенок тени
    })
)
plane.rotation.x = -Math.PI * 0.5
plane.position.set(0, 0, 0)
plane.receiveShadow = true
scene.add(plane)

// РЕНДЕР

const renderer = new THREE.WebGLRenderer({
    canvas: canvas, 
    antialias: true, // Сглаживание геометрии от three
    powerPreference: 'high-performance', // Максимальная производительность браузера
    depth: true, // Буфер глубины для корректного отображения 
    alpha: true
})

// Оптимизация сглаживания для ретина-экранов от браузера! Выбирает минимальное значение разрешения либо 2.
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
 
renderer.outputColorSpace = THREE.SRGBColorSpace // Улучшенное и корректное отображение цветов
// renderer.toneMapping = THREE.LinearToneMapping // Улучшение переходов и теней
renderer.toneMapping = THREE.ACESFilmicToneMapping // Супер классный ToneMapping
renderer.shadowMap.enabled = true // Добавление теней в рендеринг!
// renderer.shadowMap.type = THREE.PCFShadowMap // Алгоритм сжатия теней
renderer.shadowMap.type = THREE.PCFSoftShadowMap // Чтоб были супер мягкие тени
renderer.setSize(config.sizes.width, config.sizes.height)

// АНИМИРОВАНИЕ И УПРАВЛЕНИЕ

function animate() {
    updateCameraTween() // До controls.update(), чтобы орбит подхватил новую позицию
    updateLightTween()
    controls.update() // Постоянно обновляет орбит
    // loader.rotation.y -= THREE.MathUtils.degToRad(.05) // Постоянная анимация вращения
    requestAnimationFrame(animate) // Бесконечно вызывает функцию и синхронизируется с частотой экрана
    renderer.render(scene, camera)
}
animate()

// КАРТА ОКРУЖЕНИЯ

const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
scene.environmentIntensity = .3 // Сила освещения и отражений от окружения (фон не затрагивается)

// РЕСАЙЗ (РЕЗИНОВЫЙ КАНВАС)

window.addEventListener('resize', () => { // Вешаем обработку на событие ресайза экрана
    controls.update()
    config.sizes.height = window.innerHeight // Обновляем стороны при каждом изменении окна
    config.sizes.width = window.innerWidth
    
    camera.aspect = config.sizes.width / config.sizes.height // Обновляем соотношения сторон камеры
    camera.updateProjectionMatrix() // Обновляем матрицу экрана

    renderer.setSize(config.sizes.width, config.sizes.height) //  Обновляем рендерер с новыми сторонами
})

if (!devMode) scene.remove(
    dirLightHelper, 
    pointLightHelper, 
    pointLightHelper2,
    pointLightHelper3, 
    pointLightHelper4, 
    axisHelper, 
    gridHelper, 
    shadowHelper
)
