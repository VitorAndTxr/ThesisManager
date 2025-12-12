import { useState, useCallback } from 'react';

/**
 * Hook para sincronização de dados com arquivo externo
 * Funciona com qualquer pasta, incluindo pastas sincronizadas (Google Drive, OneDrive, Dropbox)
 */
export function useFileSync() {
    const [fileHandle, setFileHandle] = useState(null);
    const [fileName, setFileName] = useState(null);
    const [lastSync, setLastSync] = useState(null);
    const [isSyncing, setIsSyncing] = useState(false);
    const [error, setError] = useState(null);

    // Verifica se a API está disponível
    const isSupported = typeof window !== 'undefined' && 'showSaveFilePicker' in window;

    // Seleciona um arquivo existente para sincronizar
    const openFile = useCallback(async () => {
        if (!isSupported) {
            setError('Seu navegador não suporta esta funcionalidade. Use Chrome, Edge ou Opera.');
            return null;
        }

        try {
            setIsSyncing(true);
            setError(null);

            const [handle] = await window.showOpenFilePicker({
                types: [{
                    description: 'PRISM Data Files',
                    accept: { 'application/json': ['.json'] }
                }],
                multiple: false
            });

            const file = await handle.getFile();
            const content = await file.text();
            const data = JSON.parse(content);

            setFileHandle(handle);
            setFileName(file.name);
            setLastSync(new Date());
            setIsSyncing(false);

            return data;
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError('Erro ao abrir arquivo: ' + err.message);
            }
            setIsSyncing(false);
            return null;
        }
    }, [isSupported]);

    // Cria um novo arquivo para sincronização
    const createFile = useCallback(async (data) => {
        if (!isSupported) {
            setError('Seu navegador não suporta esta funcionalidade. Use Chrome, Edge ou Opera.');
            return false;
        }

        try {
            setIsSyncing(true);
            setError(null);

            const handle = await window.showSaveFilePicker({
                suggestedName: 'prism-monografia-sync.json',
                types: [{
                    description: 'PRISM Data Files',
                    accept: { 'application/json': ['.json'] }
                }]
            });

            const writable = await handle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();

            setFileHandle(handle);
            setFileName(handle.name);
            setLastSync(new Date());
            setIsSyncing(false);

            return true;
        } catch (err) {
            if (err.name !== 'AbortError') {
                setError('Erro ao criar arquivo: ' + err.message);
            }
            setIsSyncing(false);
            return false;
        }
    }, [isSupported]);

    // Salva dados no arquivo vinculado
    const saveToFile = useCallback(async (data) => {
        if (!fileHandle) {
            setError('Nenhum arquivo vinculado. Configure a sincronização primeiro.');
            return false;
        }

        try {
            setIsSyncing(true);
            setError(null);

            // Verifica permissão de escrita
            const permission = await fileHandle.queryPermission({ mode: 'readwrite' });
            if (permission !== 'granted') {
                const request = await fileHandle.requestPermission({ mode: 'readwrite' });
                if (request !== 'granted') {
                    setError('Permissão de escrita negada.');
                    setIsSyncing(false);
                    return false;
                }
            }

            const writable = await fileHandle.createWritable();
            await writable.write(JSON.stringify(data, null, 2));
            await writable.close();

            setLastSync(new Date());
            setIsSyncing(false);
            return true;
        } catch (err) {
            setError('Erro ao salvar: ' + err.message);
            setIsSyncing(false);
            return false;
        }
    }, [fileHandle]);

    // Carrega dados do arquivo vinculado
    const loadFromFile = useCallback(async () => {
        if (!fileHandle) {
            setError('Nenhum arquivo vinculado.');
            return null;
        }

        try {
            setIsSyncing(true);
            setError(null);

            const file = await fileHandle.getFile();
            const content = await file.text();
            const data = JSON.parse(content);

            setLastSync(new Date());
            setIsSyncing(false);
            return data;
        } catch (err) {
            setError('Erro ao carregar: ' + err.message);
            setIsSyncing(false);
            return null;
        }
    }, [fileHandle]);

    // Desvincula o arquivo
    const disconnect = useCallback(() => {
        setFileHandle(null);
        setFileName(null);
        setLastSync(null);
        setError(null);
    }, []);

    return {
        isSupported,
        isConnected: !!fileHandle,
        fileName,
        lastSync,
        isSyncing,
        error,
        openFile,
        createFile,
        saveToFile,
        loadFromFile,
        disconnect,
        clearError: () => setError(null)
    };
}
