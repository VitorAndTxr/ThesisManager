import { useState, useEffect } from 'react';

/**
 * Hook para persistir estado no localStorage
 * @param {string} key - Chave do localStorage
 * @param {any} initialValue - Valor inicial caso não exista no storage
 */
export function useLocalStorage(key, initialValue) {
    // Inicializa o estado com valor do localStorage ou valor inicial
    const [storedValue, setStoredValue] = useState(() => {
        try {
            const item = window.localStorage.getItem(key);
            return item ? JSON.parse(item) : initialValue;
        } catch (error) {
            console.error(`Erro ao ler localStorage key "${key}":`, error);
            return initialValue;
        }
    });

    // Persiste mudanças no localStorage
    useEffect(() => {
        try {
            window.localStorage.setItem(key, JSON.stringify(storedValue));
        } catch (error) {
            console.error(`Erro ao salvar localStorage key "${key}":`, error);
        }
    }, [key, storedValue]);

    return [storedValue, setStoredValue];
}

/**
 * Limpa todos os dados do aplicativo
 */
export function clearAllData() {
    const keys = ['prism-chapters', 'prism-tasks', 'prism-projects'];
    keys.forEach(key => window.localStorage.removeItem(key));
}

/**
 * Exporta todos os dados para JSON
 */
export function exportData() {
    const data = {
        chapters: JSON.parse(window.localStorage.getItem('prism-chapters') || '[]'),
        tasks: JSON.parse(window.localStorage.getItem('prism-tasks') || '[]'),
        projects: JSON.parse(window.localStorage.getItem('prism-projects') || '[]'),
        exportedAt: new Date().toISOString()
    };
    return data;
}

/**
 * Importa dados de JSON
 */
export function importData(data) {
    if (data.chapters) window.localStorage.setItem('prism-chapters', JSON.stringify(data.chapters));
    if (data.tasks) window.localStorage.setItem('prism-tasks', JSON.stringify(data.tasks));
    if (data.projects) window.localStorage.setItem('prism-projects', JSON.stringify(data.projects));
}
