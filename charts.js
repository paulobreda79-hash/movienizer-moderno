// public/charts.js
// Biblioteca de gráficos personalizada para MovieNizer Desktop
// Usa Canvas API para desenhar gráficos sem dependências externas

class MovieNizerCharts {

    // Gráfico de Pizza
    static drawPieChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas com ID "${canvasId}" não encontrado.`);
            return;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const total = data.reduce((sum, item) => sum + item.value, 0);
        if (total === 0) {
            ctx.fillStyle = '#666';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('Sem dados disponíveis', canvas.width / 2, canvas.height / 2);
            return;
        }

        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = Math.min(centerX, centerY) * 0.8; // 80% do menor lado

        let startAngle = 0;
        const colors = this.generateColors(data.length);

        // Desenhar fatias
        data.forEach((item, index) => {
            const sliceAngle = (item.value / total) * 2 * Math.PI;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY);
            ctx.arc(centerX, centerY, radius, startAngle, startAngle + sliceAngle);
            ctx.closePath();
            ctx.fillStyle = colors[index];
            ctx.fill();

            // Opcional: borda
            if (options.strokeColor) {
                ctx.strokeStyle = options.strokeColor;
                ctx.lineWidth = options.strokeWidth || 1;
                ctx.stroke();
            }

            startAngle += sliceAngle;
        });

        // Legenda (opcional)
        if (options.showLegend) {
            this.drawLegend(canvas, data, colors);
        }
    }

    // Gráfico de Barras
    static drawBarChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas com ID "${canvasId}" não encontrado.`);
            return;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        const maxValue = Math.max(...data.map(item => item.value), 1);
        const barWidth = (canvas.width * 0.8) / data.length;
        const chartHeight = canvas.height * 0.8;
        const chartTop = canvas.height * 0.1;
        const chartLeft = canvas.width * 0.1;

        const colors = this.generateColors(data.length);

        data.forEach((item, index) => {
            const x = chartLeft + index * barWidth;
            const height = (item.value / maxValue) * chartHeight;
            const y = canvas.height - height - chartTop;

            ctx.fillStyle = colors[index];
            ctx.fillRect(x, y, barWidth * 0.8, height);

            // Opcional: borda
            if (options.strokeColor) {
                ctx.strokeStyle = options.strokeColor;
                ctx.lineWidth = options.strokeWidth || 1;
                ctx.strokeRect(x, y, barWidth * 0.8, height);
            }

            // Rótulo
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(item.label, x + barWidth * 0.4, canvas.height - 5);
        });

        // Legenda (opcional)
        if (options.showLegend) {
            this.drawLegend(canvas, data, colors);
        }
    }

    // Gráfico de Linha (básico)
    static drawLineChart(canvasId, data, options = {}) {
        const canvas = document.getElementById(canvasId);
        if (!canvas) {
            console.error(`Canvas com ID "${canvasId}" não encontrado.`);
            return;
        }
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        if (data.length === 0) return;

        const maxValue = Math.max(...data.map(item => item.value), 1);
        const chartHeight = canvas.height * 0.8;
        const chartTop = canvas.height * 0.1;
        const chartLeft = canvas.width * 0.1;
        const chartWidth = canvas.width * 0.8;

        const pointSpacing = chartWidth / (data.length - 1);

        // Desenhar linha
        ctx.beginPath();
        ctx.moveTo(chartLeft, canvas.height - chartTop);
        data.forEach((item, index) => {
            const x = chartLeft + index * pointSpacing;
            const y = canvas.height - chartTop - (item.value / maxValue) * chartHeight;
            if (index === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        });
        ctx.strokeStyle = options.lineColor || '#007bff';
        ctx.lineWidth = options.lineWidth || 2;
        ctx.stroke();

        // Desenhar pontos
        data.forEach((item, index) => {
            const x = chartLeft + index * pointSpacing;
            const y = canvas.height - chartTop - (item.value / maxValue) * chartHeight;
            ctx.beginPath();
            ctx.arc(x, y, 4, 0, 2 * Math.PI);
            ctx.fillStyle = options.pointColor || '#007bff';
            ctx.fill();
        });

        // Rótulos
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        data.forEach((item, index) => {
            const x = chartLeft + index * pointSpacing;
            ctx.fillText(item.label, x, canvas.height - 5);
        });
    }

    // Gera uma paleta de cores
    static generateColors(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            // Tonalidades de cores baseadas no índice para variedade
            const hue = (i * 137.508) % 360; // Golden angle approximation
            colors.push(this.hslToHex(hue, 70, 60));
        }
        return colors;
    }

    // Converte HSL para Hex
    static hslToHex(h, s, l) {
        h /= 360;
        s /= 100;
        l /= 100;
        let r, g, b;
        if (s === 0) {
            r = g = b = l; // Ajuste para tons de cinza
        } else {
            const hue2rgb = (p, q, t) => {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };
            const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            const p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }
        const toHex = x => {
            const hex = Math.round(x * 255).toString(16);
            return hex.length === 1 ? '0' + hex : hex;
        };
        return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
    }

    // Desenha legenda abaixo do gráfico
    static drawLegend(canvas, data, colors) {
        const legendY = canvas.height - 20;
        let currentX = 10;
        const itemWidth = 100;
        const itemHeight = 20;

        data.forEach((item, index) => {
            // Quadrado de cor
            ctx.fillStyle = colors[index];
            ctx.fillRect(currentX, legendY, 15, 15);

            // Texto
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText(item.label, currentX + 20, legendY + 12);

            currentX += itemWidth;
        });
    }
}

// Exemplo de uso (opcional - pode ser removido se for só uma biblioteca)
/*
document.addEventListener('DOMContentLoaded', () => {
    // Exemplo de dados
    const pieData = [
        { label: 'Vistos', value: 45 },
        { label: 'A Ver', value: 25 },
        { label: 'Por Ver', value: 20 },
        { label: 'Abandonados', value: 10 }
    ];

    const barData = [
        { label: 'Ação', value: 30 },
        { label: 'Comédia', value: 25 },
        { label: 'Drama', value: 35 },
        { label: 'Ficção', value: 15 }
    ];

    // Desenhar gráficos
    MovieNizerCharts.drawPieChart('stats-pie-canvas', pieData, { showLegend: true });
    MovieNizerCharts.drawBarChart('stats-canvas', barData, { showLegend: true });
});
*/