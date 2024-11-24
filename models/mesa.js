import mongoose from 'mongoose';

const mesaSchema = mongoose.Schema({
  id: { type: Number, required: true, unique: true },
  capacidad: { type: Number, required: true },
  disponible: { type: Boolean, default: true },
});

const Mesa = mongoose.model('Mesa', mesaSchema);

export default Mesa;
