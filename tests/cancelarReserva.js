// reserva.js
const fs = require('fs/promises');

const reservasPath = '../data/reservas.json'; // Cambia la ruta según tu estructura

async function cancelarReserva(id) {
    // Leer las reservas desde el archivo JSON
    const reservas = JSON.parse(await fs.readFile(reservasPath, 'utf-8'));
    const reserva = reservas.find(r => r.id === parseInt(id));

    if (reserva) {
        reserva.estado = 'Cancelada';
        await fs.writeFile(reservasPath, JSON.stringify(reservas, null, 2));
        return "La reserva ha sido cancelada con éxito";
    } else {
        throw new Error("Reserva no encontrada");
    }
}

module.exports = { cancelarReserva };