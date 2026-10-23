import * as THREE from 'three'

const textureLoader = new THREE.TextureLoader()

// Коррекция текстур. UV у моделей в сантиметрах (от -70 до 70), а не 0..1, поэтому нужен повтор и масштаб
const loadTexture = (path, isColor = false, scale = .01) => {
    const tex = textureLoader.load(path)
    tex.wrapS = tex.wrapT = THREE.RepeatWrapping // Повторяет тектсуру
    tex.repeat.set(scale, scale) // Масштабилование техстуры. Одна плитка на 1 / scale единиц UV
    tex.anisotropy = 8 // ЧТО ЭТО?
    if (isColor) tex.colorSpace = THREE.SRGBColorSpace // Цветовые карты в sRGB, остальные — линейные
    return tex
}

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
export const metallMaterial3 = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/MetalCladdingFrame006/MetalCladdingFrame006_COL_2K.jpg', true),
    aoMap: loadTexture('./img/MetalCladdingFrame006/MetalCladdingFrame006_BUMP_2K.jpg'),
    roughnessMap: loadTexture('./img/MetalCladdingFrame006/MetalCladdingFrame006_GLOSS_2K.jpg'),
    metalnessMap: loadTexture('./img/MetalCladdingFrame006/MetalCladdingFrame006_REFL_2K.jpg'),
    normalMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Normal.png'),
    metalness: .7,
    roughness: .5
})
export const metallMaterial4 = new THREE.MeshStandardMaterial({
    map: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_COL_2K.jpg', true),
    aoMap: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_BUMP_2K.jpg'),
    roughnessMap: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_GLOSS_2K.jpg'),
    metalnessMap: loadTexture('./img/MetalCladdingFrame007/MetalCladdingFrame007_REFL_2K.jpg'),
    normalMap: loadTexture('./img/Poliigon_MetalPaintedMatte_7037_Normal.png'),
    metalness: .8,
    roughness: .2
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

// Ткани для шатров: у их моделей UV 0..1 (а не в сантиметрах), поэтому масштаб свой. Больше — мельче узор
const loadTentTexture = (path, isColor = false) => loadTexture(path, isColor, 5)

export const roofMaterial = new THREE.MeshStandardMaterial({
    map: loadTentTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_BaseColor.jpg', true),
    aoMap: loadTentTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_AmbientOcclusion.jpg'),
    roughnessMap: loadTentTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_Roughness.jpg'),
    metalnessMap: loadTentTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_Metallic.jpg'),
    normalMap: loadTentTexture('./img/FabricUpholsteryDrapery/Poliigon_FabricUpholsteryDrapery_8447_Normal.png'),
    side: THREE.DoubleSide // Тонкая ткань без толщины — видна с обеих сторон
})
roofMaterial.normalScale.set(.1, .1)

// Каркас шатра без текстур: у модели нет нормальной UV-развёртки, а с расстояния камеры рисунок металла всё равно не виден
export const frameMaterial = new THREE.MeshStandardMaterial({
    color: 'rgb(196, 199, 204)', // Светлый серый металл — тот же цвет, что задан в самой модели
    metalness: .7,
    roughness: .5,
})

