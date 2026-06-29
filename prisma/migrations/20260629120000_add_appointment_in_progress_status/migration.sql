-- Add IN_PROGRESS to Appointment.status (used by doctor dashboard)
ALTER TABLE `Appointment` MODIFY `status` ENUM('SCHEDULED', 'CONFIRMED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW', 'RESCHEDULED') NOT NULL DEFAULT 'SCHEDULED';
