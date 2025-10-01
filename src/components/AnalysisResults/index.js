import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';

const AnalysisResults = () => {
    const navigate = useNavigate();
    const [analysisData, setAnalysisData] = useState(null);
    const [facultyData, setFacultyData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [overallScore, setOverallScore] = useState(0);
    const [sectionScores, setSectionScores] = useState({});
    const [activeSection, setActiveSection] = useState('overview');

    // Calculate section and overall scores
    const calculateScores = (analysisData) => {
        if (!analysisData || !analysisData.analysis) return;
        
        const sectionResults = {};
        let totalScore = 0;
        let totalWeight = 0;
        
        // Process each section
        Object.keys(analysisData.analysis).forEach(sectionKey => {
            const section = analysisData.analysis[sectionKey];
            let sectionScore = 0;
            let questionCount = 0;
            
            // Process each question in the section
            Object.values(section.questions).forEach(question => {
                let weightedSum = 0;
                let totalResponses = 0;
                
                // Calculate weighted score for each question
                // Interpret option 1 as bad, 2 as neutral, 3 as good
                question.options.forEach(option => {
                    // Map the values: 1 (bad) = 1, 2 (neutral) = 3, 3 (good) = 5
                    const mappedValue = option.value === 1 ? 1 : option.value === 2 ? 3 : option.value === 3 ? 5 : option.value;
                    weightedSum += option.count * mappedValue;
                    totalResponses += option.count;
                });
                
                const maxPossibleScore = totalResponses * 5; // Using 5-point scale
                const questionScore = maxPossibleScore > 0 
                    ? (weightedSum / maxPossibleScore) * 100 
                    : 0;
                
                sectionScore += questionScore;
                questionCount++;
            });
            
            const avgSectionScore = questionCount > 0 ? sectionScore / questionCount : 0;
            sectionResults[sectionKey] = {
                name: section.section_name || sectionKey,
                score: Math.round(avgSectionScore),
                questionCount
            };
            
            totalScore += avgSectionScore;
            totalWeight++;
        });
        
        const finalOverallScore = totalWeight > 0 ? Math.round(totalScore / totalWeight) : 0;
        setOverallScore(finalOverallScore);
        setSectionScores(sectionResults);
    };

    useEffect(() => {
        const storedAnalysisData = sessionStorage.getItem('analysisResults');
        const storedFacultyData = sessionStorage.getItem('facultyData');
        
        if (storedAnalysisData && storedFacultyData) {
            try {
                const parsedAnalysisData = JSON.parse(storedAnalysisData);
                setAnalysisData(parsedAnalysisData);
                setFacultyData(JSON.parse(storedFacultyData));
                calculateScores(parsedAnalysisData);
            } catch (error) {
                console.error('Error parsing stored data:', error);
                navigate('/analysis');
            }
        } else {
            navigate('/analysis');
        }
        
        setLoading(false);
    }, [navigate]);

    const handleBackToAnalysis = () => {
        sessionStorage.removeItem('analysisResults');
        sessionStorage.removeItem('facultyData');
        navigate('/analysis');
    };

    const handleGenerateReport = async () => {
        try {
            console.log('Starting report generation...');
            
            // Detailed data logging
            console.log('Full Analysis Data:', JSON.stringify({
                staffId: analysisData.staff_id,
                courseCode: analysisData.course_code,
                courseName: analysisData.course_name,
                totalResponses: analysisData.total_responses,
                analysis: analysisData.analysis ? 
                    Object.entries(analysisData.analysis).map(([key, section]) => ({
                        sectionKey: key,
                        sectionName: section.section_name,
                        questions: Object.entries(section.questions || {}).map(([qKey, q]) => ({
                            question: q.question,
                            totalResponses: q.total_responses,
                            options: q.options
                        }))
                    })) : 'No analysis data'
            }, null, 2));
            
            const response = await fetch('http://localhost:5000/api/reports/generate-report', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    analysisData,
                    facultyData,
                }),
            });

            if (!response.ok) {
                // Try to parse error as JSON
                const contentType = response.headers.get('content-type');
                if (contentType && contentType.includes('application/json')) {
                    const errorData = await response.json();
                    throw new Error(errorData.details || errorData.error || 'Failed to generate report');
                } else {
                    // If not JSON, get text
                    const errorText = await response.text();
                    console.error('Server response:', errorText);
                    throw new Error('Server error occurred');
                }
            }

            const contentType = response.headers.get('content-type');
            if (!contentType || !contentType.includes('spreadsheetml')) {
                console.error('Unexpected content type:', contentType);
                throw new Error('Invalid response format from server');
            }

            // Get the blob from the response
            const blob = await response.blob();
            
            // Create a URL for the blob
            const url = window.URL.createObjectURL(blob);
            
            // Create a temporary link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `faculty_feedback_report_${analysisData.staff_id || 'unknown'}.xlsx`;
            document.body.appendChild(a);
            a.click();
            
            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('Error generating report:', error);
            alert(`Failed to generate report: ${error.message}`);
        }
    };

    if (loading) {
        return (
            <div className="analysis-results-container">
                <div className="loading-spinner">
                    <div className="spinner"></div>
                    <p>Loading analysis results...</p>
                </div>
            </div>
        );
    }

    if (!analysisData || !facultyData) {
        return (
            <div className="analysis-results-container">
                <div className="error-message">
                    <h2>No Analysis Data Found</h2>
                    <p>Please go back and select a faculty to analyze.</p>
                    <button onClick={handleBackToAnalysis} className="back-btn">
                        Back to Analysis
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="analysis-results-container">
            <div className="dashboard-header">
                <div className="header-content">
                    <img 
                        src="https://www.kalasalingam.ac.in/wp-content/uploads/2022/02/Logo.png" 
                        alt="Kalasalingam Logo"
                        className="logo"
                    />
                    <div className="faculty-info">
                        <h2>{facultyData.faculty_name || facultyData.name}</h2>
                        <p>
                            <span className="label">Course:</span>
                            <span className="highlight">{analysisData.course_code} - {analysisData.course_name}</span>
                        </p>
                        <p>
                            <span className="label">Staff ID:</span>
                            <span className="highlight">{analysisData.staff_id}</span>
                            <span className="divider">•</span>
                            <span className="label">Total Responses:</span>
                            <span className="highlight">{analysisData.total_responses}</span>
                        </p>
                    </div>
                </div>
                <div className="header-actions">
                    <button onClick={handleBackToAnalysis} className="header-btn">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M19 12H5M12 19l-7-7 7-7"/>
                        </svg>
                        Back to Analysis
                    </button>
                    <button onClick={handleGenerateReport} className="header-btn primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"/>
                            <polyline points="13 2 13 9 20 9"/>
                        </svg>
                        Generate Report
                    </button>
                </div>
            </div>

            <main className="dashboard-content">
                {activeSection === 'overview' ? (
                    <>
                        <div className="metrics-grid">
                            <div className="metric-card overall">
                                <div className="metric-value">{overallScore}%</div>
                                <div className="metric-label">Overall Score</div>
                            </div>
                            {Object.entries(sectionScores).map(([key, section]) => (
                                <div 
                                    key={key}
                                    className="metric-card"
                                    onClick={() => setActiveSection(key)}
                                >
                                    <div className="metric-value">{section.score}%</div>
                                    <div className="metric-label">{section.name}</div>
                                    <div className="metric-detail">Click to view details →</div>
                                </div>
                            ))}
                        </div>

                        <div className="performance-summary">
                            <h2>Section-wise Performance</h2>
                            <div className="section-bars">
                                {Object.entries(sectionScores).map(([key, section]) => (
                                    <div key={key} className="section-bar-item">
                                        <div className="bar-header">
                                            <span>{section.name}</span>
                                            <span>{section.score}%</span>
                                        </div>
                                        <div className="progress-bar">
                                            <div 
                                                className={`progress-fill ${
                                                    section.score >= 75 ? 'success' : 
                                                    section.score >= 50 ? 'warning' : 'danger'
                                                }`}
                                                style={{ width: `${section.score}%` }}
                                            />
                                        </div>
                                        <div className="bar-footer">
                                            Based on {section.questionCount} questions
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                ) : (
                    <div className="section-analysis">
                        <div className="section-header">
                            <button 
                                className="back-button"
                                onClick={() => setActiveSection('overview')}
                            >
                                ← Back to Overview
                            </button>
                            <h2>{sectionScores[activeSection]?.name}</h2>
                            <div className="section-score">
                                Score: {sectionScores[activeSection]?.score}%
                            </div>
                        </div>
                        
                        <div className="section-content">
                            <div className="questions-list">
                                {Object.values(analysisData.analysis[activeSection]?.questions || {}).map((question, index) => (
                                    <div key={index} className="question-item">
                                        <div className="question-header">
                                            <h3 className="question-title">Question {index + 1}</h3>
                                            <p className="question-text">{question.question}</p>
                                        </div>
                                        
                                        <div className="responses">
                                            {question.options.map((option, optIndex) => {
                                                const percentage = (option.count / question.total_responses) * 100;
                                                // Determine color class based on option value (1=bad, 2=neutral, 3=good)
                                                let colorClass = option.value === 3 ? 'success' : 
                                                               option.value === 2 ? 'warning' : 'danger';
                                                
                                                // Add interpretation label with appropriate CSS class
                                                const interpretationClass = option.value === 3 ? 'good' : 
                                                                          option.value === 2 ? 'neutral' : 'bad';
                                                const interpretationText = option.value === 3 ? 'Good' : 
                                                                          option.value === 2 ? 'Neutral' : 'Bad';
                                            
                                                return (
                                                    <div key={optIndex} className="response-item">
                                                        <div className="response-header">
                                                            <span className="response-text">
                                                                {option.text} 
                                                                <span className={`interpretation ${interpretationClass}`}>{interpretationText}</span>
                                                            </span>
                                                            <span className={`response-count`}>({option.count})</span>
                                                            <span className={`percentage ${colorClass}`}>
                                                                {Math.round(percentage)}%
                                                            </span>
                                                        </div>
                                                        <div className="progress-bar">
                                                            <div 
                                                                className={`progress-fill ${colorClass}`}
                                                                style={{ width: `${percentage}%` }}
                                                            />
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default AnalysisResults;
