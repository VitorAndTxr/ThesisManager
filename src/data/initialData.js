/**
 * Dados iniciais para primeira execução do aplicativo
 * Estes dados são usados apenas quando não há dados salvos no localStorage
 */

export const initialChapters = [
    {
        id: 'intro',
        title: 'Introdução',
        file: 'cap-introducao.tex',
        status: 'em-progresso',
        progress: 85,
        sections: [
            { name: 'Contexto e Motivação', done: true, subsections: [] },
            { name: 'Objetivos', done: true, subsections: [{ name: 'Objetivos Específicos', done: true }] },
            { name: 'Metodologia de Pesquisa', done: true, subsections: [] },
            {
                name: 'Estado da Arte', done: false, notes: 'Revisar iniciativas internacionais', subsections: [
                    { name: 'RDNS (Brasil)', done: true },
                    { name: 'USCDI (EUA)', done: true },
                    { name: 'EHDS (Europa)', done: true },
                    { name: 'NHS (Reino Unido)', done: true },
                    { name: 'Canada Health Infoway', done: false },
                    { name: 'My Health Record (Austrália)', done: false }
                ]
            }
        ],
        revision: [
            { name: 'Contexto e Motivação', done: false, subsections: [] },
            { name: 'Objetivos', done: false, subsections: [{ name: 'Objetivos Específicos', done: false }] },
            { name: 'Metodologia de Pesquisa', done: false, subsections: [] },
            {
                name: 'Estado da Arte', done: false, subsections: [
                    { name: 'RDNS (Brasil)', done: false },
                    { name: 'USCDI (EUA)', done: false },
                    { name: 'EHDS (Europa)', done: false },
                    { name: 'NHS (Reino Unido)', done: false },
                    { name: 'Canada Health Infoway', done: false },
                    { name: 'My Health Record (Austrália)', done: false }
                ]
            }
        ],
        notes: 'Revisar seção de Estado da Arte - completar análise comparativa'
    },
    {
        id: 'conceitos',
        title: 'Referencial Teórico',
        file: 'cap-conceitos.tex',
        status: 'em-progresso',
        progress: 45,
        sections: [
            { name: 'Sistemas', done: false, notes: 'Texto incompleto', subsections: [] },
            { name: 'Hardware', done: false, subsections: [] },
            { name: 'Software', done: false, subsections: [] },
            {
                name: 'Sistemas Distribuídos', done: true, subsections: [
                    { name: 'Middleware', done: true },
                    { name: 'Interoperabilidade', done: false },
                    { name: 'Criptografia Assimétrica', done: false }
                ]
            },
            { name: 'Engenharia Biomédica', done: false, subsections: [] },
            {
                name: 'Biossinais', done: true, subsections: [
                    { name: 'Eletromiografia', done: true },
                    { name: 'Eletromiografia de Superfície (sEMG)', done: false }
                ]
            },
            {
                name: 'Normas, Padronizações e Leis', done: false, subsections: [
                    { name: 'NBRISO 18308:2013', done: false },
                    { name: 'NBRISO/HL7 10781:2017', done: false }
                ]
            }
        ],
        revision: null,
        notes: 'Muitas seções vazias - priorizar Hardware, Software, Interoperabilidade'
    },
    {
        id: 'metodologia',
        title: 'Metodologia',
        file: 'cap-metodologia.tex',
        status: 'em-progresso',
        progress: 60,
        sections: [
            { name: 'Visão Geral', done: true, subsections: [] },
            {
                name: 'Modelo Proposto (PRISM)', done: true, subsections: [
                    { name: 'Dispositivo', done: true },
                    { name: 'Aplicação', done: true },
                    { name: 'Projeto', done: true },
                    { name: 'NPI - Nó de Pesquisa Interoperável', done: true }
                ]
            },
            { name: 'Coleta de Dados', done: false, notes: 'Explicar processo', subsections: [] },
            { name: 'Ferramentas Utilizadas', done: false, subsections: [] }
        ],
        revision: null,
        notes: 'Detalhar coleta de dados e ferramentas utilizadas'
    },
    {
        id: 'desenvolvimento',
        title: 'Desenvolvimento',
        file: 'cap-experimentos-resultados.tex',
        status: 'nao-iniciado',
        progress: 15,
        sections: [
            { name: 'Escopo do Sistema', done: false, notes: 'Tem template de exemplo', subsections: [] },
            { name: 'Nó de Pesquisa Integrada (NPI)', done: false, subsections: [] },
            { name: 'Integração do Projeto Exemplo', done: false, subsections: [] },
            { name: 'Modelagem do Sistema', done: false, subsections: [] },
            { name: 'Apresentação do Sistema', done: false, subsections: [] },
            { name: 'Implementação do Sistema', done: false, subsections: [] },
            { name: 'Discussões', done: false, subsections: [] }
        ],
        revision: null,
        notes: 'Capítulo crítico - desenvolver NPI e integração com sEMG'
    },
    {
        id: 'conclusao',
        title: 'Conclusões',
        file: 'cap-conclusoes.tex',
        status: 'nao-iniciado',
        progress: 0,
        sections: [
            { name: 'Síntese dos Resultados', done: false, subsections: [] },
            { name: 'Contribuições', done: false, subsections: [] },
            { name: 'Limitações', done: false, subsections: [] },
            { name: 'Trabalhos Futuros', done: false, subsections: [] }
        ],
        revision: null,
        notes: 'Aguardando finalização dos resultados'
    }
];

export const initialTasks = [
    { id: 1, text: 'Completar seções vazias do Referencial Teórico', priority: 'alta', deadline: '2025-10-15', done: false },
    { id: 2, text: 'Desenvolver o NPI (back-end)', priority: 'alta', deadline: '2025-10-20', done: false },
    { id: 3, text: 'Integrar projeto sEMG existente', priority: 'alta', deadline: '2025-10-25', done: false },
    { id: 4, text: 'Realizar coleta de dados com voluntários', priority: 'media', deadline: '2025-11-01', done: false },
    { id: 5, text: 'Documentar implementação do sistema', priority: 'alta', deadline: '2025-11-10', done: false },
    { id: 6, text: 'Revisar Estado da Arte', priority: 'media', deadline: '2025-10-10', done: false },
    { id: 7, text: 'Escrever seção de Ferramentas Utilizadas', priority: 'media', deadline: '2025-10-12', done: false }
];

export const initialProjects = [
    {
        id: 'semg-project',
        title: 'Projeto sEMG',
        status: 'em-progresso',
        progress: 40,
        sections: [
            { name: 'Configuração ESP32', done: true, subsections: [] },
            { name: 'Comunicação Bluetooth', done: true, subsections: [] },
            {
                name: 'Coleta de Dados', done: false, subsections: [
                    { name: 'Protocolo de Aquisição', done: false },
                    { name: 'Calibração', done: false }
                ]
            },
            { name: 'Visualização', done: false, subsections: [] }
        ],
        notes: 'Integrar com o NPI da monografia'
    }
];
