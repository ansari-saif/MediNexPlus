-- Stream polls filter Appointment by hospitalId + createdAt
CREATE INDEX `Appointment_hospitalId_createdAt_idx` ON `Appointment`(`hospitalId`, `createdAt`);
