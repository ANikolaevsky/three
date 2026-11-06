
// Режим разработчика
export const devMode = false 

// Единый объект конфигурации
export const config = {
    shadows: {
        resolution: 2048, // Разрешение теней (512, 1024, 2048)
        normalBias: .0002, // Порядка 2–3 текселя теневой карты, иначе тень «отрывается» от объектов
        area: 1.5, // Половина размера области, в которой считаются тени
        areaLarge: 2.5, // То же для больших моделей (комплект 7.3)
        areaSmall: 0.8, // Для сложенных комплектов (комплект 7.4)
        areaRoof: 6 // Крыша 4×4 м: при вращении её углы уходят на ~2,8 м от центра
    },
    lighting: {

        directionalIntensity: 5,
        directionalIntensity2: 1, // dirLight2 в мебели
        directionalIntensityTents: 3,
        directionalIntensityTents2: 3,
        directionalIntensityLamps: 1, // dirLight при включённых лампах шатра — будто вечер
        environmentIntensity: .6, // Интенсивность окружения. Не освещения!
        environmentIntensityTents: .5, // Окружение в разделе шатров

        dirLightPosition: [1, 6, 1], // Позиция dirLight в мебели
        dirLightPositionTents: [3, 6, 3], // Позиция dirLight в шатрах
        dirLight2Position: [-5, 2, -4], // dirLight2 с противоположной от dirLight стороны, в обоих разделах
        pointLightPosition: [-1.5, .5, -1.5], // Точечный свет для бликов на металле мебели
        pointLightPositionFar: [-2.8, .8, -2.6] // То же для разложенного комплекта 7.3

    },
    camera: {
        fov: 14,
        position: [ 0, 0, 0 ],
        near: 1,
        far: 20
    },
    sizes: {
    height: window.innerHeight,
    width: window.innerWidth
    }
}