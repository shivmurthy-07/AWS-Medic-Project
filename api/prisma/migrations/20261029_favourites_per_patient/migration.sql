DROP INDEX `Favourites_doctorId_key` ON `Favourites`;

CREATE UNIQUE INDEX `Favourites_patientId_doctorId_key` ON `Favourites` (`patientId`, `doctorId`);
