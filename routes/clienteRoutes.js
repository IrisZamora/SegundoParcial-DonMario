import express from 'express';
import Reserva from '../models/reserva.js'; // Importa el modelo de reservas
import Mesa from '../models/mesa.js'; // Importa el modelo de mesas
import { ObjectId } from 'mongodb';

const router = express.Router();

// Ruta para que el cliente reserve una mesa
router.post('/reservar', async (req, res) => {
  const { cliente, email, fecha, hora, numeroPersonas } = req.body;

  try {
    // Obtener mesas disponibles desde la base de datos
    const mesasDisponibles = await Mesa.find({ disponible: true });

    // Verificar si hay mesas disponibles
    if (mesasDisponibles.length === 0) {
      return res.send('Error: No hay mesas disponibles para reservar.');
    }

    // Seleccionar una mesa aleatoriamente de las disponibles
    const mesaSeleccionada = mesasDisponibles[Math.floor(Math.random() * mesasDisponibles.length)];

    // Verificar si ya hay una reserva activa para la misma mesa y fecha
    const reservaExistente = await Reserva.findOne({
      mesa: mesaSeleccionada.id,
      fecha,
      estado: 'Activa',
    });

    if (reservaExistente) {
      return res.send(`Error: La mesa ${mesaSeleccionada.id} ya está reservada para el ${fecha}.`);
    }

    // Crear la nueva reserva en la base de datos
    const totalReservas = await Reserva.countDocuments({});
    const nuevaReserva = await Reserva.create({
      id: totalReservas + 1,
      cliente,
      email,
      fecha,
      hora,
      numeroPersonas,
      mesa: mesaSeleccionada.id,
      estado: 'Activa',
      reservadoPor: 'Cliente',
    });

    // Actualizar la disponibilidad de la mesa
    mesaSeleccionada.disponible = false;
    await mesaSeleccionada.save();

    // Enviar mensaje de éxito
    return res.send(`
      <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #f4f4f4; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #333;">Reserva realizada con éxito</h2>
      <p>Reserva número <strong>${nuevaReserva.id}</strong> para el día <strong>${fecha}</strong> a las <strong>${hora}</strong> horas.</p>
      <a href="/api/cliente" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; transition: background-color 0.3s;">Volver al panel de cliente</a>
      </div>
    `);
  } catch (error) {
    console.error('Error al procesar la reserva:', error);
    res.status(500).send('Error interno del servidor');
  }
});


  // Ruta para filtrar reservas por número (id)
// Ruta para filtrar reservas por número (id)
router.get('/filtrar-reservasId', async (req, res) => {
  const { idFiltro } = req.query;

  try {

    // Buscar una reserva por ID en la base de datos
    const reservaFiltrada = await Reserva.findOne({id: idFiltro});

    if (!reservaFiltrada) {
      return res.status(404).send('No se encontró ninguna reserva con ese ID.');
    }

    res.render('interfazCliente', {
      reserva: reservaFiltrada,
    });
  } catch (error) {
    console.error('Error al filtrar reservas por ID:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para cancelar una reserva
router.post('/cancelar', async (req, res) => {
  const { id } = req.body;

  try {
    // Cancelar la reserva en la base de datos
    const reservaCancelada = await Reserva.findOneAndUpdate({id}, { estado: 'Cancelada' }, { new: true });

    if (!reservaCancelada) {
      return res.status(404).send('No se encontró la reserva para cancelar.');
    }

    // Hacer que la mesa esté disponible nuevamente
    await Mesa.findOneAndUpdate({ id: reservaCancelada.mesa }, { disponible: true });

    res.send('La reserva ha sido cancelada con éxito.');
  } catch (error) {
    console.error('Error al cancelar la reserva:', error);
    res.status(500).send('Error interno del servidor');
  }
});

export default router;
