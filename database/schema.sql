
-- ============================================
-- CIVICFLOW: CIVIC ISSUE MANAGEMENT DATABASE
-- PostgreSQL 16
-- ============================================

-- 1. WARD
CREATE TABLE ward (
    ward_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    zone VARCHAR(100) NOT NULL
);

-- 2. CITIZEN
CREATE TABLE citizen (
    citizen_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. CATEGORY
CREATE TABLE category (
    category_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    description TEXT
);

-- 4. DEPARTMENT
CREATE TABLE department (
    department_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(120) NOT NULL UNIQUE,
    contact_email VARCHAR(255) UNIQUE,
    contact_phone VARCHAR(20)
);

-- 5. LOCATION
CREATE TABLE location (
    location_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    ward_id INTEGER NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 7),
    longitude DECIMAL(10, 7),

    CONSTRAINT fk_location_ward
        FOREIGN KEY (ward_id)
        REFERENCES ward(ward_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_latitude
        CHECK (latitude IS NULL OR latitude BETWEEN -90 AND 90),

    CONSTRAINT chk_longitude
        CHECK (longitude IS NULL OR longitude BETWEEN -180 AND 180)
);

-- 6. WORKER
CREATE TABLE worker (
    worker_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    department_id INTEGER NOT NULL,
    name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    specialization VARCHAR(120),
    availability_status VARCHAR(20) NOT NULL DEFAULT 'available',

    CONSTRAINT fk_worker_department
        FOREIGN KEY (department_id)
        REFERENCES department(department_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_worker_availability
        CHECK (availability_status IN (
            'available', 'busy', 'unavailable'
        ))
);

-- 7. ISSUE
CREATE TABLE issue (
    issue_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    citizen_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    location_id INTEGER NOT NULL,
    description TEXT NOT NULL,
    priority VARCHAR(20) NOT NULL DEFAULT 'medium',
    status VARCHAR(30) NOT NULL DEFAULT 'submitted',
    reported_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    resolved_at TIMESTAMP,

    CONSTRAINT fk_issue_citizen
        FOREIGN KEY (citizen_id)
        REFERENCES citizen(citizen_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_issue_category
        FOREIGN KEY (category_id)
        REFERENCES category(category_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_issue_location
        FOREIGN KEY (location_id)
        REFERENCES location(location_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_issue_priority
        CHECK (priority IN ('low', 'medium', 'high', 'critical')),

    CONSTRAINT chk_issue_status
        CHECK (status IN (
            'submitted',
            'under_review',
            'assigned',
            'in_progress',
            'resolved',
            'rejected'
        )),

    CONSTRAINT chk_issue_resolution_time
        CHECK (
            resolved_at IS NULL OR resolved_at >= reported_at
        )
);

-- 8. ASSIGNMENT
CREATE TABLE assignment (
    assignment_id INTEGER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    issue_id INTEGER NOT NULL,
    worker_id INTEGER NOT NULL,
    assigned_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',

    CONSTRAINT fk_assignment_issue
        FOREIGN KEY (issue_id)
        REFERENCES issue(issue_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_assignment_worker
        FOREIGN KEY (worker_id)
        REFERENCES worker(worker_id)
        ON DELETE RESTRICT,

    CONSTRAINT chk_assignment_status
        CHECK (status IN (
            'pending', 'in_progress', 'completed', 'cancelled'
        )),

    CONSTRAINT chk_assignment_completion
        CHECK (
            completed_at IS NULL OR completed_at >= assigned_at
        )
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX idx_issue_citizen
    ON issue(citizen_id);

CREATE INDEX idx_issue_category
    ON issue(category_id);

CREATE INDEX idx_issue_location
    ON issue(location_id);

CREATE INDEX idx_issue_status
    ON issue(status);

CREATE INDEX idx_issue_priority
    ON issue(priority);

CREATE INDEX idx_assignment_issue
    ON assignment(issue_id);

CREATE INDEX idx_assignment_worker
    ON assignment(worker_id);

CREATE INDEX idx_worker_department
    ON worker(department_id);

CREATE INDEX idx_location_ward
    ON location(ward_id);

