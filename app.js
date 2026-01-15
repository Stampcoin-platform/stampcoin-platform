// Simple Todo app with localStorage persistence.
// Key: 'todos-v1'

const STORAGE_KEY = 'todos-v1';

// Elements
const newForm = document.getElementById('new-todo-form');
const newInput = document.getElementById('new-todo-input');
const todoList = document.getElementById('todo-list');
const countEl = document.getElementById('count');
const clearBtn = document.getElementById('clear-completed');
const filterButtons = document.querySelectorAll('.filter-btn');

let todos = []; // { id, text, completed }
let filter = 'all'; // all | active | completed

// Helpers
const save = () => localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
const load = () => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (e) {
    console.error('Failed to parse todos from storage', e);
    return [];
  }
};
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2,8);

// Render
function render() {
  // filter todos
  const list = todos.filter(t => {
    if (filter === 'active') return !t.completed;
    if (filter === 'completed') return t.completed;
    return true;
  });

  todoList.innerHTML = '';
  if (list.length === 0) {
    const empty = document.createElement('div');
    empty.className = 'small';
    empty.textContent = 'No todos yet.';
    todoList.appendChild(empty);
  }

  for (const t of list) {
    const li = document.createElement('li');
    li.className = 'todo' + (t.completed ? ' completed' : '');
    li.dataset.id = t.id;

    // checkbox
    const cb = document.createElement('button');
    cb.className = 'checkbox';
    cb.setAttribute('aria-label', t.completed ? 'Mark as active' : 'Mark as completed');
    cb.innerHTML = t.completed ? '✓' : '';
    cb.addEventListener('click', () => {
      toggleComplete(t.id);
    });

    // label (editable on double click)
    const label = document.createElement('div');
    label.className = 'label';
    label.tabIndex = 0;
    label.textContent = t.text;
    label.title = 'Double click to edit';

    // edit on double click
    label.addEventListener('dblclick', () => startEdit(li, t));
    label.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') startEdit(li, t);
    });

    // delete button
    const del = document.createElement('button');
    del.className = 'icon-btn delete';
    del.setAttribute('aria-label', 'Delete todo');
    del.textContent = '✕';
    del.addEventListener('click', () => removeTodo(t.id));

    li.appendChild(cb);
    li.appendChild(label);
    li.appendChild(del);

    todoList.appendChild(li);
  }

  updateCount();
  // update filter UI aria-selected
  filterButtons.forEach(btn => {
    const isActive = btn.dataset.filter === filter;
    btn.classList.toggle('active', isActive);
    btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
  });
}

function updateCount() {
  const remaining = todos.filter(t => !t.completed).length;
  countEl.textContent = `${remaining} item${remaining !== 1 ? 's' : ''} left`;
}

// Actions
function addTodo(text) {
  const trimmed = text.trim();
  if (!trimmed) return;
  todos.unshift({ id: uid(), text: trimmed, completed: false });
  save();
  render();
}

function removeTodo(id) {
  todos = todos.filter(t => t.id !== id);
  save();
  render();
}

function toggleComplete(id) {
  const idx = todos.findIndex(t => t.id === id);
  if (idx === -1) return;
  todos[idx].completed = !todos[idx].completed;
  save();
  render();
}

function clearCompleted() {
  todos = todos.filter(t => !t.completed);
  save();
  render();
}

function startEdit(li, todo) {
  // replace label with input
  const input = document.createElement('input');
  input.className = 'edit-input';
  input.value = todo.text;
  input.setAttribute('aria-label', 'Edit todo');
  // focus & select
  li.querySelector('.label').replaceWith(input);
  input.focus();
  input.select();

  function commit() {
    const txt = input.value.trim();
    if (!txt) {
      removeTodo(todo.id);
    } else {
      const idx = todos.findIndex(t => t.id === todo.id);
      if (idx !== -1) {
        todos[idx].text = txt;
        save();
        render();
      }
    }
  }
  function cancel() {
    render();
  }

  input.addEventListener('blur', commit);
  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') commit();
    else if (e.key === 'Escape') cancel();
  });
}

// Init
function init() {
  todos = load();
  render();

  newForm.addEventListener('submit', (e) => {
    e.preventDefault();
    addTodo(newInput.value);
    newInput.value = '';
    newInput.focus();
  });

  clearBtn.addEventListener('click', () => {
    clearCompleted();
  });

  filterButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      filter = btn.dataset.filter;
      render();
    });
  });

  // keyboard shortcut: focus input with 'n'
  window.addEventListener('keydown', (e) => {
    if (e.key === 'n' && !e.metaKey && !e.ctrlKey && !e.altKey) {
      newInput.focus();
      e.preventDefault();
    }
  });
}

init();