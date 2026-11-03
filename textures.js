import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()

// Коррекция текстур мебели. UV у моделей в сантиметрах (от -70 до 70), а не 0..1, поэтому нужен повтор и масштаб
const loadTexture = (path, isColor = false, scale = .01) => {
    const tex = textureLoader.load(path)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping // Повторяет тектсуру
    tex.repeat.set(scale, scale) // Масштабилование техстуры. Одна плитка на 1 / scale единиц UV
    tex.anisotropy = 8 // ЧТО ЭТО?
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace // Цветовые карты в sRGB, остальные — линейные
    return tex
}

// МАТЕРИАЛЫ МЕБЕЛИ

export const metallMaterial = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/MetalGalvanizedSteelWorn001_COL_2K_METALNESS.jpg', true), // Базовое изображение текстуры
    aoMap: loadTexture('./img/Poliigon_MetalGalvanizedZinc_7184_AmbientOcclusion.jpg'), // Карта теней
    roughnessMap: loadTexture('./img/MetalGalvanizedSteelWorn001_ROUGHNESS_2K_METALNESS.jpg'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/MetalGalvanizedSteelWorn001_METALNESS_2K_METALNESS.jpg'), // Металл или диэлектрик
    normalMap: loadTexture('./img/MetalGalvanizedSteelWorn001_NRM_2K_METALNESS.jpg'), // Карта нормалей
    metalness: .7,
    roughness: .3,
    // emissive: 'rgb(167, 167, 167)' // Излучение
})

export const metallMaterial2 = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_BaseColor.jpg', true), // Базовое изображение текстуры
    aoMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_AmbientOcclusion.jpg'), // Карта теней
    roughnessMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Roughness.jpg'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Metallic.jpg'), // Металл или диэлектрик
    normalMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Normal.png'), // Карта нормалей
    metalness: .7,
    roughness: .5
})

metallMaterial2.normalScale.set(.6, .6)

export const metallMaterial3 = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/MetalCladdingFrame006/MetalCladdingFrame006_COL_2K.jpg', true),
    aoMap: loadTexture('./img/MetalCladdingFrame006/MetalCladdingFrame006_BUMP_2K.jpg'),
    metalnessMap: loadTexture('./img/MetalCladdingFrame006/MetalCladdingFrame006_REFL_2K.jpg'),
    normalMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Normal.png'),
    metalness: .8,
    roughness: .2
})

metallMaterial3.normalScale.set(.6, .6) // Глянцевому металлу нужен слабый рельеф, иначе он выглядит зернистым

export const metallMaterial4 = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_COL_2K.jpg', true),
    aoMap: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_BUMP_2K.jpg'),
    roughnessMap: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_ROUGHNESS_2K.jpg'), // Инвертированная GLOSS
    metalnessMap: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_REFL_2K.jpg'),
    normalMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Normal.png'),
    metalness: .8,
    roughness: 1 // Шероховатость берётся из карты (0,2–0,33), число на неё умножается
})

export const softMaterial = new THREE.MeshStandardMaterial({ 
    map: loadTexture('/img/rough-fabric_albedo.png', true), // Базовое изображение текстуры
    aoMap: loadTexture('./img/rough-fabric_ao.png'), // Карта теней
    roughnessMap: loadTexture('./img/rough-fabric_roughness.png'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/rough-fabric_metallic.png'), // Металл или диэлектрик
    normalMap: loadTexture('./img/rough-fabric_normal-ogl.png') // Карта нормалей
})
export const softMaterial2 = new THREE.MeshStandardMaterial({ 
    map: loadTexture('/img/grey-upholstery_albedo.png', true), // Базовое изображение текстуры
    aoMap: loadTexture('./img/grey-upholstery_ao.png'), // Карта теней
    roughnessMap: loadTexture('./img/grey-upholstery_roughness.png'), // Карта шероховатостей
    metalnessMap: loadTexture('./img/grey-upholstery_metallic.png'), // Металл или диэлектрик
    normalMap: loadTexture('./img/grey-upholstery_normal-ogl.png') // Карта нормалей
})
softMaterial2.normalScale.set(.1, .1) // Уменьшение значений неправильной карты нормалей

export const softMaterial3 = new THREE.MeshStandardMaterial({ 
    map: loadTexture('/img/Poliigon_FabricUpholsteryDrapery_8446_BaseColor.jpg', true),
    aoMap: loadTexture('./img/Poliigon_FabricUpholsteryDrapery_8446_AmbientOcclusion.jpg'),
    roughnessMap: loadTexture('./img/Poliigon_FabricUpholsteryDrapery_8446_Roughness.jpg'),
    metalnessMap: loadTexture('./img/Poliigon_FabricUpholsteryDrapery_8446_Metallic.jpg'),
    normalMap: loadTexture('./img/Poliigon_FabricUpholsteryDrapery_8446_Normal.png')
})
softMaterial3.normalScale.set(.2, .2)

export const softMaterial4 = new THREE.MeshStandardMaterial({ 
    map: loadTexture('./img/FabricUpholsterySolid/Poliigon_FabricUpholsterySolid_9286_BaseColor.jpg', true),
    aoMap: loadTexture('./img/FabricUpholsterySolid/Poliigon_FabricUpholsterySolid_9286_AmbientOcclusion.jpg'), 
    roughnessMap: loadTexture('./img/FabricUpholsterySolid/Poliigon_FabricUpholsterySolid_9286_Roughness.jpg'),
    metalnessMap: loadTexture('./img/FabricUpholsterySolid/Poliigon_FabricUpholsterySolid_9286_Metallic.jpg'), 
    normalMap: loadTexture('./img/FabricUpholsterySolid/Poliigon_FabricUpholsterySolid_9286_Normal.png')
})
softMaterial4.normalScale.set(.2, .2)

export const softMaterial5 = new THREE.MeshStandardMaterial({ 
    map: loadTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_BaseColor.jpg', true),
    aoMap: loadTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_AmbientOcclusion.jpg'), 
    roughnessMap: loadTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_Roughness.jpg'),
    metalnessMap: loadTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_Metallic.jpg'), 
    normalMap: loadTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_Normal.png')
})
softMaterial5.normalScale.set(.2, .2)

export const softMaterial6 = new THREE.MeshStandardMaterial({ 
    map: loadTexture('./img/FabricPlainRedChenille001_COL_2K.jpg', true),
    roughnessMap: loadTexture('./img/FabricPlainRedChenille001_ROUGHNESS_2K.jpg'), // Инвертированная GLOSS
    normalMap: loadTexture('./img/FabricPlainRedChenille001_NRM_2K.png'),
    roughness: 1 // Шероховатость берётся из карты (0,39–0,65), число на неё умножается
})
softMaterial6.normalScale.set(.2, .2)

export const softMaterial7 = new THREE.MeshStandardMaterial({ 
    map: loadTexture('./img/FabricPlainBrownChenille005/FabricPlainBrownChenille005_COL_2K.png', true, .02),
    // aoMap: loadTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_AmbientOcclusion.jpg'), 
    roughnessMap: loadTexture('./img/FabricPlainBrownChenille005/FabricPlainBrownChenille005_ROUGHNESS_2K.jpg', false, .02), // Инвертированная GLOSS. Масштаб как у map
    // metalnessMap: loadTexture('./img/FabricPlainBrownChenille005/FabricPlainBrownChenille005_REFL_2K.png'), 
    normalMap: loadTexture('./img/FabricPlainBrownChenille005/FabricPlainBrownChenille005_NRM_2K.png'),
    roughness: 1 // Шероховатость берётся из карты (0,44–0,66), число на неё умножается
})

softMaterial7.normalScale.set(.2, .2)

// МАТЕРИАЛЫ ШАТРОВ

export const roofMaterial = new THREE.MeshPhysicalMaterial({ // Такой объект, так как у него есть sheen
    normalMap: loadTexture('./img/FabricNylonBallistic/FabricNylonBallistic_Normal.png', false, 4), // Плетение — единственная нужная карта
    color: 'rgb(203, 203, 204)', // Цвет ткани целиком из color без карты BaseColor
    roughness: .7, // Матовый оксфорд с пропиткой
    specularIntensity: .5, // Сила обычного блика. У ткани слабее, чем у пластика
    transparent: true,
    opacity: .99,
    side: THREE.DoubleSide,
    sheen: .8, // Отдельный слой блеска поверх материала
    sheenRoughness: .6, // Ширина отлива
    sheenColor: 'rgb(180, 180, 180)' // Цвет отлива
})

roofMaterial.normalScale.set(1, 1)

// Другие цвета той же ткани: клон делит с roofMaterial текстуру и шейдер, отличаются цвет и отлив
const tentColor = (color, sheen) => {
    const fabric = roofMaterial.clone()
    fabric.color.set(color)
    fabric.sheen = sheen
    return fabric
}

// id кнопки в index.html → ткань. Новый цвет — одна строка здесь, свечение, липучки и кнопка подхватят его сами
export const tentFabricsById = {
    'tent-white':   roofMaterial,
    'tent-blue':    tentColor('rgb(46, 64, 96)', .1),    // Василек
    'tent-blue-2':  tentColor('rgb(32, 43, 62)', .1),    // Синий
    'tent-black':   tentColor('rgb(35, 35, 35)', .1),    // Черный
    'tent-grey-2':  tentColor('rgb(65, 65, 65)', .3),    // Серый
    'tent-grey':    tentColor('rgb(134, 134, 134)', .3), // Светло-серый
    'tent-green':   tentColor('rgb(65, 88, 47)', .3),    // Яблоко
    'tent-green-2': tentColor('rgb(37, 56, 31)', .1),    // Зеленый
    'tent-red':     tentColor('rgb(99, 35, 35)', .1),    // Красный
    'tent-brown':   tentColor('rgb(71, 45, 19)', .1)     // Коричневый
}

// Свечение ткани изнутри, когда в шатре горят лампы
const tentFabrics = Object.values(tentFabricsById)

const FABRIC_GLOW = .01 // Яркость свечения ткани при включённых лампах
const FABRIC_OPACITY = .99 // Прозрачность ткани при включённых лампах. Без ламп = 1, непрозрачная

// Цвет и карту задаём сразу, а по клику меняем только яркость — иначе three.js перекомпилирует шейдеры и клик подтормаживает
tentFabrics.forEach(material => {
    material.emissive.set('rgb(248, 253, 255)') // Свет ламп
    material.emissiveMap = material.map // Светится сама ткань с её узором, а не сплошной цвет
    material.emissiveIntensity = 0
})

export const setFabricGlow = (on) => {
    backShade.value = on ? 1 : BACK_SHADE; // С лампами внутри светло — внутреннюю сторону не затемняем. ; обязательна: следующая строка начинается с [
    [...tentFabrics, ...velcroOf.values()].forEach(material => { // Липучки — клоны тканей, светятся вместе с ними
        material.emissiveIntensity = on ? FABRIC_GLOW : 0
        material.opacity = on ? FABRIC_OPACITY : 1
    })
}


// Каркас шатра: алюминиевый профиль без текстур
export const frameMaterial = new THREE.MeshPhysicalMaterial({
    color: 'rgb(211, 211, 211)', // Цвет отражения алюминия: светлый, а не средне-серый
    metalness: 1, // Чистый металл
    roughness: .4, // Анодированный профиль: блик размытый, но заметный
    anisotropy: .9, // Вытянутый блик вдоль профиля
    // envMapIntensity: .7, // Отражения окружения сильнее, чем у ткани
    anisotropyRotation: Math.PI / 2 // Чтоб блик шел вдоль профиля
})


// Окна шатра: прозрачный ПВХ. Без текстур — гладкий плёночный материал
export const windowMaterial = new THREE.MeshStandardMaterial({
    color: 'rgb(235, 240, 242)', // Чуть холодный оттенок плёнки
    transparent: true,
    opacity: .75, // Сквозь окно видно, но плёнку заметно
    roughness: .9, // Глянцевая — даёт блики от dirLight
    metalness: 0,
    side: THREE.DoubleSide, // Видно и снаружи, и изнутри
    depthWrite: false // Не перекрывает по глубине то, что за окном
})

// Молнии на передней стене: тёмный пластик
export const zipperMaterial = new THREE.MeshStandardMaterial({
    color: 'rgb(40, 40, 40)',
    roughness: .5,
    metalness: 0
})

// Коннекторы: светлый пластик
export const connectorMaterial = new THREE.MeshStandardMaterial({
    color: 'rgb(248, 248, 248)',
    roughness: .5,
    metalness: 0
})

// ЛИПУЧКА. Текстуры и шейдер у клона общие с тканью, отличаются только цвет и свечение
const VELCRO_SHADE = .8 // Насколько липучка будеттемнее ткани
export const velcroOf = new Map(tentFabrics.map(material => { 
    // Объект Map это объект-словарь, он харнит пару материал-липучка. Материал здесь является отдельным объектом.
    const velcro = material.clone()
    velcro.color.multiplyScalar(VELCRO_SHADE) // Темнее днём: color умножается на текстуру       
    velcro.emissive.multiplyScalar(VELCRO_SHADE) // И при включённых лампах: свечение не зависит от color, затемняем его отдельно
    return [material, velcro]
}))
// .map перебирает массив tentFabrics и подставляет в него новый массив со значениями, которые вернула функция внутри .map

// ВНУТРЕННЯЯ СТОРОНА ТКАНИ
const BACK_SHADE = .7 // Насколько внутренняя сторона темнее внешней
const backShade = { value: BACK_SHADE } // Один объект на все ткани: смена value сразу меняет всё

const darkenBackSide = (shader) => {
    shader.uniforms.backShade = backShade
    shader.fragmentShader = 'uniform float backShade;\n' + shader.fragmentShader.replace(
        '#include <color_fragment>',
        // Прозрачную DoubleSide ткань three.js рисует в два прохода: сначала только внутреннюю сторону (FLIP_SIDED), потом только внешнюю.
        // В проходе FLIP_SIDED gl_FrontFacing перевёрнут, поэтому внутреннюю сторону там узнаём по самому проходу
        `#include <color_fragment>
        #if defined( FLIP_SIDED )
            diffuseColor.rgb *= backShade;
        #elif defined( DOUBLE_SIDED )
            if (!gl_FrontFacing) diffuseColor.rgb *= backShade;
        #endif`
    )
}
;[...tentFabrics, ...velcroOf.values()].forEach(material => material.onBeforeCompile = darkenBackSide)
