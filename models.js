import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js' // Декодер сжатия геометрии
import { metallMaterial2, softMaterial, roofMaterial, frameMaterial, windowMaterial, zipperMaterial, connectorMaterial, velcroOf, fastenerMaterial, stitchOf } from './textures.js'

export const state = { metall: metallMaterial2, soft: softMaterial } // Стейт материалов мебели по дефолту

const loader = new GLTFLoader() // Подключаем объект загрузки моделей
loader.setMeshoptDecoder(MeshoptDecoder) // Метод для сжатой геометрии

// mesh - узел, у которого есть форма и материал (Node1…Node46, стены и крыша шатра)
// node - любой объект в дереве сцены (Node0, gltf.scene, turntable, свет, камера)

// mesh (THREE.Mesh)
// ├── mesh.geometry  — форма: вершины, нормали, UV (BufferGeometry)
// ├── mesh.material  — материал: цвет, текстуры, металличность
// ├── mesh.name      — имя из glb: 'Node25'
// ├── mesh.visible   — показывать или нет
// ├── mesh.position / rotation / scale — где стоит и как повёрнут
// └── mesh.parent    — в какую группу вложен (здесь — корень модели)

// ОБЩИЕ ПОМОЩНИКИ ДЛЯ МОДЕЛЕЙ

// ПОСТОЯННЫЙ МАТЕРИАЛ ДЛЯ УЗЛОВ КРЕПЕЖА В СБОРКЕ

const isFastener = (mesh) => mesh.geometry.attributes.position.count === 1182 // Вытаскиваем узел по его вершинам

const setFastenerMaterial = (mesh) => {
    mesh.material = fastenerMaterial // Присваиваем материал
    mesh.userData.fixedMaterial = true // Фиксируем материал. replaceMaterial будет пропускать эти узлы
}

// СТОЛЫ

// СМЕНА СТОЛЕШНИЦ. Показывает узлы выбранного варианта name, прячет узлы других вариантов, 
// а общие детали (Frame_Back, Fabric, Fasteners…) не трогает вообще.
const setParts = (parts, variants, name) => Object.entries(variants).forEach(([variant, nodes]) => {
    nodes.forEach(nodeName => { if (parts[nodeName]) parts[nodeName].visible = variant === name })
})

const t2Parts = {} // Вытаскиваем все узлы сборки по именам: t2Parts.Node3 и т.д.

// Столешницы по названию кнопки: узлы разных вариантов стоят на одних координатах
const T2_TOPS = {
    'С1': ['Node3', 'Node4'], // Одна столешница
    'С2': ['Node8', 'Node7'] // Другая столешница
}

const t3Parts = {}

const T3_TOPS = {
    'С4': ['Node2', 'Node3'],
    'С5': ['Node10', 'Node9']
}

export const setT2Tops = (name) => setParts(t2Parts, T2_TOPS, name)
export const setT3Tops = (name) => setParts(t3Parts, T3_TOPS, name)

// ОСНОВНАЯ ФУНКЦИЯ СМЕНЫ УЗЛОВ В СБОРКЕ
// showParts устроен под мебель с номерными узлами: прячет всё, чего нет в наборе, 
// и разбирает крепеж по рамам (*_FRAME_FASTENERS).
const showParts = (parts, visible, frameFasteners) => Object.values(parts).forEach(mesh => {
    const frame = Object.keys(frameFasteners).find(frame => frameFasteners[frame].includes(mesh.name))
    if (frame) mesh.visible = visible.includes(frame) // Крепеж виден вместе со своей рамой
    else mesh.visible = visible.includes(mesh.name) || isFastener(mesh)
})

// КРЕСЛА. М1–М4 (одна сборка) Клик по модели выбирает, какие узлы видны

const mParts = {} // Разложенная сборка М
const m2Parts = {} // Сложенная сборка M_2
const m3Parts = {} // Разобранная сборка M_3

// Постоянные узлы: задняя рама, пластины сиденья, подушки сиденья
const M_BASE = ['Node9', 'Node3', 'Node7', 'Node5', 'Node6']

const M_SETS = {
    'М1': [...M_BASE, 'Node2', 'Node1', 'Node15', 'Node14'],
    'М2': [...M_BASE, 'Node2', 'Node1', 'Node12', 'Node14', 'Node4'],
    'М3': [...M_BASE, 'Node2', 'Node1', 'Node12', 'Node13', 'Node4', 'Node8'],
    'М4': [...M_BASE, 'Node10', 'Node16', 'Node17']
}

// СМЕНА ВЫСОКОГО И НИЗКОГО КРЕПЕЖА

const M_FRAME_FASTENERS = { 
    Node2: ['Node25', 'Node26'], // С высокой рамкой берутся два верхних узла
    Node10: ['Node23', 'Node24'] // С низкой рамкой берутся два нижних узла
}

// Показывает узлы выбранной М сразу во всех сборках, остальные прячет. Состав не зависит от того, какая М была до этого
export const setM = (name) => { // Включает узлы из набора и прячет остальные.
    const visible = M_SETS[name] ?? M_SETS['М1'] // Оператор нулевого слияния ?? возвращает значение справа, если значения слева нет
    showParts(mParts, visible, M_FRAME_FASTENERS)
    showParts(m2Parts, visible, M_FRAME_FASTENERS)
    showParts(m3Parts, visible, M_FRAME_FASTENERS)
}

// ДИВАНЫ

const dParts = {} // Разложенная сборка D
const d2Parts = {} // Сложенная сборка D_2
const d3Parts = {} // Разобранная сборка D_3

// Постоянные узлы: задние рамы, пластины сиденья, подушки сиденья
const D_BASE = ['Node9', 'Node12', 'Node3', 'Node7', 'Node21', 'Node22', 'Node5', 'Node6', 'Node24', 'Node25']

const D_SETS = {
    'Д1': [...D_BASE, 'Node11', 'Node2', 'Node14', 'Node1', 'Node23', 'Node18', 'Node17'],
    'Д2': [...D_BASE, 'Node11', 'Node2', 'Node14', 'Node1', 'Node23', 'Node15', 'Node17', 'Node4'],
    'Д3': [...D_BASE, 'Node11', 'Node2', 'Node14', 'Node1', 'Node23', 'Node15', 'Node16', 'Node4', 'Node8'],
    'Д4': [...D_BASE, 'Node46', 'Node10', 'Node13', 'Node20', 'Node19']
}

// Как у М: крепеж на верхних трубах рам виден только вместе со своей рамой
const D_FRAME_FASTENERS = {
    Node2: ['Node42', 'Node45'], Node14: ['Node34', 'Node35'], // С высокой рамкой берутся четыре верхних узла
    Node10: ['Node39', 'Node41'], Node13: ['Node30', 'Node33'] // С низкой рамкой берутся четыре нижних узла
}

export const setD = (name) => {
    const visible = D_SETS[name] ?? D_SETS['Д1'] // Оператор нулевого слияния ??
    showParts(dParts, visible, D_FRAME_FASTENERS)
    showParts(d2Parts, visible, D_FRAME_FASTENERS)
    showParts(d3Parts, visible, D_FRAME_FASTENERS)
}

// Компактные кресла

const kParts = {} // Разложенная сборка K

const K_SETS = {
    'К1': ['Frame_Left_Open', 'Frame_Right_Open'],
    'К2': ['Frame_Left_Full', 'Frame_Right_Full', 'Armrests']
}

export const setK = (name) => setParts(kParts, K_SETS, name)

// Настройка узлов К после загрузки. onMesh вызывается уже после выбора ткани/металла в loadModel, поэтому перекрывает его
const setupKMesh = (mesh) => {
    kParts[mesh.name] = mesh
    if (mesh.name === 'Stitching') mesh.material = stitchOf.get(state.soft) // Строчка — затемнённая текущая ткань, setSoftMaterial перекрашивает её вместе с тканью
    if (mesh.name === 'Fasteners') setFastenerMaterial(mesh) // Весь крепеж К одним мешем, isFastener по 1182 вершинам его не находит
}

// СМЕНА МАТЕРИАЛОВ ДЛЯ РАЗНЫХ УЗЛОВ СБОРКИ

// Вытаскиваем массив имён узлов подушек из модели. Остальным просто присвоем другой материал
const K_SOFT_PARTS = new Set(['Fabric', 'Stitching', 'Armrests'])
const M_SOFT_PARTS = new Set(['Node1', 'Node4', 'Node5', 'Node6', 'Node8']) // Именя мягких узлов (подушек) M1-M4. Вычленяются из моделей m, m2, m3
const D_SOFT_PARTS = new Set(['Node1', 'Node23', 'Node4', 'Node8', 'Node5', 'Node6', 'Node24', 'Node25']) // Именя мягких узлов (подушек) Д1-Д4
const A73_SOFT_PARTS = new Set([ 'Node12', 'Node13', 'Node14', 'Node20', 'Node37', 'Node38', 
    'Node39', 'Node67', 'Node68', 'Node69', 'Node70', 'Node79', 'Node83', 'Node84', 'Node85', 
    'Node89', 'Node104', 'Node105', 'Node107', 'Node118', 'Node123', 'Node124'
]) // Именя мягких узлов (подушек) Сборки 7:3
const A74_SOFT_PARTS = new Set([ 'Node2', 'Node3', 'Node4', 'Node5', 'Node16', 'Node17', 'Node23', 
    'Node24', 'Node25', 'Node26', 'Node29', 'Node32', 'Node33', 'Node34', 'Node35', 'Node36',
    'Node37', 'Node38', 'Node39', 'Node40'
]) // Именя мягких узлов (подушек) Сборки 7:4

// САМИ МОДЕЛИ

const FURNITURE = {

    k: { url: './models/compressed/K.glb', pos: [0, 0, .35], rot: [0, 0, 0], scale: 1, softParts: K_SOFT_PARTS, onMesh: setupKMesh },

    m: { url: './models/compressed/M.glb', pos: [.889, 0, 3.247], rot: [0, 90, 0], softParts: M_SOFT_PARTS, fasteners: true, onMesh: (n) => { mParts[n.name] = n } },
    m2: { url: './models/compressed/M_2.glb', pos: [.736, 0, 3.236], rot: [0, 90, 0], softParts: M_SOFT_PARTS, fasteners: true, onMesh: (n) => { m2Parts[n.name] = n } },
    m3: { url: './models/compressed/M_3.glb', pos: [.889, 0, 3.247], rot: [0, 90, 0], softParts: M_SOFT_PARTS, fasteners: true, onMesh: (n) => { m3Parts[n.name] = n } },

    d: { url: './models/compressed/D.glb', pos: [.889, 0, 3.247], rot: [0, 90, 0], softParts: D_SOFT_PARTS, fasteners: true, onMesh: (n) => { dParts[n.name] = n } },
    d2: { url: './models/compressed/D_2.glb', pos: [.670, 0, 3.236], rot: [0, 90, 0], softParts: D_SOFT_PARTS, fasteners: true, onMesh: (n) => { d2Parts[n.name] = n } },
    d3: { url: './models/compressed/D_3.glb', pos: [.889, 0, 3.247], rot: [0, 90, 0], softParts: D_SOFT_PARTS, fasteners: true, onMesh: (n) => { d3Parts[n.name] = n } },

    t2:  { url: './models/compressed/T2_Assembly.glb', pos: [.89, .15, 1.54], rot: [0, 90, 0], onMesh: (n) => { t2Parts[n.name] = n } },
    t3:  { url: './models/compressed/T3_Assembly.glb', pos: [.89, 0, 3.3], rot: [0, 90, 0], onMesh: (n) => { t3Parts[n.name] = n } },
    t4:  { url: './models/compressed/T4_Assembly.glb', pos: [1.25, 0, 3.3], rot: [0, 90, 0] },
    t5:  { url: './models/compressed/T5_Assembly.glb', pos: [1.25, .15, 1.54], rot: [0, 90, 0] },

    a73: { url: './models/compressed/7.3_Assembly.glb', pos: [1.7, 0, -.9], softParts: A73_SOFT_PARTS, fasteners: true },
    a74: { url: './models/compressed/7.3_Disassembly.glb', pos: [-2.55, 0, .14], softParts: A74_SOFT_PARTS, fasteners: true },
}

// Общая функция. Берет модель, назначает материал, масштаб, поворот, позицию.

const loadModel = ({ url, pos, rot = [0, 180, 0], scale = .01, soft = false, softParts, fasteners = false, material, parts, onMesh }) => 
    // Ещё одна деструктуризация. Получая config из FURNITURE, loadModel раскладывает его по переменным. Заодно задаются значения по умолчанию.
    new Promise((resolve) => {
        loader.load(url, (gltf) => {
            const root = gltf.scene
            root.traverse((node) => { // traverse обходит все узлы в дереве модели
                if (!node.isMesh) return // если node не mesh (не виден на сцене), то ретёрн
                if (parts) { // Присвоение материала узлам в сборке тента
                    // материал выбираем по имени узла, части не из списка оставляют свой.
                    // Если у узла есть дети (стена с окном), сжатие переносит его меш в безымянный дочерний узел — тогда берём имя родителя
                    node.material = parts[node.name] ?? parts[node.parent?.name] ?? node.material // Запасная проверка для дочерних стен
                    node.userData.fixedMaterial = true // replaceMaterial мебели их не меняет
                } else { // Присвоение материала узлам в сборке мебели
                    const isSoft = softParts ? softParts.has(node.name) : soft // true или false. Если у модели есть список мягких деталей, проверь, есть ли этот узел в списке, иначе возьми soft
                    node.material = isSoft ? state.soft : state.metall // Назначение материала. Мягкой детали достаётся текущая ткань, остальным — текущий металл.
                }
                if (material) {
                    node.material = material // Свой материал модели
                    node.userData.fixedMaterial = true // replaceMaterial его не меняет
                }
                node.castShadow = true
                node.receiveShadow = true
                if (fasteners && isFastener(node)) setFastenerMaterial(node)
                onMesh?.(node)   // для t2Parts / t3Parts
            })
            root.scale.setScalar(scale) // Большинство моделей в сантиметрах, поэтому по умолчанию .01
            root.rotation.set(...rot.map(THREE.MathUtils.degToRad))
            root.position.set(...pos)
            resolve(root)
        })
    })

// Собирает всю мебель разом и возвращает объект с ней models = { m, t2, … }
// Делает ту самую подстановку моделей FURNITURE в функцию loadModel
export const loadFurniture = async () => {
    const models = {}
    await Promise.all(
        // Object.entries возвращает массив пар [[ключ, значение], [ключ, значение]], чтоб сделать метод map
        // .map вызывает функцию для каждой пары и собирает то, что она вернула, в новый массив той же длины.
        Object.entries(FURNITURE).map(async ([key, config]) => { models[key] = await loadModel(config) })
    )
    // Альтернативные детали по умолчанию скрыты
    setT2Tops('С1')
    setT3Tops('С4')
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

// Все шатры устроены одинаково, отличаются только файлом и набором стен.
// У каждой стены своя липучка с тем же суффиксом: Wall_Back → Velcro_Back
const WALLS = ['Left', 'Right', 'Back', 'Front']
const WALLS_SPLIT = ['Left', 'Right', 'Back_Left', 'Back_Right', 'Front_Left', 'Front_Right'] // Длинные шатры: задняя и передняя стены из двух половин

const tent = (file, walls) => ({
    url: `./models/compressed/${file}.glb`, pos: [0, 0, 0], rot: [0, 0, 0], scale: 1, // Модели уже в метрах
    parts: {
        Frame: frameMaterial,
        Roof: roofMaterial,
        Frame_Connectors: connectorMaterial,
        Window_Left: windowMaterial,
        Window_Right: windowMaterial,
        Zippers_Front: zipperMaterial,
        // Object собирает результат в объект с двумя свойствами, а ... делает из них список свойств
        ...Object.fromEntries(walls.flatMap(wall => [ // flatMap каждоую стену разбивает на:
            [`Wall_${wall}`, roofMaterial], // Саму стену
            [`Velcro_${wall}`, velcroOf.get(roofMaterial)] // Липучку
        ]))
    },
    onMesh: setupTentMesh
})

// Название кнопки размера → модель
const TENTS = {
    '3,0x3,0': tent('tent_3x3', WALLS),
    '3,0x4,5': tent('tent_3x45', WALLS),
    '3,0x6,0': tent('tent_3x6', WALLS_SPLIT),
    '4,0x4,0': tent('tent_4x4', WALLS),
    '4,0x6,0': tent('tent_4x6', WALLS),
    '4,0x8,0': tent('tent_4x8', WALLS_SPLIT)
}

const tentModels = {} // Загрузки шатров: каждый грузим один раз и запоминаем

// Возвращает модель шатра по названию кнопки
export const loadTent = (name) => {
    tentModels[name] ??= loadModel(TENTS[name]) // Запоминаем сам Promise, чтобы два быстрых клика не загрузили модель дважды
    return tentModels[name]
}
