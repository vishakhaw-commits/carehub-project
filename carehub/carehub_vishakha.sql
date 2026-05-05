USE carehub_vishakha;
CREATE TABLE users (
  user_id INT AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(100) NOT NULL,
  role ENUM('doctor','patient') NOT NULL
);
INSERT INTO users (email,password,role) VALUES
('doc1@gmail.com','123','doctor'),
('doc2@gmail.com','123','doctor'),
('doc3@gmail.com','123','doctor'),
('doc4@gmail.com','123','doctor'),
('doc5@gmail.com','123','doctor'),
('doc6@gmail.com','123','doctor'),
('doc7@gmail.com','123','doctor'),
('doc8@gmail.com','123','doctor'),
('doc9@gmail.com','123','doctor'),
('doc10@gmail.com','123','doctor');
SHOW TABLES;
INSERT INTO users (email,password,role) VALUES
('pat1@gmail.com','123','patient'),
('pat2@gmail.com','123','patient'),
('pat3@gmail.com','123','patient'),
('pat4@gmail.com','123','patient'),
('pat5@gmail.com','123','patient'),
('pat6@gmail.com','123','patient'),
('pat7@gmail.com','123','patient'),
('pat8@gmail.com','123','patient'),
('pat9@gmail.com','123','patient'),
('pat10@gmail.com','123','patient'),
('pat11@gmail.com','123','patient'),
('pat12@gmail.com','123','patient'),
('pat13@gmail.com','123','patient'),
('pat14@gmail.com','123','patient'),
('pat15@gmail.com','123','patient'),
('pat16@gmail.com','123','patient'),
('pat17@gmail.com','123','patient'),
('pat18@gmail.com','123','patient'),
('pat19@gmail.com','123','patient'),
('pat20@gmail.com','123','patient'),
('pat21@gmail.com','123','patient'),
('pat22@gmail.com','123','patient'),
('pat23@gmail.com','123','patient'),
('pat24@gmail.com','123','patient'),
('pat25@gmail.com','123','patient'),
('pat26@gmail.com','123','patient'),
('pat27@gmail.com','123','patient'),
('pat28@gmail.com','123','patient'),
('pat29@gmail.com','123','patient'),
('pat30@gmail.com','123','patient'),
('pat31@gmail.com','123','patient'),
('pat32@gmail.com','123','patient'),
('pat33@gmail.com','123','patient'),
('pat34@gmail.com','123','patient'),
('pat35@gmail.com','123','patient'),
('pat36@gmail.com','123','patient'),
('pat37@gmail.com','123','patient'),
('pat38@gmail.com','123','patient'),
('pat39@gmail.com','123','patient'),
('pat40@gmail.com','123','patient'),
('pat41@gmail.com','123','patient'),
('pat42@gmail.com','123','patient'),
('pat43@gmail.com','123','patient'),
('pat44@gmail.com','123','patient'),
('pat45@gmail.com','123','patient'),
('pat46@gmail.com','123','patient'),
('pat47@gmail.com','123','patient'),
('pat48@gmail.com','123','patient'),
('pat49@gmail.com','123','patient'),
('pat50@gmail.com','123','patient'),
('pat51@gmail.com','123','patient'),
('pat52@gmail.com','123','patient'),
('pat53@gmail.com','123','patient'),
('pat54@gmail.com','123','patient'),
('pat55@gmail.com','123','patient'),
('pat56@gmail.com','123','patient'),
('pat57@gmail.com','123','patient'),
('pat58@gmail.com','123','patient'),
('pat59@gmail.com','123','patient'),
('pat60@gmail.com','123','patient'),
('pat61@gmail.com','123','patient'),
('pat62@gmail.com','123','patient'),
('pat63@gmail.com','123','patient'),
('pat64@gmail.com','123','patient'),
('pat65@gmail.com','123','patient'),
('pat66@gmail.com','123','patient'),
('pat67@gmail.com','123','patient'),
('pat68@gmail.com','123','patient');
SELECT COUNT(*) FROM users;
CREATE TABLE doctors (
  doctor_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100),
  specialization VARCHAR(100),
  phone VARCHAR(15),
  city VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
INSERT INTO doctors (user_id,name,specialization,phone,city) VALUES
(1,'Dr. Ankit Sharma','Cardiologist','9876543210','Pune'),
(2,'Dr. Priya Mehta','Dermatologist','9876543211','Mumbai'),
(3,'Dr. Rohan Patel','Neurologist','9876543212','Pune'),
(4,'Dr. Kavita Rao','Orthopedic','9876543213','Nagpur'),
(5,'Dr. Arjun Singh','ENT','9876543214','Delhi'),
(6,'Dr. Neha Verma','General','9876543215','Pune'),
(7,'Dr. Rahul Kapoor','Pediatrician','9876543216','Mumbai'),
(8,'Dr. Meera Nair','Gynecologist','9876543217','Kochi'),
(9,'Dr. Suresh Iyer','Psychiatrist','9876543218','Chennai'),
(10,'Dr. Farhan Khan','Oncologist','9876543219','Hyderabad');
SELECT * FROM doctors;
CREATE TABLE patients (
  patient_id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  name VARCHAR(100),
  age INT,
  gender VARCHAR(10),
  phone VARCHAR(15),
  city VARCHAR(50),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);
INSERT INTO patients (user_id,name,age,gender,phone,city) VALUES
(11,'Aditi Sharma',22,'Female','9990000001','Pune'),
(12,'Riya Patel',21,'Female','9990000002','Mumbai'),
(13,'Aman Verma',23,'Male','9990000003','Delhi'),
(14,'Rahul Singh',24,'Male','9990000004','Pune'),
(15,'Sneha Kapoor',22,'Female','9990000005','Nagpur'),
(16,'Karan Mehta',25,'Male','9990000006','Mumbai'),
(17,'Pooja Nair',23,'Female','9990000007','Kochi'),
(18,'Arjun Iyer',26,'Male','9990000008','Chennai'),
(19,'Neha Gupta',22,'Female','9990000009','Delhi'),
(20,'Rohit Sharma',24,'Male','9990000010','Pune');
CREATE TABLE appointments (
  appointment_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  doctor_id INT,
  appointment_date DATE,
  appointment_time TIME,
  status VARCHAR(20),
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id),
  FOREIGN KEY (doctor_id) REFERENCES doctors(doctor_id)
);
SHOW TABLES;
INSERT INTO appointments 
(patient_id,doctor_id,appointment_date,appointment_time,status) VALUES
(1,1,'2026-03-05','10:00:00','Completed'),
(2,1,'2026-03-06','11:00:00','Booked'),
(3,2,'2026-03-07','12:00:00','Completed'),
(4,3,'2026-03-08','09:30:00','Booked'),
(5,4,'2026-03-09','14:00:00','Cancelled'),
(6,5,'2026-03-10','15:30:00','Completed'),
(7,6,'2026-03-11','10:45:00','Booked'),
(8,7,'2026-03-12','13:15:00','Completed'),
(9,8,'2026-03-13','16:00:00','Booked'),
(10,9,'2026-03-14','17:30:00','Completed');
SELECT * FROM appointments;
CREATE TABLE vitals (
  vital_id INT AUTO_INCREMENT PRIMARY KEY,
  patient_id INT,
  heart_rate INT,
  oxygen_level INT,
  temperature DECIMAL(4,1),
  recorded_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (patient_id) REFERENCES patients(patient_id)
);
INSERT INTO vitals 
(patient_id,heart_rate,oxygen_level,temperature) VALUES
(1,72,98,36.7),
(2,80,97,37.0),
(3,65,99,36.5),
(4,90,95,38.1),
(5,75,96,37.2),
(6,85,94,38.0),
(7,70,98,36.8),
(8,88,97,37.5),
(9,78,96,37.1),
(10,82,95,37.9);
SELECT * FROM vitals;
CREATE TABLE prescriptions (
  prescription_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT,
  doctor_id INT,
  patient_id INT,
  medication TEXT,
  notes TEXT,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);
INSERT INTO prescriptions 
(appointment_id,doctor_id,patient_id,medication,notes) VALUES
(1,1,1,'Paracetamol 500mg','Take twice daily for fever'),
(2,1,2,'Ibuprofen 400mg','After meals for pain'),
(3,2,3,'Amoxicillin','Antibiotic for 5 days'),
(4,3,4,'Vitamin D3','Once daily for deficiency'),
(5,4,5,'Diclofenac','For joint pain'),
(6,5,6,'Cetirizine','For allergy symptoms'),
(7,6,7,'Metformin','For blood sugar control'),
(8,7,8,'ORS Sachet','Hydration support'),
(9,8,9,'Pantoprazole','Before breakfast'),
(10,9,10,'Azithromycin','3-day antibiotic course');
SELECT * FROM prescriptions;
CREATE TABLE bills (
  bill_id INT AUTO_INCREMENT PRIMARY KEY,
  appointment_id INT,
  amount DECIMAL(10,2),
  payment_status VARCHAR(20),
  bill_date DATE,
  FOREIGN KEY (appointment_id) REFERENCES appointments(appointment_id)
);
INSERT INTO bills 
(appointment_id,amount,payment_status,bill_date) VALUES
(1,500.00,'Paid','2026-03-05'),
(2,600.00,'Pending','2026-03-06'),
(3,450.00,'Paid','2026-03-07'),
(4,700.00,'Paid','2026-03-08'),
(5,300.00,'Cancelled','2026-03-09'),
(6,550.00,'Paid','2026-03-10'),
(7,650.00,'Pending','2026-03-11'),
(8,400.00,'Paid','2026-03-12'),
(9,800.00,'Paid','2026-03-13'),
(10,500.00,'Pending','2026-03-14');
SELECT * FROM bills;
INSERT INTO vitals (patient_id, heart_rate, oxygen_level, temperature)
VALUES (2, 80, 97, 37.0);
SELECT * FROM users;
SELECT * FROM doctors;
SELECT * FROM patients;
DELETE FROM doctors
WHERE user_id IN (79);
DELETE FROM users
WHERE user_id IN (79);
SELECT @@hostname, @@port;
SHOW DATABASES;
CREATE DATABASE carehub_vishakha;
USE carehub_vishakha;
SHOW TABLES;
