-- Table minimale servant uniquement à vérifier que l'API lit bien PostgreSQL.
CREATE TABLE greetings (
    id      SERIAL PRIMARY KEY,
    message VARCHAR(255) NOT NULL
);

INSERT INTO greetings (message) VALUES ('Hello World from PostgreSQL 🌱');
