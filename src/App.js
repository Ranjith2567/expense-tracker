import React, { useState, useEffect } from 'react';
import './App.css';
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from 'recharts';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const App = () => {
  const [expenses, setExpenses] = useState([]);
  const [editing, setEditing] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterCategory, setFilterCategory] = useState('All');
  const [darkMode, setDarkMode] = useState(false);

  const maxBudget = 10000;
  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#FF66CC'];

  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem('expenses')) || [];
    setExpenses(saved);
  }, []);

  useEffect(() => {
    localStorage.setItem('expenses', JSON.stringify(expenses));
  }, [expenses]);

  const handleSave = (expense) => {
    if (!expense.title || !expense.amount || !expense.category) {
      toast.error('Please fill all fields!');
      return;
    }

    if (editing) {
      const updated = expenses.map((e) =>
        e.id === editing.id ? { ...expense, id: editing.id } : e
      );
      setExpenses(updated);
      toast.success('Expense Updated!');
    } else {
      const newExpense = { ...expense, id: Date.now(), date: new Date().toLocaleDateString() };
      setExpenses([newExpense, ...expenses]);
      toast.success('Expense Added!');
    }

    setEditing(null);
  };

  const handleDelete = (id) => {
    const updated = expenses.filter((e) => e.id !== id);
    setExpenses(updated);
    toast.info('Expense Deleted');
  };

  const handleEdit = (expense) => {
    setEditing(expense);
  };

  const filteredExpenses = expenses.filter(
    (e) =>
      (filterCategory === 'All' || e.category === filterCategory) &&
      e.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalExpense = filteredExpenses.reduce((sum, e) => sum + parseFloat(e.amount), 0);

  const exportPDF = () => {
    const input = document.getElementById('export-area');
    if (!input) return;

    html2canvas(input).then((canvas) => {
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF();
      const imgProps = pdf.getImageProperties(imgData);
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (imgProps.height * pdfWidth) / imgProps.width;
      pdf.addImage(imgData, 'PNG', 0, 10, pdfWidth, pdfHeight);
      pdf.save('expenses.pdf');
      toast.success('Exported to PDF!');
    });
  };

  return (
    <div className={`app ${darkMode ? 'dark' : ''}`}>
      <div className="header">
        <h2>💸 Expense Tracker</h2>
        <button className="toggle-btn" onClick={() => setDarkMode(!darkMode)}>
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </div>

      {/* Form */}
      <form
        className="expense-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleSave({
            title: e.target.title.value,
            amount: parseFloat(e.target.amount.value),
            category: e.target.category.value,
            date: editing ? editing.date : new Date().toLocaleDateString(),
          });
          e.target.reset();
        }}
      >
        <h3>{editing ? 'Edit Expense' : 'Add Expense'}</h3>
        <input
          type="text"
          name="title"
          placeholder="Title"
          defaultValue={editing?.title || ''}
        />
        <input
          type="number"
          name="amount"
          placeholder="Amount"
          defaultValue={editing?.amount || ''}
        />
        <select name="category" defaultValue={editing?.category || ''}>
          <option value="">Choose Category</option>
          <option value="Food">🍔 Food</option>
          <option value="Travel">🚗 Travel</option>
          <option value="Shopping">🛒 Shopping</option>
          <option value="Bills">📑 Bills</option>
          <option value="Others">📦 Others</option>
        </select>
        <div className="form-actions">
          <button type="submit">{editing ? 'Update' : 'Save'}</button>
          {editing && (
            <button type="button" className="cancel-btn" onClick={() => setEditing(null)}>
              Cancel
            </button>
          )}
        </div>
      </form>

      {/* Controls */}
      <div className="controls">
        <input
          type="text"
          placeholder="Search..."
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <select onChange={(e) => setFilterCategory(e.target.value)}>
          <option>All</option>
          <option>Food</option>
          <option>Travel</option>
          <option>Shopping</option>
          <option>Bills</option>
          <option>Others</option>
        </select>
        <button onClick={exportPDF}>📄 Export PDF</button>
      </div>

      {/* Progress Bar */}
      <div className="progress-container">
        <div className="progress-bar" style={{ width: `${(totalExpense / maxBudget) * 100}%` }} />
        <p>{`Total: ₹${totalExpense} / ₹${maxBudget}`}</p>
      </div>

      <div id="export-area" className="main-content">
        {/* List */}
        <div className="expense-list">
          {filteredExpenses.length === 0 ? (
            <p className="empty">No expenses found.</p>
          ) : (
            filteredExpenses.map((e) => (
              <div key={e.id} className="expense-item">
                <div>
                  <h4>{e.title}</h4>
                  <p>₹ {e.amount}</p>
                  <small>
                    {e.category} • {e.date}
                  </small>
                </div>
                <div className="item-actions">
                  <button onClick={() => handleEdit(e)}>✏️</button>
                  <button onClick={() => handleDelete(e.id)}>🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Pie Chart */}
        <div className="chart-container">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={filteredExpenses}
                dataKey="amount"
                nameKey="category"
                cx="50%"
                cy="50%"
                outerRadius={100}
                fill="#8884d8"
                label
              >
                {filteredExpenses.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <ToastContainer position="top-right" autoClose={1500} />
    </div>
  );
};

export default App;
