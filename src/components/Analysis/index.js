import React, { useState, useEffect } from 'react';
import './index.css';

const Analysis = () => {
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

    const getInitials = (fullName) => {
        if (!fullName || typeof fullName !== 'string') return '?';
        const parts = fullName.trim().split(/\s+/);
        const first = parts[0]?.[0] || '';
        const last = parts.length > 1 ? parts[parts.length - 1][0] : '';
        const initials = (first + last).toUpperCase();
        return initials || '?';
    };

    // Fetch initial degree options
    useEffect(() => {
        fetchDegrees();
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
            const response = await fetch('http://localhost:5000/api/analysis/degrees');
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
            const response = await fetch(`http://localhost:5000/api/analysis/departments?degree=${degree}`);
            const data = await response.json();
            setOptions(prev => ({ ...prev, departments: data }));
        } catch (error) {
            console.error('Error fetching departments:', error);
        }
    };

    const fetchBatches = async (degree, department) => {
        try {
            const response = await fetch(`http://localhost:5000/api/analysis/batches?degree=${degree}&dept=${department}`);
            const data = await response.json();
            setOptions(prev => ({ ...prev, batches: data }));
        } catch (error) {
            console.error('Error fetching batches:', error);
        }
    };

    const fetchCourses = async (degree, department, batch) => {
        try {
            const response = await fetch(
                `http://localhost:5000/api/analysis/courses?degree=${degree}&dept=${department}&batch=${batch}`
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
            const response = await fetch(`http://localhost:5000/api/analysis/faculty?${params.toString()}`);
            const data = await response.json();
            if (Array.isArray(data)) setFaculty(data);
            else setFaculty([]);
        } catch (error) {
            console.error('Error fetching faculty:', error);
            setFaculty([]);
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
                </div>

                {filters.course && (
                    <div className="faculty-section">
                        <div className="faculty-search">
                            <label>Search by Staff ID</label>
                            <input
                                type="text"
                                placeholder="Enter staff_id..."
                                value={staffIdSearch}
                                onChange={(e) => setStaffIdSearch(e.target.value)}
                            />
                        </div>

                        <div className="faculty-grid">
                            {faculty.length === 0 ? (
                                <p>No faculty found.</p>
                            ) : (
                                faculty.map((fac, idx) => (
                                    <div key={`${fac.staff_id || fac.staffid}-${idx}`} className="faculty-card">
                                        <div className="faculty-card-header">
                                            <div className="faculty-avatar" aria-hidden="true">{getInitials(fac.faculty_name)}</div>
                                            <div className="faculty-header-info">
                                                <div className="faculty-name">{fac.faculty_name || 'Unknown'}</div>
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
                                                onClick={() => {
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
            </main>
        </div>
    );
};

export default Analysis;