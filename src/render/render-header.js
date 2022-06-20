/*eslint no-unused-vars: ["error", { "argsIgnorePattern": "^_" }]*/
const h = require('virtual-dom/h')

function render(_Todos) {
  return h('header', { className: 'header' }, [
    h('h1', {}, 'todos'),
    h(
      'form',
      {
        action: '/',
        method: 'post',
      },
      [
        h(
          'input',
          {
            className: 'new-todo',
            placeholder: 'What needs to be done?',
            autofocus: true,
            name: 'what',
          },
          [],
        ),
      ],
    ),
  ])
}

module.exports = render
