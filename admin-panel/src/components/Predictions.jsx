import { useState, useEffect } from 'react';
import apiService from '../services/apiService';
import './Predictions.css';

function Predictions() {
    const [predictions, setPredictions] = useState([]);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState(null);
    const [formData, setFormData] = useState({
        matchId: '',
        title: '',
        previewText: '',
        fullPrediction: '',
        predictedWinner: '',
        confidencePercentage: '',
        price: '',
        isPublished: true,
    });

    useEffect(() => {
        loadPredictions();
    }, []);

    const loadPredictions = async () => {
        // For now, just show the form since we don't have a list endpoint
        console.log('Predictions loaded');
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        try {
            if (editingId) {
                await apiService.put(`/admin/predictions/${editingId}`, formData);
                alert('Prediction updated successfully!');
            } else {
                await apiService.post('/admin/predictions', formData);
                alert('Prediction created successfully!');
            }

            resetForm();
            loadPredictions();
        } catch (error) {
            alert(`Error: ${error.response?.data?.error || error.message}`);
        }
    };

    const resetForm = () => {
        setFormData({
            matchId: '',
            title: '',
            previewText: '',
            fullPrediction: '',
            predictedWinner: '',
            confidencePercentage: '',
            price: '',
            isPublished: true,
        });
        setEditingId(null);
        setShowForm(false);
    };

    return (
        <div className="predictions">
            <div className="page-header">
                <h1>Prediction Management</h1>
                <button onClick={() => setShowForm(!showForm)} className="primary-button">
                    {showForm ? 'Cancel' : '+ Create Prediction'}
                </button>
            </div>

            {showForm && (
                <div className="prediction-form">
                    <h2>{editingId ? 'Edit Prediction' : 'Create New Prediction'}</h2>

                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-group">
                                <label>Match ID *</label>
                                <input
                                    type="number"
                                    value={formData.matchId}
                                    onChange={(e) => setFormData({ ...formData, matchId: e.target.value })}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label>Price (₹) *</label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    required
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label>Title *</label>
                            <input
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                placeholder="e.g., Expert Analysis: India vs Australia"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Preview Text *</label>
                            <textarea
                                value={formData.previewText}
                                onChange={(e) => setFormData({ ...formData, previewText: e.target.value })}
                                placeholder="Short preview visible to all users..."
                                rows="3"
                                required
                            />
                        </div>

                        <div className="form-group">
                            <label>Full Prediction *</label>
                            <textarea
                                value={formData.fullPrediction}
                                onChange={(e) => setFormData({ ...formData, fullPrediction: e.target.value })}
                                placeholder="Detailed analysis visible after purchase..."
                                rows="8"
                                required
                            />
                        </div>

                        <div className="form-row">
                            <div className="form-group">
                                <label>Predicted Winner</label>
                                <input
                                    type="text"
                                    value={formData.predictedWinner}
                                    onChange={(e) => setFormData({ ...formData, predictedWinner: e.target.value })}
                                    placeholder="e.g., India"
                                />
                            </div>

                            <div className="form-group">
                                <label>Confidence %</label>
                                <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    value={formData.confidencePercentage}
                                    onChange={(e) => setFormData({ ...formData, confidencePercentage: e.target.value })}
                                    placeholder="e.g., 85"
                                />
                            </div>
                        </div>

                        <div className="form-group">
                            <label className="checkbox-label">
                                <input
                                    type="checkbox"
                                    checked={formData.isPublished}
                                    onChange={(e) => setFormData({ ...formData, isPublished: e.target.checked })}
                                />
                                Publish immediately
                            </label>
                        </div>

                        <div className="form-actions">
                            <button type="submit" className="primary-button">
                                {editingId ? 'Update Prediction' : 'Create Prediction'}
                            </button>
                            <button type="button" onClick={resetForm} className="secondary-button">
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            <div className="info-card">
                <h3>How to Create Predictions</h3>
                <ol>
                    <li>First, sync matches from the Cricket API</li>
                    <li>Note the Match ID from the database</li>
                    <li>Create a prediction with preview and full analysis</li>
                    <li>Set the price and confidence percentage</li>
                    <li>Publish when ready</li>
                </ol>
            </div>
        </div>
    );
}

export default Predictions;
