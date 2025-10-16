import React from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

const Home = () => {
  const navigate = useNavigate();

  return (
    <div className="home-container">
      <header className="header">
        <div className="logo-container">
          <img 
            src="https://www.kalasalingam.ac.in/wp-content/uploads/2022/02/Logo.png" 
            alt="Kalasalingam Logo" 
            className="logo" 
          />
          <div className="header-text">
            <h1>Office of IQAC, KARE</h1>
            <p>Internal Quality Assurance Compliance</p>
          </div>
        </div>
      </header>

      <main className="main-content">
        <h1 className="portal-title">Student Feedback Analysis Portal</h1>
        <h2 className="institution">Kalasalingam Academy of Research and Education</h2>
        <p className="portal-description">
          Comprehensive platform for analyzing student feedback across departments, courses, 
          and faculty members with detailed insights and reporting.
        </p>

        <div className="action-buttons">
          <label className="upload-button-container">
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  const formData = new FormData();
                  formData.append('file', e.target.files[0]);
                  
                  fetch('https://feedback-analysis-backend-5os5.onrender.com/api/upload', {
                    method: 'POST',
                    body: formData
                  })
                  .then(response => response.json())
                  .then(data => {
                    if (data.success) {
                      alert(`Successfully uploaded ${data.count} records!`);
                    } else {
                      throw new Error(data.message);
                    }
                  })
                  .catch(error => {
                    alert('Upload failed: ' + error.message);
                  })
                  .finally(() => {
                    e.target.value = ''; // Reset file input
                  });
                }
              }}
              style={{ display: 'none' }}
            />
            <span className="button-text">Upload File 📁</span>
          </label>

          <button 
            className="start-analysis-btn"
            onClick={() => navigate('/analysis')}
          >
            Start Analysis <span className="icon">📊</span>
          </button>

          <button 
            className="manage-questions-btn"
            onClick={() => navigate('/questions')}
          >
            Manage Questions <span className="icon">❓</span>
          </button>
        </div>

        <section className="features-section">
          <h2>Key Features</h2>
          <div className="features-grid">
            <div className="feature-card">
              <span className="feature-icon">📚</span>
              <h3>Department-wise Analysis</h3>
              <p>Analyze feedback across different departments and academic programs</p>
            </div>
            
            <div className="feature-card">
              <span className="feature-icon">👤</span>
              <h3>Faculty Performance</h3>
              <p>Comprehensive evaluation of teaching effectiveness and engagement</p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">📊</span>
              <h3>Detailed Analytics</h3>
              <p>Section-wise and question-wise analysis with visual insights</p>
            </div>

            <div className="feature-card">
              <span className="feature-icon">🎯</span>
              <h3>Performance Tracking</h3>
              <p>Monitor trends and improvements across semesters</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Home;