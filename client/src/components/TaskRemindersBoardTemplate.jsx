import React, { useState, useEffect } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/TaskRemindersBoardTemplate.css';

const TaskRemindersBoardTemplate = ({ onClose, onTemplateSaved }) => {
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Get user info using auth utils
  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  // Template data state
  const [templateData, setTemplateData] = useState({
    title: 'Weekly Task Reminders',
    subtitle: 'Click on any card to edit description',
    tasks: [
      {
        id: 1,
        title: 'Complete quarterly review',
        description: 'Prepare presentation and gather team feedback',
        priority: 'HIGH',
        date: '2025-11-01',
        priorityColor: '#FF6B6B',
        completed: false
      },
      {
        id: 2,
        title: 'Update training materials',
        description: 'Review and revise onboarding documentation',
        priority: 'MEDIUM',
        date: '2025-11-05',
        priorityColor: '#FFD93D',
        completed: false
      },
      {
        id: 3,
        title: 'Team building event planning',
        description: 'Organize monthly team activity and send invites',
        priority: 'LOW',
        date: '2025-11-10',
        priorityColor: '#6BCF7F',
        completed: false
      },
      {
        id: 4,
        title: 'Budget review meeting',
        description: 'Analyze Q3 spending and plan Q4 budget',
        priority: 'URGENT',
        date: '2025-10-25',
        priorityColor: '#FF4757',
        completed: false
      }
    ]
  });

  // Auto-resize textarea function
  useEffect(() => {
    const autoResize = (textarea) => {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    };

    const textareas = document.querySelectorAll('.auto-resize');
    textareas.forEach(textarea => {
      autoResize(textarea);
      textarea.addEventListener('input', () => autoResize(textarea));
    });

    return () => {
      textareas.forEach(textarea => {
        textarea.removeEventListener('input', () => autoResize(textarea));
      });
    };
  }, []);

  const handleInputChange = (field, value) => {
    setTemplateData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTaskChange = (taskId, field, value) => {
    setTemplateData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, [field]: value } : task
      )
    }));
  };

  const handlePriorityChange = (taskId, priority) => {
    const priorityColors = {
      'HIGH': '#FF6B6B',
      'MEDIUM': '#FFD93D',
      'LOW': '#6BCF7F',
      'URGENT': '#FF4757'
    };

    setTemplateData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId 
          ? { ...task, priority, priorityColor: priorityColors[priority] }
          : task
      )
    }));
  };

  const handleTaskComplete = (taskId) => {
    setTemplateData(prev => ({
      ...prev,
      tasks: prev.tasks.map(task =>
        task.id === taskId ? { ...task, completed: !task.completed } : task
      )
    }));
  };

  const handleAddTask = () => {
    const newTaskId = Math.max(...templateData.tasks.map(t => t.id)) + 1;
    const newTask = {
      id: newTaskId,
      title: 'New task',
      description: 'Enter task description',
      priority: 'MEDIUM',
      date: new Date().toISOString().split('T')[0],
      priorityColor: '#FFD93D',
      completed: false
    };

    setTemplateData(prev => ({
      ...prev,
      tasks: [...prev.tasks, newTask]
    }));
  };

  const handleRemoveTask = (taskId) => {
    if (templateData.tasks.length <= 1) {
      return; // Don't allow removing the last task
    }

    setTemplateData(prev => ({
      ...prev,
      tasks: prev.tasks.filter(task => task.id !== taskId)
    }));
  };

  const handleCompleteTemplate = () => {
    if (!currentUser) {
      setSaveMessage('Please log in to complete template');
      return;
    }

    if (!userRole || (userRole !== 'Admin' && userRole !== 'Supervisor')) {
      setSaveMessage('Only Admin and Supervisor can complete templates');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const templateDataForModal = {
        type: 'task-reminders-board',
        title: templateData.title,
        description: templateData.subtitle,
        templateData: templateData
      };

      if (onTemplateSaved) {
        onTemplateSaved(templateDataForModal);
      }
    } catch (error) {
      console.error('Complete template error:', error);
      setSaveMessage('Error completing template');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="task-reminders-container">
      <div className="task-reminders-modal">
        <button className="close-btn" onClick={onClose}>×</button>
        
        <div className="task-reminders-header">
          <h1>Task Reminders Board</h1>
          <p>Remind your trainees of important tasks with visual reminder cards</p>
        </div>

      <div className="task-board-content" style={{ background: '#ffffff', border: '2px solid #e5e7eb', borderRadius: '16px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
        <div className="board-header">
          <input
            type="text"
            className="board-title"
            value={templateData.title}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter board title"
          />
          <textarea
            className="board-subtitle auto-resize"
            value={templateData.subtitle}
            onChange={(e) => handleInputChange('subtitle', e.target.value)}
            placeholder="Enter subtitle or instructions"
          />
        </div>

        <div className="tasks-section">
          <div className="tasks-grid">
            {templateData.tasks.map((task) => (
              <div key={task.id} className={`task-card ${task.completed ? 'completed' : ''}`}>
                <div className="task-card-header">
                  <div 
                    className="priority-badge"
                    style={{ backgroundColor: task.priorityColor }}
                  >
                    {task.priority}
                  </div>
                  <div className="task-actions">
                    <div className="task-checkbox">
                      <input 
                        type="checkbox" 
                        id={`task-${task.id}`}
                        checked={task.completed || false}
                        onChange={() => handleTaskComplete(task.id)}
                      />
                    </div>
                    <button 
                      className="remove-task-btn"
                      onClick={() => handleRemoveTask(task.id)}
                      title="Remove task"
                    >
                      ×
                    </button>
                  </div>
                </div>

              <div className="task-content">
                <input
                  type="text"
                  className="task-title"
                  value={task.title}
                  onChange={(e) => handleTaskChange(task.id, 'title', e.target.value)}
                  placeholder="Task title"
                />
                
                <textarea
                  className="task-description auto-resize"
                  value={task.description}
                  onChange={(e) => handleTaskChange(task.id, 'description', e.target.value)}
                  placeholder="Task description"
                />
              </div>

              <div className="task-footer">
                <div className="task-date">
                  <span className="date-icon" aria-hidden="true">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="5" width="18" height="16" rx="3" stroke="#6366f1" strokeWidth="1.8"/>
                      <line x1="3" y1="9" x2="21" y2="9" stroke="#6366f1" strokeWidth="1.8"/>
                      <rect x="7" y="2" width="2" height="4" rx="1" fill="#6366f1"/>
                      <rect x="15" y="2" width="2" height="4" rx="1" fill="#6366f1"/>
                    </svg>
                  </span>
                  <input
                    type="date"
                    className="date-input"
                    value={task.date}
                    onChange={(e) => handleTaskChange(task.id, 'date', e.target.value)}
                  />
                </div>
                
                <select 
                  className="priority-select"
                  value={task.priority}
                  onChange={(e) => handlePriorityChange(task.id, e.target.value)}
                >
                  <option value="HIGH">High</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="LOW">Low</option>
                  <option value="URGENT">Urgent</option>
                </select>
              </div>
            </div>
          ))}
          </div>
          
          <div className="add-task-section">
            <button className="add-task-btn" onClick={handleAddTask}>
              <span className="plus-icon">+</span>
              Add Task
            </button>
          </div>
        </div>

        <div className="board-actions" style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button 
            className="bg-white hover:bg-gray-50 text-gray-700 border-2 border-gray-300 hover:border-gray-400 px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-md hover:scale-105"
            onClick={onClose}
            disabled={saving}
          >
            Cancel
          </button>
          <button 
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all whitespace-nowrap hover:shadow-lg hover:scale-105"
            onClick={handleCompleteTemplate}
            disabled={saving}
          >
            {saving ? 'Completing...' : 'Complete Template'}
          </button>
        </div>

        {saveMessage && (
          <div className={`save-message ${saveMessage.includes('Error') ? 'error' : 'success'}`}>
            {saveMessage}
          </div>
        )}
        </div>
      </div>
    </div>
  );
};

export default TaskRemindersBoardTemplate;