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

const stats = new Stats() // FPS
// document.body.appendChild(stats.dom)

const devMode = false

// Единый объект конфигурации

const config = {
    shadows: {
        resolution: 2048,
        normalBias: .05,
    },
    lighting: {
        ambientIntensity: .4,
        directionalIntensity: 4,
        directionalPosition: [ 5, 10, 7 ]
    },
    camera: {
        fov: 14,
        position: [ 0, 0, 0 ],
        near: .1,
        far: 1000
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
dirLight.position.set(0, 6, 0)
// dirLight.castShadow = true // Включает отбрасывание тени от этого источника
// dirLight.shadow.mapSize = new THREE.Vector2(1024, 1024) // Разрешение теней (512, 1024, 2048)
scene.add(dirLight)

const dirLightHelper = new THREE.DirectionalLightHelper (dirLight, 2)
scene.add(dirLightHelper)

const hemiLight = new THREE.HemisphereLight(0x0099ff, 0xaa5500)
// scene.add(hemiLight)

const pointLight = new THREE.PointLight('rgb(238, 238, 236)', 8, 10)
pointLight.position.set(1, 2, 1)
pointLight.castShadow = true
pointLight.shadow.mapSize = new THREE.Vector2(config.shadows.resolution, config.shadows.resolution) 
pointLight.shadow.camera.far = 10 // Макс расстояние отбрасывания теней
pointLight.shadow.normalBias = config.shadows.normalBias // Улучшение нормалей от теней
pointLight.shadow.radius = 1 // Мягкость теней
scene.add(pointLight)

const pointLightHelper = new THREE.PointLightHelper(pointLight, .1)
scene.add(pointLightHelper)

const pointLight2 = new THREE.PointLight('rgb(225, 225, 225)', 8, 10)
pointLight2.position.set(-2, 1, -2)
// pointLight2.castShadow = true
scene.add(pointLight2)

const pointLightHelper2 = new THREE.PointLightHelper(pointLight2, .1)
scene.add(pointLightHelper2)

// Камера

const camera = new THREE.PerspectiveCamera(
    config.camera.fov, 
    config.sizes.width / config.sizes.height
)
camera.position.set(-5, 5, 10)

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
// controls.enableZoom = false // Отключение зума
controls.minDistance = 15
controls.maxDistance = 15

// Текстуры

const textureLoader = new THREE.TextureLoader()

// UV у моделей в сантиметрах (от -70 до 70), а не 0..1, поэтому нужен повтор и масштаб
const loadTexture = (path, isColor = false, scale = .01) => {
    const tex = textureLoader.load(path)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping // Без этого за пределами 0..1 растягивается крайний пиксель
    tex.repeat.set(scale, scale) // Одна плитка текстуры на 1 / scale единиц UV
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace // Цветовые карты в sRGB, остальные — линейные
    return tex
}

const metallMaterial = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/MetalGalvanizedSteelWorn001_COL_2K_METALNESS.jpg', true), // Базовое изображение текстуры
    // aoMap: loadTexture('./img/Poliigon_MetalGalvanizedZinc_7184_AmbientOcclusion.jpg'), // Карта теней
    roughnessMap: loadTexture('./img/MetalGalvanizedSteelWorn001_ROUGHNESS_2K_METALNESS.jpg'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/MetalGalvanizedSteelWorn001_METALNESS_2K_METALNESS.jpg'), // Металл или диэлектрик
    normalMap: loadTexture('./img/MetalGalvanizedSteelWorn001_NRM_2K_METALNESS.jpg'), // Карта нормалей
    // displacementMap: textureLoader.load('./img/Poliigon_Displacement.tiff'), // Карта высот
    // displacementScale: 0,
    metalness: .2,
    roughness: 1,
    // emissive: 'rgb(167, 167, 167)' // Излучение
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

// Куб

const tempVector = new THREE.Vector3(-1, 0.15, 0) // Если хотим присваивать значение координат много раз

const geometry = new THREE.BoxGeometry(1, 1, 1) // Геометрия

const material = new THREE.MeshStandardMaterial({ // Базовый, учитывает все характеристики без бликов
    color: 'new THREE.Color(rgb(203, 195, 180)',
    // flatShading: true,
    emissive: 'rgb(47, 46, 46)',
    metalness: 1, // Лучше использовать 1 или 0
    roughness: .2 // Шероховатость поверхности
})

const cube = new THREE.Mesh(geometry, metallMaterial)
cube.scale.set(0.3, 0.3, 1) // Можно и сразу указать данные размеры бокса без скейла
// cube.rotation.set(Math.PI * 0.15, Math.PI * 0.15, 0) // Угол через ПИ
// cube.rotation.set(THREE.MathUtils.degToRad(30), THREE.MathUtils.degToRad(30), 0) // В градусах удобнее
cube.position.copy(tempVector) // Пример применения координат через Vector3
cube.castShadow = true // Отбрасывание теней
cube.receiveShadow = true // Принятие теней
cube.updateMatrix() // Обновление матрицы преобразования объектов вручную
// scene.add(cube)

// const wireCube = new THREE.Mesh(geometry, material)
// wireCube.scale.setScalar(1.01)
// cube.add(wireCube) // Можно добавлять мэш не в сцену, а в другой мэш!!

// Плоскость

const plane = new THREE.Mesh(
    new THREE.PlaneGeometry(2.5, 2.5), 
    new THREE.MeshStandardMaterial({
        color: 'rgb(255, 255, 255)', 
        roughness: 0,
        transparent: true, // Прозрачность. Но тени тоже исчезают..
        opacity: 1, // Уровень прозрачности
        metalness: .4
    })
)
plane.rotation.x = -Math.PI * 0.5
plane.position.set(0, 0, 0)
plane.receiveShadow = true
plane.castShadow = true
scene.add(plane)

// Группы

// const group = new THREE.Group()
// const mesh1 = new THREE.Mesh(geometry, material)
// const mesh2 = new THREE.Mesh(geometry, material)
// mesh1.position.set(-1.5, 0, 0)
// mesh2.position.set(1.5, 0, 0)
// group.add(mesh1, mesh2)
// group.scale.setSсalar(.5) // Если по всем осям одинаковый скейл
// group.rotation.x = Math.PI * 0.25
// group.rotation.y = Math.PI * 0.25
// scene.add(group)

// Лоадеры

const loader = new GLTFLoader()

let mr = null
loader.load(
    './models/MR.glb',
    (gltf) => { // Коллбек при успешной загрузки
        mr = gltf.scene // Загружаем геометрию
        mr.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = metallMaterial
                // node.castShadow = true
                // node.receiveShadow = true
            }
        })
        mr.scale.setScalar(.01) // Сразу во все направления
        mr.rotation.set(0, THREE.MathUtils.degToRad(180), 0)
        mr.position.set(-.35, 0, .4)
        scene.add(mr)
    }
)

loader.load(
    './models/ML2.glb',
    (gltf) => {
        const ml2 = gltf.scene // Загружаем геометрию
        ml2.traverse((node) => { // Траверс как раз позволяет пройтись по всем дочерним элементам.
            if (node.isMesh) {
                node.material = metallMaterial,
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
                node.material = metallMaterial,
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
                node.material = metallMaterial,
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
                node.material = metallMaterial,
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
                node.material = metallMaterial,
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
                node.material = softMaterial,
                node.castShadow = true,
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
                node.material = softMaterial,
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
                node.material = softMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s2.scale.setScalar(.01)
        s2.rotation.set(THREE.MathUtils.degToRad(90), 0, 0)
        s2.position.set(-.365, .38, -.28)
        scene.add(s2)
    }
)

loader.load(
    './models/S3.glb',
    (gltf) => {
        const s3 = gltf.scene // Загружаем геометрию
        s3.traverse((node) => { // Загружаем текстуру
            if (node.isMesh) {
                node.material = softMaterial,
                node.castShadow = true,
                node.receiveShadow = true
            }
        })
        s3.scale.setScalar(.01)
        s3.rotation.set(0, THREE.MathUtils.degToRad(180), THREE.MathUtils.degToRad(90))
        s3.position.set(-.365, .38, -.19)
        scene.add(s3)
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
renderer.physicallyCorrectLights = true // Делает свет реалистичнее
// renderer.toneMapping = THREE.LinearToneMapping // Улучшение переходов и теней
renderer.shadowMap.enabled = true // Добавление теней в рендеринг!
// renderer.shadowMap.type = THREE.PCFShadowMap // Алгоритм сжатия теней
renderer.shadowMap.type = THREE.PCFSoftShadowMap // Чтоб были супер мягкие тени
renderer.setSize(config.sizes.width, config.sizes.height)

// Постпроцессинг

const composer = new EffectComposer(renderer) // Композер, прослойка между рендерингом и анимейтом

const renderPass = new RenderPass(scene, camera) // Сам движок рендеринга
composer.addPass(renderPass) // Проход движка через композер

const bloomPass = new UnrealBloomPass( // Эффект свечения
    new THREE.Vector2(config.sizes.height, config.sizes.width, 150, 120, 1))
composer.addPass(bloomPass) // Проход эффекта через композер

// Обработчик передвижения мыши

// const cursor = {x: 0, y: 0}
// canvas.addEventListener('mousemove', (MouseEvent) => {
//     cursor.x = -(MouseEvent.clientX / sizes.width - 0.5)
//     cursor.y = MouseEvent.clientY / sizes.height - 0.5
// })

// Анимирование и управление

function animate() {
    controls.update() // Постоянно обновляет орбит
    // cube.rotation.y -= THREE.MathUtils.degToRad(.05) // Постоянная анимация вращения
    requestAnimationFrame(animate) // Бесконечно вызывает функцию и синхронизируется с частотой экрана
    stats.begin() // Запуск стэтса FPS
    renderer.render(scene, camera)
    stats.end()
    // composer.render()
}
animate()

// Резиновый канвас (ресайз)

window.addEventListener('resize', () => {
    controls.update()
    config.sizes.height = window.innerHeight // Обновляем соотношение сторон при каждом изменении окна
    config.sizes.width = window.innerWidth / 2
    
    camera.aspect = sizes.width / sizes.height // Обновление соотношения сторон
    camera.updateProjectionMatrix() // Обновление матрицы экрана

    renderer.setSize(sizes.width, sizes.height) //  Обновление рендерера с новыми сторонами
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
})

// Полноэкранный режим канваса

window.addEventListener('dblclick', () => {
    if (document.fullscreenElement) {
        document.exitFullscreen()
    }
    else {
        canvas.requestFullscreen()
    }
})

console.log(material)

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
        gridHelper
    )
}

// Buttons

document.querySelectorAll('.button').forEach(button => {
    button.addEventListener('click', () => {
        scene.remove(s1)
    })
})