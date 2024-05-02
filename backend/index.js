const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());


const createFiles = () => {
  const articlesPath = path.join(__dirname, 'articles.json');
  const usersPath = path.join(__dirname, 'users.json')
  if (!fs.existsSync(articlesPath)) {
    const defaultData = { articles: [] };
    fs.writeFileSync(articlesPath, JSON.stringify(defaultData, null, 2));
  }
  if (!fs.existsSync(usersPath)) {
    const defaultData = { users: [] };
    fs.writeFileSync(usersPath, JSON.stringify(defaultData, null, 2));
  }
};


createFiles();


app.post('/register', (req, res) => {
  const { username, password } = req.body;


  const usersData = fs.readFileSync(path.join(__dirname, 'users.json'));
  let users = JSON.parse(usersData).users;


  const existingUser = users.find(user => user.username === username);
  if (existingUser) {
    return res.status(400).json({ message: 'Username already exists' });
  }

  // Create new user object
  const newUser = {
    id: users.length + 1,
    username,
    password 
  };


  users.push(newUser);


  fs.writeFileSync(path.join(__dirname, 'users.json'), JSON.stringify({ users }, null, 2));

  res.status(201).json({ message: 'User registered successfully' });
});


app.post('/login', (req, res) => {
  const { username, password } = req.body;


  const usersData = fs.readFileSync(path.join(__dirname, 'users.json'));
  const users = JSON.parse(usersData).users;


  const user = users.find(user => user.username === username);


  if (!user || user.password !== password) {
    return res.status(401).json({ message: 'Invalid username or password' });
  }

  const token = jwt.sign({ username: user.username }, 'secretkey123', { expiresIn: '1h' });

  res.json({ message: 'Login successful', token });
});


app.get('/articles', (req, res) => {
  const articlesData = fs.readFileSync(path.join(__dirname, 'articles.json'));
  const articles = JSON.parse(articlesData).articles;
  res.json(articles);
});


app.get('/articles/:id', (req, res) => {
    const { id } = req.params;
    const articlesData = fs.readFileSync(path.join(__dirname, 'articles.json'));
    const articles = JSON.parse(articlesData).articles;
    const article = articles.find(article => article.id === parseInt(id));
    if (!article) {
      return res.status(404).json({ message: 'Article not found' });
    }
    res.json(article);
  });
  

app.post('/articles', (req, res) => {
  const { title, content } = req.body;
  const articlesData = fs.readFileSync(path.join(__dirname, 'articles.json'));
  const articles = JSON.parse(articlesData).articles;
  const newArticle = {
    id: articles.length + 1,
    title,
    content,
    votes: 0,
    createdAt: new Date().toISOString()
  };
  articles.push(newArticle);
  fs.writeFileSync(path.join(__dirname, 'articles.json'), JSON.stringify({ articles }, null, 2));
  res.status(201).json(newArticle);
});

app.post('/articles/:id/comments', (req, res) => {
  const { id } = req.params;
  const { content } = req.body;

  const articlesData = fs.readFileSync(path.join(__dirname, 'articles.json'));
  const articlesJSON = JSON.parse(articlesData);
  const articles = articlesJSON.articles;

  const articleIndex = articles.findIndex(article => article.id === parseInt(id));
  if (articleIndex === -1) {
    return res.status(404).json({ message: 'Article not found' });
  }

  const newComment = {
    id: Math.floor(Math.random() * 100), 
    content,
    createdAt: new Date().toISOString()
  };

  // Add comment to article
  if (!articles[articleIndex].comments) {
    articles[articleIndex].comments = [newComment];
  } else {
    articles[articleIndex].comments.push(newComment);
  }

  // Update articles in JSON file
  fs.writeFileSync(path.join(__dirname, 'articles.json'), JSON.stringify(articlesJSON, null, 2));

  res.json({ message: 'Comment added successfully', comment: newComment });
});

app.put('/articles/:id/vote', (req, res) => {
  const { id } = req.params;
  const { hasUpvoted } = req.body;

  const articlesData = fs.readFileSync(path.join(__dirname, 'articles.json'));
  const articles = JSON.parse(articlesData).articles;

  const articleIndex = articles.findIndex(article => article.id === parseInt(id));
  if (articleIndex === -1) {
      return res.status(404).json({ message: 'Article not found' });
  }

  let updatedVoteCount;
  if (hasUpvoted) {
      updatedVoteCount = articles[articleIndex].votes + 1;
  } else {
      updatedVoteCount = articles[articleIndex].votes - 1;
  }
  articles[articleIndex].votes = updatedVoteCount;

  fs.writeFileSync(path.join(__dirname, 'articles.json'), JSON.stringify({ articles }, null, 2));

  res.json({ message: 'Vote updated', updatedVoteCount }); 
});

app.delete('/articles/:id', (req, res) => {
  const articleId = parseInt(req.params.id);
  let articlesData = fs.readFileSync(path.join(__dirname, 'articles.json'));
  let articles = JSON.parse(articlesData).articles;
  articles = articles.filter(article => article.id !== articleId);
  fs.writeFileSync(path.join(__dirname, 'articles.json'), JSON.stringify({ articles }, null, 2));
  res.sendStatus(204);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
