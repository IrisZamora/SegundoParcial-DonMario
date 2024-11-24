import express from 'express';
import Reserva from '../models/reserva.js'; // Modelo de reservas
import Mesa from '../models/mesa.js'; // Modelo de mesas

const router = express.Router();

// Ruta para filtrar reservas por fecha
router.get('/filtrar-reservas', async (req, res) => {
  const { fechaFiltro } = req.query;

  try {
    // Filtrar reservas por la fecha seleccionada
    const reservasFiltradas = await Reserva.find({ fecha: fechaFiltro });

    // Obtener todas las mesas
    const mesas = await Mesa.find();

    res.render('adminPanel', {
      reservas: reservasFiltradas,
      mesas,
    });
  } catch (error) {
    console.error('Error al filtrar reservas:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para que el administrador reserve una mesa
router.post('/reservar', async (req, res) => {
  const { cliente, email, fecha, hora, numeroPersonas } = req.body;

  try {
    // Buscar mesas disponibles
    const mesasDisponibles = await Mesa.find({ disponible: true });

    if (mesasDisponibles.length === 0) {
      return res.send('Error: No hay mesas disponibles para reservar.');
    }

    // Seleccionar una mesa aleatoriamente
    const mesaSeleccionada = mesasDisponibles[Math.floor(Math.random() * mesasDisponibles.length)];

    // Verificar si ya existe una reserva activa para la misma mesa y fecha
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
      reservadoPor: 'Administrador',
    });

    // Marcar la mesa como no disponible
    mesaSeleccionada.disponible = false;
    await mesaSeleccionada.save();
    
    return res.send(`
      <div style="font-family: Arial, sans-serif; margin: 20px; padding: 20px; background-color: #f4f4f4; border-radius: 8px; box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);">
      <h2 style="color: #333;">Reserva realizada con éxito</h2>
      <p>Reserva número <strong>${nuevaReserva.id}</strong> para el día <strong>${fecha}</strong> a las <strong>${hora}</strong> horas.</p>
      <a href="/api/admin" style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; transition: background-color 0.3s;">Volver al panel del administrador</a>
      </div>
    `);

  } catch (error) {
    console.error('Error al procesar la reserva:', error);
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

// Ruta para mostrar todas las mesas
router.get('/mesas', async (req, res) => {
  try {
    const mesas = await Mesa.find(); // Obtener todas las mesas
    res.render('mesaManagement', { mesas });
  } catch (error) {
    console.error('Error al obtener las mesas:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para añadir una nueva mesa
router.post('/mesas/add', async (req, res) => {
  const { capacidad } = req.body;

  try {
    const totalMesas = await Mesa.countDocuments({});
    const nuevaMesa = await Mesa.create({
      id: totalMesas + 1,
      capacidad: parseInt(capacidad, 10),
      disponible: true,
    });

    console.log('Mesa creada:', nuevaMesa);
    res.redirect('/api/admin');
  } catch (error) {
    if (error.code === 11000) {
      console.error('Error: ID de mesa duplicado.');
      return res.status(400).send('Error: El ID de la mesa ya existe.');
    }

    console.error('Error al agregar la mesa:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para eliminar una mesa
router.post('/mesas/delete', async (req, res) => {
  const { id } = req.body;

  try {
    const mesaEliminada = await Mesa.findOneAndDelete({ id });

    if (!mesaEliminada) {
      return res.status(404).send('No se encontró la mesa para eliminar.');
    }

    res.redirect('/api/admin');
  } catch (error) {
    console.error('Error al eliminar la mesa:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para actualizar la disponibilidad de una mesa
router.post('/mesas/update', async (req, res) => {
  const { id, disponible } = req.body;

  try {
    const mesaActualizada = await Mesa.findOneAndUpdate(
      { id },
      { disponible },
      { new: true }
    );

    if (!mesaActualizada) {
      return res.status(404).send('No se encontró la mesa para actualizar.');
    }

    res.redirect('/api/admin');
  } catch (error) {
    console.error('Error al actualizar la disponibilidad de la mesa:', error);
    res.status(500).send('Error interno del servidor');
  }
});

// Ruta para mostrar el informe de ocupación basado en la fecha actual
router.get('/informe-ocupacion', async (req, res) => {
  const fechaHoy = new Date().toISOString().split('T')[0]; // Formatear fecha actual

  try {
    const reservasHoy = await Reserva.find({ fecha: fechaHoy, estado: 'Activa' });
    const mesas = await Mesa.find();

    const totalMesas = mesas.length;
    const mesasOcupadas = reservasHoy.length;
    const mesasLibres = totalMesas - mesasOcupadas;
    const porcentajeOcupacion = totalMesas ? (mesasOcupadas / totalMesas) * 100 : 0;

    res.render('informeOcupacion', {
      totalMesas,
      mesasOcupadas,
      mesasLibres,
      porcentajeOcupacion: porcentajeOcupacion.toFixed(2),
      fechaHoy,
    });
  } catch (error) {
    console.error('Error al generar el informe de ocupación:', error);
    res.status(500).send('Error interno del servidor');
  }
});

export default router;
