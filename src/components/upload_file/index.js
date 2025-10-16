import React, { useState } from 'react';
import axios from 'axios';
import './index.css';

const UploadFile = () => {
    const [file, setFile] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleFileSelect = (event) => {
        const selectedFile = event.target.files[0];
        if (selectedFile) {
            const fileType = selectedFile.name.split('.').pop().toLowerCase();
            if (['csv', 'xlsx', 'xls'].includes(fileType)) {
                setFile(selectedFile);
                setMessage('');
            } else {
                setMessage('Error: Please select a CSV or Excel file');
                event.target.value = '';
            }
        }
    };

    const handleUpload = async () => {
        if (!file) {
            setMessage('Please select a file first');
            return;
        }

        setLoading(true);
        const formData = new FormData();
        formData.append('file', file);

        try {
            console.log('Starting file upload...'); // Debug log
            console.log('File details:', { 
                name: file.name, 
                size: file.size, 
                type: file.type 
            }); // Debug log

            const response = await axios.post('https://feedback-analysis-backend-5os5.onrender.com', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                },
                onUploadProgress: (progressEvent) => {
                    console.log('Upload progress:', Math.round((progressEvent.loaded * 100) / progressEvent.total));
                }
            });

            console.log('Server response:', response.data); // Debug log

            if (response.data.success) {
                setMessage(`Success! Uploaded ${response.data.count} records to course feedback database.`);
                alert(`Upload successful! ${response.data.count} records added to database.`);
                setFile(null);
                const fileInput = document.querySelector('input[type="file"]');
                if (fileInput) fileInput.value = '';
            } else {
                setMessage('Upload failed: ' + response.data.message);
                alert('Upload failed: ' + response.data.message);
            }
        } catch (error) {
            console.error('Upload error:', error); // Debug log
            setMessage('Error: ' + (error.response?.data?.message || error.message));
            alert('Upload error: ' + (error.response?.data?.message || error.message));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="file-upload-btn">
            <input
                type="file"
                onChange={handleFileSelect}
                accept=".csv,.xlsx,.xls"
                className="file-input"
            />
            <button 
                onClick={handleUpload}
                disabled={loading || !file}
                className="upload-button"
            >
                {loading ? (
                    <>
                        Uploading... 
                        <div className="spinner" />
                    </>
                ) : (
                    <>
                        Upload File <span className="icon">📁</span>
                    </>
                )}
            </button>
            {loading && (
                <div className="upload-progress">
                    <div className="progress-bar" />
                </div>
            )}
            {message && (
                <p className={`selected-file ${message.includes('Success') ? 'success' : 'error'}`}>
                    {message}
                </p>
            )}
        </div>
    );
};

export default UploadFile;