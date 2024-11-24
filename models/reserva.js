
import mongoose from 'mongoose';

const reservaSchema = mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  cliente: { type: String, required: true },
  email: { type: String, required: true },
  fecha: { type: String, required: true },
  hora: { type: String, required: true },
  numeroPersonas:{ type: Number, required: true },
  mesa: { type: Number, required: true },
  estado: { type: String, default: 'Activa' },
  reservadoPor: { type: String, default: 'Cliente' },
}, { timestamps: true });

const Reserva = mongoose.model('Reserva', reservaSchema);

export default Reserva;

  