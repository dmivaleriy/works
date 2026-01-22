(function () {
  let isDebugMode = false // Включена ли сейчас сетка
  const debuggerEl = document.querySelector('.debugger')

  document.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.code === 'KeyG') { // Включаем-выключаем сетку по ctrl-g
      e.preventDefault()

      isDebugMode = !isDebugMode
      debuggerEl.classList.toggle('is__active')
      debuggerEl.style.height = document.body.clientHeight + 'px' // Растягиваем сетку на всю высоту окна
    }

    if (isDebugMode && ['ArrowUp', 'ArrowDown'].includes(e.code)) { // Обрабатываем нажатия на стрелки вверх-вниз
      e.preventDefault()

      // Сдвигаем сетку дебаггера вверх-вниз на пиксель
      const top = parseInt(debuggerEl.style.top, 10) || 0
      const shift = e.code === 'ArrowUp' ? -1 : 1
      const newTop = top + shift

      debuggerEl.style.top = newTop + 'px'
    }
  })

  debuggerEl.style.height = document.body.clientHeight + 'px'
})()