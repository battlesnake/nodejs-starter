nodejs-starter
==============

First attempt at a nodejs/ajax app


To start:

`node app`


Go to http://localhost:3000/plants to access the app


To build an example database (set database password in model/db.js):

`CREATE DATABASE IF NOT EXISTS node;
USE node;

CREATE TABLE IF NOT EXISTS plants (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(32) NOT NULL,
  weight float NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO plants (name, weight) VALUES
  ('potato',0.54),
  ('potato',0.51),
  ('potato',0.50),
  ('potato',0.38),
  ('carrot',0.21),
  ('potato',0.36),
  ('potato',0.31),
  ('carrot',0.23),
  ('potato',0.43),
  ('carrot',0.17),
  ('potato',0.46),
  ('potato',0.45),
  ('potato',0.46),
  ('potato',0.48);

CREATE USER 'node'@'localhost' IDENTIFIED BY 'node-password';
GRANT ALL ON node.* TO 'node'@'localhost';`


TODO
----
AJAX return XML via jade.
Use AJAX for page / page size change instead of reload.
AJAX return page number of edited/added item so we can request that page.
Make the "table" jade code an include so plants and plants_ajax can share it.
