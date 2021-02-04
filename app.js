//Import modules
const express = require('express');

const app = express();

app.use(express.static('app'));
app.use(express.urlencoded({ extended: true }));

app.listen(80, () => {
  console.log(`Server running on port ${80}`);
});
