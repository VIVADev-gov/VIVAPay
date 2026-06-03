import React from 'react';
import { AlertTriangle } from 'lucide-react';

interface Entidad {
    tipo?: string;
    nombre?: string;
    dependencias?: number;
    nombreDependencia?: string;
}

interface DeleteConfirmModalProps {
    isOpen: boolean;
    onClose: (value: boolean) => void;
    onConfirm: () => void;
    loading?: boolean;
    entidad?: Entidad;
}

const DeleteConfirmModal: React.FC<DeleteConfirmModalProps> = ({ 
    isOpen, 
    onClose, 
    onConfirm, 
    loading = false, 
    entidad 
}) => {
    if (!isOpen) return null;

    const {
        tipo = 'elemento', // "categoría", "producto", etc.
        nombre = '',
        dependencias = 0,
        nombreDependencia = '',
    } = entidad || {};

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-background rounded-2xl shadow-2xl max-w-md w-full p-6 transform transition-all">
                <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-destructive/10 rounded-full">
                    <AlertTriangle className="w-8 h-8 text-destructive" />
                </div>

                <h3 className="text-xl font-bold text-foreground text-center mb-2">
                    ¿Eliminar {tipo}?
                </h3>


                <p className="text-muted-foreground text-center mb-6">
                    Esta acción eliminará {tipo === 'producto' ? 'el' : 'la'} <strong>{tipo} &quot;{nombre}&quot;</strong>
                    {dependencias > 0 && nombreDependencia ? (
                        <> y afectará a <strong>{dependencias} {nombreDependencia}</strong>.</>
                    ) : null}
                    <br />
                    Esta acción no se puede deshacer.
                </p>

                <div className="flex gap-3">
                    <button
                        onClick={() => onClose(false)}
                        className="flex-1 px-4 py-3 border border-border text-foreground rounded-xl hover:bg-card transition-colors"
                    >
                        Cancelar
                    </button>
                    <button
                        onClick={onConfirm}
                        disabled={loading}
                        className={`flex-1 px-4 py-3 ${loading ? 'bg-destructive/70' : 'bg-destructive hover:bg-destructive/90'} text-destructive-foreground rounded-xl transition-colors`}
                    >
                        {loading ? 'Cargando...' : 'Eliminar'}
                    </button>
                </div>
            </div>
        </div>
    );
};

export default DeleteConfirmModal;
