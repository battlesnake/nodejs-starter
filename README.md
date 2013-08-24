nodejs-starter
==============

First attempt at a nodejs/ajax app


To start:

node app


Go to http://localhost:3000/plants to access the app


To build the database (set database password in model/db.js):

CREATE USER 'node'@'localhost' IDENTIFIED BY 'node-password';

CREATE TABLE `plants` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `name` varchar(32) NOT NULL,
  `weight` float NOT NULL,
  PRIMARY KEY (`id`)
);

GRANT ALL ON `plants` TO 'node'@'localhost';

INSERT INTO `plants` (name, weight) VALUES
  ('potato',0.54),
  ('potato',0.51),
  ('potato',0.50),
  ('potato',0.38),
  ('potato',0.36),
  ('potato',0.31),
  ('potato',0.43),
  ('potato',0.46),
  ('potato',0.45),
  ('potato',0.46),
  ('potato',0.48);
