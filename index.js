import * as THREE from 'three'
import './css/style.css'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js' // Декодер сжатия геометрии
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js' 
import { materialLightMap, metalness, roughness, texture } from 'three/tsl'
import { Pane } from 'tweakpane'
import Stats from 'three/addons/libs/stats.module.js'
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js'

const devMode = false

// Единый объект конфигурации

const config = {
    shadows: {
        resolution: 2048, // Разрешение теней (512, 1024, 2048)
        normalBias: .0001, // Порядка 2–3 текселя теневой карты, иначе тень «отрывается» от объектов
        area: 1.5, // Половина размера области, в которой считаются тени
        areaLarge: 2.5 // То же для больших моделей (комплект 7.3)
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

const dirLight = new THREE.DirectionalLight('rgb(252, 250, 243)', config.lighting.directionalIntensity)
dirLight.position.set(1, 6, 1)
dirLight.castShadow = true // Включает отбрасывание тени от этого источника
dirLight.shadow.mapSize = new THREE.Vector2(config.shadows.resolution, config.shadows.resolution) 
dirLight.shadow.normalBias = config.shadows.normalBias // Улучшение нормалей от теней
dirLight.shadow.radius = 1

dirLight.shadow.camera.near = config.camera.near
dirLight.shadow.camera.far = config.camera.far
scene.add(dirLight)

const dirLightHelper = new THREE.DirectionalLightHelper (dirLight, 2)
scene.add(dirLightHelper)

const shadowHelper = new THREE.CameraHelper(dirLight.shadow.camera)
scene.add(shadowHelper)

// По умолчанию тени считаются в квадрате 10×10, а сцена ~1.5 м — сужаем, чтобы тень стала детальнее
// Чем меньше area, тем чётче тень, но модель должна целиком помещаться в область
const setShadowArea = (area) => {
    const cam = dirLight.shadow.camera
    cam.left = cam.bottom = -area
    cam.right = cam.top = area
    cam.updateProjectionMatrix() // Без этого новые границы не применятся
    shadowHelper.update() // Рамка в devMode тоже должна показать новую область
}
setShadowArea(config.shadows.area)

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
pointLight2.position.set(-1.5, .5, -1.5) // Совпадает с pointLight2Default ниже
// pointLight2.castShadow = true
scene.add(pointLight2)

const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, .1)
scene.add(pointLightHelper2)

const pointLight3 = new THREE.PointLight('rgb(225, 225, 225)', 5, 100)
pointLight3.position.set(-2.8, .5, 1)

const pointLightHelper3 = new THREE.PointLightHelper(pointLight3, .1)
scene.add(pointLightHelper3)

const pointLight4 = new THREE.PointLight('rgb(225, 225, 225)', 10, 100)
pointLight4.position.set(2.8, .5, -2.8)

const pointLightHelper4 = new THREE.PointLightHelper(pointLight4, .1)
scene.add(pointLightHelper4)

// Позиции pointLight2: комплект 7.3 больше остальных моделей, поэтому свет отводим дальше
const pointLight2Default = new THREE.Vector3(-1.5, .5, -1.5)
const pointLight2Far = new THREE.Vector3(-2.8, .8, -2.6)

// Плавный переход pointLight2 на новую позицию (та же кривая, что у камеры)
const lightTween = {
    active: false,
    duration: 1, // мс, как у камеры, чтобы двигались вместе
    startTime: 0,
    from: new THREE.Vector3(),
    to: new THREE.Vector3()
}

const movePointLight2 = (position) => {
    lightTween.from.copy(pointLight2.position)
    lightTween.to.copy(position)
    lightTween.startTime = performance.now()
    lightTween.active = true
}

const updateLightTween = () => {
    if (!lightTween.active) return
    const t = Math.min((performance.now() - lightTween.startTime) / lightTween.duration, 1)
    const eased = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2 // easeInOutCubic
    pointLight2.position.lerpVectors(lightTween.from, lightTween.to, eased)
    if (t === 1) lightTween.active = false
}

// Камера

const camera = new THREE.PerspectiveCamera(
    config.camera.fov, 
    config.sizes.width / config.sizes.height
)
camera.position.set(-4, 3.2, 10)

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
controls.minPolarAngle = 0 // Можно смотреть строго сверху (+90°)
controls.maxPolarAngle = THREE.MathUtils.degToRad(85) // Ниже 5° от горизонта опуститься нельзя

// Блокируем зум страницы браузером
window.addEventListener('wheel', (event) => {
    if (event.ctrlKey) event.preventDefault() // Щипок на трекпаде браузер тоже передаёт как wheel с ctrlKey
}, { passive: false })

// Safari на Mac и iOS шлёт щипок отдельными событиями
const preventGesture = (event) => event.preventDefault()
document.addEventListener('gesturestart', preventGesture)
document.addEventListener('gesturechange', preventGesture)
document.addEventListener('gestureend', preventGesture)

controls.target.set(0, .3, 0) // Чтоб модель была чуть ниже на экране

// Плавный возврат камеры в изначальное положение (МАГИЯ)
// Двигаем камеру не по прямой, а по дуге вокруг цели (сферические координаты):

const cameraHome = {
    target: controls.target.clone(),
    spherical: new THREE.Spherical().setFromVector3(camera.position.clone().sub(controls.target)) // (-4, 3.1, 12) относительно цели
}

// Куда возвращать камеру: М9 (T4) шире остальных моделей, поэтому для неё камера дальше
const setCameraHome = (position) => {
    cameraHome.spherical.setFromVector3(new THREE.Vector3().copy(position).sub(cameraHome.target))
}
const cameraHomeDefault = new THREE.Vector3(-4, 3.2, 10)
const cameraHomeFar = new THREE.Vector3(-4.5, 3.5, 11)
const cameraHomeFar2 = new THREE.Vector3(-5, 11, 11)
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

// Коррекция текстур. UV у моделей в сантиметрах (от -70 до 70), а не 0..1, поэтому нужен повтор и масштаб
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
    new THREE.PlaneGeometry(20, 20), // Размер должен покрывать область, куда падают тени
    new THREE.ShadowMaterial({
        opacity: .2 // Плоскость невидима, виден только сам оттенок тени
    })
)
plane.rotation.x = -Math.PI * 0.5
plane.position.set(0, 0, 0)
plane.receiveShadow = true
scene.add(plane)

// Лоадеры

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder) // Использование сжатой геометрии

// Все модели кресел (М1–М3) лежат в одной группе, чтобы М4 могла убрать их разом
const sofa = new THREE.Group()
scene.add(sofa)

let currentMetallMaterial = metallMaterial2 // Металл по дефолту, меняется кнопками Лак / Цинк
let currentSoftMaterial = softMaterial // Ткань по дефолту, меняется кнопками Бежевые / Серые

let mr = null
loader.load(
    './models/compressed/MR.glb',
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
        mr.position.set(-.351, 0, .4)
        // sofa.add(mr)
    }
)

let mr2 = null
loader.load(
    './models/compressed/MR2.glb',
    (gltf) => { 
        mr2 = gltf.scene 
        mr2.traverse((node) => {
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mr2.scale.setScalar(.01) 
        mr2.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        mr2.position.set(-.351, 0, .4)
        sofa.add(mr2)
    }
)

let ml = null
loader.load(
    './models/compressed/ML.glb',
    (gltf) => {
        ml = gltf.scene 
        ml.traverse((node) => { 
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        ml.scale.setScalar(.01)
        ml.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        ml.position.set(.376, 0, .4)
        // sofa.add(ml)
    }
)

let ml2 = null
loader.load(
    './models/compressed/ML2.glb',
    (gltf) => {
        ml2 = gltf.scene 
        ml2.traverse((node) => { 
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        ml2.scale.setScalar(.01)
        ml2.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        ml2.position.set(.376, 0, .4)
        sofa.add(ml2)
    }
)

loader.load(
    './models/compressed/TB.glb',
    (gltf) => {
        const tb = gltf.scene 
        tb.traverse((node) => { 
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        tb.scale.setScalar(.01)
        tb.rotation.set(0, THREE.MathUtils.degToRad(270), 0)
        tb.position.set(.35, 0, .375)
        sofa.add(tb)
    }
)

loader.load(
    './models/compressed/MF.glb',
    (gltf) => {
        const mf = gltf.scene 
        mf.traverse((node) => { 
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mf.scale.setScalar(.01)
        mf.rotation.set(0, THREE.MathUtils.degToRad(90), 0)
        mf.position.set(-.35, 0, -.275)
        sofa.add(mf)
    }
)

loader.load(
    './models/compressed/MG.glb',
    (gltf) => {
        const mg = gltf.scene 
        mg.traverse((node) => { 
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mg.scale.setScalar(.01)
        mg.rotation.set(THREE.MathUtils.degToRad(180), 0, 0)
        mg.position.set(-.35, .285, -.275)
        sofa.add(mg)
    }
)

loader.load(
    './models/compressed/MG.glb',
    (gltf) => {
        const mg2 = gltf.scene
        mg2.traverse((node) => {
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        mg2.scale.setScalar(.01)
        mg2.rotation.set(THREE.MathUtils.degToRad(180), 0, 0)
        mg2.position.set(-.35, .285, .05)
        sofa.add(mg2)
    }
)

let s1Left = null
loader.load(
    './models/compressed/S1.glb',
    (gltf) => {
        s1Left = gltf.scene 
        s1Left.traverse((node) => {
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true
                node.receiveShadow = true
            }
        })
        s1Left.scale.setScalar(.01)
        s1Left.position.set(-.365, .290, .387)
        sofa.add(s1Left)
    }
)

let s1Right = null
loader.load(
    './models/compressed/S1.glb',
    (gltf) => {
        s1Right = gltf.scene
        s1Right.traverse((node) => {
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s1Right.scale.setScalar(.01)
        s1Right.position.set(0, .290, .387)
        sofa.add(s1Right)
    }
)

loader.load(
    './models/compressed/S2.glb',
    (gltf) => {
        const s2 = gltf.scene
        s2.traverse((node) => {
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s2.scale.setScalar(.01)
        s2.rotation.set(THREE.MathUtils.degToRad(90), 0, 0)
        s2.position.set(-.365, .375, -.28)
        sofa.add(s2)
    }
)

let s3 = null
loader.load(
    './models/compressed/S3.glb',
    (gltf) => {
        s3 = gltf.scene
        s3.traverse((node) => {
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s3.scale.setScalar(.01)
        s3.rotation.set(0, THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(90))
        s3.position.set(-.365, .375, -.19)
    }
) 

let s4 = null
loader.load(
    './models/compressed/S3.glb',
    (gltf) => {
        s4 = gltf.scene
        s4.traverse((node) => {
            if (node.isMesh) {
                node.material = currentSoftMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s4.scale.setScalar(.01)
        s4.rotation.set(0, THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(90))
        s4.position.set(.272, .375, -.19)
    }
) 

// Показывает одни детали сборки и скрывает другие (взаимозаменяемые детали на одних координатах)
const setParts = (parts, show, hide) => {
    show.forEach(name => { if (parts[name]) parts[name].visible = true })
    hide.forEach(name => { if (parts[name]) parts[name].visible = false })
}

let t2 = null
const t2Parts = {} // Детали сборки по именам: t2Parts.Node3 и т.д.

// Половины столешницы: М4 — стандартные, М5 — альтернативные (стоят на тех же координатах)
const t2TopsM4 = ['Node3', 'Node4']
const t2TopsM5 = ['Node8', 'Node7'] // Node8 на месте Node3, Node7 на месте Node4

const setT2Tops = (show, hide) => setParts(t2Parts, show, hide)

loader.load(
    './models/compressed/T2_Assembly.glb',
    (gltf) => {
        t2 = gltf.scene
        t2.traverse((node) => {
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
                t2Parts[node.name] = node
            }
        })
        setT2Tops(t2TopsM4, t2TopsM5) // По умолчанию альтернативные детали скрыты
        t2.scale.setScalar(.01)
        t2.rotation.set(0, THREE.MathUtils.degToRad(90), 0)
        t2.position.set(.89, .15, 1.54)
    }
)

let t3 = null
const t3Parts = {} // Детали сборки по именам: t3Parts.Node2 и т.д.

// Половины верхней столешницы: М7 — стандартные, М8 — альтернативные (стоят на тех же координатах)
// Node7 и Node8 — нижняя полка, не заменяются и видны всегда
const t3TopsM7 = ['Node2', 'Node3']
const t3TopsM8 = ['Node10', 'Node9'] // Node10 на месте Node2, Node9 на месте Node3

const setT3Tops = (show, hide) => setParts(t3Parts, show, hide)

loader.load(
    './models/compressed/T3_Assembly.glb',
    (gltf) => {
        t3 = gltf.scene
        t3.traverse((node) => {
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
                t3Parts[node.name] = node
            }
        })
        setT3Tops(t3TopsM7, t3TopsM8) // По умолчанию альтернативные детали скрыты
        t3.scale.setScalar(.01)
        t3.rotation.set(0, THREE.MathUtils.degToRad(90), 0)
        t3.position.set(.89, 0, 3.3)
    }
)

let t4 = null
loader.load(
    './models/compressed/T4_Assembly.glb',
    (gltf) => {
        t4 = gltf.scene
        t4.traverse((node) => {
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        t4.scale.setScalar(.01)
        t4.rotation.set(0, THREE.MathUtils.degToRad(90), 0)
        t4.position.set(1.25, 0, 3.3)
    }
) 

let t5 = null
loader.load(
    './models/compressed/T5_Assembly.glb',
    (gltf) => {
        t5 = gltf.scene
        t5.traverse((node) => {
            if (node.isMesh) {
                node.material = currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        t5.scale.setScalar(.01)
        t5.rotation.set(0, THREE.MathUtils.degToRad(90), 0)
        t5.position.set(1.25, .15, 1.54)
    }
) 

// Круглые диски ⌀1.9 см (1182 вершины) в комплектах 7.3 всегда из metallMaterial, кнопки Лак / Цинк их не меняют
const isCap = (node) => node.geometry.attributes.position.count === 1182

const setCapMaterial = (node) => {
    node.material = metallMaterial
    node.userData.fixedMaterial = true // replaceMaterial пропускает такие узлы
}

let a73 = null

// Подушки комплекта: те же S1 (Node4, 12...), S2 (Node5, 23...) и S3 (Node6, 37...), остальное — металл
// Найдены по числу вершин (844, 884, 804), как у отдельных S1, S2, S3. После переэкспорта модели номера нужно проверить
const a73SoftParts = new Set([
    'Node4', 'Node5', 'Node6', 'Node12', 'Node21', 'Node22', 'Node23', 'Node35',
    'Node36', 'Node37', 'Node38', 'Node47', 'Node51', 'Node52', 'Node53', 'Node57',
    'Node66', 'Node67', 'Node69', 'Node74', 'Node77', 'Node78'
]) // Просто список подушек

loader.load(
    './models/compressed/7.3_Assembly.glb',
    (gltf) => {
        a73 = gltf.scene
        a73.traverse((node) => {
            if (node.isMesh) {
                node.material = a73SoftParts.has(node.name) ? currentSoftMaterial : currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
                if (isCap(node)) setCapMaterial(node)
            }
        })
        a73.scale.setScalar(.01)
        a73.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        a73.position.set(1.7, 0, -.9)

    }
)

let a74 = null

// Подушки сложенного комплекта: номера узлов в 7.3_Disassembly свои, найдены так же по числу вершин S1, S2, S3
const a74SoftParts = new Set([
    'Node2', 'Node3', 'Node4', 'Node5', 'Node16', 'Node17', 'Node23', 'Node24',
    'Node25', 'Node26', 'Node29', 'Node32', 'Node33', 'Node34', 'Node35', 'Node36',
    'Node37', 'Node38', 'Node39', 'Node40'
])

loader.load(
    './models/compressed/7.3_Disassembly.glb',
    (gltf) => {
        a74 = gltf.scene
        a74.traverse((node) => {
            if (node.isMesh) {
                node.material = a74SoftParts.has(node.name) ? currentSoftMaterial : currentMetallMaterial,
                node.castShadow = true,
                node.receiveShadow = true
                if (isCap(node)) setCapMaterial(node)
            }
        })
        a74.scale.setScalar(.01)
        a74.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        a74.position.set(-2.55, 0, .14)
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
    updateLightTween()
    controls.update() // Постоянно обновляет орбит
    // cube.rotation.y -= THREE.MathUtils.degToRad(.05) // Постоянная анимация вращения
    requestAnimationFrame(animate) // Бесконечно вызывает функцию и синхронизируется с частотой экрана
    // stats.begin() // Запуск стэтса FPS
    renderer.render(scene, camera)
    // stats.end()
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

// Лак / Цинк: переключение metalness и активной кнопки

const zinc = document.getElementById('zinc')
const lacquer = document.getElementById('lacquer')

// sofa, mr, mr2, ml, ml2, s3, s4, t2 могут быть не в сцене, поэтому обходим их отдельно
const replaceMaterial = (from, to) => {
    const objects = [scene, sofa, mr, mr2, ml, ml2, s3, s4, t2, t3, t4, t5, a73, a74]
    objects.forEach(object => {
        object?.traverse((node) => {
            if (node.isMesh && node.material === from && !node.userData.fixedMaterial) node.material = to
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

// Сложить / Разложить: комплект 7.3 меняется на сложенный вариант a74 и обратно

const assembly = document.getElementById('assembly')
let isFolded = false

// Только состояние и текст кнопки, модели меняет обработчик клика
const setFolded = (folded) => {
    isFolded = folded
    assembly.textContent = folded ? 'Разложить' : 'Сложить'
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
        setShadowArea(config.shadows.area) // Сложенный комплект помещается в обычную область теней
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

moduleButtons.forEach(li => {
    li.addEventListener('click', () => {
        moduleButtons.forEach(other => other.className = 'button')
        li.className = 'active' // background: rgb(240, 240, 240)

        const name = li.textContent.trim()

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

// Режим разработчика

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
} else {
    scene.remove(
        dirLightHelper, 
        pointLightHelper, 
        pointLightHelper2,
        pointLightHelper3,
        pointLightHelper4,
        axisHelper,
        gridHelper,
        shadowHelper
    )
}