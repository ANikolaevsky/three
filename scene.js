import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'
import { devMode, config } from './config.js'
import { reduceVertices } from 'three/examples/jsm/utils/SceneUtils.js'
import { frameMaterial } from './textures.js'

// СЦЕНА

export const scene = new THREE.Scene()
export const backgroundDefault = new THREE.Color('rgb(240, 240, 240)')
export const backgroundNight = new THREE.Color('rgb(38, 38, 38)') // Тёмный фон, когда в шатре включены лампы
scene.background = backgroundDefault.clone() // Копия: фон потом меняется через copy(), а backgroundDefault должен остаться прежним
const canvas = document.querySelector('canvas');

// ОСИ И СЕТКИ

const axisHelper = new THREE.AxesHelper(10)
scene.add(axisHelper)

const gridHelper = new THREE.GridHelper(2, 6)
scene.add(gridHelper)

// СВЕТ

export const dirLight = new THREE.DirectionalLight('rgb(251, 249, 240)', config.lighting.directionalIntensity)
dirLight.position.set(...config.lighting.dirLightPosition) // ... раскладывает массив внутри dirLightPosition в три аргумента.
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

// Второй направленный свет: подсвечивает сторону, куда не достаёт dirLight. Без тени. В сцене всегда, яркость задаёт каждый раздел в enter()
export const dirLight2 = new THREE.DirectionalLight('rgb(250, 248, 238)', config.lighting.directionalIntensity2)
dirLight2.position.set(...config.lighting.dirLight2Position)
scene.add(dirLight2)

export const dirLightHelper2 = new THREE.DirectionalLightHelper(dirLight2, 2, 'red')
scene.add(dirLightHelper2)

// Точечный свет ради бликов на металле мебели: у направленного света на плоских гранях бликов нет. Шатры его убирают
export const pointLight = new THREE.PointLight('rgb(225, 225, 225)', 5, 100)
pointLight.position.set(...config.lighting.pointLightPosition)
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight, .1)
scene.add(pointLightHelper)

// Позиции pointLight: обычная и для разложенного комплекта 7.3
export const pointLightDefault = new THREE.Vector3(...config.lighting.pointLightPosition)
export const pointLightFar = new THREE.Vector3(...config.lighting.pointLightPositionFar)

// Позиции dirLight по разделам
export const dirLightDefault = new THREE.Vector3(...config.lighting.dirLightPosition) 
export const dirLightTents = new THREE.Vector3(...config.lighting.dirLightPositionTents) // строка 94

// Переставляет dirLight. Светит он всегда в центр сцены, меняется только позиция источника
export const moveDirLight = (position) => {
    dirLight.position.copy(position)
    dirLight.updateMatrixWorld() // Хелперы берут позицию из матрицы, а она сама обновится только при рендере
    dirLightHelper.update() // Без update хелперы в devMode остаются на старом месте
    shadowHelper.update()
}

// Плавный переход pointLight на новую позицию (та же кривая, что у камеры)
const lightTween = {
    active: false,
    duration: 1, // мс, как у камеры, чтобы двигались вместе (изменен)
    startTime: 0,
    from: new THREE.Vector3(),
    to: new THREE.Vector3()
}

export const movePointLight = (position) => {
    lightTween.from.copy(pointLight.position)
    lightTween.to.copy(position)
    lightTween.startTime = performance.now()
    lightTween.active = true
}

const updateLightTween = () => {
    if (!lightTween.active) return
    const t = Math.min((performance.now() - lightTween.startTime) / lightTween.duration, 1)
    const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic: мягко трогается и мягко тормозит
    pointLight.position.lerpVectors(lightTween.from, lightTween.to, eased)
    if (t === 1) lightTween.active = false
}

// АНИМАЦИЯ ВРАЩЕНИЯ

// Группа для анимации вращения
export const turntable = new THREE.Group() // Все модели кладём сюда, чтобы вращать разом
scene.add(turntable)

const timer = new THREE.Timer() // Объект для анимации
timer.connect(document) // Пока вкладка скрыта, время не накапливается, и после возврата модель не прыгнет

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

// Насколько низко можно опустить камеру. 85° — чуть выше горизонта, больше 90° — можно заглянуть снизу. Каждый раздел задаёт свой угол в enter()
export const setMaxPolarAngle = (degrees) => {
    controls.maxPolarAngle = THREE.MathUtils.degToRad(degrees)
}

// Блокируем зум страницы браузером
window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) event.preventDefault() // Щипок на трекпаде браузер тоже передаёт как wheel с ctrlKey
}, { passive: false })

const preventGesture = (event) => event.preventDefault() // Safari на Mac и iOS шлёт щипок отдельными событиями
document.addEventListener('gesturestart', preventGesture)
document.addEventListener('gesturechange', preventGesture)
document.addEventListener('gestureend', preventGesture)

controls.target.set(0, .3, 0) // Чтоб модель была чуть ниже на экране. Камера не сдвинута, но смотрит чуть выше модели

// ВОЗВРАТ КАМЕРЫ В ДЕФОЛТНОЕ ПОЛОЖЕНИЕ
// Двигаем камеру не по прямой, а по дуге вокруг цели (сферические координаты):

const cameraHome = {
    target: controls.target.clone(),
    spherical: new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)) // (-4, 3.1, 12) относительно цели
}

export const cameraTargetDefault = cameraHome.target.clone() // (0, .3, 0)
export const cameraTargetRoof = new THREE.Vector3(0, 1.5, 0) // Крыша висит на высоте 2,2–3,9 м — смотрим в её середину

// Куда возвращать камеру и куда она смотрит: С5 (T4) шире остальных моделей, поэтому для неё камера дальше
export const setCameraHome = (position, target = cameraTargetDefault) => {
    cameraHome.target.copy(target)
    cameraHome.spherical.setFromVector3(new THREE.Vector3().copy(position).sub(target))
}

export const cameraHomeDefault = new THREE.Vector3(-4, 3.2, 10)
export const cameraHomeFar = new THREE.Vector3(-4.5, 3.5, 11)
export const cameraHomeFar2 = new THREE.Vector3(-5, 11, 11)
export const cameraHomeRoof = new THREE.Vector3(-25, 10, 35) // Крыша 4×4 м — камера заметно дальше и выше

const cameraTween = {
    active: false,
    duration: 1100, // мс
    startTime: 0,
    fromTarget: new THREE.Vector3(),
    fromSpherical: new THREE.Spherical(),
    spherical: new THREE.Spherical(), // Промежуточное значение на каждом кадре
    offset: new THREE.Vector3(),
    fromRotation: 0 // Угол turntable в момент нажатия — его плавно возвращаем в 0
}

let isDragging = false // Пользователь схватил модель — вращение останавливается до переключения на другую модель

export const resetCamera = () => {
    isDragging = false // Новая модель — вращение запускается снова
    cameraTween.fromTarget.copy(controls.target)
    cameraTween.fromSpherical.setFromVector3(cameraTween.offset.copy(camera.position).sub(controls.target))

    // Поворачиваем по короткой стороне, а не через полный оборот
    const dTheta = cameraHome.spherical.theta - cameraTween.fromSpherical.theta
    cameraTween.fromSpherical.theta += Math.round(dTheta / (Math.PI * 2)) * Math.PI * 2

    // Модель тоже довращаем в исходное положение по короткой стороне (угол приводим к диапазону -180°…180°)
    cameraTween.fromRotation = THREE.MathUtils.euclideanModulo(turntable.rotation.y + Math.PI, Math.PI * 2) - Math.PI
    cameraTween.startTime = performance.now()
    cameraTween.active = true
}

// Мгновенно ставим камеру в cameraHome, без полёта — для смены разделов, где точки слишком далеко друг от друга
export const jumpCamera = () => {
    isDragging = false // Вращение запускается сразу
    cameraTween.active = false // Отменяем полёт, если его успела запустить кнопка модели
    controls.target.copy(cameraHome.target)
    camera.position.setFromSpherical(cameraHome.spherical).add(controls.target)
    turntable.rotation.y = 0 // Модель в исходном положении, как после обычного возврата
    controls.update() // Орбит сразу принимает новую позицию
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
    turntable.rotation.y = THREE.MathUtils.lerp(cameraTween.fromRotation, 0, eased)
    if (t === 1) cameraTween.active = false
}

controls.addEventListener('start', () => {
    cameraTween.active = false // Пользователь схватил камеру — отменяем возврат
    isDragging = true
})
// controls.addEventListener('end', () => { isDragging = false }) // Отпустил — вращение продолжается

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
// renderer.toneMapping = THREE.NeutralToneMapping
renderer.toneMapping = THREE.ACESFilmicToneMapping // Супер классный ToneMapping
renderer.toneMappingExposure = 1 // Общая яркость сцены

renderer.shadowMap.enabled = true // Добавление теней в рендеринг!
// renderer.shadowMap.type = THREE.PCFShadowMap // Алгоритм сжатия теней
renderer.shadowMap.type = THREE.PCFSoftShadowMap // Чтоб были супер мягкие тени

renderer.setSize(config.sizes.width, config.sizes.height)

// АНИМИРОВАНИЕ И УПРАВЛЕНИЕ

function animate(timestamp) {
    timer.update(timestamp) // Обновляем таймер раз за кадр
    const delta = timer.getDelta() // Секунды с прошлого кадра
    updateCameraTween() // До controls.update(), чтобы орбит подхватил новую позицию
    updateLightTween()
    controls.update() // Постоянно обновляет орбит
    if (!cameraTween.active && !isDragging) turntable.rotation.y -= THREE.MathUtils.degToRad(2) * delta // 2° в секунду; пауза на время возврата камеры и пока модель держат
    requestAnimationFrame(animate) // Бесконечно вызывает функцию и синхронизируется с частотой экрана
    renderer.render(scene, camera)
}
animate()

// КАРТА ОКРУЖЕНИЯ

const pmrem = new THREE.PMREMGenerator(renderer)
scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture
// frameMaterial.envMap = scene.environment // Тогда каркас получает силу окружения envMapIntensity напрямую, а не общую силу окружения сцены
scene.environmentIntensity = config.lighting.environmentIntensity // Сила освещения и отражений от окружения (фон не затрагивается)

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
    dirLightHelper2,
    pointLightHelper,
    axisHelper, 
    gridHelper, 
    shadowHelper
)
