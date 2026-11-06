import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js' // Декодер сжатия геометрии
import { metallMaterial, metallMaterial2, softMaterial, roofMaterial, frameMaterial, windowMaterial, zipperMaterial, connectorMaterial, velcroOf } from './textures.js'

export const state = { metall: metallMaterial2, soft: softMaterial } // Задаем стейт материалов по дефолту

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder) // Метод для сжатой геометрии

// ОБЩИЕ ПОМОЩНИКИ ДЛЯ МОДЕЛЕЙ

// НЕ ВЫБИРАЕМЫЙ МАТЕРИАЛ ДЛЯ НЕКОТОРЫХ УЗЛОВ В СБОРКЕ

const isCap = (node) => node.geometry.attributes.position.count === 1182 // Вытаскиваем узел по его вершинам

const setCapMaterial = (node) => {
    node.material = metallMaterial // Присваиваем
    node.userData.fixedMaterial = true // Метод фиксации материала. replaceMaterial будет пропускать эти узлы
}

// ВЗАИМОЗАМЕНЯЕМЫЕ УЗЛЫ В СБОРКЕ НА ОДИНАКОВЫХ КООРДИНАТАХ

// Создаем условие (функцию) для смены узлов на общих координатах
const setParts = (parts, show, hide) => {
    show.forEach(name => { if (parts[name]) parts[name].visible = true })
    hide.forEach(name => { if (parts[name]) parts[name].visible = false })
}

const t2Parts = {} // Вытаскиваем все узлы сборки по именам: t2Parts.Node3 и т.д.

export const t2TopsM4 = ['Node3', 'Node4'] // Указываем, какие узлы на какие могут меняться
export const t2TopsC1 = ['Node8', 'Node7'] 

const t3Parts = {}

export const t3TopsC3 = ['Node2', 'Node3']
export const t3TopsC4 = ['Node10', 'Node9']

// Указываем, что в условии setParts показывается по дефолту
export const setT2Tops = (show, hide) => setParts(t2Parts, show, hide) 
export const setT3Tops = (show, hide) => setParts(t3Parts, show, hide)

// М1–М4 (одна сборка) Клик по модели выбирает, какие узлы видны
// Имён в модели нет, сортировка по номерам узлов. 

const mParts = {} // Разложенная сборка М
const m2Parts = {} // Сложенная сборка M_2
const m3Parts = {} // Разобранная сборка M_3

// Постоянные узлы: Сидушки, пластины, передняя рама.
const M_BASE = ['Node13', 'Node3', 'Node7', 'Node5', 'Node6']

// Узлы Node1–16 одинаковы во всех трёх сборках
const M_SETS = {
    'М1': [...M_BASE, 'Node2', 'Node1', 'Node12', 'Node11'],
    'М2': [...M_BASE, 'Node2', 'Node1', 'Node8', 'Node11', 'Node4'],
    'М3': [...M_BASE, 'Node2', 'Node1', 'Node8', 'Node9', 'Node4', 'Node10'],
    'М4': [...M_BASE, 'Node16', 'Node14', 'Node15']
}

// Крепеж (Node17–26) есть только в файлах M_2 и M_3, и номера в них разные.
// Весь крепеж виден всегда, кроме крепежа на трубах, которые есть только у одной из рам:
// Node2 — верхняя труба высокой рамы М1–М3, Node16 — верхняя труба низкой рамы М4
const M2_CAPS_OF = { Node2: ['Node21', 'Node26'], Node16: ['Node18', 'Node22'] }
const M3_CAPS_OF = { Node2: ['Node25', 'Node26'], Node16: ['Node23', 'Node24'] }

const showMParts = (parts, visible, capsOf = {}) => Object.values(parts).forEach(node => {
    const frame = Object.keys(capsOf).find(frame => capsOf[frame].includes(node.name))
    if (frame) node.visible = visible.includes(frame) // Крепеж виден вместе со своей рамой
    else node.visible = visible.includes(node.name) || isCap(node)
})

// Показывает узлы выбранной М сразу во всех сборках, остальные прячет. Состав не зависит от того, какая М была до этого
export const setM = (name) => { // Включает узлы из набора и прячет остальные.
    const visible = M_SETS[name] ?? M_SETS['М1'] // У комплектов 4.1 и 5.2 пока нет своих моделей — показываем М1
    showMParts(mParts, visible)
    showMParts(m2Parts, visible, M2_CAPS_OF)
    showMParts(m3Parts, visible, M3_CAPS_OF)
}

const mSoftParts = new Set(['Node1', 'Node4', 'Node5', 'Node6', 'Node10']) // Подушки S1, S2, S3

// СМЕННЫЕ МАТЕРИАЛЫ ДЛЯ РАЗНЫХ УСЛОВ СБОРКИ

// Вытаскиваем массив узлов подушек из модели. Остальным просто присвоем другой материал
const a73SoftParts = new Set([
    'Node12', 'Node13', 'Node14', 'Node20', 'Node37', 'Node38', 'Node39', 'Node67',
    'Node68', 'Node69', 'Node70', 'Node79', 'Node83', 'Node84', 'Node85', 'Node89',
    'Node104', 'Node105', 'Node107', 'Node118', 'Node123', 'Node124'
])

const a74SoftParts = new Set([
    'Node2', 'Node3', 'Node4', 'Node5', 'Node16', 'Node17', 'Node23', 'Node24',
    'Node25', 'Node26', 'Node29', 'Node32', 'Node33', 'Node34', 'Node35', 'Node36',
    'Node37', 'Node38', 'Node39', 'Node40'
])

// ЗАГРУЗКА МОДЕЛЕЙ

const FURNITURE = {
    // Сборка М в файле сдвинута и повёрнута: pos и rot ставят её туда же, где стояли отдельные модели
    m: { url: './models/compressed/M.glb', pos: [.889, 0, 3.297], rot: [0, 90, 0], softParts: mSoftParts, onMesh: (n) => { mParts[n.name] = n } },
    // Сложенная М: стопка смещена в файле, pos ставит её в центр стола
    m2: { url: './models/compressed/M_2.glb', pos: [.746, 0, 3.297], rot: [0, 90, 0], softParts: mSoftParts, caps: true, onMesh: (n) => { m2Parts[n.name] = n } },
    // Разобранная М: центр в файле совпадает с M, поэтому pos тот же
    m3: { url: './models/compressed/M_3.glb', pos: [.889, 0, 3.297], rot: [0, 90, 0], softParts: mSoftParts, caps: true, onMesh: (n) => { m3Parts[n.name] = n } },

    t2:  { url: './models/compressed/T2_Assembly.glb', pos: [.89, .15, 1.54], rot: [0, 90, 0], onMesh: (n) => { t2Parts[n.name] = n } },
    t3:  { url: './models/compressed/T3_Assembly.glb', pos: [.89, 0, 3.3], rot: [0, 90, 0], onMesh: (n) => { t3Parts[n.name] = n } },
    t4:  { url: './models/compressed/T4_Assembly.glb', pos: [1.25, 0, 3.3], rot: [0, 90, 0] },
    t5:  { url: './models/compressed/T5_Assembly.glb', pos: [1.25, .15, 1.54], rot: [0, 90, 0] },

    a73: { url: './models/compressed/7.3_Assembly.glb', pos: [1.7, 0, -.9], softParts: a73SoftParts, caps: true },
    a74: { url: './models/compressed/7.3_Disassembly.glb', pos: [-2.55, 0, .14], softParts: a74SoftParts, caps: true },
}

// Общая функция. Берет модель, назначает материал, масштаб, поворот, позицию.

const loadModel = ({ url, pos, rot = [0, 180, 0], scale = .01, soft = false, softParts, caps = false, material, parts, onMesh }) =>
    new Promise((resolve) => {
        loader.load(url, (gltf) => {
            const root = gltf.scene
            root.traverse((node) => {
                if (!node.isMesh) return
                if (parts) {
                    // Модель из нескольких частей (шатёр): материал выбираем по имени узла, части не из списка оставляют свой.
                    // Если у узла есть дети (стена с окном), сжатие переносит его меш в безымянный дочерний узел — тогда берём имя родителя
                    node.material = parts[node.name] ?? parts[node.parent?.name] ?? node.material
                    node.userData.fixedMaterial = true // replaceMaterial мебели их не меняет
                } else {
                    const isSoft = softParts ? softParts.has(node.name) : soft
                    node.material = isSoft ? state.soft : state.metall
                }
                if (material) {
                    node.material = material // Свой материал модели
                    node.userData.fixedMaterial = true // replaceMaterial его не меняет
                }
                node.castShadow = true
                node.receiveShadow = true
                if (caps && isCap(node)) setCapMaterial(node)
                onMesh?.(node)   // для t2Parts / t3Parts
            })
            root.scale.setScalar(scale) // Большинство моделей в сантиметрах, поэтому по умолчанию .01
            root.rotation.set(...rot.map(THREE.MathUtils.degToRad))
            root.position.set(...pos)
            resolve(root)
        })
    })

// Собирает всю мебель разом и возвращает объект { m, t2, … }

export const loadFurniture = async () => {
    const models = {}
    await Promise.all(
        Object.entries(FURNITURE).map(async ([key, config]) => { models[key] = await loadModel(config) })
    )
    // Альтернативные детали по умолчанию скрыты
    setT2Tops(t2TopsM4, t2TopsC1)
    setT3Tops(t3TopsC3, t3TopsC4)
    return models
}

// МОДЕЛИ ШАТРОВ

// Не в FURNITURE: те грузятся сразу при старте, а шатры — только при первом клике в разделе «Мобильные шатры»

// Шатёр — одна модель со всеми частями: каркас (Frame), крыша (Roof) и стены отдельными узлами
// (Wall_Left −x, Wall_Right +x, Wall_Back −z, Wall_Front +z). Какие стены видны, решает tents.js
// Материалов в модели нет, поэтому назначаем их по именам узлов. UV у ткани развёрнуты в Blender

// Настройка частей шатра после загрузки: ткань помечаем для кнопок «Ткань» в tents.js, окнам — свои тень и порядок отрисовки
const setupTentMesh = (mesh) => {
    if (mesh.material === roofMaterial) mesh.userData.fabric = true
    if (mesh.material === velcroOf.get(roofMaterial)) mesh.userData.fabric = mesh.userData.velcro = true // Липучки тоже красятся, но своим клоном ткани
    if (mesh.material === windowMaterial) {
        mesh.castShadow = false // Карта теней не учитывает opacity — прозрачное окно давало бы сплошную тень
        mesh.renderOrder = 1 // Рисуем после ткани, иначе при некоторых поворотах крыша за окном перекрывает плёнку
    }
}

// Название кнопки размера → модель. Остальные размеры добавим, когда появятся модели
const TENTS = {

    '3,0x3,0': {
        url: './models/compressed/tent_3x3.glb', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, // Модель уже в метрах
        parts: { 
            Frame: frameMaterial, 
            Roof: roofMaterial, 
            Wall_Left: roofMaterial, 
            Wall_Right: roofMaterial, 
            Wall_Back: roofMaterial, 
            Wall_Front: roofMaterial,
            Frame_Connectors: connectorMaterial, 
            Window_Left: windowMaterial, 
            Window_Right: windowMaterial, 
            Zippers_Front: zipperMaterial,
            Velcro_Left: velcroOf.get(roofMaterial),
            Velcro_Right: velcroOf.get(roofMaterial),
            Velcro_Back: velcroOf.get(roofMaterial),
            Velcro_Front: velcroOf.get(roofMaterial)
        },
        onMesh: setupTentMesh
    },

    '3,0x4,5': {
        url: './models/compressed/tent_3x45.glb', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, // Модель уже в метрах
        parts: { 
            Frame: frameMaterial, 
            Roof: roofMaterial, 
            Wall_Left: roofMaterial, 
            Wall_Right: roofMaterial, 
            Wall_Back: roofMaterial, 
            Wall_Front: roofMaterial,
            Frame_Connectors: connectorMaterial, 
            Window_Left: windowMaterial, 
            Window_Right: windowMaterial, 
            Zippers_Front: zipperMaterial,
            Velcro_Left: velcroOf.get(roofMaterial),
            Velcro_Right: velcroOf.get(roofMaterial),
            Velcro_Back: velcroOf.get(roofMaterial),
            Velcro_Front: velcroOf.get(roofMaterial)
        },
        onMesh: setupTentMesh
    },

    '3,0x6,0': {
        url: './models/compressed/tent_3x6.glb', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, // Модель уже в метрах
        parts: { 
            Frame: frameMaterial, 
            Roof: roofMaterial, 
            Wall_Left: roofMaterial, 
            Wall_Right: roofMaterial, 
            Wall_Back_Left: roofMaterial,
            Wall_Back_Right: roofMaterial, 
            Wall_Front_Left: roofMaterial,
            Wall_Front_Right: roofMaterial,
            Frame_Connectors: connectorMaterial, 
            Window_Left: windowMaterial, 
            Window_Right: windowMaterial, 
            Zippers_Front: zipperMaterial,
            Velcro_Left: velcroOf.get(roofMaterial),
            Velcro_Right: velcroOf.get(roofMaterial),
            Velcro_Back_Left: velcroOf.get(roofMaterial),
            Velcro_Back_Right: velcroOf.get(roofMaterial),
            Velcro_Front_Left: velcroOf.get(roofMaterial),
            Velcro_Front_Right: velcroOf.get(roofMaterial)
        },
        onMesh: setupTentMesh
    },

    '4,0x4,0': {
        url: './models/compressed/tent_4x4.glb', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, // Модель уже в метрах
        parts: { 
            Frame: frameMaterial, 
            Roof: roofMaterial, 
            Wall_Left: roofMaterial, 
            Wall_Right: roofMaterial, 
            Wall_Back: roofMaterial, 
            Wall_Front: roofMaterial,
            Frame_Connectors: connectorMaterial, 
            Window_Left: windowMaterial, 
            Window_Right: windowMaterial, 
            Zippers_Front: zipperMaterial,
            Velcro_Left: velcroOf.get(roofMaterial),
            Velcro_Right: velcroOf.get(roofMaterial),
            Velcro_Back: velcroOf.get(roofMaterial),
            Velcro_Front: velcroOf.get(roofMaterial)
        },
        onMesh: setupTentMesh
    },

    '4,0x6,0': {
        url: './models/compressed/tent_4x6.glb', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1,
        parts: { 
            Frame: frameMaterial, 
            Roof: roofMaterial, 
            Wall_Left: roofMaterial, 
            Wall_Right: roofMaterial, 
            Wall_Back: roofMaterial, 
            Wall_Front: roofMaterial,
            Frame_Connectors: connectorMaterial, 
            Window_Left: windowMaterial, 
            Window_Right: windowMaterial, 
            Zippers_Front: zipperMaterial,
            Velcro_Left: velcroOf.get(roofMaterial),
            Velcro_Right: velcroOf.get(roofMaterial),
            Velcro_Back: velcroOf.get(roofMaterial),
            Velcro_Front: velcroOf.get(roofMaterial)
        },
        onMesh: setupTentMesh
    },

    '4,0x8,0': {
        url: './models/compressed/tent_4x8.glb', pos: [0, 0, 0], rot: [0, 0, 0], scale: 1,
        parts: { 
            Frame: frameMaterial, 
            Roof: roofMaterial, 
            Wall_Left: roofMaterial, 
            Wall_Right: roofMaterial, 
            Wall_Back_Left: roofMaterial,
            Wall_Back_Right: roofMaterial, 
            Wall_Front_Left: roofMaterial,
            Wall_Front_Right: roofMaterial,
            Frame_Connectors: connectorMaterial, 
            Window_Left: windowMaterial, 
            Window_Right: windowMaterial, 
            Zippers_Front: zipperMaterial,
            Velcro_Left: velcroOf.get(roofMaterial),
            Velcro_Right: velcroOf.get(roofMaterial),
            Velcro_Back_Left: velcroOf.get(roofMaterial),
            Velcro_Back_Right: velcroOf.get(roofMaterial),
            Velcro_Front_Left: velcroOf.get(roofMaterial),
            Velcro_Front_Right: velcroOf.get(roofMaterial)
        },
        onMesh: setupTentMesh
    }
}

const tentModels = {} // Загрузки шатров: каждый грузим один раз и запоминаем

// Возвращает модель шатра по названию кнопки, или null, если модели для этого размера пока нет
export const loadTent = (name) => {
    if (!TENTS[name]) return Promise.resolve(null)
    tentModels[name] ??= loadModel(TENTS[name]) // Запоминаем сам Promise, чтобы два быстрых клика не загрузили модель дважды
    return tentModels[name]
}
