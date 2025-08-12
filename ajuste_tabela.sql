DROP TABLE IF EXISTS ordens_servico;

CREATE TABLE ordens_servico (
    id SERIAL PRIMARY KEY,
    clientName TEXT NOT NULL,
    clientPhone TEXT NOT NULL,
    deviceType TEXT NOT NULL,
    problemDescription TEXT NOT NULL,
    priority TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pendente',
    createdAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);