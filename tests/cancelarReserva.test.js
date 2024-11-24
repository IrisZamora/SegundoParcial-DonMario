const fs = require('fs/promises');
const { cancelarReserva } = require('./cancelarReserva');
const reservasPath = '../data/reservas.json';

jest.mock('fs/promises'); // Mockear el módulo fs/promises

describe('Sistema de Reservas de Don Mario - Cancelar Reserva', () => {
    beforeEach(() => {
        jest.clearAllMocks(); // Limpiar los mocks antes de cada prueba
    });

    test('debería cancelar una reserva existente', async () => {
        // Mockear la lectura de archivos
        fs.readFile.mockResolvedValueOnce(JSON.stringify([{ id: 1, estado: 'Activa' }])); // Una reserva activa

        const mensaje = await cancelarReserva(1);

        expect(mensaje).toBe("La reserva ha sido cancelada con éxito");
        expect(fs.writeFile).toHaveBeenCalled(); // Verificar que se haya llamado a writeFile
    });

    test('debería lanzar un error si la reserva no existe', async () => {
        fs.readFile.mockResolvedValueOnce(JSON.stringify([])); // Sin reservas

        await expect(cancelarReserva(999)).rejects.toThrow('Reserva no encontrada');
    });

    test('debería cambiar el estado de la reserva a "Cancelada"', async () => {
        const reservasMock = [{ id: 1, estado: 'Activa' }];
        fs.readFile.mockResolvedValueOnce(JSON.stringify(reservasMock)); // Una reserva activa
    
        await cancelarReserva(1);
    
        // Verificar que se haya llamado a writeFile con el estado actualizado
        expect(fs.writeFile).toHaveBeenCalledWith(reservasPath, JSON.stringify([{ id: 1, estado: 'Cancelada' }], null, 2));
    });

    test('debería lanzar un error si el archivo de reservas está vacío', async () => {
        fs.readFile.mockResolvedValueOnce(JSON.stringify([])); // Sin reservas

        await expect(cancelarReserva(1)).rejects.toThrow('Reserva no encontrada');
    });

    test('debería lanzar un error si hay un problema al leer el archivo de reservas', async () => {
        fs.readFile.mockRejectedValueOnce(new Error('Error al leer el archivo'));

        await expect(cancelarReserva(1)).rejects.toThrow('Error al leer el archivo');
    });

    test('debería lanzar un error si hay un problema al escribir en el archivo de reservas', async () => {
        fs.readFile.mockResolvedValueOnce(JSON.stringify([{ id: 1, estado: 'Activa' }]));
        fs.writeFile.mockRejectedValueOnce(new Error('Error al escribir en el archivo'));

        await expect(cancelarReserva(1)).rejects.toThrow('Error al escribir en el archivo');
    });

});