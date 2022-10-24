class Application {
    constructor() {
        this.canvas = document.getElementById("canvas");
        this.context = this.canvas.getContext("2d");
        const canvSize = Math.min(window.innerHeight, window.innerWidth) * 0.8;
        this.canvas.width = canvSize;
        this.canvas.height = canvSize;
        
        this.fields = {}
        for (let field of ["angle", "frequency", "amplitude", "length", "friction", "speed"])
            this.fields[field] = document.getElementById(field);

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

                this.interval = 30 / data.speed;

                // Создаём новый маятник
                this.pendulum = new Pendulum(this.canvas.width / 2, this.canvas.height - data.length * data.mult - 20 - data.amplitude * data.mult, 15, 
                    data.angle, data.length, data.friction, data.frequency, data.amplitude, data.mult);

                this.timer = setInterval(() => this.redraw(), this.interval);
                this.button.value = "Остановить";
            }
            
            this.run = !this.run;
        });
    }

    /**
     * Перерисовывает весь холст заново
     */
    redraw() {
        console.log(this.context);
        this.pendulum.drawPendulum(this.context, this.canvas.width, this.canvas.height, this.interval);
    }

    /**
     * Возвращает значения
     * @param length длина
     * @param amplitude амплитуда
     * @returns {*} пересчитанные размеры амплитуды и длины
     */
    calcMultByPendulumSize(length, amplitude)
    {
        let mult = this.canvas.height / (2 * (amplitude + length));
        if (length * mult > this.canvas.width / 2)
            mult = this.canvas.width / 2 / length;
        return mult;
    }

    /**
     * Возвращает значения
     * @returns {*} null - некорректные данные, значения, если все верно
     */
    getData() {
        let values = {}
        for (let field in this.fields)
        {
            values[field] = parseFloat(this.fields[field].value);
            if (!isFinite(values[field]))
                return null;
        }
        values.mult = this.calcMultByPendulumSize(values.length, values.amplitude);
        return values;
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
        
        if (data.angle < -90 || data.angle > 90) {
            alert("Начальный угол отклонения должен быть в пределах от -90° до 90°!");
            return false;
        }

        if (data.length <= 0) {
            alert("Длина подвеса должна быть больше 0!");
            return false;
        }

        if (data.frequency < 0) {
            alert("Циклическая частота колебаний не может быть меньше 0!");
            return false;
        }

        if (data.amplitude < 0) {
            alert("Амплитуда колебаний подвеса не может быть меньше 0!");
            return false;
        }

        if (data.friction < 0 || data.friction > 1) {
            alert("Коэффициент затухания должен быть от 0 до 1!");
            return false;
        }

        if (data.speed <= 0 || data.speed > 3) {
            alert("Скорость должна быть больше 0 и не больше 3!");
            return false;
        }

        return true;
    }

    /**
     * Создаёт маятник
     * @param value состояние полей ввода
     */
    changeStateInputFields(value) {
        for (let field in this.fields)
            this.fields[field].disabled = value;
    }

    enableInputFields() {
        this.changeStateInputFields(false);
    }

    disableInputFields() {
        this.changeStateInputFields(true);
    }
}

class Pendulum {
    /**
     * Создаёт маятник
     * @param x0 координата х точки крепления опоры и стержня
     * @param y0 координата y точки крепления опоры и стержня
     * @param radius радиус шара
     * @param angle угол начального отклонения маятника
     * @param length длина стержня
     * @param friction коэффицент затухания
     * @param frequency частота колебаний подвеса
     * @param amplitude амплитуда колебаний подвеса
     * @param mult коэффициент отрисовки
     */
    constructor(x0, y0, radius, angle, length, friction, frequency, amplitude, mult) {
        // Начальные координаты
        this.x0 = x0;
        this.y0 = y0;

        // Текущие координаты шара
        this.ballX = x0 + length * mult * Math.sin(angle);
        this.ballY = y0 + length * mult * Math.cos(angle);

        // Текущие координаты опоры
        this.susX = x0;
        this.susY = y0;

        // Радиус шара
        this.r = radius;

        // Параметры системы

        // Отрисовка
        this.len = length * mult;
        this.amp = amplitude * mult;

        // Истинные значения
        this.length = length;
        this.amplitude = amplitude;

        this.frequency = frequency;
        
        this.g = 9.80665;
        this.friction = friction;

        // Переменные для leap_frog
        this.a = [0, 0];
        this.v = [0, 0];
        this.phi = [angle / 180 * Math.PI, 0];
        this.i = 0;
        this.t = 0;
        this.dt = 0.1;
        //console.log("ball", this.ballX, this.ballY, this.len);
        //console.log("sus", this.susX, this.susY, this.amp);
    }

    /**
     * @return {*} ballX, ballY, susY
     */
    getNewCoordinates() { // Решаем с помощью метода leapfrog уравнение для угла отклонения маятника
        let i = this.i;
        let x = (this.g / this.len - (this.amp / this.len) * this.frequency * this.frequency * Math.cos(this.frequency * this.t));
        let y = -2 * this.friction * this.v[i % 2];

        this.a[i % 2] = y + x * Math.sin(this.phi[i % 2]);

        this.phi[(i + 1) % 2] = this.phi[i % 2] + this.v[i % 2] * this.dt + (1 / 2) * this.a[i % 2] * this.dt * this.dt;

        this.a[(i + 1) % 2] = y + x * Math.sin(this.phi[(i + 1) % 2]);

        this.v[(i + 1) % 2] = this.v[i % 2] + (1 / 2) * (this.a[i % 2] + this.a[(i + 1) % 2]) * this.dt;

        let susY = this.y0 + this.amp * Math.cos(this.frequency * this.t);

        let ballX = this.susX + this.len * Math.sin(this.phi[(i + 1) % 2]);
        let ballY = this.susY + this.len * Math.cos(this.phi[i % 2]);

        this.t += this.dt;
        this.i = (i + 1) % 2;
        return {
            ballX: ballX,
            ballY: ballY,
            susY: susY
        }
        //console.log("ball", this.ballX, this.ballY, this.i);
        //console.log("sus", this.susX, this.susY, this.len);
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
     * @param clear очистить поло
     */
    drawPendulum(context, canvX, canvY, interval) {
        const cord = this.getNewCoordinates();
        const k = interval / 10;
        const ballXStep = (cord.ballX - this.ballX) / k;
        const ballYStep = (cord.ballY - this.ballY) / k;
        const susYStep = (cord.susY - this.susY) / k;
        for (let i = 0; i < k; i++)
        {
            context.clearRect(0, 0, canvX, canvY);
            this.ballX += ballXStep;
            this.ballY += ballYStep;
            this.susY += susYStep;
            this.drawKernel(context, canvX, canvY);
            this.drawSuspension(context, canvX, canvY);
            this.drawBall(context, canvX, canvY);
            // console.log(Math.abs(this.ballY - this.susY));
        }
    }
}

window.onload = () => {
    new Application();
}