// frontend/src/TableInsertModal.js
// Insert and Edit Tables

import React, { useState } from 'react';
import { X, Plus, Trash2, Table as TableIcon } from 'lucide-react';
import './TableInsertModal.css';

function TableInsertModal({ isOpen, onClose, onInsert }) {
  const [rows, setRows] = useState(3);
  const [cols, setCols] = useState(3);
  const [tableData, setTableData] = useState([]);
  const [showPreview, setShowPreview] = useState(false);

  const generateTable = () => {
    const newTable = Array(rows).fill(null).map(() => 
      Array(cols).fill('')
    );
    setTableData(newTable);
    setShowPreview(true);
  };

  const updateCell = (rowIndex, colIndex, value) => {
    const newTable = [...tableData];
    newTable[rowIndex][colIndex] = value;
    setTableData(newTable);
  };

  const addRow = () => {
    setTableData([...tableData, Array(cols).fill('')]);
  };

  const addColumn = () => {
    setTableData(tableData.map(row => [...row, '']));
    setCols(cols + 1);
  };

  const removeRow = (index) => {
    if (tableData.length > 1) {
      const newTable = tableData.filter((_, i) => i !== index);
      setTableData(newTable);
      setRows(rows - 1);
    }
  };

  const removeColumn = (index) => {
    if (tableData[0]?.length > 1) {
      const newTable = tableData.map(row => row.filter((_, i) => i !== index));
      setTableData(newTable);
      setCols(cols - 1);
    }
  };

  const handleInsert = () => {
    if (tableData.length > 0) {
      onInsert(tableData);
      handleClose();
    }
  };

  const handleClose = () => {
    setRows(3);
    setCols(3);
    setTableData([]);
    setShowPreview(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="table-insert-modal">
      <div className="table-insert-container">
        <div className="table-insert-header">
          <h3><TableIcon size={20} /> Insert Table</h3>
          <button className="close-btn" onClick={handleClose}>
            <X size={20} />
          </button>
        </div>

        <div className="table-insert-content">
          {!showPreview ? (
            <div className="table-size-selector">
              <h4>Select table size:</h4>
              <div className="size-inputs">
                <div className="size-input-group">
                  <label>Rows:</label>
                  <input
                    type="number"
                    min="1"
                    max="20"
                    value={rows}
                    onChange={(e) => setRows(parseInt(e.target.value) || 1)}
                  />
                </div>
                <div className="size-input-group">
                  <label>Columns:</label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={cols}
                    onChange={(e) => setCols(parseInt(e.target.value) || 1)}
                  />
                </div>
              </div>
              <button className="btn btn-primary" onClick={generateTable}>
                Generate Table
              </button>
            </div>
          ) : (
            <div className="table-editor">
              <div className="table-actions">
                <button className="btn btn-secondary btn-sm" onClick={addRow}>
                  <Plus size={16} /> Add Row
                </button>
                <button className="btn btn-secondary btn-sm" onClick={addColumn}>
                  <Plus size={16} /> Add Column
                </button>
              </div>

              <div className="table-wrapper">
                <table className="editable-table">
                  <tbody>
                    {tableData.map((row, rowIndex) => (
                      <tr key={rowIndex}>
                        {row.map((cell, colIndex) => (
                          <td key={colIndex}>
                            <input
                              type="text"
                              value={cell}
                              onChange={(e) => updateCell(rowIndex, colIndex, e.target.value)}
                              placeholder={`${rowIndex === 0 ? 'Header' : 'Cell'} ${colIndex + 1}`}
                            />
                          </td>
                        ))}
                        <td className="action-cell">
                          <button
                            className="action-btn delete"
                            onClick={() => removeRow(rowIndex)}
                            disabled={tableData.length === 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                    <tr>
                      {tableData[0]?.map((_, colIndex) => (
                        <td key={colIndex} className="action-cell">
                          <button
                            className="action-btn delete"
                            onClick={() => removeColumn(colIndex)}
                            disabled={tableData[0]?.length === 1}
                          >
                            <Trash2 size={14} />
                          </button>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        <div className="table-insert-footer">
          <button className="btn btn-secondary" onClick={handleClose}>
            Cancel
          </button>
          {showPreview && (
            <button className="btn btn-primary" onClick={handleInsert}>
              Insert Table
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default TableInsertModal;