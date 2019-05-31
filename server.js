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

hbs.registerHelper('obtenerListaInscritos', function(object) {
    var inscritos = require('./inscritos.json');
    var usuarios = require('./usuarios.json');
    inscritos = inscritos.filter(function (item) {
        return item.idCurso === object
    });
    var ret = "<ul class='list-group list-group-flush'>";
    inscritos.forEach(function (it) {
        var usua = usuarios.filter(function (item) {
            return item.documento === it.documento
        });
        usua.forEach(function (i) {
            ret = ret + "<li class='list-group-item'>" + i.nombre + "</li>";
        });
    });
    ret = ret + "</ul>";
    return ret;
  }
);


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
            return item.estado === 'disponible'
        }),
    };
    res.render(path.join(__dirname + '/vistas/listar-cursos.hbs'));
});

app.get('/ver-inscritos', function (req, res) {
    const cursos = require('./cursos.json');
    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
    };
    res.render(path.join(__dirname + '/vistas/ver-inscritos.hbs'));
});

app.post('/cambiar-estado-curso', function (req, res) {
    var cursos = require('./cursos.json');
    const body = req.body;
    var idCurso = body.idCurso;

    cursos[cursos.findIndex(el => el.idCurso === idCurso)].estado = "cerrado";
    escribirArchivo("cursos.json", cursos);

    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
        cerrado: true
    };
    res.render(path.join(__dirname + '/vistas/ver-inscritos.hbs'));
});

app.get('/ver-curso/:id', function (req, res) {
    var cursos = require('./cursos.json');
    const id = req.params.id;
    curso = cursos.filter(function (item) {
        return item.idCurso === id
    });
    res.locals = {
        curso: curso[0]
    };
    res.render(path.join(__dirname + '/vistas/ver-curso.hbs'));
});

app.get('/proceso-inscripcion/', function (req, res) {
    var cursos = require('./cursos.json');
    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        })
    };
    res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'));
});

app.post('/guardar-proceso-inscripcion/', function (req, res) {
    var cursos = require('./cursos.json');
    var inscritos = require('./inscritos.json');
    var usuarios = require('./usuarios.json');
    var guardado = false;
    const body = req.body;
    var existeUsuarioCurso = inscritos.some(function (item) {
        return item.idCurso === body.idCurso && item.documento === body.documento
    });
    if(! existeUsuarioCurso || existeUsuarioCurso === null){
        guardado = true;
        usuarios.push({
            nombre: body.nombre,
            correo: body.correo,
            telefono: body.telefono,
            documento: body.documento
        });
        escribirArchivo("usuarios.json", usuarios);
        inscritos.push({
            idCurso: body.idCurso,
            documento: body.documento
        });
        escribirArchivo("inscritos.json", inscritos);
    }
    res.locals = {
        cursos: cursos.filter(function (item) {
            return item.estado === 'disponible'
        }),
        guardado: guardado,
        existeUsuarioCurso: existeUsuarioCurso
    };
    res.render(path.join(__dirname + '/vistas/proceso-inscripcion.hbs'));
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
        intensidad: body['intensidadHoraria'],
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
    fs.exists("cursos.json", function (exists) {
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
    fs.exists("inscritos.json", function (exists) {
            if (!exists) {
                // inscritos
                escribirArchivo("inscritos.json", []);
            }
        }
    );
});

function escribirArchivo(nombre, contenido) {
    fs.writeFile(nombre, JSON.stringify(contenido), function (err, data) {});
}


