/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/

const express = require('express')
const app = express()
const morgan = require('morgan')
const is = require('check-more-types')
const methodOverride = require('method-override')
const bodyParser = require('body-parser')

app.use(morgan('dev'))
app.use(bodyParser.json())
app.use(bodyParser.urlencoded({ extended: true }))

function hasMethodField(req) {
  return is.object(req.body) && is.unemptyString(req.body._method)
}

function grabMethodFromBody(req, _res) {
  if (hasMethodField(req)) {
    const method = req.body._method
    delete req.body._method
    return method
  }
}

app.use(methodOverride(grabMethodFromBody))

const { renderIndexPage, renderTodoPage } = require('./index-page')

function sendIndexPage(_req, res) {
  renderIndexPage().then((html) => res.send(html))
}

function sendTodoPage(req, res) {
  renderTodoPage(req.params.id).then((html) => res.send(html))
}

function activeTodosPage(req, res) {
  const filter = (todo) => !todo.done
  renderIndexPage(filter, req.url).then((html) => res.send(html))
}

function completedTodosPage(req, res) {
  const filter = (todo) => todo.done
  renderIndexPage(filter, req.url).then((html) => res.send(html))
}

function toIndex(_req, res) {
  res.redirect('/')
}

function broadcast(_req, _res, next) {
  const db = require('./cache')
  db.loadTodos().then((todos) => {
    console.log('emitting %d todos', todos.length)
    app.emit('todos', todos)
    next()
  })
}

function sendTodos(_req, res) {
  const db = require('./cache')
  db.loadTodos().then((todos) => {
    res.json(todos)
  })
}

function sendAppCss(_req, res) {
  const cssPath = require('path').join(__dirname, 'app.css')
  const css = require('fs').readFileSync(cssPath, 'utf-8')
  res.set('Content-Type', 'text/css; charset=UTF-8')
  res.send(css)
}

function addTodo(req, _res, next) {
  console.log('adding new todo')
  console.log('post params', req.body)

  if (is.unemptyString(req.body.what)) {
    const db = require('./cache')
    return db.addTodo(req.body.what).then(() => next())
  }
  next()
}

function deleteTodo(req, _res, next) {
  console.log('deleting todo', req.body.id)

  // sync for now
  if (is.unemptyString(req.body.id)) {
    const db = require('./cache')
    return db.deleteTodo(req.body.id).then(() => next())
  }
  next()
}

function markTodo(req, _res, next) {
  console.log('marking todo', req.body.id, 'as done?', req.body.done)

  // sync for now
  if (is.unemptyString(req.body.id)) {
    const db = require('./cache')
    return db.markTodo(req.body.id, req.body.done === 'true').then(() => next())
  }

  next()
}

function clearCompleted(_req, _res, next) {
  console.log('clearing completed todos')
  const db = require('./cache')
  db.clearCompleted().then(() => next())
}

function reset(_req, res) {
  console.log('reset todos')
  const db = require('./cache')
  db.reset().then(() => res.end())
}

app.get('/health', (req, res) => {
  res.send('ok')
})

app.get('/version', (req, res) => {
  res.send('FSO ADMINS seal of approval 🦄') // change this string to ensure a new version deployed
})

app.get('/', broadcast, sendIndexPage)
app.get('/todo/:id', sendTodoPage)
app.get('/app.css', sendAppCss)
app.get('/active', activeTodosPage)
app.get('/completed', completedTodosPage)
app.get('/todos', sendTodos)

// actions
app.post('/reset', reset)
app.post('/', addTodo, broadcast, toIndex)
app.delete('/', deleteTodo, broadcast, toIndex)
app.patch('/', markTodo, broadcast, toIndex)
app.post('/clear-completed', clearCompleted, broadcast, toIndex)

module.exports = app
