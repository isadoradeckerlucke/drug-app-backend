INSERT INTO users (username, password, email) VALUES ('testuser', 'testpassword', 'testemail@gmail.com');

INSERT INTO drugs (med_name, rxcui) VALUES ('ethanol', 448), ('adderall', 84815);

INSERT INTO users_drugs_relation VALUES ('adderall', 'testuser');