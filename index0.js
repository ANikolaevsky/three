
// Всё из THREE, что осталось, но не задействовано в основном проекте

// Куб

// const tempVector = new THREE.Vector3(-1, 0.15, 0) // Если хотим присваивать значение координат много раз

// const geometry = new THREE.BoxGeometry(1, 1, 1) // Геометрия
// const material = new THREE.MeshStandardMaterial({ // Базовый, учитывает все характеристики без бликов
//     color: 'new THREE.Color(rgb(203, 195, 180)',
//     // flatShading: true,
//     emissive: 'rgb(47, 46, 46)',
//     metalness: 1, // Лучше использовать 1 или 0
//     roughness: .2 // Шероховатость поверхности
// })

// const cube = new THREE.Mesh(geometry, metallMaterial)
// cube.scale.set(0.3, 0.3, 1) // Можно и сразу указать данные размеры бокса без скейла
// cube.rotation.set(Math.PI * 0.15, Math.PI * 0.15, 0) // Угол через ПИ
// cube.rotation.set(THREE.MathUtils.degToRad(30), THREE.MathUtils.degToRad(30), 0) // В градусах удобнее
// cube.position.copy(tempVector) // Пример применения координат через Vector3
// cube.castShadow = true // Отбрасывание теней
// cube.receiveShadow = true // Принятие теней
// cube.updateMatrix() // Обновление матрицы преобразования объектов вручную
// scene.add(cube)

// const wireCube = new THREE.Mesh(geometry, material)
// wireCube.scale.setScalar(1.01)
// cube.add(wireCube) // Можно добавлять мэш не в сцену, а в другой мэш!!

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

// Постпроцессинг

// const composer = new EffectComposer(renderer) // Композер, прослойка между рендерингом и анимейтом

// const renderPass = new RenderPass(scene, camera) // Сам движок рендеринга
// composer.addPass(renderPass) // Проход движка через композер

// const bloomPass = new UnrealBloomPass( // Эффект свечения
//     new THREE.Vector2(config.sizes.height, config.sizes.width, 150, 120, 1))
// composer.addPass(bloomPass) // Проход эффекта через композер

// Обработчик передвижения мыши

// const cursor = {x: 0, y: 0}
// canvas.addEventListener('mousemove', (MouseEvent) => {
//     cursor.x = -(MouseEvent.clientX / sizes.width - 0.5)
//     cursor.y = MouseEvent.clientY / sizes.height - 0.5
// })

// Полноэкранный режим канваса

// window.addEventListener('dblclick', () => {
//     if (document.fullscreenElement) {
//         document.exitFullscreen()
//     }
//     else {
//         canvas.requestFullscreen()
//     }
// })

// Buttons

// document.querySelectorAll('.button').forEach(button => {
//     button.addEventListener('click', () => {
//         scene.remove(s1)
//     })
// })