import * as THREE from 'three'
import './css/style.css'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js' 
import { materialLightMap, metalness, roughness, texture } from 'three/tsl'
import { Pane } from 'tweakpane'
import Stats from 'three/addons/libs/stats.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const stats = new Stats() // FPS
// document.body.appendChild(stats.dom)

const devMode = false

// Единый объект конфигурации

const config = {
    shadows: {
        resolution: 2048, // Разрешение теней (512, 1024, 2048)
        normalBias: .0001, // Должен быть порядка 2–3 текселей теневой карты, иначе тень «отрывается» от объектов
        area: 1.5 // Половина размера области, в которой считаются тени
    },
    lighting: {
        ambientIntensity: .4,
        directionalIntensity: 8
    },
    camera: {
        fov: 14,
        position: [ 0, 0, 0 ],
        near: 1,
        far: 10
    },
    materials: {
        roughness: .4,
        metalness: 0
    },
    sizes: {
    height: window.innerHeight,
    width: window.innerWidth
}
}

// Сцена

const scene = new THREE.Scene()
scene.background = new THREE.Color('rgb(240, 240, 240)')
const canvas = document.querySelector('canvas');

// Свет

const ambientLight = new THREE.AmbientLight('white', 0.5) // Равномерный фоновый свет
// scene.add(ambientLight)

const dirLight = new THREE.DirectionalLight('rgb(252, 250, 243)', config.lighting.directionalIntensity)
dirLight.position.set(1, 6, 1)
dirLight.castShadow = true // Включает отбрасывание тени от этого источника
dirLight.shadow.mapSize = new THREE.Vector2(config.shadows.resolution, config.shadows.resolution) 
dirLight.shadow.normalBias = config.shadows.normalBias // Улучшение нормалей от теней
dirLight.shadow.radius = 1
// По умолчанию тени считаются в квадрате 10×10, а сцена ~1.5 м — сужаем, чтобы тень стала детальнее
dirLight.shadow.camera.left = -config.shadows.area
dirLight.shadow.camera.right = config.shadows.area
dirLight.shadow.camera.top = config.shadows.area
dirLight.shadow.camera.bottom = -config.shadows.area
dirLight.shadow.camera.near = 1
dirLight.shadow.camera.far = 10
scene.add(dirLight)

const dirLightHelper = new THREE.DirectionalLightHelper (dirLight, 2)
scene.add(dirLightHelper)

const shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera)
scene.add(shadowHelper)


const hemiLight = new THREE.HemisphereLight(0x0099ff, 0xaa5500)
// scene.add(hemiLight)

const pointLight = new THREE.PointLight('rgb(238, 238, 236)', 10, 10)
pointLight.position.set(2, 1, 2)
// pointLight.castShadow = true
// pointLight.shadow.mapSize = new THREE.Vector2(config.shadows.resolution, config.shadows.resolution) 
// pointLight.shadow.camera.far = 10 // Макс расстояние отбрасывания теней
// pointLight.shadow.normalBias = config.shadows.normalBias // Улучшение нормалей от теней
// pointLight.shadow.radius = 1 // Мягкость теней
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight, .1)
scene.add(pointLightHelper)

const pointLight2 = new THREE.PointLight('rgb(225, 225, 225)', 15, 100)
pointLight2.position.set(-1.5, .5, -1.5)
// pointLight2.castShadow = true
scene.add(pointLight2)

const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, .1)
scene.add(pointLightHelper2)

// Камера

const camera = new THREE.PerspectiveCamera(
    config.camera.fov, 
    config.sizes.width / config.sizes.height
)
camera.position.set(-4, 3.3, 10)

// Оси и сетки

const axisHelper = new THREE.AxesHelper(10)
scene.add(axisHelper)

const gridHelper = new THREE.GridHelper(2, 6)
scene.add(gridHelper)

// Вращение OrbitControls

const controls = new OrbitControls(camera, canvas)
controls.enableDamping = true // Плавность, инерция
controls.dampingFactor = .05 // Степень плавности
controls.screenSpacePanning = false
controls.enableZoom = false // Отключение зума

// Блокируем зум страницы браузером
window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) event.preventDefault() // Щипок на трекпаде браузер тоже передаёт как wheel с ctrlKey
}, { passive: false })

// Safari на Mac и iOS шлёт щипок отдельными событиями
const preventGesture = (event) => event.preventDefault()
document.addEventListener('gesturestart', preventGesture)
document.addEventListener('gesturechange', preventGesture)
document.addEventListener('gestureend', preventGesture)


controls.target.set(0, .2, 0) // Чтоб модель была чуть ниже на экране

// Плавный возврат камеры в изначальное положение

// Двигаем камеру не по прямой, а по дуге вокруг цели (сферические координаты):
// прямая проходит ближе к модели, и камера по пути «наезжала» бы на неё
const cameraHome = {
    target: controls.target.clone(),
    spherical: new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)) // (-4, 3, 10) относительно цели
}
const cameraTween = {
    active: false,
    duration: 1100, // мс
    startTime: 0,
    fromTarget: new THREE.Vector3(),
    fromSpherical: new THREE.Spherical(),
    spherical: new THREE.Spherical(), // Промежуточное значение на каждом кадре
    offset: new THREE.Vector3()
}

const resetCamera = () => {
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

// Текстуры

const textureLoader = new THREE.TextureLoader()

// UV у моделей в сантиметрах (от -70 до 70), а не 0..1, поэтому нужен повтор и масштаб
const loadTexture = (path, isColor = false, scale = .01) => {
    const tex = textureLoader.load(path)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping // Без этого за пределами 0..1 растягивается крайний пиксель
    tex.repeat.set(scale, scale) // Одна плитка текстуры на 1 / scale единиц UV
    tex.anisotropy = 8
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace // Цветовые карты в sRGB, остальные — линейные
    return tex
}

const metallMaterial = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/MetalGalvanizedSteelWorn001_COL_2K_METALNESS.jpg', true), // Базовое изображение текстуры
    // aoMap: loadTexture('./img/Poliigon_MetalGalvanizedZinc_7184_AmbientOcclusion.jpg'), // Карта теней
    roughnessMap: loadTexture('./img/MetalGalvanizedSteelWorn001_ROUGHNESS_2K_METALNESS.jpg'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/MetalGalvanizedSteelWorn001_METALNESS_2K_METALNESS.jpg'), // Металл или диэлектрик
    normalMap: loadTexture('./img/MetalGalvanizedSteelWorn001_NRM_2K_METALNESS.jpg'), // Карта нормалей
    // displacementMap: loadTexture('./img/Poliigon_Displacement.tiff'), // Карта высот
    // displacementScale: 0,
    metalness: .5,
    roughness: .4,
    // emissive: 'rgb(167, 167, 167)' // Излучение
})

const metallMaterial2 = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_BaseColor.jpg', true), // Базовое изображение текстуры
    aoMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_AmbientOcclusion.jpg'), // Карта теней
    roughnessMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Roughness.jpg'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Metallic.jpg'), // Металл или диэлектрик
    normalMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Normal.png'), // Карта нормалей
    // displacementMap: loadTexture('./img/Poliigon_Displacement.tiff'), // Карта высот
    // displacementScale: 0,
    metalness: 1,
    roughness: 1
})

const softMaterial = new THREE.MeshStandardMaterial({ 
    map: loadTexture('/img/rough-fabric_albedo.png', true), // Базовое изображение текстуры
    aoMap: loadTexture('./img/rough-fabric_ao.png'), // Карта теней
    roughnessMap: loadTexture('./img/rough-fabric_roughness.png'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/rough-fabric_metallic.png'), // Металл или диэлектрик
    normalMap: loadTexture('./img/rough-fabric_normal-ogl.png'), // Карта нормалей
    displacementMap: loadTexture('./img/rough-fabric_height.png'), // Карта высот
    displacementScale: 0
})

const softMaterial2 = new THREE.MeshStandardMaterial({ 
    map: loadTexture('/img/grey-upholstery_albedo.png', true), // Базовое изображение текстуры
    aoMap: loadTexture('./img/grey-upholstery_ao.png'), // Карта теней
    roughnessMap: loadTexture('./img/grey-upholstery_roughness.png'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/grey-upholstery_metallic.png'), // Металл или диэлектрик
    normalMap: loadTexture('./img/grey-upholstery_normal-ogl.png'), // Карта нормалей
    displacementMap: loadTexture('./img/grey-upholstery_height.png'), // Карта высот
    displacementScale: 0
})

softMaterial2.normalScale.set(.1, .1) // Уменьшение значений неправильной карты нормалей

// Плоскость

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20), // Размер должен покрывать область, где падают тени
    new THREE.ShadowMaterial({
        opacity: .2 // Плоскость невидима, виден только сам оттенок тени
    })
)
plane.rotation.x = -Math.PI * 0.5
plane.position.set(0, 0, 0)
plane.receiveShadow = true
// plane.castShadow = true
scene.add(plane)

// Лоадеры

const loader = new GLTFLoader()

let currentMetallMaterial = metallMaterial2 // Металл для подгружаемых моделей, меняется кнопками Лак / Цинк
let currentSoftMaterial = softMaterial // Ткань подушек, меняется кнопками Бежевые / Серые

let mr = null
loader.load(
    './models/MR.glb',
    (gltf) => { // Коллбек при успешной загрузки
        mr = gltf.scene // Загружаем геометрию
        mr.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mr.scale.setScalar(.01) // Сразу во все направления
        mr.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        mr.position.set(-.35, 0, .4)
        // scene.add(mr)
    }
)

let mr2 = null
loader.load(
    './models/MR2.glb',
    (gltf) => { // Коллбек при успешной загрузки
        mr2 = gltf.scene // Загружаем геометрию
        mr2.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mr2.scale.setScalar(.01) // Сразу во все направления
        mr2.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        mr2.position.set(-.35, 0, .4)
        scene.add(mr2)
    }
)

let ml = null
loader.load(
    './models/ML.glb',
    (gltf) => {
        ml = gltf.scene // Загружаем геометрию
        ml.traverse((node) => { // Траверс как раз позволяет пройтись по всем дочерним элементам.
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        ml.scale.setScalar(.01)
        ml.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        ml.position.set(.375, 0, .4)
        // scene.add(ml)
    }
)

let ml2 = null
loader.load(
    './models/ML2.glb',
    (gltf) => {
        ml2 = gltf.scene // Загружаем геометрию
        ml2.traverse((node) => { // Траверс как раз позволяет пройтись по всем дочерним элементам.
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        ml2.scale.setScalar(.01)
        ml2.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        ml2.position.set(.375, 0, .4)
        scene.add(ml2)
    }
)

loader.load(
    './models/TB.glb',
    (gltf) => {
        const tb = gltf.scene // Загружаем геометрию
        tb.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        tb.scale.setScalar(.01)
        tb.rotation.set(0, THREE.MathUtils.degToRad(270), 0)
        tb.position.set(.35, 0, .375)
        scene.add(tb)
    }
)

loader.load(
    './models/MF.glb',
    (gltf) => {
        const mf = gltf.scene // Загружаем геометрию
        mf.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mf.scale.setScalar(.01)
        mf.rotation.set(0, THREE.MathUtils.degToRad(90), 0)
        mf.position.set(-.35, 0, -.275)
        scene.add(mf)
    }
)

loader.load(
    './models/MG.glb',
    (gltf) => {
        const mg = gltf.scene // Загружаем геометрию
        mg.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mg.scale.setScalar(.01)
        mg.rotation.set(THREE.MathUtils.degToRad(180), 0, 0)
        mg.position.set(-.35, .285, -.275)
        scene.add(mg)
    }
)

loader.load(
    './models/MG.glb',
    (gltf) => {
        const mg2 = gltf.scene // Загружаем геометрию
        mg2.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mg2.scale.setScalar(.01)
        mg2.rotation.set(THREE.MathUtils.degToRad(180), 0, 0)
        mg2.position.set(-.35, .285, .05)
        scene.add(mg2)
    }
)

loader.load(
    './models/S1.glb',
    (gltf) => {
        const s1 = gltf.scene // Загружаем геометрию
        s1.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true
                node.receiveShadow = true
            }
        })
        s1.scale.setScalar(.01)
        s1.position.set(-.365, .290, .387)
        scene.add(s1)
    }
)

loader.load(
    './models/S1.glb',
    (gltf) => {
        const s1 = gltf.scene // Загружаем геометрию
        s1.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s1.scale.setScalar(.01)
        s1.position.set(0, .290, .387)
        scene.add(s1)
    }
)

loader.load(
    './models/S2.glb',
    (gltf) => {
        const s2 = gltf.scene // Загружаем геометрию
        s2.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s2.scale.setScalar(.01)
        s2.rotation.set(THREE.MathUtils.degToRad(90), 0, 0)
        s2.position.set(-.365, .375, -.28)
        scene.add(s2)
    }
)

let s3 = null
loader.load(
    './models/S3.glb',
    (gltf) => {
        s3 = gltf.scene // Загружаем геометрию
        s3.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s3.scale.setScalar(.01)
        s3.rotation.set(0, THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(90))
        s3.position.set(-.365, .375, -.19)
        // scene.add(s3)
    }
) 

let s4 = null
loader.load(
    './models/S3.glb',
    (gltf) => {
        s4 = gltf.scene // Загружаем геометрию
        s4.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s4.scale.setScalar(.01)
        s4.rotation.set(0, THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(90))
        s4.position.set(.272, .375, -.19)
        // scene.add(s4)
    }
) 

// Рендер

const renderer = new THREE.WebGLRenderer({
    canvas: canvas, 
    antialias: true, // Сглаживание геометрии от three
    powerPreference: 'high-performance', // Максимальная производительность браузера
    depth: true, // Буфер глубины для корректного отображения 
    alpha: true
})

// Оптимизация сглаживания для ретина-экранов от браузера! 
// Выбирает минимальное значение разрешения либо двойку
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
 
renderer.outputColorSpace = THREE.SRGBColorSpace // Улучшенное и корректное отображение цветов
// renderer.toneMapping = THREE.LinearToneMapping // Улучшение переходов и теней
renderer.toneMapping = THREE.ACESFilmicToneMapping // Супер классный ToneMapping
renderer.shadowMap.enabled = true // Добавление теней в рендеринг!
// renderer.shadowMap.type = THREE.PCFShadowMap // Алгоритм сжатия теней
renderer.shadowMap.type = THREE.PCFSoftShadowMap // Чтоб были супер мягкие тени
renderer.setSize(config.sizes.width, config.sizes.height)

// Анимирование и управление

function animate() {
    updateCameraTween() // До controls.update(), чтобы орбит подхватил новую позицию
    controls.update() // Постоянно обновляет орбит
    // cube.rotation.y -= THREE.MathUtils.degToRad(.05) // Постоянная анимация вращения
    requestAnimationFrame(animate) // Бесконечно вызывает функцию и синхронизируется с частотой экрана
    stats.begin() // Запуск стэтса FPS
    renderer.render(scene, camera)
    stats.end()
    // composer.render()
}
animate()

// Карта окружения

// const pmrem = new THREE.PMREMGenerator(renderer)
// scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture

// Резиновый канвас (ресайз)

window.addEventListener('resize', () => {
    controls.update()
    config.sizes.height = window.innerHeight // Обновляем соотношение сторон при каждом изменении окна
    config.sizes.width = window.innerWidth
    
    camera.aspect = config.sizes.width / config.sizes.height // Обновление соотношения сторон
    camera.updateProjectionMatrix() // Обновление матрицы экрана

    renderer.setSize(config.sizes.width, config.sizes.height) //  Обновление рендерера с новыми сторонами
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Режим разработчика

if (devMode) {
    const pane = new Pane()
    pane.addBinding(metallMaterial, 'metalness', {min: 0, max: 1, step:.1})
    pane.addBinding(softMaterial, 'metalness', {min: 0, max: 1, step:.1})
    pane.addBinding(metallMaterial, 'roughness', {min: 0, max: 1, step: .1})
    pane.addBinding(softMaterial, 'roughness', {min: 0, max: 1, step: .1})
    // pane.addBinding(metallMaterial, 'offset', {
    //     x: {min: -1, max: 1, step:.1}
    // })
    // pane.addBinding(softMaterial, 'offset', {x: {min: -1, max: 1, step:.1}, y: {min: -1, max: 1, step:.1}})

} else {
    scene.remove(
        dirLightHelper, 
        pointLightHelper, 
        pointLightHelper2,
        axisHelper,
        gridHelper,
        shadowHelper
    )
}

// Лак / Цинк: переключение metalness и активной кнопки

const zinc = document.getElementById('zinc')
const lacquer = document.getElementById('lacquer')

// mr, mr2, ml, ml2, s3, s4 могут быть не в сцене, поэтому обходим их отдельно
const replaceMaterial = (from, to) => {
    const objects = [scene, mr, mr2, ml, ml2, s3, s4]
    objects.forEach(object => {
        object?.traverse((node) => {
            if (node.isMesh && node.material === from) node.material = to
        })
    })
}

const setMetallMaterial = (from, to) => {
    currentMetallMaterial = to
    replaceMaterial(from, to)
}

zinc.addEventListener('click', () => {
    setMetallMaterial(metallMaterial2, metallMaterial)
    resetCamera()
    zinc.className = 'active'
    lacquer.className = 'button'
})

lacquer.addEventListener('click', () => {
    setMetallMaterial(metallMaterial, metallMaterial2)
    resetCamera()
    lacquer.className = 'active'
    zinc.className = 'button'
})

// Бежевые / Серые: смена ткани подушек

const beige = document.getElementById('beige')
const grey = document.getElementById('grey')

const setSoftMaterial = (from, to) => {
    currentSoftMaterial = to
    replaceMaterial(from, to)
}

grey.addEventListener('click', () => {
    setSoftMaterial(softMaterial, softMaterial2)
    resetCamera()
    grey.className = 'active'
    beige.className = 'button'
})

beige.addEventListener('click', () => {
    setSoftMaterial(softMaterial2, softMaterial)
    resetCamera()
    beige.className = 'active'
    grey.className = 'button'
})

// Модуль: переключение активной кнопки и моделей

const moduleButtons = document.querySelectorAll('.footer-block .buttons:first-child li:not(.label)')

moduleButtons.forEach(li => {
    li.addEventListener('click', () => {
        moduleButtons.forEach(other => other.className = 'button')
        li.className = 'active' // background: rgb(240, 240, 240)
        resetCamera()

        if (li.textContent.trim() === 'М2') {
            if (mr2) scene.remove(mr2)
            if (mr) scene.add(mr)
            if (s3) scene.add(s3)
            if (ml) scene.remove(ml) // Сброс после М3
            if (s4) scene.remove(s4)
            if (ml2) scene.add(ml2)
        }

        if (li.textContent.trim() === 'М1') {
            if (mr) scene.remove(mr)
            if (mr2) scene.add(mr2)
            if (s3) scene.remove(s3)
            if (ml) scene.remove(ml) // Сброс после М3
            if (s4) scene.remove(s4)
            if (ml2) scene.add(ml2)
        }

        if (li.textContent.trim() === 'М3') {
            if (mr2) scene.remove(mr2)
            if (ml2) scene.remove(ml2)
            if (mr) scene.add(mr)
            if (ml) scene.add(ml)
            if (s3) scene.add(s3)
            if (s4) scene.add(s4)
        }
    })
})
