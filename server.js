var fs = require('fs');
var express = require('express');
var hbs = require('hbs');
var path = require('path');

var app = express();

hbs.registerPartial('menu', fs.readFileSync(__dirname + '/vistas/menu.hbs', 'utf8'));

app.set('view engine', 'hbs');

app.get('/', function (req, res) {
    res.locals = {
        some_value: 'foo bar',
        list: ['cat', 'dog']
    }
    res.render(path.join(__dirname + '/vistas/cursos.hbs'));
});

app.get('/crear-cursos', function (req, res) {
    res.locals = {
        some_value: 'foo bar',
        list: ['cat', 'dog']
    }
    res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'));
});

app.listen(3000, function () {
    // cursos
    fs.exists("cursos.json", function (exists) {
        if(! exists)
        {
            fs.writeFile("cursos.json", JSON.stringify({}), function (err, data) {});
        }
    });

    // usuarios
    fs.exists("usuarios.json", function (exists) {
        if(! exists)
        {
            fs.writeFile("usuarios.json", JSON.stringify({}), function (err, data) {})
        }
    });
});



