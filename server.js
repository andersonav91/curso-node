var fs = require('fs');
var express = require('express');
var hbs = require('hbs');
var path = require('path');
var bodyParser = require("body-parser");

var app = express();

hbs.registerPartial('menu', fs.readFileSync(__dirname + '/vistas/menu.hbs', 'utf8'));

app.set('view engine', 'hbs');
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: true}));

app.get('/', function (req, res) {
    res.render(path.join(__dirname + '/vistas/cursos.hbs'));
});

app.get('/crear-cursos', function (req, res) {
    res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'));
});

app.get('/listar-cursos', function (req, res) {
    const cursos = require('./cursos.json');
    res.locals = {
        cursos: cursos.filter(function (item) {
            console.log(item);
            return item.estado === 'disponible'
        }),
    };
    res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'));
});

app.post('/guardar-cursos', function (req, res) {
    const cursos = require('./cursos.json');
    var guardado = false;
    const body = req.body;
    var existeCurso = cursos.some( m => m.idCurso === body['idCurso']);
    var cursosActuales = cursos;
    cursosActuales.push({
        idCurso: body['idCurso'],
        nombre: body['nombre'],
        descripcion: body['descripcion'],
        valor: body['valor'],
        intensidad: body['intensidad'],
        modalidad: body['modalidad'],
        estado: 'disponible',
    });
    if(! existeCurso){
        guardado = true;
        escribirArchivo("cursos.json", cursosActuales);
    }
    res.locals = {
        existeCurso: existeCurso,
        guardado: guardado
    };
    res.render(path.join(__dirname + '/vistas/crear-cursos.hbs'));
});

app.listen(3000, function () {
    // cursos
    fs.exists("usuarios.json", function (exists) {
            if (!exists) {
                // usuarios
                escribirArchivo("cursos.json", []);
            }
        }
    );
    fs.exists("usuarios.json", function (exists) {
            if (!exists) {
                // usuarios
                escribirArchivo("usuarios.json", []);
            }
        }
    );
});

function escribirArchivo(nombre, contenido) {
    fs.writeFile(nombre, JSON.stringify(contenido), function (err, data) {});
}


