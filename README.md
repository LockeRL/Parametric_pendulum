# Parametric_pendulum
- МЮ - Миша Юрченко
- МС - Миша Семенчук
- М - Максим Сидоров
## Как пользоваться версией v1.2
- вводить значения угловой скорости от 0 до 5 желательно
- амплитуду вводить от 0.1 до n
- длину подвеса также, главное чтобы амплитуда и длина не слишком сильно отличались(20-30 раз еще нормально)
- коэффициент от 0 до 1
- скорость от 0 до 3, 0 нельзя
- нажать кнопку запустить и наслаждаться, поля ввода заблокируются
- нажать остановить, чтобы поля вводу разлочились и ввести новые данные
- при вводе данных не из указанных диапазонов картинку разнесет и она будет супер нестабильной
## Немного по коду
- длина стержня и амплитуда высчитываются в зависимости от размера экрана и пропорционально друг другу
- отрисовывается новый кадр каждые 30/скорость милисекунд, а в промежутки между этими значениями каждые 10 милисекунд новый кадр, чтобы было плавнее
- далее для ввода значений будут сделаны ползунки, так что проблема проверки корректности данных уйдет
- getNewCoordinates считает новые координаты методом leapfrog, как это работает, я без понятия до сих пор
- drawPendulum - отрисовка плавная через цикл
## Задачи
### МЮ
- сделать ползунки с ограниченными значениями
- сделать 3 кнопки скорости возпроизведения 0.5х 1х 2х
- сделать все кнопки нормальными
### МС
- сделать график зависимости энергии от времени это посмотреть в маятнике капицы в инете, там везде такие графики есть
- в конструкторе маятника дополнительно передать множитель, то есть оставить значения длины и амплитуды как при вводе, чтобы считать энергию по заданным величинам, а для отрисовки отдельно умножить на множитель, чтобы была наглядность (то есть this.len = length * mult, аналогично для this.amp; и запомнить значения переменных this.length = length)
- функцию calculateNewLenandAmp переписать в  calcMultByScreenSize и в дате возвращать еще и mult, а амплитуду и длину не менять(для подсчета верных значений энергии)
- проверить, что подсчет новых значений происходит быстрее, чем просится отрисовка следующей точки (лучше подсчеты и заполнение массива сделать асинхронно, а рисовать по массиву значений)
- сделать изменение ползунков в реальном времени и изменение траектории движения маятника в реальном времни, если это возможно, а так можно лочить ползунки как сделано сейчас
### М
## Выполнение
- если вы считаете, что выполнили свою задачу, то рядом с задачей ставить такой смайлик :heavy_check_mark:, я проверяю и удаляю задачу, если ок
- если появились вопросы к тестировке чего-то или что-то еще, то добавляйте задачу в раздел задачи в блок того человека, к которому относится проблема
- иногда я буду лезть в код и решать задачи вместе с вами, так что постоянно делайте pull или пишите, что я пидр и порчу вашу структуру
- если я замечу какой-то баг или что-то неправильное, я сделаю issue и дополнительно опишу проблему тут
- при изменении кода создавайте новую папку и обзывайте новой версией, я периодически старые и ненужные буду удалять, а новые переименовывать
## P.S
К нам тут скоро приставят физиков, я с ними уже говорил, они нам решат некоторые задачи, надо будет потом сделать еще одну страничку, так что не затягиваем с данным проектом.
