class Application
{
    constructor()
    {
        this.FPS = 100

        this.pendulumCanvas = document.getElementById("pendulumCanvas");
        this.pendulumContext = this.pendulumCanvas.getContext("2d");

        this.graphCanvas = document.getElementById("graphCanvas");
        this.graphContext = this.graphCanvas.getContext("2d");

        const canvSize = Math.min(window.innerHeight, window.innerWidth) * 0.8;

        this.pendulumCanvas.width = canvSize;
        this.pendulumCanvas.height = canvSize;
        
        this.graphCanvas.width = canvSize / 2;
        this.graphCanvas.height = canvSize / 2;


        this.fields = {}
        for (let field of ["angle", "ang_vel", "amplitude", "length", "friction", "speed", "weight"])
            this.fields[field] = document.getElementById(field);

        this.restartButton = document.getElementById("restartButton");
        this.continueButton = document.getElementById("continueButton");

        this.run = false;

        this.continueButton.addEventListener('click', () => {
            if (this.run)
                this.pause();
            else if (this.pendulum !== undefined || this.createPendulum())
                this.unpause();
        });

        this.restartButton.addEventListener('click', () => {
            if (this.createPendulum())
            {
                this.cleanCanvas(this.graphCanvas);
                this.unpause();
            }
        });
    }

    pause()
    {
        this.enableInputFields();
        clearInterval(this.timer);
        this.continueButton.value = "Продолжить";
        this.run = false;
    }

    unpause()
    {
        this.disableInputFields();
        clearInterval(this.timer);
        this.timer = setInterval(() => this.redraw(), 1000 / this.FPS);
        this.continueButton.value = "Остановить";
        this.restartButton.value = "Запустить";
        this.run = true;
    }

    createPendulum()
    {
        const data = this.getData();
        if (!this.validateData(data))
            return false;
        this.pendulum = new Pendulum(this.pendulumCanvas.width / 2, this.pendulumCanvas.height - data.length * data.mult - 20 - data.amplitude * data.mult, 15, data, data.speed / this.FPS);
        return true;
    }

    cleanCanvas(canvas)
    {
        canvas.getContext("2d").clearRect(0, 0, canvas.width, canvas.height)
    }

    /**
     * Перерисовывает весь холст заново
     */
    redraw()
    {
        this.pendulum.update();

        this.cleanCanvas(this.pendulumCanvas);
        this.pendulum.drawPendulum(this.pendulumContext, this.pendulumCanvas.width, this.pendulumCanvas.height);

        this.cleanCanvas(this.graphCanvas);
        this.pendulum.drawGraph(this.graphContext, this.graphCanvas.width, this.graphCanvas.height);
    }

    /**
     * Возвращает значения
     * @param length длина
     * @param amplitude амплитуда
     * @returns {*} пересчитанные размеры амплитуды и длины
     */
    calcMultByPendulumSize(length, amplitude)
    {
        let mult = this.pendulumCanvas.height / (2 * (amplitude + length));
        if (length * mult > this.pendulumCanvas.width / 2)
            mult = this.pendulumCanvas.width / 2 / length;
        return mult;
    }

    /**
     * Возвращает значения
     * @returns {*} null - некорректные данные, значения, если все верно
     */
    getData()
    {
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
     * @param data объект с данными
     * @returns {boolean} true - поля заполнены верно, false - поля заполнены неверно
     */
    validateData(data)
    {
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

        if (data.ang_vel < 0) {
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
    changeStateInputFields(value)
    {
        for (let field in this.fields)
            this.fields[field].disabled = value;
    }

    enableInputFields()
    {
        this.changeStateInputFields(false);
    }

    disableInputFields()
    {
        this.changeStateInputFields(true);
    }
}

class Pendulum
{
    /**
     * Создаёт маятник
     * @param x0 координата х точки крепления опоры и стержня
     * @param y0 координата y точки крепления опоры и стержня
     * @param radius радиус шара
     * @param data.angle угол начального отклонения маятника
     * @param data.length длина стержня
     * @param data.friction коэффицент затухания
     * @param data.ang_vel частота колебаний подвеса
     * @param data.amplitude амплитуда колебаний подвеса
     * @param data.mult коэффициент отрисовки
     * @param data.weight масса шарика
     * @param dt длина временного промежутка между кадрами
     */
    constructor(x0, y0, radius, data, dt)
    {
        // Начальное состояние системы
        this.x0 = x0;
        this.y0 = y0;

        // Текущие координаты шара
        this.ballX = x0 + data.length * data.mult * Math.sin(data.angle);
        this.ballY = y0 + data.length * data.mult * Math.cos(data.angle);

        // Текущие координаты опоры
        this.susX = x0;
        this.susY = y0;

        // Радиус шара
        this.r = radius;

        // Параметры системы

        // Истинные значения
        this.weight = data.weight;
        this.length = data.length;
        this.amplitude = data.amplitude;
        this.friction = data.friction;
        this.ang_vel = data.ang_vel;

        // Отрисовка
        this.len = data.length * data.mult;
        this.amp = data.amplitude * data.mult;        

        // Координаты для отрисковки графика
        this.energy_values = [];
        this.min_energy = +Infinity;
        this.max_energy = -Infinity;

        // Переменные для leapfrog
        this.a = [0, 0];
        this.v = [0, 0];
        this.phi = [data.angle / 180 * Math.PI, 0];
        this.i = 0;
        this.t = 0;
        this.dt = dt;
    }

    /**
     * Ускорение свободного падения
     */
    get g()
    {
        return 9.80665;
    }

    update() // Обновляем координаты с помощью метода leapfrog
    {
        let i = this.i;
        let x = (this.g / this.len - (this.amp / this.len) * this.ang_vel**2 * Math.cos(this.ang_vel * this.t));
        let y = -2 * this.friction * this.v[i % 2];

        this.a[i % 2] = y + x * Math.sin(this.phi[i % 2]);
        this.phi[(i + 1) % 2] = this.phi[i % 2] + this.v[i % 2] * this.dt + (1 / 2) * this.a[i % 2] * this.dt**2;
        this.a[(i + 1) % 2] = y + x * Math.sin(this.phi[(i + 1) % 2]);
        this.v[(i + 1) % 2] = this.v[i % 2] + (1 / 2) * (this.a[i % 2] + this.a[(i + 1) % 2]) * this.dt;

        this.susY = this.y0 + this.amp * Math.cos(this.ang_vel * this.t);
        this.ballX = this.susX + this.len * Math.sin(this.phi[(i + 1) % 2]);
        this.ballY = this.susY + this.len * Math.cos(this.phi[i % 2]);

        this.t += this.dt;
        this.i = (i + 1) % 2;
    }

    /**
     * Рисует шар
     * @param context контекст
     * @param width ширина полотна
     * @param height высота полотна
     */
    drawBall(context, width, height)
    {
        const gradient = context.createRadialGradient(width - this.ballX, height - this.ballY, this.r, width - (this.ballX - 2), height - (this.ballY - 4), 2);

        gradient.addColorStop(0, '#333');
        gradient.addColorStop(1, '#999');

        context.fillStyle = gradient;
        context.arc(width - this.ballX, height - this.ballY, this.r, 0, Math.PI * 2, true);
        context.fill();
    }

    /**
     * Рисует стержень
     * @param context контекст
     * @param width ширина полотна
     * @param height высота полотна
     */
    drawKernel(context, width, height)
    {
        context.beginPath();
        context.strokeStyle = "#555";
        context.moveTo(width - this.ballX, height - this.ballY);
        context.lineTo(width - this.susX, height - this.susY);
        context.stroke();
        context.closePath();
    }

    /**
     * Рисует опору
     * @param context контекст
     * @param width ширина полотна
     * @param height высота полотна
     */
    drawSuspension(context, width, height)
    {
        context.beginPath();
        context.strokeStyle = "#555";
        context.moveTo(width - this.susX - 10, height - this.susY + 5);
        context.lineTo(width - this.susX + 10, height - this.susY + 5);
        context.lineTo(width - this.susX + 10, height - this.susY - 5);
        context.lineTo(width - this.susX - 10, height - this.susY - 5);
        context.fill();
        context.closePath();
    }

    /**
     * Рисует маятник целиком
     * @param context контекст
     * @param width ширина полотна
     * @param height высота полотна
     */
    drawPendulum(context, width, height)
    {
        this.drawKernel(context, width, height);
        this.drawSuspension(context, width, height);
        this.drawBall(context, width, height);
    }

    calculatePotentialEnergy()
    {
        return this.weight * this.g * this.ballY;
    }

    calculateKineticEnergy()
    {
        let term1 = this.weight * this.length**2 * this.calculatePhiDerivative()**2 / 2;
        let term2 = this.weight * this.amplitude * this.length * this.ang_vel * Math.sin(this.ang_vel * this.t) * Math.sin(this.phi[1]); // phi[0]
        let term3 = this.weight * this.amplitude**2 * this.ang_vel**2 * Math.sin(this.ang_vel * this.t) ** 2 / 2;
        return term1 + term2 + term3;
    }

    calculateTotalEnergy()
    {
        return this.calculateKineticEnergy() + this.calculatePotentialEnergy();
    }
    
    calculatePhiDerivative()
    {
        return Math.abs(this.phi[1] - this.phi[0]) / this.dt;
    }

    drawGraph(context, width, height)
    {
        context.strokeStyle = "#555";
        context.lineWidth = 2;

        context.beginPath();
        context.moveTo(0, 0);
        context.lineTo(0, height);
        context.stroke();
        context.closePath();

        context.beginPath();
        context.moveTo(0, height);
        context.lineTo(width, height);
        context.stroke();
        context.closePath();
        
        // this.drawSerifs(context, width, height);

        let y = height - this.calculateTotalEnergy() / 50;
        this.energy_values.push(y);
        if (this.energy_values.length > width)
            this.energy_values.shift();

        this.min_energy = Math.min(this.min_energy, ...this.energy_values);
        this.max_energy = Math.max(this.max_energy, ...this.energy_values);
        
        let k = height * 0.1;
        let coordinates = [];
        for (let i = 0; i < this.energy_values.length; i++)
            coordinates.push(normalize_number(this.energy_values[i], this.min_energy, this.max_energy, k, height - k));

        context.beginPath();
        context.moveTo(0, coordinates[0]);
        for (let i = 1; i < coordinates.length; i++)
            context.lineTo(i, coordinates[i]);
        context.stroke();
        context.closePath();
    }

    // drawSerifs(context, width, height)
    // {
    //     const count = 5;
    //     const distance = width * this.dt / count;
    //     const ost = this.t % distance;
    //     for (let i = 0; i < count; i++)
    //         context.arc(width * dt - ost - i * distance, height, 2, 0, 2 * Math.PI, false);
    // }
}

window.onload = () => {
    new Application();
}

function normalize_number(number, min_src, max_src, min_dst, max_dst)
{
    return min_dst + (number - min_src) / (max_src - min_src) * (max_dst - min_dst);
}
