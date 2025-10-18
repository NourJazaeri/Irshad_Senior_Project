import React, { useState, useEffect } from 'react';
import { saveContent } from '../services/api.js';
import { getCurrentUser, getUserRole } from '../utils/auth.js';
import '../styles/TaskRemindersBoardTemplate.css';

const TaskRemindersBoardTemplate = ({ onClose }) => {
  const [saveMessage, setSaveMessage] = useState('');
  const [saving, setSaving] = useState(false);
  
  // Get user info using auth utils
  const currentUser = getCurrentUser();
  const userRole = getUserRole();

  // Template data state
  const [templateData, setTemplateData] = useState({
    title: 'Weekly Task Reminders',
    subtitle: 'Click on any card to edit details',
    tasks: [
      {
        id: 1,
        title: 'Complete quarterly review',
        description: 'Prepare presentation and gather team feedback',
        priority: 'HIGH',
        date: '11/01/2025',
        priorityColor: '#FF6B6B'
      },
      {
        id: 2,
        title: 'Update training materials',
        description: 'Review and revise onboarding documentation',
        priority: 'MEDIUM',
        date: '11/05/2025',
        priorityColor: '#FFD93D'
      },
      {
        id: 3,
        title: 'Team building event planning',
        description: 'Organize monthly team activity and send invites',
        priority: 'LOW',
        date: '11/10/2025',
        priorityColor: '#6BCF7F'
      },
      {
        id: 4,
        title: 'Budget review meeting',
        description: 'Analyze Q3 spending and plan Q4 budget',
        priority: 'URGENT',
        date: '10/25/2025',
        priorityColor: '#FF4757'
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

  const handleAddTask = () => {
    const newTaskId = Math.max(...templateData.tasks.map(t => t.id)) + 1;
    const newTask = {
      id: newTaskId,
      title: 'New task',
      description: 'Enter task description',
      priority: 'MEDIUM',
      date: new Date().toISOString().split('T')[0],
      priorityColor: '#FFD93D'
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

  const handleSaveContent = async () => {
    if (!currentUser) {
      setSaveMessage('Please log in to save content');
      return;
    }

    if (!userRole || (userRole !== 'Admin' && userRole !== 'Supervisor')) {
      setSaveMessage('Only Admin and Supervisor can save content');
      return;
    }

    setSaving(true);
    setSaveMessage('');

    try {
      const contentData = {
        title: templateData.title,
        description: templateData.subtitle,
        type: 'Task Reminders Board',
        templateData: templateData,
        assignedBy: currentUser.id,
        assignedByModel: userRole,
        deadline: null,
        ackRequired: false,
        assignedTo_GroupID: null,
        assignedTo_depID: null,
        assignedTo_traineeID: null
      };

      const result = await saveContent(contentData);

      if (result.success) {
        setSaveMessage('Content saved successfully!');
        setTimeout(() => {
          setSaveMessage('');
        }, 3000);
      } else {
        setSaveMessage(result.message || 'Failed to save content');
      }
    } catch (error) {
      console.error('Save error:', error);
      setSaveMessage('Failed to save content. Please try again.');
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
          <p>Organize and track important tasks with visual reminder cards</p>
        </div>

      <div className="task-board-content">
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
              <div key={task.id} className="task-card">
                <div className="task-card-header">
                  <div 
                    className="priority-badge"
                    style={{ backgroundColor: task.priorityColor }}
                  >
                    {task.priority}
                  </div>
                  <div className="task-actions">
                    <div className="task-checkbox">
                      <input type="checkbox" id={`task-${task.id}`} />
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
                  <span className="date-icon">📅</span>
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

        <div className="board-actions">
          <button 
            className="btn btn-primary"
            onClick={handleSaveContent}
            disabled={saving}
          >
            {saving ? 'Saving...' : 'Save Content'}
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