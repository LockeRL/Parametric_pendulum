class Application {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");

        this.angleField = document.getElementById("angle"); 
        this.frequencyField = document.getElementById("frequency");
        this.amplitudeField = document.getElementById("amplitude");
        this.lengthField = document.getElementById("length");

        this.button = document.getElementById("mainButton");

        this.interval = 30; // время через которое перерисовывается

        this.run = false;

        this.button.addEventListener('click', () => {
            if (this.run)
            {
                this.enableInputFields();

                clearInterval(this.timer);
                this.button.value = "Запустить";
            }
            else if (this.validateData()) {
                this.disableInputFields();

                const data = this.getData();

                // Создаём новый маятник
                this.pendulum = new Pendulum(400, 400, 15, data.angle, data.length, data.frequency, data.amplitude);

                this.timer = setInterval(() => this.redraw(), this.interval);
                this.button.value = "Остановить";
            }

            
            this.run = !this.run;
        });
    }

    /**
     * Очищает холст
     */
    clear() {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    }

    /**
     * Перерисовывает весь холст заново
     */
    redraw() {
        this.clear();


        this.pendulum.drawPendulum(this.context, this.canvas.width, this.canvas.height);
    }

    /**
     * Возвращает значения
     * @returns {*} null - некорректные данные, значения, если все верно
     */
    getData() {
        const angle = parseFloat(this.angleField.value);
        const length = parseFloat(this.lengthField.value);
        const frequency = parseFloat(this.frequencyField.value);
        const amplitude = parseFloat(this.amplitudeField.value);

        if (isFinite(angle) && isFinite(length) && isFinite(amplitude) && isFinite(frequency))
            return {
                angle: angle,
                length: length,
                frequency: frequency,
                amplitude: amplitude
            };
        else
            return null;
    }

    /**
     * Выводит alert о недопустимых значениях
     * @returns {boolean} true - поля заполнены верно, false - поля заполнены неверно
     */
    validateData() {
        const data = this.getData();

        if (data === null) {
            alert("Одно или несколько полей заполнены неправильно или не заполнены совсем!");
            return false;
        }
        else {
            if (data.angle < -90 || data.angle > 90) {
                alert("Начальный угол отклонения должен быть в пределах от -90° до 90°!");
                return false;
            }

            if (data.length <= 0) {
                alert("Длина подвеса должна быть больше нуля!");
                return false;
            }

            if (data.frequency < 0) {
                alert("Циклическая частота колебаний должна быть больше 0!");
                return false;
            }

            if (data.amplitude < 0) {
                alert("Амплитуда колебаний подвеса не может быть меньше 0!");
                return false;
            }

            return true;
        }
    }

    enableInputFields() {
        this.angleField.disabled = false;
        this.lengthField.disabled = false;
        this.frequencyField.disabled = false;
        this.amplitudeField.disabled = false;
    }

    disableInputFields() {
        this.angleField.disabled = true;
        this.lengthField.disabled = true;
        this.frequencyField.disabled = true;
        this.amplitudeField.disabled = true;
    }
}

class Pendulum {
    /**
     * Создаёт маятник
     * @param x0 Координата точки крепления маятника по оси X
     * @param y0 Координата точки крепления маятника по оси Y
     * @param raduis Радиус груза (так как он имеет форму шара)
     * @param angle Угол начального отклонения маятника (в градусах)
     * @param length Длина подвеса
     * @param frequency Коэффицент затухания
     * @param amplitude Амплитуда колебаний подвеса
     */
    constructor(x0, y0, raduis, angle, length, frequency, amplitude) {
        const mult = 200; // Коэффециент масштабирования длины нити
        length *= mult;
        amplitude *= mult;

        // Текущие координаты шара
        this.ballX = x0 + length * Math.sin(angle);
        this.ballY = y0 + length * Math.cos(angle);

        // Текущие координаты опоры
        this.susX = x0;
        this.susY = y0;

        // Радиус шара
        this.r = raduis;

        // Параметры системы
        this.len = length;
        this.freq = frequency;
        this.amp = amplitude;
        this.g = 9.80665;
        this.gamma = 0.1; // трение

        // Переменные для leap_frog
        this.a = [0, 0];
        this.v = [0, 0];
        this.phi = [angle / 180 * Math.PI, 0];
        this.i = 0;
        this.t = 0;
        this.dt = 0.1;
        console.log("ball", this.ballX, this.ballY, this.len);
        console.log("sus", this.susX, this.susY);
    }

    calculateCoordinates() { // Решаем с помощью метода leapfrog уравннеие для угла отклонения маятника
        var i = this.i;
        this.a[i % 2] = (-1) * 2 * this.gamma * this.v[i % 2] + (this.g / this.len - 
        (this.amp / this.len) * this.freq * this.freq * Math.cos(this.freq * this.t)) * Math.sin(this.phi[i % 2]);

        this.phi[(i + 1) % 2] = this.phi[i % 2] + this.v[i % 2] * this.dt + (1 / 2) * 
            this.a[i % 2] * this.dt * this.dt;

        this.a[(i + 1) % 2] = (-1) * 2 * this.gamma * this.v[i % 2] + (this.g / this.len - (this.amp / this.len) *
            this.freq * this.freq * Math.cos(this.freq * this.t)) * Math.sin(this.phi[(i + 1) % 2]);

        this.v[(i + 1) % 2] = this.v[i % 2] + (1 / 2) * (this.a[i % 2] + this.a[(i + 1) % 2]) * this.dt;

        this.susY += this.amp * Math.cos(this.freq * this.t);

        this.ballX = this.susX + this.len * Math.sin(this.phi[(i + 1) % 2]);
        this.ballY = this.susY + this.len * Math.cos(this.phi[i % 2]);

        this.t += this.dt;
        this.i++;
        console.log("ball", this.ballX, this.ballY, this.i);
        console.log("sus", this.susX, this.susY, this.len);
    }

    /**
     * Рисует шар
     * @param context контекст
     * @param canvX ширина полотна
     * @param canvY высота полотна
     */
    drawBall(context, canvX, canvY) {
        const gradient = context.createRadialGradient(canvX - this.ballX, canvY - this.ballY, this.r,
             canvX - (this.ballX - 2), canvY - (this.ballY - 4), 2);

        gradient.addColorStop(0, '#333');
        gradient.addColorStop(1, '#999');

        context.fillStyle = gradient;
        context.beginPath();
        context.arc(canvX - this.ballX, canvY - this.ballY, this.r, 0, Math.PI * 2, true);
        context.fill();
    }

    /**
     * Рисует стержень
     * @param context контекст
     * @param canvX ширина полотна
     * @param canvY высота полотна
     */
    drawKernel(context, canvX, canvY) {
        context.beginPath();
        context.strokeStyle = "#555";
        context.moveTo(canvX - this.ballX, canvY - this.ballY);
        context.lineTo(canvX - this.susX, canvY - this.susY);
        context.closePath();
        context.stroke();
    }

    /**
     * Рисует опору
     * @param context контекст
     * @param canvX ширина полотна
     * @param canvY высота полотна
     */
    drawSuspension(context, canvX, canvY) {
        context.beginPath();
        context.strokeStyle = "#555";
        context.moveTo(canvX - this.susX - 10, canvY - this.susY + 5);
        context.lineTo(canvX - this.susX + 10, canvY - this.susY + 5);
        context.lineTo(canvX - this.susX + 10, canvY - this.susY - 5);
        context.lineTo(canvX - this.susX - 10, canvY - this.susY - 5);
        context.fill();
    }


    /**
     * Рисует маятник целиком
     * @param context контекст
     * @param canvX ширина полотна
     * @param canvY высота полотна
     */
    drawPendulum(context, canvX, canvY) {
        this.drawKernel(context, canvX, canvY);
        this.drawSuspension(context, canvX, canvY);
        this.drawBall(context, canvX, canvY);
        this.calculateCoordinates();
    }
}

window.onload = () => {
    new Application();
}