
// Режим разработчика
export const devMode = false 

// Единый объект конфигурации
export const config = {
    shadows: {
        resolution: 2048, // Разрешение теней (512, 1024, 2048)
        normalBias: .0002, // Порядка 2–3 текселя теневой карты, иначе тень «отрывается» от объектов
        area: 1.5, // Половина размера области, в которой считаются тени
        areaLarge: 2.5, // То же для больших моделей (комплект 7.3)
        areaSmall: 0.8 // Для сложенных комплектов (комплект 7.4)
    },
    lighting: {
        directionalIntensity: 6
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