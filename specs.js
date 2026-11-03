// СПЕЦИФИКАЦИЯ МЕБЕЛИ

export const defaultSpecs = {
    'Время сборки': '1 минута',
    'Каркас': 'Сталь',
    'Ткань': 'Полиэстер',
    'Наполнитель': 'Паралон',
    'Коннекторы': 'Сталь'
}

export const specs = {
    'М1': { 'Габариты': '70 × 70 × 60 см', 'Вес': '8 кг' },
    'М2': { 'Габариты': '70 × 70 × 60 см', 'Вес': '10 кг' },
    'М3': { 'Габариты': '70 × 70 × 60 см', 'Вес': '12 кг' },
    'М4': { 'Габариты': '70 × 70 × 35 см', 'Вес': '6 кг' },
    'С1': { 'Габариты': '70 × 70 × 35 см', 'Вес': '5 кг', 'Ткань': null, 'Наполнитель': null },
    'С2': { 'Габариты': '70 × 70 × 35 см', 'Вес': '6 кг', 'Ткань': null, 'Наполнитель': null },
    'С3': { 'Габариты': '140 × 70 × 35 см', 'Вес': '11 кг', 'Ткань': null, 'Наполнитель': null },
    'С4': { 'Габариты': '70 × 70 × 60 см', 'Вес': '11 кг', 'Ткань': null, 'Наполнитель': null },
    'С5': { 'Габариты': '70 × 70 × 60 см', 'Вес': '12 кг', 'Ткань': null, 'Наполнитель': null },
    'С6': { 'Габариты': '140 × 70 × 60 см', 'Вес': '23 кг', 'Ткань': null, 'Наполнитель': null },
    '7.3': { 'Площадь комплекта': '4,5 × 3,0 м', 'В сложенном': '1,7 × 0,7 м', 'Общий вес': '75 кг', 'Время сборки': '10 минут' }
}

export const prices = {
    'М1': '21 000 ₽',
    'М2': '23 000 ₽',
    'М3': '25 000 ₽',
    'М4': '19 000 ₽',
    'С1': '17 000 ₽',
    'С2': '16 000 ₽',
    'С3': '30 000 ₽',
    'С4': '23 000 ₽',
    'С5': '22 000 ₽',
    'С6': '50 000 ₽',
    '7.3': '195 000 ₽'
}

// СПЕЦИФИКАЦИЯ ТЕНТОВ

export const defaultSpecsTents = {
    'Время сборки': '5 минут',
    'Стойки': 'Восьмигранные 44х40мм',
    'Каркас' : 'Анодированный алюминий',
    'Ткань': 'Oxford 600D',
    'Ветровая нагрузка': 'до 16 м/с'
}

export const specsTents = {
    '4,0x4,0': { 'Площадь': '16 м2', 'Вес': '50 кг', 'Вместимость': 'до 12 человек', 'Высота входа': '2,4 м' }
}

export const pricesTents = {
    '4,0x4,0': '115 000 ₽'
}

// Данные каждого раздела. Ключ — id раздела в index.html, у каждого раздела свой блок .right
const catalogs = {
    furniture: { defaults: defaultSpecs, models: specs, modelPrices: prices },
    tents: { defaults: defaultSpecsTents, models: specsTents, modelPrices: pricesTents }
}

export const showSpecs = (name, section) => {
    const { defaults, models, modelPrices } = catalogs[section]
    const specsList = document.querySelector(`#${section} .specs`)
    const priceTitle = document.querySelector(`#${section} .right h2`)
    const rows = { ...defaults, ...models[name] }
    specsList.innerHTML = Object.entries(rows)
        .filter(([, value]) => value)
        .map(([key, value]) => `<div><dt>${key}</dt><dd>${value}</dd></div>`)
        .join('')
    priceTitle.textContent = modelPrices[name] ?? '' // Цена выбранной модели
}
