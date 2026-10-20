import * as THREE from 'three'
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js'
import { MeshoptDecoder } from 'three/examples/jsm/libs/meshopt_decoder.module.js' // Декодер сжатия геометрии
import { metallMaterial, metallMaterial2, softMaterial } from './textures.js'

export const state = { metall: metallMaterial2, soft: softMaterial } // Задаем стейт материалов по дефолту
export const sofa = new THREE.Group() // Все модели кресел (М1–М3) лежат в одной группе, чтобы при выборе М4, они убирались разом

const loader = new GLTFLoader()
loader.setMeshoptDecoder(MeshoptDecoder) // Метод, использующий сжатую геометрию

// ОБЩИЕ ПОМОЩНИКИ

const setParts = (parts, show, hide) => { // Создаем условие для смены одних деталей на другие
    show.forEach(name => { if (parts[name]) parts[name].visible = true })
    hide.forEach(name => { if (parts[name]) parts[name].visible = false })
}

// Присвоение постоянного материала некоторым узлам в модели
const isCap = (node) => node.geometry.attributes.position.count === 1182 // Вытаскиваем элемент по его вершинам

const setCapMaterial = (node) => {
    node.material = metallMaterial
    node.userData.fixedMaterial = true // replaceMaterial пропускает такие узлы
}

// ДАННЫЕ

const t2Parts = {} // Вытаскиваем все узлы сборки по именам: t2Parts.Node3 и т.д.

// Когда модель подгружена с взаимозаменяемыми узлами на одинаковых координатах

export const t2TopsM4 = ['Node3', 'Node4'] // Указываем, какие узлы на какие могут меняться
export const t2TopsC1 = ['Node8', 'Node7'] 

const t3Parts = {}

export const t3TopsC3 = ['Node2', 'Node3']
export const t3TopsC4 = ['Node10', 'Node9']

// Присваиваем сменяемый материал некоторым узлам из модели
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

// Указываем, что в условии setParts показывается по дефолту
export const setT2Tops = (show, hide) => setParts(t2Parts, show, hide) 
export const setT3Tops = (show, hide) => setParts(t3Parts, show, hide)

const MODELS = {
    mr:  { url: './models/compressed/MR.glb', pos: [-.351, 0, .4] },
    mr2:  { url: './models/compressed/MR2.glb', pos: [-.351, 0, .4] },
    ml:  { url: './models/compressed/ML.glb', pos: [.376, 0, .4] },
    ml2:  { url: './models/compressed/ML2.glb', pos: [.376, 0, .4] },
    tb:  { url: './models/compressed/TB.glb', pos: [.35, 0, .375], rot: [0, 270, 0] },
    mf:  { url: './models/compressed/MF.glb', pos: [-.35, 0, -.275], rot: [0, 90, 0] },
    mg:  { url: './models/compressed/MG.glb', pos: [-.35, .285, -.275], rot: [180, 0, 0] },
    mg2:  { url: './models/compressed/MG.glb', pos: [-.35, .285, .05], rot: [180, 0, 0] },
    s1Left: { url: './models/compressed/S1.glb', pos: [-.365, .29, .387], rot: [0, 0, 0], soft: true },
    s1Right: { url: './models/compressed/S1.glb', pos: [0, .290, .387], rot: [0, 0, 0], soft: true },
    s2: { url: './models/compressed/S2.glb', pos: [-.365, .375, -.28], rot: [90, 0, 0], soft: true },
    s3: { url: './models/compressed/S3.glb', pos: [-.365, .375, -.19], rot: [0, 180, 90], soft: true },
    s4: { url: './models/compressed/S3.glb', pos: [.272, .375, -.19], rot: [0, 180, 90], soft: true },

    t2:  { url: './models/compressed/T2_Assembly.glb', pos: [.89, .15, 1.54], rot: [0, 90, 0], onMesh: (n) => { t2Parts[n.name] = n } },
    t3:  { url: './models/compressed/T3_Assembly.glb', pos: [.89, 0, 3.3], rot: [0, 90, 0], onMesh: (n) => { t3Parts[n.name] = n } },
    t4:  { url: './models/compressed/T4_Assembly.glb', pos: [1.25, 0, 3.3], rot: [0, 90, 0] },
    t5:  { url: './models/compressed/T5_Assembly.glb', pos: [1.25, .15, 1.54], rot: [0, 90, 0] },

    a73: { url: './models/compressed/7.3_Assembly.glb', pos: [1.7, 0, -.9], softParts: a73SoftParts, caps: true },
    a74: { url: './models/compressed/7.3_Disassembly.glb', pos: [-2.55, 0, .14], softParts: a74SoftParts, caps: true }
}

const loadModel = ({ url, pos, rot = [0, 180, 0], soft = false, softParts, caps = false, onMesh }) =>
    new Promise((resolve) => {
        loader.load(url, (gltf) => {
            const root = gltf.scene
            root.traverse((node) => {
                if (!node.isMesh) return
                const isSoft = softParts ? softParts.has(node.name) : soft
                node.material = isSoft ? state.soft : state.metall
                node.castShadow = true
                node.receiveShadow = true
                if (caps && isCap(node)) setCapMaterial(node)
                onMesh?.(node)   // для t2Parts / t3Parts
            })
            root.scale.setScalar(.01)
            root.rotation.set(...rot.map(THREE.MathUtils.degToRad))
            root.position.set(...pos)
            resolve(root)
        })
    })

export const models = {}
await Promise.all(
    Object.entries(MODELS).map(async ([key, config]) => { models[key] = await loadModel(config) })
)

// Какие модели лежат в группе sofa
const inSofa = ['mr2', 'ml2', 'tb', 'mf', 'mg', 'mg2', 's1Left', 's1Right', 's2']
inSofa.forEach(key => sofa.add(models[key]))

// Альтернативные детали по умолчанию скрыты
setT2Tops(t2TopsM4, t2TopsC1)
setT3Tops(t3TopsC3, t3TopsC4)
