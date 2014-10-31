nodejs-starter
==============

First attempt at a nodejs/ajax app.  It provides a web interface for editing a table within a MySQL database, and a summary page which allows aggregation of the data.
As an added extra to show simple analysis, the app contains a knapsack solver...


To start: `node app`


Go to `http://localhost:3000/` to access the app


To build an example database to play with:

```sql
CREATE DATABASE IF NOT EXISTS node;
USE node;

CREATE TABLE IF NOT EXISTS plants (
  id int(11) NOT NULL AUTO_INCREMENT,
  name varchar(32) NOT NULL,
  weight float NOT NULL,
  PRIMARY KEY (id)
);

INSERT INTO plants (name, weight) VALUES
        ("potato", 0.54),
        ("potato", 0.51),
        ("potato", 0.5),
        ("potato", 0.38),
        ("carrot", 0.21),
        ("onion", 0.36),
        ("onion", 0.31),
        ("carrot", 0.23),
        ("onion", 0.43),
        ("potato", 0.46),
        ("potato", 0.45),
        ("potato", 0.46),
        ("potato", 0.48),
        ("watermelon", 3.12),
        ("watermelon", 3.85),
        ("carrot", 0.17);

CREATE USER 'node'@'localhost' IDENTIFIED BY 'node-password';
GRANT ALL ON node.* TO 'node'@'localhost';
```

Remember to set database password in `models/db.js` if you changed it from `node-password`


TODO
----
 - Fix sortByCol bug which occurs when clicking a column title
 - Make AJAX return XML/HTML fragments via jade.
 - Use AJAX for change of page / page size instead of reloading the page.
 - Make AJAX edits/additions return page number of edited/added item so we can go to that page (via AJAX again).
 - Make the column CSS better, so they have sensible, deterministic sizes (try Chrome to see the ugliness)
 - Makbe use Stylus to do the previous bit of styling, might as well learn it?
