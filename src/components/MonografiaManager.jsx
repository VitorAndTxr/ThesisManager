import React, { useState } from 'react';
import { CheckCircle2, Circle, Clock, AlertCircle, FileText, Calendar, Target, BookOpen, Edit2, Save, X, Plus, GripVertical, Eye, Pencil, Download, Upload, Trash2 } from 'lucide-react';
import { useLocalStorage, exportData, importData, clearAllData } from '../hooks/useLocalStorage';
import { initialChapters, initialTasks, initialProjects } from '../data/initialData';

export default function MonografiaManager() {
    const createRevisionStructure = (sections) => {
        return sections.map(s => ({
            name: s.name,
            done: false,
            notes: '',
            subsections: s.subsections ? s.subsections.map(sub => ({
                name: sub.name,
                done: false,
                notes: ''
            })) : []
        }));
    };

    // Estados persistidos no localStorage
    const [chapters, setChapters] = useLocalStorage('prism-chapters', initialChapters);
    const [tasks, setTasks] = useLocalStorage('prism-tasks', initialTasks);
    const [projects, setProjects] = useLocalStorage('prism-projects', initialProjects);

    // Estados de UI (não persistidos)
    const [editingChapter, setEditingChapter] = useState(null);
    const [editForm, setEditForm] = useState({});
    const [viewMode, setViewMode] = useState({});
    const [newTask, setNewTask] = useState('');
    const [newTaskPriority, setNewTaskPriority] = useState('media');
    const [newTaskDeadline, setNewTaskDeadline] = useState('');
    const [dragItem, setDragItem] = useState(null);
    const [dragOverItem, setDragOverItem] = useState(null);
    const [showNewChapter, setShowNewChapter] = useState(false);
    const [newChapter, setNewChapter] = useState({ title: '', file: '', notes: '' });
    const [showNewProject, setShowNewProject] = useState(false);
    const [newProject, setNewProject] = useState({ title: '', notes: '' });
    const [editingProject, setEditingProject] = useState(null);
    const [editProjectForm, setEditProjectForm] = useState({});
    const [showSettings, setShowSettings] = useState(false);

    // Funções de export/import
    const handleExport = () => {
        const data = exportData();
        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `prism-backup-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const handleImport = (event) => {
        const file = event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = JSON.parse(e.target.result);
                    importData(data);
                    // Recarregar a página para aplicar os dados importados
                    window.location.reload();
                } catch (error) {
                    alert('Erro ao importar arquivo. Verifique se é um JSON válido.');
                }
            };
            reader.readAsText(file);
        }
    };

    const handleClearData = () => {
        if (confirm('⚠️ ATENÇÃO: Isso irá apagar TODOS os dados salvos e restaurar os dados iniciais. Deseja continuar?')) {
            clearAllData();
            window.location.reload();
        }
    };

    const getStatusIcon = (status) => {
        switch (status) {
            case 'concluido': return <CheckCircle2 className="text-green-600" size={20} />;
            case 'em-progresso': return <Clock className="text-yellow-600" size={20} />;
            default: return <Circle className="text-gray-400" size={20} />;
        }
    };

    const getStatusColor = (status) => {
        switch (status) {
            case 'concluido': return 'bg-green-100 border-green-300';
            case 'em-progresso': return 'bg-yellow-100 border-yellow-300';
            default: return 'bg-gray-100 border-gray-300';
        }
    };

    const getPriorityColor = (priority) => {
        switch (priority) {
            case 'alta': return 'bg-red-100 text-red-800 border-red-300';
            case 'media': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'baixa': return 'bg-green-100 text-green-800 border-green-300';
            default: return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    const handleDragStart = (e, type, indices) => {
        e.stopPropagation();
        setDragItem({ type, indices });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    };

    const handleDragOver = (e, type, indices) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragItem && dragItem.type === type) {
            if (type === 'subsection' && dragItem.indices.sectionIdx !== indices.sectionIdx) return;
            setDragOverItem({ type, indices });
        }
    };

    const handleDrop = (e, type, indices) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragItem || dragItem.type !== type) return;

        const newSections = JSON.parse(JSON.stringify(editForm.sections));

        if (type === 'section') {
            const [removed] = newSections.splice(dragItem.indices.sectionIdx, 1);
            newSections.splice(indices.sectionIdx, 0, removed);
        } else if (type === 'subsection' && dragItem.indices.sectionIdx === indices.sectionIdx) {
            const subs = newSections[indices.sectionIdx].subsections;
            const [removed] = subs.splice(dragItem.indices.subIdx, 1);
            subs.splice(indices.subIdx, 0, removed);
        }

        setEditForm({ ...editForm, sections: newSections });
        setDragItem(null);
        setDragOverItem(null);
    };

    const handleDragEnd = () => {
        setDragItem(null);
        setDragOverItem(null);
    };

    const startEditChapter = (chapter, mode = 'sections') => {
        setEditingChapter(chapter.id);
        const dataToEdit = mode === 'revision'
            ? (chapter.revision || createRevisionStructure(chapter.sections))
            : chapter.sections;
        setEditForm({
            progress: chapter.progress,
            status: chapter.status,
            notes: chapter.notes,
            sections: JSON.parse(JSON.stringify(dataToEdit)),
            editMode: mode
        });
    };

    const cancelEdit = () => {
        setEditingChapter(null);
        setEditForm({});
    };

    const saveChapterEdit = () => {
        setChapters(chapters.map(ch => {
            if (ch.id === editingChapter) {
                const completedCount = countCompletedSections(editForm.sections);
                const totalCount = countTotalSections(editForm.sections);
                const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;

                let newStatus = 'nao-iniciado';
                if (calculatedProgress === 100) newStatus = 'concluido';
                else if (calculatedProgress > 0) newStatus = 'em-progresso';

                if (editForm.editMode === 'revision') {
                    return { ...ch, revision: editForm.sections, notes: editForm.notes };
                }
                return {
                    ...ch,
                    progress: calculatedProgress,
                    status: newStatus,
                    notes: editForm.notes,
                    sections: editForm.sections
                };
            }
            return ch;
        }));
        setEditingChapter(null);
        setEditForm({});
    };

    const toggleSectionInEdit = (index) => {
        const newSections = [...editForm.sections];
        newSections[index].done = !newSections[index].done;
        if (newSections[index].subsections) {
            newSections[index].subsections = newSections[index].subsections.map(s => ({ ...s, done: newSections[index].done }));
        }
        setEditForm({ ...editForm, sections: newSections });
    };

    const toggleSubsectionInEdit = (sectionIdx, subIdx) => {
        const newSections = [...editForm.sections];
        newSections[sectionIdx].subsections[subIdx].done = !newSections[sectionIdx].subsections[subIdx].done;
        const allDone = newSections[sectionIdx].subsections.every(s => s.done);
        newSections[sectionIdx].done = allDone;
        setEditForm({ ...editForm, sections: newSections });
    };

    const addSectionToEdit = () => {
        setEditForm({
            ...editForm,
            sections: [...editForm.sections, { name: 'Nova Seção', done: false, notes: '', subsections: [] }]
        });
    };

    const addSubsectionToEdit = (sectionIdx) => {
        const newSections = [...editForm.sections];
        if (!newSections[sectionIdx].subsections) newSections[sectionIdx].subsections = [];
        newSections[sectionIdx].subsections.push({ name: 'Nova Subseção', done: false, notes: '' });
        setEditForm({ ...editForm, sections: newSections });
    };

    const removeSectionFromEdit = (index) => {
        setEditForm({ ...editForm, sections: editForm.sections.filter((_, i) => i !== index) });
    };

    const removeSubsectionFromEdit = (sectionIdx, subIdx) => {
        const newSections = [...editForm.sections];
        newSections[sectionIdx].subsections = newSections[sectionIdx].subsections.filter((_, i) => i !== subIdx);
        setEditForm({ ...editForm, sections: newSections });
    };

    const updateSectionName = (index, name) => {
        const newSections = [...editForm.sections];
        newSections[index].name = name;
        setEditForm({ ...editForm, sections: newSections });
    };

    const updateSubsectionName = (sectionIdx, subIdx, name) => {
        const newSections = [...editForm.sections];
        newSections[sectionIdx].subsections[subIdx].name = name;
        setEditForm({ ...editForm, sections: newSections });
    };

    const updateSubsectionNotes = (sectionIdx, subIdx, notes) => {
        const newSections = [...editForm.sections];
        newSections[sectionIdx].subsections[subIdx].notes = notes;
        setEditForm({ ...editForm, sections: newSections });
    };

    const updateSectionNotes = (index, notes) => {
        const newSections = [...editForm.sections];
        newSections[index].notes = notes;
        setEditForm({ ...editForm, sections: newSections });
    };

    const countCompletedSections = (sections) => {
        return sections.reduce((count, section) => {
            if (section.subsections && section.subsections.length > 0) {
                return count + section.subsections.filter(sub => sub.done).length;
            }
            return count + (section.done ? 1 : 0);
        }, 0);
    };

    const countTotalSections = (sections) => {
        return sections.reduce((count, section) => {
            if (section.subsections && section.subsections.length > 0) {
                return count + section.subsections.length;
            }
            return count + 1;
        }, 0);
    };

    const toggleTask = (taskId) => setTasks(tasks.map(t => t.id === taskId ? { ...t, done: !t.done } : t));
    const deleteTask = (taskId) => setTasks(tasks.filter(t => t.id !== taskId));
    const addTask = () => {
        if (newTask.trim()) {
            setTasks([...tasks, { id: Date.now(), text: newTask, priority: newTaskPriority, deadline: newTaskDeadline, done: false }]);
            setNewTask('');
            setNewTaskDeadline('');
        }
    };

    const addChapter = () => {
        if (newChapter.title.trim()) {
            const id = newChapter.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') + '-' + Date.now();
            const fileName = newChapter.file.trim() || `cap-${id}.tex`;
            setChapters([...chapters, {
                id,
                title: newChapter.title,
                file: fileName,
                status: 'nao-iniciado',
                progress: 0,
                sections: [{ name: 'Nova Seção', done: false, notes: '', subsections: [] }],
                revision: null,
                notes: newChapter.notes
            }]);
            setNewChapter({ title: '', file: '', notes: '' });
            setShowNewChapter(false);
        }
    };

    const deleteChapter = (chapterId) => {
        if (confirm('Tem certeza que deseja excluir este capítulo?')) {
            setChapters(chapters.filter(ch => ch.id !== chapterId));
        }
    };

    const startEditProject = (project) => {
        setEditingProject(project.id);
        setEditProjectForm({
            progress: project.progress,
            status: project.status,
            notes: project.notes,
            sections: JSON.parse(JSON.stringify(project.sections))
        });
    };

    const cancelProjectEdit = () => {
        setEditingProject(null);
        setEditProjectForm({});
    };

    const saveProjectEdit = () => {
        setProjects(projects.map(p => {
            if (p.id === editingProject) {
                const completedCount = countCompletedSections(editProjectForm.sections);
                const totalCount = countTotalSections(editProjectForm.sections);
                const calculatedProgress = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
                let newStatus = 'nao-iniciado';
                if (calculatedProgress === 100) newStatus = 'concluido';
                else if (calculatedProgress > 0) newStatus = 'em-progresso';
                return { ...p, progress: calculatedProgress, status: newStatus, notes: editProjectForm.notes, sections: editProjectForm.sections };
            }
            return p;
        }));
        setEditingProject(null);
        setEditProjectForm({});
    };

    const addProject = () => {
        if (newProject.title.trim()) {
            const id = 'proj-' + Date.now();
            setProjects([...projects, {
                id,
                title: newProject.title,
                status: 'nao-iniciado',
                progress: 0,
                sections: [{ name: 'Nova Seção', done: false, notes: '', subsections: [] }],
                notes: newProject.notes
            }]);
            setNewProject({ title: '', notes: '' });
            setShowNewProject(false);
        }
    };

    const deleteProject = (projectId) => {
        if (confirm('Tem certeza que deseja excluir este projeto?')) {
            setProjects(projects.filter(p => p.id !== projectId));
        }
    };

    const handleProjectDragStart = (e, type, indices) => {
        e.stopPropagation();
        setDragItem({ type: 'project-' + type, indices });
        e.dataTransfer.effectAllowed = 'move';
        e.dataTransfer.setData('text/plain', '');
    };

    const handleProjectDragOver = (e, type, indices) => {
        e.preventDefault();
        e.stopPropagation();
        if (dragItem && dragItem.type === 'project-' + type) {
            if (type === 'subsection' && dragItem.indices.sectionIdx !== indices.sectionIdx) return;
            setDragOverItem({ type: 'project-' + type, indices });
        }
    };

    const handleProjectDrop = (e, type, indices) => {
        e.preventDefault();
        e.stopPropagation();
        if (!dragItem || dragItem.type !== 'project-' + type) return;
        const newSections = JSON.parse(JSON.stringify(editProjectForm.sections));
        if (type === 'section') {
            const [removed] = newSections.splice(dragItem.indices.sectionIdx, 1);
            newSections.splice(indices.sectionIdx, 0, removed);
        } else if (type === 'subsection' && dragItem.indices.sectionIdx === indices.sectionIdx) {
            const subs = newSections[indices.sectionIdx].subsections;
            const [removed] = subs.splice(dragItem.indices.subIdx, 1);
            subs.splice(indices.subIdx, 0, removed);
        }
        setEditProjectForm({ ...editProjectForm, sections: newSections });
        setDragItem(null);
        setDragOverItem(null);
    };

    const toggleProjectSection = (index) => {
        const newSections = [...editProjectForm.sections];
        newSections[index].done = !newSections[index].done;
        if (newSections[index].subsections) {
            newSections[index].subsections = newSections[index].subsections.map(s => ({ ...s, done: newSections[index].done }));
        }
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const toggleProjectSubsection = (sectionIdx, subIdx) => {
        const newSections = [...editProjectForm.sections];
        newSections[sectionIdx].subsections[subIdx].done = !newSections[sectionIdx].subsections[subIdx].done;
        const allDone = newSections[sectionIdx].subsections.every(s => s.done);
        newSections[sectionIdx].done = allDone;
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const addProjectSection = () => {
        setEditProjectForm({
            ...editProjectForm,
            sections: [...editProjectForm.sections, { name: 'Nova Seção', done: false, notes: '', subsections: [] }]
        });
    };

    const addProjectSubsection = (sectionIdx) => {
        const newSections = [...editProjectForm.sections];
        if (!newSections[sectionIdx].subsections) newSections[sectionIdx].subsections = [];
        newSections[sectionIdx].subsections.push({ name: 'Nova Subseção', done: false, notes: '' });
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const removeProjectSection = (index) => {
        setEditProjectForm({ ...editProjectForm, sections: editProjectForm.sections.filter((_, i) => i !== index) });
    };

    const removeProjectSubsection = (sectionIdx, subIdx) => {
        const newSections = [...editProjectForm.sections];
        newSections[sectionIdx].subsections = newSections[sectionIdx].subsections.filter((_, i) => i !== subIdx);
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const updateProjectSectionName = (index, name) => {
        const newSections = [...editProjectForm.sections];
        newSections[index].name = name;
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const updateProjectSubsectionName = (sectionIdx, subIdx, name) => {
        const newSections = [...editProjectForm.sections];
        newSections[sectionIdx].subsections[subIdx].name = name;
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const updateProjectSubsectionNotes = (sectionIdx, subIdx, notes) => {
        const newSections = [...editProjectForm.sections];
        newSections[sectionIdx].subsections[subIdx].notes = notes;
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const updateProjectSectionNotes = (index, notes) => {
        const newSections = [...editProjectForm.sections];
        newSections[index].notes = notes;
        setEditProjectForm({ ...editProjectForm, sections: newSections });
    };

    const getChapterMode = (chapterId) => viewMode[chapterId] || 'escrita';
    const toggleViewMode = (chapterId) => {
        setViewMode({ ...viewMode, [chapterId]: getChapterMode(chapterId) === 'escrita' ? 'revisao' : 'escrita' });
    };

    const overallProgress = Math.round(chapters.reduce((sum, ch) => sum + ch.progress, 0) / chapters.length);
    const totalSections = chapters.reduce((sum, ch) => sum + countTotalSections(ch.sections), 0);
    const completedSections = chapters.reduce((sum, ch) => sum + countCompletedSections(ch.sections), 0);

    const renderSections = (sections, isRevision = false) => (
        <div className="space-y-2 mb-3">
            {sections.map((section, idx) => (
                <div key={idx}>
                    <div className="flex items-start gap-2 text-sm">
                        {section.done ?
                            <CheckCircle2 size={16} className="text-green-600 mt-0.5 flex-shrink-0" /> :
                            <Circle size={16} className="text-gray-400 mt-0.5 flex-shrink-0" />
                        }
                        <div className="flex-1">
                            <span className={section.done ? 'text-gray-500 line-through' : 'text-gray-700 font-medium'}>
                                {section.name}
                            </span>
                            {section.notes && <p className="text-xs text-orange-600 mt-1">→ {section.notes}</p>}
                            {section.subsections && section.subsections.length > 0 && (
                                <div className="ml-6 mt-2 space-y-1">
                                    {section.subsections.map((sub, subIdx) => (
                                        <div key={subIdx} className="flex items-start gap-2 text-xs">
                                            {sub.done ?
                                                <CheckCircle2 size={14} className="text-green-600 mt-0.5 flex-shrink-0" /> :
                                                <Circle size={14} className="text-gray-400 mt-0.5 flex-shrink-0" />
                                            }
                                            <div className="flex-1">
                                                <span className={sub.done ? 'text-gray-500 line-through' : 'text-gray-600'}>{sub.name}</span>
                                                {sub.notes && <p className="text-xs text-orange-500 mt-0.5">→ {sub.notes}</p>}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            ))}
        </div>
    );

    return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
            <div className="max-w-7xl mx-auto">
                <div className="bg-white rounded-lg shadow-lg p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                        <div className="flex items-center gap-3">
                            <BookOpen className="text-indigo-600" size={28} />
                            <div>
                                <h1 className="text-2xl font-bold text-gray-800">PRISM - Monografia UTFPR</h1>
                                <p className="text-gray-600 text-sm">Padrão de Rótulos e Interfaces para Sistemas Médicos</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setShowSettings(!showSettings)}
                                className="p-2 bg-gray-100 text-gray-600 rounded hover:bg-gray-200"
                                title="Configurações"
                            >
                                ⚙️
                            </button>
                        </div>
                    </div>

                    {showSettings && (
                        <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                            <h3 className="font-semibold text-gray-700 mb-2 text-sm">💾 Gerenciar Dados</h3>
                            <div className="flex flex-wrap gap-2">
                                <button
                                    onClick={handleExport}
                                    className="px-3 py-1.5 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1 text-sm"
                                >
                                    <Download size={14} /> Exportar Backup
                                </button>
                                <label className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm cursor-pointer">
                                    <Upload size={14} /> Importar Backup
                                    <input type="file" accept=".json" onChange={handleImport} className="hidden" />
                                </label>
                                <button
                                    onClick={handleClearData}
                                    className="px-3 py-1.5 bg-red-600 text-white rounded hover:bg-red-700 flex items-center gap-1 text-sm"
                                >
                                    <Trash2 size={14} /> Limpar Dados
                                </button>
                            </div>
                            <p className="text-xs text-gray-500 mt-2">
                                💡 Seus dados são salvos automaticamente no navegador (localStorage)
                            </p>
                        </div>
                    )}

                    <div className="grid grid-cols-3 gap-3">
                        <div className="bg-indigo-50 p-3 rounded-lg border border-indigo-200">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">Progresso Geral</span>
                                <Target className="text-indigo-600" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-indigo-600">{overallProgress}%</div>
                            <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                                <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${overallProgress}%` }} />
                            </div>
                        </div>
                        <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">Seções Completas</span>
                                <CheckCircle2 className="text-green-600" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-green-600">{completedSections}/{totalSections}</div>
                        </div>
                        <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                            <div className="flex items-center justify-between mb-1">
                                <span className="text-xs font-medium text-gray-700">Tarefas Pendentes</span>
                                <AlertCircle className="text-yellow-600" size={16} />
                            </div>
                            <div className="text-2xl font-bold text-yellow-600">{tasks.filter(t => !t.done).length}</div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    <div className="lg:col-span-2 space-y-3">
                        <div className="flex items-center justify-between">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <FileText size={20} className="text-indigo-600" />
                                Estrutura da Monografia
                            </h2>
                            <button
                                onClick={() => setShowNewChapter(!showNewChapter)}
                                className="px-3 py-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1 text-sm"
                            >
                                <Plus size={16} /> Novo Capítulo
                            </button>
                        </div>

                        {showNewChapter && (
                            <div className="bg-white rounded-lg shadow-md border-2 border-indigo-300 p-4 space-y-3">
                                <h3 className="font-bold text-gray-800">Criar Novo Capítulo</h3>
                                <input
                                    type="text"
                                    value={newChapter.title}
                                    onChange={(e) => setNewChapter({ ...newChapter, title: e.target.value })}
                                    placeholder="Título do capítulo *"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                />
                                <input
                                    type="text"
                                    value={newChapter.file}
                                    onChange={(e) => setNewChapter({ ...newChapter, file: e.target.value })}
                                    placeholder="Nome do arquivo (ex: cap-nome.tex)"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                />
                                <textarea
                                    value={newChapter.notes}
                                    onChange={(e) => setNewChapter({ ...newChapter, notes: e.target.value })}
                                    placeholder="Notas iniciais..."
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    rows="2"
                                />
                                <div className="flex gap-2">
                                    <button
                                        onClick={addChapter}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                                    >
                                        <Save size={14} /> Criar
                                    </button>
                                    <button
                                        onClick={() => { setShowNewChapter(false); setNewChapter({ title: '', file: '', notes: '' }); }}
                                        className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1 text-sm"
                                    >
                                        <X size={14} /> Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {chapters.map((chapter) => (
                            <div key={chapter.id} className={`bg-white rounded-lg shadow-md border-2 ${getStatusColor(chapter.status)} p-4`}>
                                {editingChapter === chapter.id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-800">
                                                {chapter.title}
                                                <span className={`ml-2 text-xs px-2 py-0.5 rounded ${editForm.editMode === 'revision' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'}`}>
                                                    {editForm.editMode === 'revision' ? '📝 Revisão' : '✍️ Escrita'}
                                                </span>
                                            </h3>
                                            <div className="flex gap-2">
                                                <button onClick={saveChapterEdit} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm">
                                                    <Save size={14} /> Salvar
                                                </button>
                                                <button onClick={cancelEdit} className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1 text-sm">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <textarea
                                            value={editForm.notes || ''}
                                            onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                            placeholder="Notas do capítulo..."
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                            rows="2"
                                        />

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Seções (arraste para reordenar)</span>
                                            <button onClick={addSectionToEdit} className="text-xs px-2 py-1 bg-indigo-600 text-white rounded hover:bg-indigo-700 flex items-center gap-1">
                                                <Plus size={12} /> Seção
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {editForm.sections.map((section, idx) => (
                                                <div
                                                    key={idx}
                                                    draggable
                                                    onDragStart={(e) => handleDragStart(e, 'section', { sectionIdx: idx })}
                                                    onDragOver={(e) => handleDragOver(e, 'section', { sectionIdx: idx })}
                                                    onDrop={(e) => handleDrop(e, 'section', { sectionIdx: idx })}
                                                    onDragEnd={handleDragEnd}
                                                    className={`border rounded p-2 space-y-2 bg-white cursor-move ${dragOverItem?.type === 'section' && dragOverItem?.indices.sectionIdx === idx ? 'border-indigo-500 border-2' : 'border-gray-300'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical size={14} className="text-gray-400 cursor-grab" />
                                                        <input type="checkbox" checked={section.done} onChange={() => toggleSectionInEdit(idx)} className="cursor-pointer" />
                                                        <input
                                                            type="text"
                                                            value={section.name}
                                                            onChange={(e) => updateSectionName(idx, e.target.value)}
                                                            className="flex-1 p-1 border border-gray-300 rounded text-sm"
                                                        />
                                                        <button onClick={() => addSubsectionToEdit(idx)} className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded">+Sub</button>
                                                        <button onClick={() => removeSectionFromEdit(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={section.notes || ''}
                                                        onChange={(e) => updateSectionNotes(idx, e.target.value)}
                                                        placeholder="Notas..."
                                                        className="w-full p-1 border border-gray-200 rounded text-xs text-gray-600"
                                                    />
                                                    {section.subsections && section.subsections.length > 0 && (
                                                        <div className="ml-6 space-y-1 pt-1 border-t" onDragOver={(e) => e.preventDefault()}>
                                                            {section.subsections.map((sub, subIdx) => (
                                                                <div
                                                                    key={subIdx}
                                                                    draggable
                                                                    onDragStart={(e) => handleDragStart(e, 'subsection', { sectionIdx: idx, subIdx })}
                                                                    onDragOver={(e) => handleDragOver(e, 'subsection', { sectionIdx: idx, subIdx })}
                                                                    onDrop={(e) => handleDrop(e, 'subsection', { sectionIdx: idx, subIdx })}
                                                                    onDragEnd={handleDragEnd}
                                                                    className={`p-1.5 rounded cursor-move space-y-1 ${dragOverItem?.type === 'subsection' && dragOverItem?.indices.sectionIdx === idx && dragOverItem?.indices.subIdx === subIdx ? 'bg-indigo-100 border-2 border-indigo-400' : 'bg-gray-50'}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <GripVertical size={12} className="text-gray-400 cursor-grab flex-shrink-0" />
                                                                        <input type="checkbox" checked={sub.done} onChange={() => toggleSubsectionInEdit(idx, subIdx)} className="cursor-pointer flex-shrink-0" />
                                                                        <input
                                                                            type="text"
                                                                            value={sub.name}
                                                                            onChange={(e) => updateSubsectionName(idx, subIdx, e.target.value)}
                                                                            className="flex-1 p-1 border border-gray-200 rounded text-xs"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        <button onClick={() => removeSubsectionFromEdit(idx, subIdx)} className="text-red-500 flex-shrink-0"><X size={12} /></button>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={sub.notes || ''}
                                                                        onChange={(e) => updateSubsectionNotes(idx, subIdx, e.target.value)}
                                                                        placeholder="Notas da subseção..."
                                                                        className="w-full p-1 border border-gray-200 rounded text-xs text-gray-500 ml-5"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(chapter.status)}
                                                <div>
                                                    <h3 className="font-bold text-gray-800">{chapter.title}</h3>
                                                    <p className="text-xs text-gray-500">{chapter.file}</p>
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-indigo-600">{chapter.progress}%</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => toggleViewMode(chapter.id)}
                                                        className={`p-1.5 rounded ${getChapterMode(chapter.id) === 'revisao' ? 'bg-purple-600 text-white' : 'bg-gray-200 text-gray-600'}`}
                                                        title="Alternar Escrita/Revisão"
                                                    >
                                                        {getChapterMode(chapter.id) === 'revisao' ? <Eye size={14} /> : <Pencil size={14} />}
                                                    </button>
                                                    <button
                                                        onClick={() => startEditChapter(chapter, getChapterMode(chapter.id) === 'revisao' ? 'revision' : 'sections')}
                                                        className="p-1.5 bg-indigo-600 text-white rounded hover:bg-indigo-700"
                                                        title="Editar capítulo"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteChapter(chapter.id)}
                                                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                                                        title="Excluir capítulo"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                            <div className="bg-indigo-600 h-1.5 rounded-full" style={{ width: `${chapter.progress}%` }} />
                                        </div>

                                        {getChapterMode(chapter.id) === 'revisao' && chapter.revision ? (
                                            <div className="bg-purple-50 rounded p-2 mb-2">
                                                <div className="text-xs font-medium text-purple-700 mb-2">📝 Checklist de Revisão</div>
                                                {renderSections(chapter.revision, true)}
                                            </div>
                                        ) : (
                                            renderSections(chapter.sections)
                                        )}

                                        {chapter.notes && (
                                            <div className="bg-blue-50 border-l-4 border-blue-400 p-2 rounded">
                                                <p className="text-xs text-blue-800"><strong>Nota:</strong> {chapter.notes}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}

                        {/* PROJETOS */}
                        <div className="flex items-center justify-between mt-6">
                            <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                                <Target size={20} className="text-green-600" />
                                Projetos
                            </h2>
                            <button
                                onClick={() => setShowNewProject(!showNewProject)}
                                className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm"
                            >
                                <Plus size={16} /> Novo Projeto
                            </button>
                        </div>

                        {showNewProject && (
                            <div className="bg-white rounded-lg shadow-md border-2 border-green-300 p-4 space-y-3">
                                <h3 className="font-bold text-gray-800">Criar Novo Projeto</h3>
                                <input
                                    type="text"
                                    value={newProject.title}
                                    onChange={(e) => setNewProject({ ...newProject, title: e.target.value })}
                                    placeholder="Nome do projeto *"
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                />
                                <textarea
                                    value={newProject.notes}
                                    onChange={(e) => setNewProject({ ...newProject, notes: e.target.value })}
                                    placeholder="Notas iniciais..."
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    rows="2"
                                />
                                <div className="flex gap-2">
                                    <button onClick={addProject} className="px-3 py-1.5 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm">
                                        <Save size={14} /> Criar
                                    </button>
                                    <button onClick={() => { setShowNewProject(false); setNewProject({ title: '', notes: '' }); }} className="px-3 py-1.5 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center gap-1 text-sm">
                                        <X size={14} /> Cancelar
                                    </button>
                                </div>
                            </div>
                        )}

                        {projects.map((project) => (
                            <div key={project.id} className={`bg-white rounded-lg shadow-md border-2 ${getStatusColor(project.status)} p-4`}>
                                {editingProject === project.id ? (
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <h3 className="font-bold text-gray-800">{project.title}</h3>
                                            <div className="flex gap-2">
                                                <button onClick={saveProjectEdit} className="px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1 text-sm">
                                                    <Save size={14} /> Salvar
                                                </button>
                                                <button onClick={cancelProjectEdit} className="px-2 py-1 bg-gray-600 text-white rounded hover:bg-gray-700 flex items-center gap-1 text-sm">
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        <textarea
                                            value={editProjectForm.notes || ''}
                                            onChange={(e) => setEditProjectForm({ ...editProjectForm, notes: e.target.value })}
                                            placeholder="Notas do projeto..."
                                            className="w-full p-2 border border-gray-300 rounded text-sm"
                                            rows="2"
                                        />

                                        <div className="flex items-center justify-between">
                                            <span className="text-sm font-medium text-gray-700">Seções</span>
                                            <button onClick={addProjectSection} className="text-xs px-2 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1">
                                                <Plus size={12} /> Seção
                                            </button>
                                        </div>

                                        <div className="space-y-2 max-h-80 overflow-y-auto">
                                            {editProjectForm.sections.map((section, idx) => (
                                                <div
                                                    key={idx}
                                                    draggable
                                                    onDragStart={(e) => handleProjectDragStart(e, 'section', { sectionIdx: idx })}
                                                    onDragOver={(e) => handleProjectDragOver(e, 'section', { sectionIdx: idx })}
                                                    onDrop={(e) => handleProjectDrop(e, 'section', { sectionIdx: idx })}
                                                    onDragEnd={handleDragEnd}
                                                    className={`border rounded p-2 space-y-2 bg-white cursor-move ${dragOverItem?.type === 'project-section' && dragOverItem?.indices.sectionIdx === idx ? 'border-green-500 border-2' : 'border-gray-300'}`}
                                                >
                                                    <div className="flex items-center gap-2">
                                                        <GripVertical size={14} className="text-gray-400 cursor-grab" />
                                                        <input type="checkbox" checked={section.done} onChange={() => toggleProjectSection(idx)} className="cursor-pointer" />
                                                        <input
                                                            type="text"
                                                            value={section.name}
                                                            onChange={(e) => updateProjectSectionName(idx, e.target.value)}
                                                            className="flex-1 p-1 border border-gray-300 rounded text-sm"
                                                        />
                                                        <button onClick={() => addProjectSubsection(idx)} className="text-xs px-1.5 py-0.5 bg-blue-500 text-white rounded">+Sub</button>
                                                        <button onClick={() => removeProjectSection(idx)} className="text-red-500 hover:text-red-700"><X size={14} /></button>
                                                    </div>
                                                    <input
                                                        type="text"
                                                        value={section.notes || ''}
                                                        onChange={(e) => updateProjectSectionNotes(idx, e.target.value)}
                                                        placeholder="Notas..."
                                                        className="w-full p-1 border border-gray-200 rounded text-xs text-gray-600"
                                                    />
                                                    {section.subsections && section.subsections.length > 0 && (
                                                        <div className="ml-6 space-y-1 pt-1 border-t" onDragOver={(e) => e.preventDefault()}>
                                                            {section.subsections.map((sub, subIdx) => (
                                                                <div
                                                                    key={subIdx}
                                                                    draggable
                                                                    onDragStart={(e) => handleProjectDragStart(e, 'subsection', { sectionIdx: idx, subIdx })}
                                                                    onDragOver={(e) => handleProjectDragOver(e, 'subsection', { sectionIdx: idx, subIdx })}
                                                                    onDrop={(e) => handleProjectDrop(e, 'subsection', { sectionIdx: idx, subIdx })}
                                                                    onDragEnd={handleDragEnd}
                                                                    className={`p-1.5 rounded cursor-move space-y-1 ${dragOverItem?.type === 'project-subsection' && dragOverItem?.indices.sectionIdx === idx && dragOverItem?.indices.subIdx === subIdx ? 'bg-green-100 border-2 border-green-400' : 'bg-gray-50'}`}
                                                                >
                                                                    <div className="flex items-center gap-2">
                                                                        <GripVertical size={12} className="text-gray-400 cursor-grab flex-shrink-0" />
                                                                        <input type="checkbox" checked={sub.done} onChange={() => toggleProjectSubsection(idx, subIdx)} className="cursor-pointer flex-shrink-0" />
                                                                        <input
                                                                            type="text"
                                                                            value={sub.name}
                                                                            onChange={(e) => updateProjectSubsectionName(idx, subIdx, e.target.value)}
                                                                            className="flex-1 p-1 border border-gray-200 rounded text-xs"
                                                                            onClick={(e) => e.stopPropagation()}
                                                                        />
                                                                        <button onClick={() => removeProjectSubsection(idx, subIdx)} className="text-red-500 flex-shrink-0"><X size={12} /></button>
                                                                    </div>
                                                                    <input
                                                                        type="text"
                                                                        value={sub.notes || ''}
                                                                        onChange={(e) => updateProjectSubsectionNotes(idx, subIdx, e.target.value)}
                                                                        placeholder="Notas da subseção..."
                                                                        className="w-full p-1 border border-gray-200 rounded text-xs text-gray-500 ml-5"
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                </div>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-center gap-2">
                                                {getStatusIcon(project.status)}
                                                <h3 className="font-bold text-gray-800">{project.title}</h3>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xl font-bold text-green-600">{project.progress}%</span>
                                                <div className="flex gap-1">
                                                    <button
                                                        onClick={() => startEditProject(project)}
                                                        className="p-1.5 bg-green-600 text-white rounded hover:bg-green-700"
                                                        title="Editar projeto"
                                                    >
                                                        <Edit2 size={14} />
                                                    </button>
                                                    <button
                                                        onClick={() => deleteProject(project.id)}
                                                        className="p-1.5 bg-red-500 text-white rounded hover:bg-red-600"
                                                        title="Excluir projeto"
                                                    >
                                                        <X size={14} />
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="w-full bg-gray-200 rounded-full h-1.5 mb-3">
                                            <div className="bg-green-600 h-1.5 rounded-full" style={{ width: `${project.progress}%` }} />
                                        </div>

                                        {renderSections(project.sections)}

                                        {project.notes && (
                                            <div className="bg-green-50 border-l-4 border-green-400 p-2 rounded">
                                                <p className="text-xs text-green-800"><strong>Nota:</strong> {project.notes}</p>
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                        ))}
                    </div>

                    <div className="space-y-3">
                        <div className="bg-white rounded-lg shadow-lg p-4">
                            <h2 className="text-lg font-bold text-gray-800 mb-3 flex items-center gap-2">
                                <Calendar size={20} className="text-indigo-600" />
                                Tarefas
                            </h2>

                            <div className="mb-3 space-y-2">
                                <input
                                    type="text"
                                    value={newTask}
                                    onChange={(e) => setNewTask(e.target.value)}
                                    placeholder="Nova tarefa..."
                                    className="w-full p-2 border border-gray-300 rounded text-sm"
                                    onKeyPress={(e) => e.key === 'Enter' && addTask()}
                                />
                                <div className="flex gap-2">
                                    <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="flex-1 p-1.5 border border-gray-300 rounded text-xs">
                                        <option value="alta">Alta</option>
                                        <option value="media">Média</option>
                                        <option value="baixa">Baixa</option>
                                    </select>
                                    <input type="date" value={newTaskDeadline} onChange={(e) => setNewTaskDeadline(e.target.value)} className="flex-1 p-1.5 border border-gray-300 rounded text-xs" />
                                </div>
                                <button onClick={addTask} className="w-full bg-indigo-600 text-white p-2 rounded hover:bg-indigo-700 text-sm font-medium">
                                    Adicionar
                                </button>
                            </div>

                            <div className="space-y-2 max-h-72 overflow-y-auto">
                                {tasks.sort((a, b) => a.done - b.done).map((task) => (
                                    <div key={task.id} className={`p-2 rounded border ${task.done ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-300'}`}>
                                        <div className="flex items-start gap-2">
                                            <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} className="mt-0.5 cursor-pointer" />
                                            <div className="flex-1">
                                                <p className={`text-xs ${task.done ? 'line-through text-gray-500' : 'text-gray-800'}`}>{task.text}</p>
                                                <div className="flex items-center gap-1 mt-1">
                                                    <span className={`text-xs px-1.5 py-0.5 rounded border ${getPriorityColor(task.priority)}`}>{task.priority}</span>
                                                    {task.deadline && <span className="text-xs text-gray-500">📅 {new Date(task.deadline).toLocaleDateString('pt-BR')}</span>}
                                                </div>
                                            </div>
                                            <button onClick={() => deleteTask(task.id)} className="text-red-500 hover:text-red-700 text-xs">✕</button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow-lg p-4">
                            <h3 className="font-bold text-gray-800 mb-2 text-sm">📝 Ajuda</h3>
                            <ul className="text-xs text-gray-700 space-y-1">
                                <li>• <Plus size={10} className="inline" /> Novo Capítulo / Projeto</li>
                                <li>• <Pencil size={10} className="inline" /> / <Eye size={10} className="inline" /> alterna Escrita/Revisão (só capítulos)</li>
                                <li>• Arraste <GripVertical size={10} className="inline" /> para reordenar</li>
                                <li>• ⚙️ para exportar/importar dados</li>
                                <li>• 💾 Salvo automaticamente no navegador</li>
                            </ul>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
