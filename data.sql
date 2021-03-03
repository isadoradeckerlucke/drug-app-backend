CREATE TABLE users(
    username TEXT PRIMARY KEY,
    email TEXT NOT NULL,
    password TEXT NOT NULL
);

CREATE TABLE drugs(
    med_name TEXT PRIMARY KEY,
    rxcui INT NOT NULL
);

CREATE TABLE users_drugs_relation(
    med_name TEXT NOT NULL, 
    username TEXT NOT NULL,
    FOREIGN KEY (med_name) REFERENCES drugs ON DELETE CASCADE,
    FOREIGN KEY (username) REFERENCES users ON DELETE CASCADE,
    UNIQUE (med_name, username)
);
