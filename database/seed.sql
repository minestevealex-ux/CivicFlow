
-- ============================================
-- CIVICFLOW: SAMPLE DATA
-- ============================================

-- 1. WARDS
INSERT INTO ward (name, zone) VALUES
('Bellandur', 'Mahadevapura'),
('Marathahalli', 'Mahadevapura'),
('HSR Layout', 'Bommanahalli'),
('Koramangala', 'South'),
('Whitefield', 'Mahadevapura');

-- 2. CITIZENS
INSERT INTO citizen (name, email, phone) VALUES
('Arjun Kumar', 'arjun@example.com', '9876543210'),
('Priya Sharma', 'priya@example.com', '9876543211'),
('Rahul Nair', 'rahul@example.com', '9876543212'),
('Sneha Rao', 'sneha@example.com', '9876543213'),
('Karthik Reddy', 'karthik@example.com', '9876543214'),
('Ananya Iyer', 'ananya@example.com', '9876543215');

-- 3. CATEGORIES
INSERT INTO category (name, description) VALUES
('Road Damage', 'Potholes and damaged roads'),
('Garbage', 'Uncollected waste and overflowing bins'),
('Water Supply', 'Water leakage and supply disruptions'),
('Street Lighting', 'Non-functional street lights'),
('Drainage', 'Blocked drains and waterlogging');

-- 4. DEPARTMENTS
INSERT INTO department (name, contact_email, contact_phone) VALUES
('Road Maintenance', 'roads@civicflow.local', '08011110001'),
('Waste Management', 'waste@civicflow.local', '08011110002'),
('Water Supply', 'water@civicflow.local', '08011110003'),
('Electrical Maintenance', 'electric@civicflow.local', '08011110004'),
('Drainage Department', 'drainage@civicflow.local', '08011110005');

-- 5. LOCATIONS
INSERT INTO location
(ward_id, address, latitude, longitude) VALUES
(1, 'Near Bellandur Lake, Bengaluru', 12.9250, 77.6760),
(1, 'Outer Ring Road, Bellandur', 12.9300, 77.6780),
(2, 'Marathahalli Bridge, Bengaluru', 12.9560, 77.7010),
(3, 'HSR Sector 2, Bengaluru', 12.9110, 77.6380),
(4, '80 Feet Road, Koramangala', 12.9350, 77.6150),
(5, 'Whitefield Main Road, Bengaluru', 12.9690, 77.7500),
(1, 'Bellandur Main Road, Bengaluru', 12.9270, 77.6750),
(2, 'AECS Layout, Bengaluru', 12.9590, 77.7150);

-- 6. WORKERS
INSERT INTO worker
(department_id, name, email, phone, specialization) VALUES
(1, 'Ravi Kumar', 'ravi@civicflow.local', '9000000001', 'Road Repair'),
(1, 'Suresh Babu', 'suresh@civicflow.local', '9000000002', 'Pothole Repair'),
(2, 'Manoj Das', 'manoj@civicflow.local', '9000000003', 'Waste Collection'),
(2, 'Deepak Rao', 'deepak@civicflow.local', '9000000004', 'Sanitation'),
(3, 'Vijay Nair', 'vijay@civicflow.local', '9000000005', 'Pipeline Repair'),
(4, 'Amit Shah', 'amit@civicflow.local', '9000000006', 'Street Lighting'),
(5, 'Ramesh Gowda', 'ramesh@civicflow.local', '9000000007', 'Drainage Repair');

-- 7. ISSUES
INSERT INTO issue
(citizen_id, category_id, location_id, description, priority, status) VALUES
(1, 1, 1, 'Large pothole near Bellandur Lake causing traffic problems', 'high', 'assigned'),
(2, 2, 2, 'Garbage bins overflowing along Outer Ring Road', 'medium', 'in_progress'),
(3, 3, 3, 'Water pipeline leaking near Marathahalli Bridge', 'critical', 'submitted'),
(4, 4, 4, 'Street lights not functioning in HSR Sector 2', 'medium', 'resolved'),
(5, 5, 5, 'Drain blockage causing waterlogging in Koramangala', 'high', 'in_progress'),
(6, 1, 6, 'Damaged road surface near Whitefield Main Road', 'high', 'submitted'),
(1, 1, 7, 'Another pothole reported near Bellandur Main Road', 'medium', 'submitted'),
(2, 2, 8, 'Uncollected garbage near AECS Layout', 'low', 'assigned'),
(3, 3, 1, 'Water leakage reported near Bellandur Lake', 'high', 'under_review'),
(4, 5, 2, 'Blocked stormwater drain near Outer Ring Road', 'critical', 'submitted')
(4, 5, 2, 'Disrupted drain near Ring Road', 'critical', 'submitted');

-- 8. ASSIGNMENTS
INSERT INTO assignment
(issue_id, worker_id, status) VALUES
(1, 1, 'in_progress'),
(1, 2, 'pending'),
(2, 3, 'in_progress'),
(4, 6, 'completed'),
(5, 7, 'in_progress'),
(8, 4, 'pending');


