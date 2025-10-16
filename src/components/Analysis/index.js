import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './index.css';
const Fetch_Api = process.env.BACKEND_API;

const Analysis = () => {
    const navigate = useNavigate();
    const [filters, setFilters] = useState({
        degree: '',
        department: '',
        batch: '',
        course: ''
    });
    
    const [options, setOptions] = useState({
        degrees: [],
        departments: [],
        batches: [],
        courses: []
    });

    const [faculty, setFaculty] = useState([]);
    const [staffIdSearch, setStaffIdSearch] = useState('');
    const [loadingAnalysis, setLoadingAnalysis] = useState(false);
    const [loadingDeptReport, setLoadingDeptReport] = useState(false);
    const [loadingDeptAllReport, setLoadingDeptAllReport] = useState(false);

    const getInitials = (fullName) => {
        if (!fullName || typeof fullName !== 'string') return '?';
        const parts = fullName.trim().split(/\s+/);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
        const initials = (first + last).toUpperCase();
        return initials || '?';
    };

    const handleGenerateDepartmentReport = async () => {
        if (!filters.degree || !filters.department || !filters.batch) {
            alert('Please select Degree, Department and Batch.');
            return;
        }
        try {
            setLoadingDeptReport(true);
            const resp = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/reports/generate-department-report`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    degree: filters.degree,
                    dept: filters.department,
                    batch: filters.batch
                })
            });
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg || 'Failed to generate department report');
            }
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `department_feedback_${filters.department}_${filters.batch}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error('Department report error:', e);
            alert('Error generating department report.');
        } finally {
            setLoadingDeptReport(false);
        }
    };

    const handleGenerateDepartmentAllBatches = async () => {
        if (!filters.degree || !filters.department) {
            alert('Please select Degree and Department.');
            return;
        }
        try {
            setLoadingDeptAllReport(true);
            const resp = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/reports/generate-department-report-all-batches`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    degree: filters.degree,
                    dept: filters.department
                })
            });
            if (!resp.ok) {
                const msg = await resp.text();
                throw new Error(msg || 'Failed to generate department report (all batches)');
            }
            const blob = await resp.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `department_feedback_${filters.department}_ALL_BATCHES.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (e) {
            console.error('Department all-batches report error:', e);
            alert('Error generating department report (all batches).');
        } finally {
            setLoadingDeptAllReport(false);
        }
    };

    // Fetch initial degree options and restore state
    useEffect(() => {
        fetchDegrees();
        
        // Restore previous state if returning from results page
        const savedFilters = sessionStorage.getItem('analysisFilters');
        const savedFaculty = sessionStorage.getItem('savedFaculty');
        const savedStaffIdSearch = sessionStorage.getItem('savedStaffIdSearch');
        
        if (savedFilters) {
            try {
                const filters = JSON.parse(savedFilters);
                setFilters(filters);
                
                // Restore faculty data if available
                if (savedFaculty) {
                    const faculty = JSON.parse(savedFaculty);
                    setFaculty(faculty);
                }
                
                // Restore staff ID search if available
                if (savedStaffIdSearch) {
                    setStaffIdSearch(savedStaffIdSearch);
                }
                
                // Clear saved data after restoring
                sessionStorage.removeItem('analysisFilters');
                sessionStorage.removeItem('savedFaculty');
                sessionStorage.removeItem('savedStaffIdSearch');
            } catch (error) {
                console.error('Error restoring analysis state:', error);
            }
        }
    }, []);

    // Fetch departments when degree changes
    useEffect(() => {
        if (filters.degree) {
            fetchDepartments(filters.degree);
        }
    }, [filters.degree]);

    // Fetch batches when department changes
    useEffect(() => {
        if (filters.department) {
            fetchBatches(filters.degree, filters.department);
        }
    }, [filters.department]);

    // Fetch courses when batch changes
    useEffect(() => {
        if (filters.batch) {
            fetchCourses(filters.degree, filters.department, filters.batch);
        }
    }, [filters.batch]);

    // Fetch faculty when course or staffIdSearch changes
    useEffect(() => {
        if (filters.course) {
            fetchFaculty(filters.degree, filters.department, filters.batch, filters.course, staffIdSearch);
        } else {
            setFaculty([]);
        }
    }, [filters.course, staffIdSearch]);

    const fetchDegrees = async () => {
        try {
            console.log('Fetching degrees...');
            const response = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/analysis/degrees`);
            const data = await response.json();
            console.log('Degrees received:', data);
            if (Array.isArray(data)) {
                setOptions(prev => ({ ...prev, degrees: data }));
            } else {
                console.error('Invalid degrees data:', data);
            }
        } catch (error) {
            console.error('Error fetching degrees:', error);
        }
    };

    const fetchDepartments = async (degree) => {
        try {
            const response = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/analysis/departments?degree=${degree}`);
            const data = await response.json();
            setOptions(prev => ({ ...prev, departments: data }));
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchBatches = async (degree, department) => {
        try {
            const response = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/analysis/batches?degree=${degree}&dept=${department}`);
            const data = await response.json();
            setOptions(prev => ({ ...prev, batches: data }));
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    const fetchCourses = async (degree, department, batch) => {
        try {
            const response = await fetch(
                `https://feedback-analysis-backend-1.onrender.com/api/analysis/courses?degree=${degree}&dept=${department}&batch=${batch}`
            );
            const data = await response.json();
            setOptions(prev => ({ ...prev, courses: data }));
        } catch (error) {
            console.error('Error fetching courses:', error);
        }
    };

    const fetchFaculty = async (degree, department, batch, course, staffId) => {
        try {
            const params = new URLSearchParams({ degree, dept: department, batch, course });
            if (staffId && staffId.trim() !== '') {
                params.append('staffId', staffId.trim());
            }
            const response = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/analysis/faculty?${params.toString()}`);
            const data = await response.json();
            if (Array.isArray(data)) setFaculty(data);
            else setFaculty([]);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            setFaculty([]);
        }
    };

    const generateBulkReport = async () => {
        try {
            setLoadingAnalysis(true);
            const allAnalysisData = [];

            // Collect analysis data for all faculty
            for (const facultyMember of faculty) {
                const params = new URLSearchParams({
                    degree: filters.degree,
                    dept: filters.department,
                    batch: filters.batch,
                    course: filters.course,
                    staffId: facultyMember.staff_id || facultyMember.staffid || ''
                });
                
                // Get analysis data
                const analysisResponse = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/analysis/feedback?${params.toString()}`);
                const analysisData = await analysisResponse.json();
                
                if (analysisData.success) {
                    allAnalysisData.push({
                        analysisData: analysisData,
                        facultyData: facultyMember
                    });
                }
            }

            // Generate consolidated report
            const reportResponse = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/reports/generate-bulk-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facultyAnalyses: allAnalysisData,
                    filters: {
                        degree: filters.degree,
                        department: filters.department,
                        batch: filters.batch,
                        course: filters.course
                    }
                }),
            });

            if (!reportResponse.ok) {
                throw new Error('Failed to generate report');
            }

            // Download the report
            const blob = await reportResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `faculty_feedback_analysis_${filters.department}_${filters.course}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            return true;
        } catch (error) {
            console.error('Error generating report:', error);
            return false;
        }
    };

    const handleGenerateAllReports = async () => {
        if (!faculty.length) {
            alert('No faculty members found to generate reports.');
            return;
        }

        if (!window.confirm(`Are you sure you want to generate a consolidated report for all ${faculty.length} faculty members?`)) {
            return;
        }

        try {
            setLoadingAnalysis(true);
            const allAnalysisData = [];

            // Collect analysis data for all faculty
            for (const facultyMember of faculty) {
                const params = new URLSearchParams({
                    degree: filters.degree,
                    dept: filters.department,
                    batch: filters.batch,
                    course: filters.course,
                    staffId: facultyMember.staff_id || facultyMember.staffid || ''
                });
                
                // Get analysis data
                const analysisResponse = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/analysis/feedback?${params.toString()}`);
                const analysisData = await analysisResponse.json();
                
                if (analysisData.success) {
                    allAnalysisData.push({
                        analysisData: analysisData,
                        facultyData: facultyMember
                    });
                }
            }

            // Generate consolidated report
            const reportResponse = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/bulk-reports/generate-bulk-report`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    facultyAnalyses: allAnalysisData,
                    filters: {
                        degree: filters.degree,
                        department: filters.department,
                        batch: filters.batch,
                        course: filters.course
                    }
                }),
            });

            if (!reportResponse.ok) {
                throw new Error('Failed to generate consolidated report');
            }

            // Download the report
            const blob = await reportResponse.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `faculty_feedback_analysis_${filters.department}_${filters.course}.xlsx`;
            document.body.appendChild(a);
            a.click();
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);

            alert('Consolidated report generated successfully!');
        } catch (error) {
            console.error('Error generating consolidated report:', error);
            alert('Error generating consolidated report. Please try again.');
        } finally {
            setLoadingAnalysis(false);
        }
    };

    const handleFacultyCardClick = async (facultyData) => {
        setLoadingAnalysis(true);
        
        try {
            // Save current state before navigating
            sessionStorage.setItem('analysisFilters', JSON.stringify(filters));
            sessionStorage.setItem('savedFaculty', JSON.stringify(faculty));
            sessionStorage.setItem('savedStaffIdSearch', staffIdSearch);
            
            const params = new URLSearchParams({
                degree: filters.degree,
                dept: filters.department,
                batch: filters.batch,
                course: filters.course,
                staffId: facultyData.staff_id || facultyData.staffid || ''
            });
            
            const response = await fetch(`https://feedback-analysis-backend-1.onrender.com/api/analysis/feedback?${params.toString()}`);
            const data = await response.json();
            
            if (data.success) {
                // Store analysis data and faculty data for the results page
                sessionStorage.setItem('analysisResults', JSON.stringify(data));
                sessionStorage.setItem('facultyData', JSON.stringify(facultyData));
                
                // Navigate to analysis results page
                navigate('/analysis-results');
            } else {
                console.error('Analysis failed:', data.message);
                alert('Failed to fetch analysis data: ' + (data.message || 'Unknown error'));
            }
        } catch (error) {
            console.error('Error fetching analysis:', error);
            alert('Error fetching analysis data. Please try again.');
        } finally {
            setLoadingAnalysis(false);
        }
    };

    return (
        <div className="analysis-container">
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
                    Use the filters below to analyze student feedback by degree, department, batch, and course.
                </p>

                <div className="filters-section">
                    <div className="filter-group">
                        <label>Degree</label>
                        <select 
                            value={filters.degree}
                            onChange={(e) => setFilters({ 
                                ...filters, 
                                degree: e.target.value,
                                department: '',
                                batch: '',
                                course: ''
                            })}
                        >
                            <option value="">Select Degree</option>
                            {options.degrees.map(degree => (
                                <option key={degree} value={degree}>{degree}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Department</label>
                        <select 
                            value={filters.department}
                            onChange={(e) => setFilters({
                                ...filters,
                                department: e.target.value,
                                batch: '',
                                course: ''
                            })}
                            disabled={!filters.degree}
                        >
                            <option value="">Select Department</option>
                            {options.departments.map(dept => (
                                <option key={dept} value={dept}>{dept}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Batch</label>
                        <select 
                            value={filters.batch}
                            onChange={(e) => setFilters({
                                ...filters,
                                batch: e.target.value,
                                course: ''
                            })}
                            disabled={!filters.department}
                        >
                            <option value="">Select Batch</option>
                            {options.batches.map(batch => (
                                <option key={batch} value={batch}>{batch}</option>
                            ))}
                        </select>
                    </div>

                    <div className="filter-group">
                        <label>Course</label>
                        <select 
                            value={filters.course}
                            onChange={(e) => setFilters({
                                ...filters,
                                course: e.target.value
                            })}
                            disabled={!filters.batch}
                        >
                            <option value="">Select Course</option>
                            {options.courses.map(course => (
                                <option key={course.code} value={course.code}>
                                    {course.code} - {course.name}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="dept-report-actions">
                        <button
                            type="button"
                            className="generate-dept-btn"
                            onClick={handleGenerateDepartmentReport}
                            disabled={!filters.degree || !filters.department || !filters.batch || loadingDeptReport}
                        >
                            {loadingDeptReport ? 'Generating…' : 'Generate Department Report'}
                        </button>
                        <button
                            type="button"
                            className="generate-dept-btn alt"
                            onClick={handleGenerateDepartmentAllBatches}
                            disabled={!filters.degree || !filters.department || loadingDeptAllReport}
                            style={{ marginLeft: '0.5rem' }}
                        >
                            {loadingDeptAllReport ? 'Generating…' : 'Generate Dept Report (All Batches)'}
                        </button>
                    </div>
                </div>

                {filters.course && (
                    <div className="faculty-section">
                        <div className="faculty-header">
                            <div className="faculty-search">
                                <label>Search by Staff ID</label>
                                <input
                                    type="text"
                                    placeholder="Enter staff_id..."
                                    value={staffIdSearch}
                                    onChange={(e) => setStaffIdSearch(e.target.value)}
                                />
                            </div>
                            {faculty.length > 0 && (
                                <button 
                                    className="generate-all-btn"
                                    onClick={handleGenerateAllReports}
                                    disabled={loadingAnalysis}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                                        <polyline points="7 10 12 15 17 10"/>
                                        <line x1="12" y1="15" x2="12" y2="3"/>
                                    </svg>
                                    Generate Reports for All Faculty
                                </button>
                            )}
                        </div>

                        <div className="faculty-grid">
                            {faculty.length === 0 ? (
                                <p>No faculty found.</p>
                            ) : (
                                faculty.map((fac, idx) => (
                                    <div 
                                        key={`${fac.staff_id || fac.staffid}-${idx}`} 
                                        className="faculty-card clickable-card"
                                        onClick={() => handleFacultyCardClick(fac)}
                                    >
                                        <div className="faculty-card-header">
                                            <div className="faculty-avatar" aria-hidden="true">{getInitials(fac.faculty_name || fac.name)}</div>
                                            <div className="faculty-header-info">
                                                <div className="faculty-name">{fac.faculty_name || fac.name || 'Unknown'}</div>
                                                <div className="faculty-sub">
                                                    <strong>{filters.degree || '-'}</strong> · {filters.department || '-'} · Batch {filters.batch || '-'}
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="faculty-card-body">
                                            <div className="info-section">
                                                <div className="section-header">
                                                    <div className="section-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                            <path d="M12 3L1 9l4 2.18v6L12 21l7-3.82v-6l2-1.09V17h2V9L12 3zm6.82 6L12 12.72 5.18 9 12 5.28 18.82 9zM17 15.99l-5 2.73-5-2.73v-3.72L12 15l5-2.73v3.72z"/>
                                                        </svg>
                                                    </div>
                                                    <div className="section-label">Course Information</div>
                                                </div>
                                                <div className="info-grid">
                                                    <div className="info-label">Code:</div>
                                                    <div className="info-value">
                                                        <div className="badge code">{fac.course_code || '-'}</div>
                                                    </div>
                                                    <div className="info-label">Name:</div>
                                                    <div className="info-value course-name">{fac.course_name || '-'}</div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="faculty-card-footer">
                                            {(fac.staff_id || fac.staffid) && (
                                                <div className="id-section">
                                                    <div className="section-icon">
                                                        <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                                                            <path d="M20 4H4c-1.1 0-2 .9-2 2v12c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 14H4V6h16v12zM4 0h16v2H4zm0 22h16v2H4zm8-10a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zm0-3.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1zm5 7.5h-10v-1c0-1.66 3.34-2.5 5-2.5s5 .84 5 2.5v1z"/>
                                                        </svg>
                                                    </div>
                                                    <div className="id-container">
                                                        <div className="id-label">Staff Identifier</div>
                                                        <div className="id-value">
                                                            {fac.staff_id || fac.staffid}
                                                        </div>
                                                    </div>
                                                </div>
                                            )}
                                            
                                            <button
                                                type="button"
                                                className="copy-btn"
                                                title="Copy faculty ID to clipboard"
                                                onClick={(e) => {
                                                    e.stopPropagation(); // Prevent card click
                                                    const value = fac.staff_id || fac.staffid || '';
                                                    if (navigator && navigator.clipboard && value) {
                                                        navigator.clipboard.writeText(value)
                                                            .then(() => {
                                                                // Could add a toast notification here in the future
                                                                console.log('ID copied to clipboard');
                                                            })
                                                            .catch(() => {});
                                                    }
                                                }}
                                            >
                                                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                                Copy ID
                                            </button>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                )}

                {/* Loading overlay for analysis */}
                {loadingAnalysis && (
                    <div className="analysis-loading-overlay">
                        <div className="loading-spinner">
                            <div className="spinner"></div>
                            <p>Fetching analysis data...</p>
                        </div>
                    </div>
                )}
            </main>
        </div>
    );
};

export default Analysis;